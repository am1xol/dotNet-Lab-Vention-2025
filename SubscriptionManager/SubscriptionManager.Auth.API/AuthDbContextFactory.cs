using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using SubscriptionManager.Infrastructure.Data;

namespace SubscriptionManager.Auth.API
{
    public class AuthDbContextFactory : IDesignTimeDbContextFactory<AuthDbContext>
    {
        public AuthDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<AuthDbContext>();
            optionsBuilder.UseSqlServer("Server=(localdb)\\mssqllocaldb;Database=AuthDb_DesignTime;Trusted_Connection=True;");

            return new AuthDbContext(optionsBuilder.Options);
        }
    }
}
