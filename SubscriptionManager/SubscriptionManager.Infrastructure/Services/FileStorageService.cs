using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel.Args;
using SubscriptionManager.Core.Models;
using SubscriptionManager.Core.Options;
using SubscriptionManager.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace SubscriptionManager.Infrastructure.Services
{
    public interface IFileStorageService
    {
        Task<FileUploadResult> UploadFileAsync(IFormFile file, Guid? userId = null);
        Task<bool> DeleteFileAsync(Guid fileId);
        Task<string> GetPresignedUrlAsync(Guid fileId, int expiryInSeconds = 3600);
        Task<StoredFile?> GetFileInfoAsync(Guid fileId);
        FileValidationResult ValidateFile(IFormFile file);
    }

    public class FileUploadResult
    {
        public bool Success { get; set; }
        public Guid? FileId { get; set; }
        public string? ErrorMessage { get; set; }
        public string? PresignedUrl { get; set; }
    }

    public class FileValidationResult
    {
        public bool IsValid { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public class FileStorageService : IFileStorageService
    {
        private readonly MinIOOptions _minioOptions;
        private readonly IMinioClient _minioClient;
        private readonly SubscriptionsDbContext _context;
        private readonly IMinioClient _externalMinioClient;

        private const long MaxFileSize = 5 * 1024 * 1024;
        private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp" };
        private readonly string[] _allowedContentTypes = { "image/jpeg", "image/png", "image/gif", "image/svg+xml", "image/webp" };

        public FileStorageService(
            IOptions<MinIOOptions> minioOptions,
            SubscriptionsDbContext context)
        {
            _minioOptions = minioOptions.Value;
            _context = context;

            var internalEndpoint = _minioOptions.Endpoint.Replace("http://", "").Replace("https://", "");
            var internalClientBuilder = new MinioClient()
                .WithEndpoint(internalEndpoint)
                .WithCredentials(_minioOptions.AccessKey, _minioOptions.SecretKey);

            if (!_minioOptions.WithSSL)
            {
                internalClientBuilder = internalClientBuilder.WithHttpClient(new HttpClient());
            }
            _minioClient = internalClientBuilder.Build();

            var externalEndpoint = _minioOptions.ExternalEndpoint?.Replace("http://", "").Replace("https://", "") ?? "127.0.0.1:9000";
            var externalClientBuilder = new MinioClient()
                .WithEndpoint(externalEndpoint)
                .WithCredentials(_minioOptions.AccessKey, _minioOptions.SecretKey);

            if (!_minioOptions.WithSSL)
            {
                externalClientBuilder = externalClientBuilder.WithHttpClient(new HttpClient());
            }
            _externalMinioClient = externalClientBuilder.Build();
        }

        public FileValidationResult ValidateFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return new FileValidationResult { IsValid = false, ErrorMessage = "File is empty" };
            }

            if (file.Length > MaxFileSize)
            {
                return new FileValidationResult { IsValid = false, ErrorMessage = $"File size exceeds {MaxFileSize / 1024 / 1024}MB" };
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (string.IsNullOrEmpty(extension) || !_allowedExtensions.Contains(extension))
            {
                return new FileValidationResult { IsValid = false, ErrorMessage = $"Allowed extensions: {string.Join(", ", _allowedExtensions)}" };
            }

            if (!_allowedContentTypes.Contains(file.ContentType.ToLowerInvariant()))
            {
                return new FileValidationResult { IsValid = false, ErrorMessage = $"Allowed content types: {string.Join(", ", _allowedContentTypes)}" };
            }

            return new FileValidationResult { IsValid = true };
        }

        public async Task<FileUploadResult> UploadFileAsync(IFormFile file, Guid? userId = null)
        {
            try
            {
                var validation = ValidateFile(file);
                if (!validation.IsValid)
                {
                    return new FileUploadResult { Success = false, ErrorMessage = validation.ErrorMessage };
                }

                await EnsureBucketExistsAsync();

                var fileId = Guid.NewGuid();
                var extension = Path.GetExtension(file.FileName);
                var objectName = $"{fileId}{extension}";

                using var stream = file.OpenReadStream();
                var putObjectArgs = new PutObjectArgs()
                    .WithBucket(_minioOptions.BucketName)
                    .WithObject(objectName)
                    .WithStreamData(stream)
                    .WithObjectSize(stream.Length)
                    .WithContentType(file.ContentType);

                await _minioClient.PutObjectAsync(putObjectArgs);

                var storedFile = new StoredFile
                {
                    Id = fileId,
                    FileName = file.FileName,
                    BucketName = _minioOptions.BucketName,
                    ObjectName = objectName,
                    ContentType = file.ContentType,
                    Size = file.Length,
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };

                _context.StoredFiles.Add(storedFile);
                await _context.SaveChangesAsync();

                var presignedUrl = await GeneratePresignedUrlAsync(objectName);

                return new FileUploadResult
                {
                    Success = true,
                    FileId = fileId,
                    PresignedUrl = presignedUrl
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Upload error: {ex}");
                return new FileUploadResult
                {
                    Success = false,
                    ErrorMessage = $"Upload failed: {ex.Message}"
                };
            }
        }

        public async Task<bool> DeleteFileAsync(Guid fileId)
        {
            try
            {
                var storedFile = await _context.StoredFiles.FindAsync(fileId);
                if (storedFile == null)
                    return false;

                var removeObjectArgs = new RemoveObjectArgs()
                    .WithBucket(_minioOptions.BucketName)
                    .WithObject(storedFile.ObjectName);

                await _minioClient.RemoveObjectAsync(removeObjectArgs);

                _context.StoredFiles.Remove(storedFile);
                await _context.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Delete error: {ex}");
                return false;
            }
        }

        public async Task<string> GetPresignedUrlAsync(Guid fileId, int expiryInSeconds = 3600)
        {
            var storedFile = await _context.StoredFiles.FindAsync(fileId);
            if (storedFile == null)
                throw new FileNotFoundException("File not found");

            return await GeneratePresignedUrlAsync(storedFile.ObjectName, expiryInSeconds);
        }

        public async Task<StoredFile?> GetFileInfoAsync(Guid fileId)
        {
            return await _context.StoredFiles.FindAsync(fileId);
        }

        private async Task EnsureBucketExistsAsync()
        {
            try
            {
                var bucketExistsArgs = new BucketExistsArgs().WithBucket(_minioOptions.BucketName);
                bool found = await _minioClient.BucketExistsAsync(bucketExistsArgs);

                if (!found)
                {
                    var makeBucketArgs = new MakeBucketArgs().WithBucket(_minioOptions.BucketName);
                    await _minioClient.MakeBucketAsync(makeBucketArgs);
                    Console.WriteLine($"Bucket '{_minioOptions.BucketName}' created successfully");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Bucket check/creation error: {ex}");
                throw;
            }
        }

        private async Task<string> GeneratePresignedUrlAsync(string objectName, int expiryInSeconds = 3600)
        {
            try
            {
                var presignedArgs = new PresignedGetObjectArgs()
                    .WithBucket(_minioOptions.BucketName)
                    .WithObject(objectName)
                    .WithExpiry(expiryInSeconds);

                return await _externalMinioClient.PresignedGetObjectAsync(presignedArgs);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Presigned URL generation error: {ex}");
                throw;
            }
        }
    }
}