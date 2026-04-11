using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubscriptionManager.Core.DTOs;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Constants;
using System.Security.Claims;
using System.Linq;

namespace SubscriptionManager.Auth.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly IChatRepository _chatRepository;
        private readonly IUserRepository _userRepository;
        private readonly IEmailService _emailService;
        private readonly ILogger<ChatController> _logger;

        public ChatController(
            IChatRepository chatRepository,
            IUserRepository userRepository,
            IEmailService emailService,
            ILogger<ChatController> logger)
        {
            _chatRepository = chatRepository;
            _userRepository = userRepository;
            _emailService = emailService;
            _logger = logger;
        }

        private async Task NotifyAdminsAboutNewSupportMessageAsync(Guid senderUserId, string messageContent)
        {
            try
            {
                var users = await _userRepository.GetAllUsersAsync();
                var adminEmails = users
                    .Where(u => u.Role == RoleConstants.Admin && !string.IsNullOrWhiteSpace(u.Email))
                    .Select(u => u.Email)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                if (adminEmails.Count == 0)
                {
                    _logger.LogWarning("Support message email notification skipped: no admin emails found.");
                    return;
                }

                var title = "Новое сообщение в чате поддержки";
                var trimmedMessage = messageContent.Length > 500
                    ? $"{messageContent[..500]}..."
                    : messageContent;
                var body = $"""
                    Пользователь отправил новое сообщение в чате поддержки.

                    ID пользователя: {senderUserId}
                    Сообщение:
                    {trimmedMessage}
                    """;

                foreach (var adminEmail in adminEmails)
                {
                    await _emailService.SendNotificationEmailAsync(adminEmail, title, body);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send support chat email notifications to admins.");
            }
        }

        private Guid GetUserIdFromClaims()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                throw new UnauthorizedAccessException("Invalid token");
            }
            return userId;
        }

        private string GetUserRole()
        {
            return User.FindFirst(ClaimTypes.Role)?.Value ?? "User";
        }

        private bool IsAdmin()
        {
            return GetUserRole() == RoleConstants.Admin;
        }

        [HttpGet("conversation")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<ChatWithUserDto>> GetMyConversation()
        {
            try
            {
                var userId = GetUserIdFromClaims();
                var conversation = await _chatRepository.GetOrCreateConversationAsync(userId);
                var messages = await _chatRepository.GetMessagesByConversationAsync(conversation.Id);
                var unreadCount = await _chatRepository.GetUnreadCountForUserAsync(conversation.Id, userId);

                var conversationDto = new ChatConversationDto
                {
                    Id = conversation.Id,
                    UserId = conversation.UserId,
                    AdminId = conversation.AdminId,
                    Status = conversation.Status.ToString(),
                    LastMessageAt = conversation.LastMessageAt,
                    CreatedAt = conversation.CreatedAt,
                    UpdatedAt = conversation.UpdatedAt,
                    UnreadCount = unreadCount
                };

                return Ok(new ChatWithUserDto
                {
                    Conversation = conversationDto,
                    Messages = messages.ToList()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting conversation");
                return Problem(title: ex.Message, statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        [HttpPost("messages")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<ChatMessageDto>> SendMessage([FromBody] SendMessageRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Content))
                {
                    return BadRequest("Message content cannot be empty");
                }

                var userId = GetUserIdFromClaims();
                var userRole = IsAdmin() ? "Admin" : "User";

                var conversation = await _chatRepository.GetOrCreateConversationAsync(userId);
                
                if (!IsAdmin() && conversation.Status == Core.Models.ChatConversationStatus.Closed)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, "This conversation is closed. Please contact support.");
                }

                var message = await _chatRepository.AddMessageAsync(
                    conversation.Id, 
                    userId, 
                    userRole, 
                    request.Content);

                if (!IsAdmin())
                {
                    await NotifyAdminsAboutNewSupportMessageAsync(userId, request.Content);
                }

                if (IsAdmin())
                {
                    await _chatRepository.UpdateConversationStatusAsync(conversation.Id, "Open", userId);
                }

                var messageDto = new ChatMessageDto
                {
                    Id = message.Id,
                    ConversationId = message.ConversationId,
                    SenderId = message.SenderId,
                    SenderRole = message.SenderRole.ToString(),
                    Content = message.Content,
                    IsRead = message.IsRead,
                    CreatedAt = message.CreatedAt
                };

                return Ok(messageDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending message");
                return Problem(title: ex.Message, statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        [HttpGet("conversations")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<IEnumerable<ChatConversationDto>>> GetAllConversations(
            [FromQuery] string? status = null)
        {
            try
            {
                var conversations = await _chatRepository.GetAllConversationsAsync(status);
                return Ok(conversations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting conversations");
                return Problem(title: ex.Message, statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        [HttpGet("conversations/{id}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<ChatWithUserDto>> GetConversationById(Guid id)
        {
            try
            {
                var conversation = await _chatRepository.GetConversationByIdAsync(id);
                if (conversation == null)
                {
                    return NotFound("Conversation not found");
                }

                var messages = await _chatRepository.GetMessagesByConversationAsync(id);
                
                var adminId = GetUserIdFromClaims();
                await _chatRepository.MarkMessagesAsReadAsync(id, adminId);

                var conversationDto = new ChatConversationDto
                {
                    Id = conversation.Id,
                    UserId = conversation.UserId,
                    AdminId = conversation.AdminId,
                    Status = conversation.Status.ToString(),
                    LastMessageAt = conversation.LastMessageAt,
                    CreatedAt = conversation.CreatedAt,
                    UpdatedAt = conversation.UpdatedAt,
                    UnreadCount = 0
                };

                return Ok(new ChatWithUserDto
                {
                    Conversation = conversationDto,
                    Messages = messages.ToList()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting conversation by ID");
                return Problem(title: ex.Message, statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        [HttpPost("conversations/{id}/messages")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<ChatMessageDto>> AdminSendMessage(
            Guid id, 
            [FromBody] SendMessageRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Content))
                {
                    return BadRequest("Message content cannot be empty");
                }

                var conversation = await _chatRepository.GetConversationByIdAsync(id);
                if (conversation == null)
                {
                    return NotFound("Conversation not found");
                }

                var adminId = GetUserIdFromClaims();
                var message = await _chatRepository.AddMessageAsync(
                    id,
                    adminId,
                    "Admin",
                    request.Content);

                var messageDto = new ChatMessageDto
                {
                    Id = message.Id,
                    ConversationId = message.ConversationId,
                    SenderId = message.SenderId,
                    SenderRole = message.SenderRole.ToString(),
                    Content = message.Content,
                    IsRead = message.IsRead,
                    CreatedAt = message.CreatedAt
                };

                return Ok(messageDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending admin message");
                return Problem(title: ex.Message, statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        [HttpPut("conversations/{id}/close")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> CloseConversation(Guid id)
        {
            try
            {
                var conversation = await _chatRepository.GetConversationByIdAsync(id);
                if (conversation == null)
                {
                    return NotFound("Conversation not found");
                }

                await _chatRepository.UpdateConversationStatusAsync(id, "Closed");
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error closing conversation");
                return Problem(title: ex.Message, statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        [HttpGet("unread")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<int>> GetUnreadCount()
        {
            try
            {
                var messages = await _chatRepository.GetUnreadMessagesForAdminAsync();
                return Ok(messages.Count());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting unread count");
                return Problem(title: ex.Message, statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        [HttpPut("conversation/read")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> MarkAsRead()
        {
            try
            {
                var userId = GetUserIdFromClaims();
                var conversation = await _chatRepository.GetConversationByUserIdAsync(userId);
                
                if (conversation != null)
                {
                    await _chatRepository.MarkMessagesAsReadAsync(conversation.Id, userId);
                }
                
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking messages as read");
                return Problem(title: ex.Message, statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        [HttpPost("conversation/new")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<ChatWithUserDto>> CreateNewConversation()
        {
            try
            {
                var userId = GetUserIdFromClaims();
                var conversation = await _chatRepository.CreateNewConversationAsync(userId);
                var messages = await _chatRepository.GetMessagesByConversationAsync(conversation.Id);
                var unreadCount = await _chatRepository.GetUnreadCountForUserAsync(conversation.Id, userId);

                var conversationDto = new ChatConversationDto
                {
                    Id = conversation.Id,
                    UserId = conversation.UserId,
                    AdminId = conversation.AdminId,
                    Status = conversation.Status.ToString(),
                    LastMessageAt = conversation.LastMessageAt,
                    CreatedAt = conversation.CreatedAt,
                    UpdatedAt = conversation.UpdatedAt,
                    UnreadCount = unreadCount
                };

                return Ok(new ChatWithUserDto
                {
                    Conversation = conversationDto,
                    Messages = messages.ToList()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating new conversation");
                return Problem(title: ex.Message, statusCode: StatusCodes.Status500InternalServerError);
            }
        }
    }
}