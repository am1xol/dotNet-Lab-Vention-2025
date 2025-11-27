using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SubscriptionManager.Core;
using SubscriptionManager.Core.DTOs;
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
        private readonly ApplicationDbContext _context;
        private readonly IFileStorageService _fileStorageService;

        public UserSubscriptionsController(ApplicationDbContext context, IFileStorageService fileStorageService)
        {
            _context = context;
            _fileStorageService = fileStorageService;
        }

        [HttpPost("subscribe-with-payment")]
        [ProducesResponseType(typeof(SubscribeResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<SubscribeResponse>> SubscribeWithPayment(SubscribeWithPaymentRequest request)
        {
            try
            {
                Console.WriteLine($"=== SubscribeWithPayment Started ===");

                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
                {
                    Console.WriteLine("FAIL: Invalid user ID");
                    return Unauthorized("Invalid user ID in token");
                }

                Console.WriteLine($"User ID: {userId}");
                Console.WriteLine($"Subscription ID: {request.SubscriptionId}");

                var subscription = await _context.Subscriptions.FindAsync(request.SubscriptionId);
                if (subscription == null || !subscription.IsActive)
                {
                    Console.WriteLine("FAIL: Subscription not found or inactive");
                    return NotFound("Subscription not found");
                }

                Console.WriteLine($"Subscription found: {subscription.Name}");

                var existingSubscription = await _context.UserSubscriptions
                    .FirstOrDefaultAsync(us => us.UserId == userId &&
                                             us.SubscriptionId == request.SubscriptionId &&
                                             us.IsActive);

                if (existingSubscription != null)
                {
                    Console.WriteLine("FAIL: User already subscribed");
                    return BadRequest("User already subscribed to this service");
                }

                request.PaymentInfo.CardNumber = request.PaymentInfo.CardNumber?.Replace(" ", "") ?? "";

                if (!ValidatePaymentInfo(request.PaymentInfo))
                {
                    Console.WriteLine("FAIL: Invalid payment info");
                    return BadRequest("Invalid payment information");
                }

                Console.WriteLine("Payment info validated successfully");

                var userSubscription = new UserSubscription
                {
                    UserId = userId,
                    SubscriptionId = request.SubscriptionId,
                    StartDate = DateTime.UtcNow,
                    NextBillingDate = CalculateNextBillingDate(subscription.Period),
                    IsActive = true
                };

                Console.WriteLine("Creating user subscription...");
                _context.UserSubscriptions.Add(userSubscription);
                await _context.SaveChangesAsync();
                Console.WriteLine($"User subscription created with ID: {userSubscription.Id}");

                var payment = new Payment
                {
                    UserSubscriptionId = userSubscription.Id,
                    UserId = userId,
                    Amount = subscription.Price,
                    Currency = "USD",
                    PaymentDate = DateTime.UtcNow,
                    PeriodStart = userSubscription.StartDate,
                    PeriodEnd = userSubscription.NextBillingDate,
                    Status = PaymentStatus.Completed,
                    CardLastFour = request.PaymentInfo.CardNumber.Length >= 4
                        ? request.PaymentInfo.CardNumber.Substring(request.PaymentInfo.CardNumber.Length - 4)
                        : request.PaymentInfo.CardNumber,
                    CardBrand = DetectCardBrand(request.PaymentInfo.CardNumber)
                };

                Console.WriteLine("Creating payment record...");
                _context.Payments.Add(payment);
                await _context.SaveChangesAsync();
                Console.WriteLine($"Payment created with ID: {payment.Id}");

                Console.WriteLine("=== SubscribeWithPayment Completed Successfully ===");

                return Ok(new SubscribeResponse
                {
                    Id = userSubscription.Id,
                    UserId = userSubscription.UserId,
                    SubscriptionId = userSubscription.SubscriptionId,
                    StartDate = userSubscription.StartDate,
                    NextBillingDate = userSubscription.NextBillingDate,
                    IsActive = userSubscription.IsActive,
                    Message = "Subscription created and payment processed successfully"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR in SubscribeWithPayment: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw;
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
                .CountAsync(us => us.UserId == userId);

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
        [ProducesResponseType(typeof(List<PaymentDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<List<PaymentDto>>> GetPaymentHistory()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized("Invalid user ID in token");
            }

            var payments = await _context.Payments
                .Where(p => p.UserId == userId)
                .OrderByDescending(p => p.PaymentDate)
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

            return Ok(payments);
        }

        private bool ValidatePaymentInfo(PaymentInfoDto paymentInfo)
        {
            var cleanCardNumber = paymentInfo.CardNumber?.Replace(" ", "") ?? "";

            if (string.IsNullOrWhiteSpace(cleanCardNumber) ||
                !cleanCardNumber.All(char.IsDigit) ||
                cleanCardNumber.Length < 13)
            {
                return false;
            }

            if (!int.TryParse(paymentInfo.ExpiryMonth, out int month) ||
                month < 1 || month > 12)
            {
                return false;
            }

            if (!int.TryParse(paymentInfo.ExpiryYear, out int year) ||
                year < DateTime.Now.Year)
            {
                return false;
            }

            if (string.IsNullOrWhiteSpace(paymentInfo.Cvc) ||
                !paymentInfo.Cvc.All(char.IsDigit) ||
                paymentInfo.Cvc.Length < 3)
            {
                return false;
            }

            return true;
        }

        private string DetectCardBrand(string cardNumber)
        {
            if (string.IsNullOrWhiteSpace(cardNumber)) return "Unknown";

            var cleanCardNumber = cardNumber.Replace(" ", "");

            return cleanCardNumber.StartsWith("4") ? "Visa" :
                   cleanCardNumber.StartsWith("5") ? "MasterCard" :
                   cleanCardNumber.StartsWith("6") ? "Discover" : "Unknown";
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
        [ProducesResponseType(typeof(Dictionary<string, List<UserSubscriptionDto>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<Dictionary<string, List<UserSubscriptionDto>>>> GetMySubscriptions()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized("Invalid user ID in token");
            }

            var currentDate = DateTime.UtcNow;

            var userSubscriptions = await _context.UserSubscriptions
                .Where(us => us.UserId == userId &&
                             us.IsActive &&
                             (!us.CancelledAt.HasValue || currentDate <= us.ValidUntil))
                .Include(us => us.Subscription)
                .Select(us => new UserSubscriptionDto
                {
                    Id = us.Id,
                    UserId = us.UserId,
                    SubscriptionId = us.SubscriptionId,
                    StartDate = us.StartDate,
                    NextBillingDate = us.NextBillingDate,
                    CancelledAt = us.CancelledAt,
                    ValidUntil = us.ValidUntil,
                    IsActive = us.IsActive,
                    Status = us.CancelledAt.HasValue ? "Cancelled" : "Active",
                    Subscription = new SubscriptionDto
                    {
                        Id = us.Subscription.Id,
                        Name = us.Subscription.Name,
                        Description = us.Subscription.Description,
                        Price = us.Subscription.Price,
                        Period = us.Subscription.Period,
                        Category = us.Subscription.Category,
                        IconFileId = us.Subscription.IconFileId,
                        IconUrl = null,
                        IsActive = us.Subscription.IsActive,
                        CreatedAt = us.Subscription.CreatedAt,
                        UpdatedAt = us.Subscription.UpdatedAt
                    }
                })
                .ToListAsync();

            foreach (var userSubscription in userSubscriptions)
            {
                if (userSubscription.Subscription.IconFileId.HasValue)
                {
                    try
                    {
                        userSubscription.Subscription.IconUrl = await _fileStorageService.GetPresignedUrlAsync(
                            userSubscription.Subscription.IconFileId.Value);
                    }
                    catch
                    {
                        userSubscription.Subscription.IconUrl = null;
                    }
                }
            }

            var groupedSubscriptions = userSubscriptions
                .GroupBy(us => us.Subscription.Category)
                .ToDictionary(g => g.Key, g => g.ToList());

            return Ok(groupedSubscriptions);
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
    }
}
