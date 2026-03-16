USE [AuthDb];
GO

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

CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);
GO

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

CREATE UNIQUE INDEX [IX_RefreshTokens_Token] ON [RefreshTokens] ([Token]);
GO


/* =========================================================================================
   АУТЕНТИФИКАЦИЯ И РЕГИСТРАЦИЯ
========================================================================================= */

-- Регистрация нового пользователя
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

-- Получение пользователя по Email
CREATE OR ALTER PROCEDURE [sp_Users_GetByEmail]
    @Email NVARCHAR(256)
AS
BEGIN
    SELECT * FROM [Users] WHERE [Email] = @Email;
END
GO

-- Проверка доступности Email
CREATE OR ALTER PROCEDURE [sp_Users_IsEmailTaken]
    @Email NVARCHAR(256),
    @ExcludeUserId UNIQUEIDENTIFIER
AS
BEGIN
    SELECT CAST(CASE WHEN EXISTS (
        SELECT 1 FROM [Users] WHERE [Email] = @Email AND [Id] != @ExcludeUserId
    ) THEN 1 ELSE 0 END AS BIT);
END
GO

CREATE PROCEDURE sp_Users_VerifyEmail
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    UPDATE Users 
    SET IsEmailVerified = 1,
        EmailVerificationCode = NULL,
        EmailVerificationCodeExpiresAt = NULL,
        UpdatedAt = GETUTCDATE()
    WHERE Id = @Id
END


/* =========================================================================================
   ВОССТАНОВЛЕНИЕ ПАРОЛЯ
========================================================================================= */

-- Установка кода сброса пароля
CREATE OR ALTER PROCEDURE [sp_Users_UpdateResetCode]
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

-- Установка нового пароля и очистка кодов сброса
CREATE OR ALTER PROCEDURE [sp_Users_UpdatePassword]
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


/* =========================================================================================
   УПРАВЛЕНИЕ ПРОФИЛЕМ И АДМИН ПАНЕЛЬ
========================================================================================= */

-- Получение пользователя по ID (Профиль)
CREATE OR ALTER PROCEDURE [sp_Users_GetById]
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    SELECT * FROM [Users] WHERE [Id] = @Id;
END
GO

-- Получение списка пользователей с пагинацией и поиском (Админка)
CREATE OR ALTER PROCEDURE [sp_Users_GetPaged]
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

-- Обновление данных пользователя
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


/* =========================================================================================
   УПРАВЛЕНИЕ ТОКЕНАМИ (REFRESH TOKENS)
========================================================================================= */

-- Сохранение нового Refresh-токена
CREATE OR ALTER PROCEDURE [sp_RefreshTokens_Insert]
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

-- Получение токена и связанных данных пользователя
CREATE OR ALTER PROCEDURE [sp_RefreshTokens_GetByTokenWithUser]
    @Token NVARCHAR(450)
AS
BEGIN
    SELECT 
        rt.Id, rt.UserId, rt.Token, rt.DeviceName, rt.ExpiresAt, rt.CreatedAt, rt.IsRevoked,
        u.Id AS UserId,
        u.Email,
        u.PasswordHash,
        u.FirstName,
        u.LastName,
        u.IsEmailVerified,
        u.EmailVerificationCode,
        u.EmailVerificationCodeExpiresAt,
        u.CreatedAt,
        u.UpdatedAt,
        u.Role,
        u.PasswordResetCode,
        u.PasswordResetExpiresAt,
        u.IsBlocked
    FROM [RefreshTokens] rt
    INNER JOIN [Users] u ON rt.[UserId] = u.[Id]
    WHERE rt.[Token] = @Token AND rt.[IsRevoked] = 0;
END
GO

-- Обновление статуса токена
CREATE OR ALTER PROCEDURE [sp_RefreshTokens_Update]
    @Id UNIQUEIDENTIFIER,
    @IsRevoked BIT
AS
BEGIN
    UPDATE [RefreshTokens]
    SET [IsRevoked] = @IsRevoked
    WHERE [Id] = @Id;
END
GO

-- Отзыв всех активных токенов пользователя
CREATE OR ALTER PROCEDURE [sp_RefreshTokens_RevokeAllUserTokens]
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    UPDATE [RefreshTokens]
    SET [IsRevoked] = 1
    WHERE [UserId] = @UserId AND [IsRevoked] = 0;
END
GO