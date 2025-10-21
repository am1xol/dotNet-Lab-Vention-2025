using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SubscriptionManager.Core.Models;

namespace SubscriptionManager.Core.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<bool> ExistsByEmailAsync(string email);
    Task<User?> GetByRefreshTokenAsync(string refreshToken);
    Task AddAsync(User user);
    Task SaveChangesAsync();
    Task UpdateAsync(User user);
}
