using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubscriptionManager.Core.Models;
using SubscriptionManager.Infrastructure.Services;

namespace SubscriptionManager.Subscriptions.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FilesController : ControllerBase
    {
        private readonly IFileStorageService _fileStorageService;

        public FilesController(IFileStorageService fileStorageService)
        {
            _fileStorageService = fileStorageService;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadFile(IFormFile file)
        {
            if (file == null)
            {
                return BadRequest("No file provided");
            }

            var userId = GetUserId();
            var result = await _fileStorageService.UploadFileAsync(file, userId);

            if (!result.Success)
            {
                return BadRequest(result.ErrorMessage);
            }

            return Ok(new
            {
                FileId = result.FileId,
                PresignedUrl = result.PresignedUrl,
                Message = "File uploaded successfully"
            });
        }

        [HttpDelete("{fileId}")]
        public async Task<IActionResult> DeleteFile(Guid fileId)
        {
            var success = await _fileStorageService.DeleteFileAsync(fileId);

            if (!success)
            {
                return NotFound("File not found");
            }

            return Ok(new { Message = "File deleted successfully" });
        }

        [HttpGet("{fileId}/url")]
        public async Task<IActionResult> GetFileUrl(Guid fileId, [FromQuery] int expiry = 3600)
        {
            try
            {
                var url = await _fileStorageService.GetPresignedUrlAsync(fileId, expiry);
                return Ok(new { Url = url });
            }
            catch (FileNotFoundException)
            {
                return NotFound("File not found");
            }
        }

        [HttpGet("{fileId}/info")]
        public async Task<IActionResult> GetFileInfo(Guid fileId)
        {
            var fileInfo = await _fileStorageService.GetFileInfoAsync(fileId);

            if (fileInfo == null)
            {
                return NotFound("File not found");
            }

            return Ok(fileInfo);
        }

        private Guid? GetUserId()
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return userId;
            }
            return null;
        }
    }
}
