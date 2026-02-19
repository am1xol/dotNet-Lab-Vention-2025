using Microsoft.EntityFrameworkCore;
using SubscriptionManager.Core;
using SubscriptionManager.Core.Models;

namespace SubscriptionManager.Subscriptions.Infrastructure.Data
{
    public class SubscriptionsDbContext : DbContext
    {
        public SubscriptionsDbContext(DbContextOptions<SubscriptionsDbContext> options) : base(options)
        {
        }

        public DbSet<Subscription> Subscriptions { get; set; }
        public DbSet<UserSubscription> UserSubscriptions { get; set; }
        public DbSet<StoredFile> StoredFiles { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Notification> Notifications { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<StoredFile>()
                .HasIndex(f => f.ObjectName)
                .IsUnique();


            modelBuilder.Entity<Subscription>()
                .HasOne(s => s.IconFile)
                .WithMany(f => f.Subscriptions)
                .HasForeignKey(s => s.IconFileId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Subscription>()
                .Property(s => s.Price)
                .HasPrecision(18, 2);

            modelBuilder.Entity<UserSubscription>()
                .HasOne(us => us.Subscription)
                .WithMany()
                .HasForeignKey(us => us.SubscriptionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserSubscription>()
                .HasIndex(us => us.UserId);

            modelBuilder.Entity<Payment>()
                .HasOne(p => p.UserSubscription)
                .WithMany(us => us.Payments)
                .HasForeignKey(p => p.UserSubscriptionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Payment>()
                .Property(p => p.Amount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Payment>()
                .Property(p => p.Currency)
                .HasMaxLength(3);

            modelBuilder.Entity<Payment>()
                .Property(p => p.CardLastFour)
                .HasMaxLength(4);

            modelBuilder.Entity<Payment>()
                .Property(p => p.CardBrand)
                .HasMaxLength(20);
        }
    }
}
