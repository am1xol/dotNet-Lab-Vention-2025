using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SubscriptionManager.Core;
using SubscriptionManager.Core.DTOs;
using SubscriptionManager.Core.Interfaces;
using SubscriptionManager.Core.Models;
using SubscriptionManager.Infrastructure.Data;
using SubscriptionManager.Infrastructure.Services;
using System.Security.Claims;

namespace SubscriptionManager.Subscriptions.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UserSubscriptionsController : ControllerBase
    {
        private readonly SubscriptionsDbContext _context;
        private readonly IFileStorageService _fileStorageService;
        private readonly IPaymentGatewayService _paymentGateway;

        private enum UserSubStatus
        {
            Pending = 0,
            Active = 1,
            Cancelled = 2,
            Expired = 3
        }

        public UserSubscriptionsController(SubscriptionsDbContext context, IFileStorageService fileStorageService, IPaymentGatewayService paymentGateway)
        {
            _context = context;
            _fileStorageService = fileStorageService;
            _paymentGateway = paymentGateway;
        }

        [HttpPost("initiate-payment/{subscriptionId}")] 
        [ProducesResponseType(typeof(PaymentInitiationResult), StatusCodes.Status200OK)] 
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<PaymentInitiationResult>> InitiateSubscriptionPayment([FromRoute] Guid subscriptionId) 
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized();

            var subscription = await _context.Subscriptions.FindAsync(subscriptionId);
            if (subscription == null || !subscription.IsActive)
                return NotFound("Subscription not found");

            var existingSubscription = await _context.UserSubscriptions
                .FirstOrDefaultAsync(us => us.UserId == userId && 
                                        us.SubscriptionId == subscriptionId && 
                                        us.IsActive);
            
            if (existingSubscription != null)
                return BadRequest("User already subscribed");

            var userSubscription = new UserSubscription
            {
                UserId = userId,
                SubscriptionId = subscriptionId,
                StartDate = DateTime.UtcNow,
                NextBillingDate = CalculateNextBillingDate(subscription.Period),
                IsActive = false 
            };

            _context.UserSubscriptions.Add(userSubscription);
            await _context.SaveChangesAsync();

            var payment = new Payment
            {
                UserSubscriptionId = userSubscription.Id,
                UserId = userId,
                Amount = subscription.Price,
                Currency = "BYN",
                PaymentDate = DateTime.UtcNow,
                Status = PaymentStatus.Pending,
                PeriodStart = userSubscription.StartDate,
                PeriodEnd = userSubscription.NextBillingDate
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            try
            {
                var userEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "customer@example.com";

                var paymentResult = await _paymentGateway.InitiatePaymentAsync(
                    subscription.Price,
                    "BYN",
                    $"Subscription: {subscription.Name}",
                    payment.Id.ToString(),
                    userEmail
                );

                return Ok(paymentResult);
            }
            catch (ArgumentException ex)
            {
                _context.Payments.Remove(payment);
                _context.UserSubscriptions.Remove(userSubscription);
                await _context.SaveChangesAsync();

                return BadRequest($"Payment initiation failed: {ex.Message}");
            }
            catch (Exception ex)
            {
                _context.Payments.Remove(payment);
                _context.UserSubscriptions.Remove(userSubscription);
                await _context.SaveChangesAsync();

                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("statistics")]
        [ProducesResponseType(typeof(UserStatisticsDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<UserStatisticsDto>> GetUserStatistics()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized("Invalid user ID in token");
            }

            var totalSpent = await _context.Payments
                .Where(p => p.UserId == userId && p.Status == PaymentStatus.Completed)
                .SumAsync(p => p.Amount);

            var activeSubscriptionsCount = await _context.UserSubscriptions
                .CountAsync(us => us.UserId == userId && us.IsActive &&
                                (!us.CancelledAt.HasValue || DateTime.UtcNow <= us.ValidUntil));

            var totalSubscriptionsCount = await _context.UserSubscriptions
                .CountAsync(us => us.UserId == userId && us.IsActive);

            var recentPayments = await _context.Payments
                .Where(p => p.UserId == userId)
                .OrderByDescending(p => p.PaymentDate)
                .Take(10)
                .Include(p => p.UserSubscription)
                    .ThenInclude(us => us.Subscription)
                .Select(p => new PaymentDto
                {
                    Id = p.Id,
                    UserSubscriptionId = p.UserSubscriptionId,
                    Amount = p.Amount,
                    Currency = p.Currency,
                    PaymentDate = p.PaymentDate,
                    PeriodStart = p.PeriodStart,
                    PeriodEnd = p.PeriodEnd,
                    Status = p.Status.ToString(),
                    CardLastFour = p.CardLastFour,
                    CardBrand = p.CardBrand,
                    Subscription = new SubscriptionDto
                    {
                        Id = p.UserSubscription.Subscription.Id,
                        Name = p.UserSubscription.Subscription.Name,
                        Price = p.UserSubscription.Subscription.Price
                    }
                })
                .ToListAsync();

            var upcomingPayments = await _context.UserSubscriptions
                .Where(us => us.UserId == userId &&
                           us.IsActive &&
                           !us.CancelledAt.HasValue &&
                           us.NextBillingDate > DateTime.UtcNow) 
                .Include(us => us.Subscription)
                .Select(us => new UpcomingPaymentDto
                {
                    SubscriptionId = us.SubscriptionId,
                    SubscriptionName = us.Subscription.Name,
                    Amount = us.Subscription.Price,
                    NextBillingDate = us.NextBillingDate
                })
                .ToListAsync();

            var nextBillingDate = upcomingPayments
                .OrderBy(p => p.NextBillingDate)
                .FirstOrDefault()?.NextBillingDate;

            var statistics = new UserStatisticsDto
            {
                TotalSpent = totalSpent,
                ActiveSubscriptionsCount = activeSubscriptionsCount,
                TotalSubscriptionsCount = totalSubscriptionsCount,
                NextBillingDate = nextBillingDate,
                RecentPayments = recentPayments,
                UpcomingPayments = upcomingPayments
            };

            return Ok(statistics);
        }

        [HttpGet("payment-history")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        public async Task<ActionResult> GetPaymentHistory([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 5)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized("Invalid user ID in token");
            }

            var totalCount = await _context.Payments
                .CountAsync(p => p.UserId == userId);

            var payments = await _context.Payments
                .Where(p => p.UserId == userId)
                .OrderByDescending(p => p.PaymentDate)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Include(p => p.UserSubscription)
                    .ThenInclude(us => us.Subscription)
                .Select(p => new PaymentDto
                {
                    Id = p.Id,
                    UserSubscriptionId = p.UserSubscriptionId,
                    Amount = p.Amount,
                    Currency = p.Currency,
                    PaymentDate = p.PaymentDate,
                    PeriodStart = p.PeriodStart,
                    PeriodEnd = p.PeriodEnd,
                    Status = p.Status.ToString(),
                    CardLastFour = p.CardLastFour,
                    CardBrand = p.CardBrand,
                    Subscription = new SubscriptionDto
                    {
                        Id = p.UserSubscription.Subscription.Id,
                        Name = p.UserSubscription.Subscription.Name,
                        Price = p.UserSubscription.Subscription.Price,
                        Period = p.UserSubscription.Subscription.Period
                    }
                })
                .ToListAsync();

            return Ok(new
            {
                items = payments,
                totalCount = totalCount,
                pageNumber = pageNumber,
                pageSize = pageSize
            });
        }

        [HttpPost("subscribe/{subscriptionId}")]
        [ProducesResponseType(typeof(SubscribeResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<SubscribeResponse>> Subscribe(Guid subscriptionId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized("Invalid user ID in token");
            }

            var subscription = await _context.Subscriptions.FindAsync(subscriptionId);
            if (subscription == null || !subscription.IsActive)
            {
                return NotFound("Subscription not found");
            }

            var existingSubscription = await _context.UserSubscriptions
                .FirstOrDefaultAsync(us => us.UserId == userId && us.SubscriptionId == subscriptionId && us.IsActive);

            if (existingSubscription != null)
            {
                return BadRequest("User already subscribed to this service");
            }

            var userSubscription = new UserSubscription
            {
                UserId = userId,
                SubscriptionId = subscriptionId,
                StartDate = DateTime.UtcNow,
                NextBillingDate = CalculateNextBillingDate(subscription.Period),
                IsActive = true
            };

            _context.UserSubscriptions.Add(userSubscription);
            await _context.SaveChangesAsync();

            return Ok(new SubscribeResponse
            {
                Id = userSubscription.Id,
                UserId = userSubscription.UserId,
                SubscriptionId = userSubscription.SubscriptionId,
                StartDate = userSubscription.StartDate,
                NextBillingDate = userSubscription.NextBillingDate,
                IsActive = userSubscription.IsActive
            });
        }

        [HttpGet("my-subscriptions")]
        public async Task<ActionResult<PagedResult<UserSubscriptionDto>>> GetMySubscriptions(
        [FromQuery] PaginationParams pq,
        [FromQuery] string? category = null)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized();

            var currentDate = DateTime.UtcNow;
            var query = _context.UserSubscriptions
                .Where(us => us.UserId == userId && us.IsActive &&
                             (!us.CancelledAt.HasValue || currentDate <= us.ValidUntil))
                .Include(us => us.Subscription)
                .AsQueryable();

            if (!string.IsNullOrEmpty(category))
            {
                query = query.Where(us => us.Subscription.Category == category);
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(us => us.StartDate)
                .Skip((pq.PageNumber - 1) * pq.PageSize)
                .Take(pq.PageSize)
                .ToListAsync();

            var dtos = items.Select(us => MapToUserDto(us)).ToList();

            foreach (var dto in dtos)
            {
                if (dto.Subscription.IconFileId.HasValue)
                {
                    dto.Subscription.IconUrl = await _fileStorageService.GetPresignedUrlAsync(dto.Subscription.IconFileId.Value);
                }
            }

            return Ok(new PagedResult<UserSubscriptionDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = pq.PageNumber,
                PageSize = pq.PageSize
            });
        }

        [HttpPost("unsubscribe/{subscriptionId}")]
        public async Task<IActionResult> Unsubscribe(Guid subscriptionId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized("Invalid user ID in token");
            }

            var userSubscription = await _context.UserSubscriptions
                .FirstOrDefaultAsync(us => us.UserId == userId && us.SubscriptionId == subscriptionId && us.IsActive);

            if (userSubscription == null)
            {
                return NotFound("Subscription not found");
            }

            userSubscription.CancelledAt = DateTime.UtcNow;

            userSubscription.ValidUntil = userSubscription.NextBillingDate;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Subscription cancelled successfully",
                ValidUntil = userSubscription.ValidUntil
            });
        }

        private DateTime CalculateNextBillingDate(string period)
        {
            return period.ToLower() switch
            {
                "monthly" => DateTime.UtcNow.AddMonths(1),
                "quarterly" => DateTime.UtcNow.AddMonths(3),
                "yearly" => DateTime.UtcNow.AddYears(1),
                "lifetime" => DateTime.UtcNow.AddYears(100),
                _ => DateTime.UtcNow.AddMonths(1)
            };
        }

        private static UserSubscriptionDto MapToUserDto(UserSubscription us)
        {
            return new UserSubscriptionDto
            {
                Id = us.Id,
                UserId = us.UserId,
                SubscriptionId = us.SubscriptionId,
                StartDate = us.StartDate,
                NextBillingDate = us.NextBillingDate,
                CancelledAt = us.CancelledAt,
                ValidUntil = us.ValidUntil,
                IsActive = us.IsActive,
                Subscription = new SubscriptionDto
                {
                    Id = us.Subscription.Id,
                    Name = us.Subscription.Name,
                    Description = us.Subscription.Description,
                    Price = us.Subscription.Price,
                    Period = us.Subscription.Period,
                    Category = us.Subscription.Category,
                    IconFileId = us.Subscription.IconFileId,
                    IsActive = us.Subscription.IsActive
                }
            };
        }
    }
}