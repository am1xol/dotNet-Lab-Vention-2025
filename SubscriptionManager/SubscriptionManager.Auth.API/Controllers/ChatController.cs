using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using SubscriptionManager.Auth.API.Realtime;
using SubscriptionManager.Auth.API.Services;
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
        private readonly IProfanityFilter _profanityFilter;
        private readonly IAdminSupportNotificationQueue _notificationQueue;
        private readonly IHubContext<ChatHub> _chatHubContext;
        private readonly ILogger<ChatController> _logger;

        public ChatController(
            IChatRepository chatRepository,
            IProfanityFilter profanityFilter,
            IAdminSupportNotificationQueue notificationQueue,
            IHubContext<ChatHub> chatHubContext,
            ILogger<ChatController> logger)
        {
            _chatRepository = chatRepository;
            _profanityFilter = profanityFilter;
            _notificationQueue = notificationQueue;
            _chatHubContext = chatHubContext;
            _logger = logger;
        }

        private bool TryGetUserIdFromClaims(out Guid userId)
        {
            userId = Guid.Empty;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            return userIdClaim != null && Guid.TryParse(userIdClaim.Value, out userId);
        }

        private string GetUserRole()
        {
            return User.FindFirst(ClaimTypes.Role)?.Value ?? "User";
        }

        private bool IsAdmin()
        {
            return GetUserRole() == RoleConstants.Admin;
        }

        private static ChatMessageDto MapMessageDto(Core.Models.ChatMessage message)
        {
            return new ChatMessageDto
            {
                Id = message.Id,
                ConversationId = message.ConversationId,
                SenderId = message.SenderId,
                SenderRole = message.SenderRole.ToString(),
                Content = message.Content,
                IsRead = message.IsRead,
                CreatedAt = message.CreatedAt
            };
        }

        private async Task PublishConversationUpdatedAsync(Guid conversationId)
        {
            await _chatHubContext.Clients.Group(ChatHubGroups.Admins)
                .SendAsync(ChatHubEvents.ConversationUpdated, conversationId);
        }

        private async Task PublishMessageAndUnreadEventsAsync(ChatMessageDto messageDto)
        {
            await _chatHubContext.Clients.Group(ChatHubGroups.Admins)
                .SendAsync(ChatHubEvents.MessageReceived, messageDto);

            if (messageDto.SenderRole == "Admin")
            {
                var conversation = await _chatRepository.GetConversationByIdAsync(messageDto.ConversationId);
                if (conversation != null)
                {
                    await _chatHubContext.Clients.Group(ChatHubGroups.User(conversation.UserId))
                        .SendAsync(ChatHubEvents.MessageReceived, messageDto);

                    var unreadForUser = await _chatRepository.GetUnreadCountForUserAsync(conversation.Id, conversation.UserId);
                    await _chatHubContext.Clients.Group(ChatHubGroups.User(conversation.UserId))
                        .SendAsync(ChatHubEvents.UnreadCountChanged, unreadForUser);
                }
            }
            else
            {
                await _chatHubContext.Clients.Group(ChatHubGroups.User(messageDto.SenderId))
                    .SendAsync(ChatHubEvents.MessageReceived, messageDto);

                var unreadAdminMessages = await _chatRepository.GetUnreadMessagesForAdminAsync();
                await _chatHubContext.Clients.Group(ChatHubGroups.Admins)
                    .SendAsync(ChatHubEvents.UnreadCountChanged, unreadAdminMessages.Count());
            }
        }

        [HttpGet("conversation")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<ChatWithUserDto>> GetMyConversation()
        {
            try
            {
                if (!TryGetUserIdFromClaims(out var userId))
                {
                    return Unauthorized();
                }

                var conversation = await _chatRepository.GetConversationByUserIdAsync(userId)
                    ?? await _chatRepository.CreateNewConversationAsync(userId);
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
        [Authorize]
        public async Task<ActionResult<ChatMessageDto>> SendMessage([FromBody] SendMessageRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Content))
                {
                    return BadRequest("Message content cannot be empty");
                }

                var moderatedContent = _profanityFilter.ModerateText(request.Content);

                if (!TryGetUserIdFromClaims(out var userId))
                {
                    return Unauthorized();
                }

                var userRole = IsAdmin() ? "Admin" : "User";

                var conversation = await _chatRepository.GetConversationByUserIdAsync(userId)
                    ?? await _chatRepository.CreateNewConversationAsync(userId);
                
                if (!IsAdmin() && conversation.Status == Core.Models.ChatConversationStatus.Closed)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, "This conversation is closed. Please contact support.");
                }

                var message = await _chatRepository.AddMessageAsync(
                    conversation.Id, 
                    userId, 
                    userRole, 
                    moderatedContent);

                if (!IsAdmin())
                {
                    await _notificationQueue.EnqueueAsync(new AdminSupportNotificationJob(userId, moderatedContent));
                }

                if (IsAdmin())
                {
                    await _chatRepository.UpdateConversationStatusAsync(conversation.Id, "Open", userId);
                }

                var messageDto = MapMessageDto(message);
                await PublishConversationUpdatedAsync(message.ConversationId);
                await PublishMessageAndUnreadEventsAsync(messageDto);

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

                if (!TryGetUserIdFromClaims(out var adminId))
                {
                    return Unauthorized();
                }

                await _chatRepository.MarkMessagesAsReadAsync(id, adminId);
                var unreadAdminMessages = await _chatRepository.GetUnreadMessagesForAdminAsync();
                await _chatHubContext.Clients.Group(ChatHubGroups.Admins)
                    .SendAsync(ChatHubEvents.UnreadCountChanged, unreadAdminMessages.Count());

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

                var moderatedContent = _profanityFilter.ModerateText(request.Content);

                var conversation = await _chatRepository.GetConversationByIdAsync(id);
                if (conversation == null)
                {
                    return NotFound("Conversation not found");
                }

                if (!TryGetUserIdFromClaims(out var adminId))
                {
                    return Unauthorized();
                }

                var message = await _chatRepository.AddMessageAsync(
                    id,
                    adminId,
                    "Admin",
                    moderatedContent);

                var messageDto = MapMessageDto(message);
                await PublishConversationUpdatedAsync(message.ConversationId);
                await PublishMessageAndUnreadEventsAsync(messageDto);

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
                await PublishConversationUpdatedAsync(id);
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
        [Authorize]
        public async Task<IActionResult> MarkAsRead()
        {
            try
            {
                if (!TryGetUserIdFromClaims(out var userId))
                {
                    return Unauthorized();
                }

                var conversation = await _chatRepository.GetConversationByUserIdAsync(userId);
                
                if (conversation != null)
                {
                    await _chatRepository.MarkMessagesAsReadAsync(conversation.Id, userId);
                    await _chatHubContext.Clients.Group(ChatHubGroups.User(userId))
                        .SendAsync(ChatHubEvents.UnreadCountChanged, 0);
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
        [Authorize]
        public async Task<ActionResult<ChatWithUserDto>> CreateNewConversation()
        {
            try
            {
                if (!TryGetUserIdFromClaims(out var userId))
                {
                    return Unauthorized();
                }

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