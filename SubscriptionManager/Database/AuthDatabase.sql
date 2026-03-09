-- Таблица Users
CREATE TABLE [Users] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY,
    [Email] NVARCHAR(256) NOT NULL,
    [PasswordHash] NVARCHAR(88) NOT NULL,
    [FirstName] NVARCHAR(MAX) NOT NULL,
    [LastName] NVARCHAR(MAX) NOT NULL,
    [IsEmailVerified] BIT NOT NULL DEFAULT 0,
    [EmailVerificationCode] NVARCHAR(MAX) NULL,
    [EmailVerificationCodeExpiresAt] DATETIME2 NULL,
    [CreatedAt] DATETIME2 NOT NULL,
    [UpdatedAt] DATETIME2 NOT NULL,
    [Role] NVARCHAR(5) NOT NULL DEFAULT 'User',
    [PasswordResetCode] NVARCHAR(MAX) NULL,
    [PasswordResetExpiresAt] DATETIME2 NULL,
    [IsBlocked] BIT NOT NULL DEFAULT 0
);
GO

-- Уникальный индекс для Email
CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);
GO

-- Таблица RefreshTokens
CREATE TABLE [RefreshTokens] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY,
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [Token] NVARCHAR(450) NOT NULL,
    [DeviceName] NVARCHAR(MAX) NULL,
    [ExpiresAt] DATETIME2 NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL,
    [IsRevoked] BIT NOT NULL DEFAULT 0,
    CONSTRAINT [FK_RefreshTokens_Users] FOREIGN KEY ([UserId]) 
        REFERENCES [Users] ([Id]) ON DELETE CASCADE
);
GO

-- Уникальный индекс для Token
CREATE UNIQUE INDEX [IX_RefreshTokens_Token] ON [RefreshTokens] ([Token]);
GO

USE [AuthDb];
GO

-- 1. Регистрация нового пользователя
CREATE OR ALTER PROCEDURE [sp_Users_Insert]
    @Id UNIQUEIDENTIFIER,
    @Email NVARCHAR(256),
    @PasswordHash NVARCHAR(88),
    @FirstName NVARCHAR(MAX),
    @LastName NVARCHAR(MAX),
    @Role NVARCHAR(5),
    @CreatedAt DATETIME2,
    @UpdatedAt DATETIME2,
    @EmailVerificationCode NVARCHAR(MAX) = NULL,
    @EmailVerificationCodeExpiresAt DATETIME2 = NULL
AS
BEGIN
    INSERT INTO [Users] (
        Id, Email, PasswordHash, FirstName, LastName, Role, CreatedAt, UpdatedAt, 
        IsEmailVerified, IsBlocked, EmailVerificationCode, EmailVerificationCodeExpiresAt
    )
    VALUES (
        @Id, @Email, @PasswordHash, @FirstName, @LastName, @Role, @CreatedAt, @UpdatedAt, 
        0, 0, @EmailVerificationCode, @EmailVerificationCodeExpiresAt
    );
END
GO

-- 2. Получение пользователя по Email (для Login)
CREATE PROCEDURE [sp_Users_GetByEmail]
    @Email NVARCHAR(256)
AS
BEGIN
    SELECT * FROM [Users] WHERE [Email] = @Email;
END
GO

-- 3. Проверка: занят ли email другим пользователем
CREATE PROCEDURE [sp_Users_IsEmailTaken]
    @Email NVARCHAR(256),
    @ExcludeUserId UNIQUEIDENTIFIER
AS
BEGIN
    SELECT CAST(CASE WHEN EXISTS (
        SELECT 1 FROM [Users] WHERE [Email] = @Email AND [Id] != @ExcludeUserId
    ) THEN 1 ELSE 0 END AS BIT);
END
GO

-- 4. Пагинация и поиск пользователей
CREATE PROCEDURE [sp_Users_GetPaged]
    @PageNumber INT,
    @PageSize INT,
    @SearchTerm NVARCHAR(MAX) = NULL,
    @TotalCount INT OUTPUT
AS
BEGIN
    SELECT @TotalCount = COUNT(*) FROM [Users]
    WHERE (@SearchTerm IS NULL OR 
           [Email] LIKE '%' + @SearchTerm + '%' OR 
           [FirstName] LIKE '%' + @SearchTerm + '%' OR 
           [LastName] LIKE '%' + @SearchTerm + '%' OR
           CAST([Id] AS NVARCHAR(MAX)) LIKE '%' + @SearchTerm + '%');

    SELECT * FROM [Users]
    WHERE (@SearchTerm IS NULL OR 
           [Email] LIKE '%' + @SearchTerm + '%' OR 
           [FirstName] LIKE '%' + @SearchTerm + '%' OR 
           [LastName] LIKE '%' + @SearchTerm + '%' OR
           CAST([Id] AS NVARCHAR(MAX)) LIKE '%' + @SearchTerm + '%')
    ORDER BY [CreatedAt] DESC
    OFFSET ((@PageNumber - 1) * @PageSize) ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO

-- 5. Получение Refresh Token вместе с данными пользователя (JOIN)
CREATE OR ALTER PROCEDURE [sp_RefreshTokens_GetByTokenWithUser]
    @Token NVARCHAR(450)
