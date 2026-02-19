using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace SubscriptionManager.Subscriptions.Infrastructure.Data
{
    public class SubscriptionsDbContextFactory : IDesignTimeDbContextFactory<SubscriptionsDbContext>
    {
        public SubscriptionsDbContext CreateDbContext(string[] args)
        {
            IConfigurationRoot configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: false)
                .AddJsonFile($"appsettings.Development.json", optional: true)
                .Build();

            var builder = new DbContextOptionsBuilder<SubscriptionsDbContext>();

            string connectionString = configuration.GetConnectionString("SubscriptionsConnection")
                ?? "Server=(localdb)\\mssqllocaldb;Database=EFDesignSubscriptionsDb;Trusted_Connection=True;";

            builder.UseSqlServer(connectionString);

            return new SubscriptionsDbContext(builder.Options);
        }
    }
}