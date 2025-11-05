using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel.Args;
using SubscriptionManager.Core.Options;

namespace SubscriptionManager.Infrastructure.Services
{
    public interface IFileStorageService
    {
        Task<string> UploadIconAsync(IFormFile file, string fileName);
        Task<bool> DeleteIconAsync(string fileName);
    }

    public class FileStorageService : IFileStorageService
    {
        private readonly MinIOOptions _minioOptions;
        private readonly IMinioClient _minioClient;

        public FileStorageService(IOptions<MinIOOptions> minioOptions)
        {
            _minioOptions = minioOptions.Value;

            _minioClient = new MinioClient()
                .WithEndpoint(_minioOptions.Endpoint)
                .WithCredentials(_minioOptions.AccessKey, _minioOptions.SecretKey)
                .WithSSL(_minioOptions.WithSSL)
                .Build();
        }

        public async Task<string> UploadIconAsync(IFormFile file, string fileName)
        {
            var bucketExistsArgs = new BucketExistsArgs().WithBucket(_minioOptions.BucketName);
            bool found = await _minioClient.BucketExistsAsync(bucketExistsArgs);

            if (!found)
            {
                var makeBucketArgs = new MakeBucketArgs().WithBucket(_minioOptions.BucketName);
                await _minioClient.MakeBucketAsync(makeBucketArgs);
            }

            using var stream = file.OpenReadStream();
            var putObjectArgs = new PutObjectArgs()
                .WithBucket(_minioOptions.BucketName)
                .WithObject(fileName)
                .WithStreamData(stream)
                .WithObjectSize(stream.Length)
                .WithContentType(file.ContentType);

            await _minioClient.PutObjectAsync(putObjectArgs);

            return $"{_minioOptions.Endpoint}/{_minioOptions.BucketName}/{fileName}";
        }

        public async Task<bool> DeleteIconAsync(string fileName)
        {
            try
            {
                var removeObjectArgs = new RemoveObjectArgs()
                    .WithBucket(_minioOptions.BucketName)
                    .WithObject(fileName);

                await _minioClient.RemoveObjectAsync(removeObjectArgs);
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}