AS
BEGIN
    SELECT 
        rt.Id, rt.UserId, rt.Token, rt.DeviceName, rt.ExpiresAt, rt.CreatedAt, rt.IsRevoked,
        u.Id,
        u.Email,
        u.PasswordHash,
        u.FirstName,
        u.LastName,
        u.IsEmailVerified,
        u.EmailVerificationCode,
        u.EmailVerificationCodeExpiresAt,
        u.CreatedAt AS UserCreatedAt,
        u.UpdatedAt AS UserUpdatedAt,
        u.Role,
        u.PasswordResetCode,
        u.PasswordResetExpiresAt,
        u.IsBlocked
    FROM [RefreshTokens] rt
    INNER JOIN [Users] u ON rt.[UserId] = u.[Id]
    WHERE rt.[Token] = @Token AND rt.[IsRevoked] = 0;
END
GO

-- 6. Обновление кодов верификации/сброса пароля
CREATE PROCEDURE [sp_Users_UpdateAuthCodes]
    @Id UNIQUEIDENTIFIER,
    @EmailVerificationCode NVARCHAR(MAX) = NULL,
    @EmailVerificationCodeExpiresAt DATETIME2 = NULL,
    @PasswordResetCode NVARCHAR(MAX) = NULL,
    @PasswordResetExpiresAt DATETIME2 = NULL,
    @IsEmailVerified BIT = NULL
AS
BEGIN
    UPDATE [Users]
    SET [EmailVerificationCode] = ISNULL(@EmailVerificationCode, [EmailVerificationCode]),
        [EmailVerificationCodeExpiresAt] = ISNULL(@EmailVerificationCodeExpiresAt, [EmailVerificationCodeExpiresAt]),
        [PasswordResetCode] = ISNULL(@PasswordResetCode, [PasswordResetCode]),
        [PasswordResetExpiresAt] = ISNULL(@PasswordResetExpiresAt, [PasswordResetExpiresAt]),
        [IsEmailVerified] = ISNULL(@IsEmailVerified, [IsEmailVerified]),
        [UpdatedAt] = GETUTCDATE()
    WHERE [Id] = @Id;
END
GO

-- 7. Добавление refresh токена
CREATE PROCEDURE [sp_RefreshTokens_Insert]
    @Id UNIQUEIDENTIFIER,
    @UserId UNIQUEIDENTIFIER,
    @Token NVARCHAR(450),
    @DeviceName NVARCHAR(MAX),
    @ExpiresAt DATETIME2,
    @CreatedAt DATETIME2
AS
BEGIN
    INSERT INTO [RefreshTokens] (Id, UserId, Token, DeviceName, ExpiresAt, CreatedAt, IsRevoked)
    VALUES (@Id, @UserId, @Token, @DeviceName, @ExpiresAt, @CreatedAt, 0);
END
GO

-- 8. Обновление refresh токена (отзыв)
CREATE PROCEDURE [sp_RefreshTokens_Update]
    @Id UNIQUEIDENTIFIER,
    @IsRevoked BIT
AS
BEGIN
    UPDATE [RefreshTokens]
    SET [IsRevoked] = @IsRevoked
    WHERE [Id] = @Id;
END
GO

-- 9. Отзыв всех refresh токенов пользователя
CREATE PROCEDURE [sp_RefreshTokens_RevokeAllUserTokens]
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    UPDATE [RefreshTokens]
    SET [IsRevoked] = 1
    WHERE [UserId] = @UserId AND [IsRevoked] = 0;
END
GO

-- 10. Обновление основных данных пользователя
CREATE OR ALTER PROCEDURE [sp_Users_Update]
    @Id UNIQUEIDENTIFIER,
    @FirstName NVARCHAR(MAX),
    @LastName NVARCHAR(MAX),
    @Email NVARCHAR(256) = NULL,
    @PasswordHash NVARCHAR(88) = NULL,
    @Role NVARCHAR(5) = NULL,
    @IsBlocked BIT = NULL
AS
BEGIN
    UPDATE [Users]
    SET 
        FirstName = @FirstName,
        LastName = @LastName,
        Email = ISNULL(@Email, Email),
        PasswordHash = ISNULL(@PasswordHash, PasswordHash),
        Role = ISNULL(@Role, Role),
        IsBlocked = ISNULL(@IsBlocked, IsBlocked),
        UpdatedAt = GETUTCDATE()
    WHERE Id = @Id;
END
GO

-- 11. Получение пользователя по Id
CREATE PROCEDURE [sp_Users_GetById]
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    SELECT * FROM [Users] WHERE [Id] = @Id;
END
GO

-- 12. Обновление только кода сброса пароля (используется в ForgotPassword)
CREATE PROCEDURE [sp_Users_UpdateResetCode]
    @Id UNIQUEIDENTIFIER,
    @PasswordResetCode NVARCHAR(MAX),
    @PasswordResetExpiresAt DATETIME2
AS
BEGIN
    UPDATE [Users]
    SET PasswordResetCode = @PasswordResetCode,
        PasswordResetExpiresAt = @PasswordResetExpiresAt,
        UpdatedAt = GETUTCDATE()
    WHERE Id = @Id;
END
GO

-- 13. Обновление пароля пользователя (используется в ResetPassword)
CREATE PROCEDURE [sp_Users_UpdatePassword]
    @Id UNIQUEIDENTIFIER,
    @PasswordHash NVARCHAR(88)
AS
BEGIN
    UPDATE [Users]
    SET PasswordHash = @PasswordHash,
        PasswordResetCode = NULL,
        PasswordResetExpiresAt = NULL,
        UpdatedAt = GETUTCDATE()
    WHERE Id = @Id;
END
GO