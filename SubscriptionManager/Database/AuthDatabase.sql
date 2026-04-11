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

CREATE OR ALTER PROCEDURE sp_Users_VerifyEmail
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
GO


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
    
    -- Для отладки: выбираем только что вставленную строку
    SELECT @Id AS Id, @UserId AS UserId, @Token AS Token, @DeviceName AS DeviceName, 
           @ExpiresAt AS ExpiresAt, @CreatedAt AS CreatedAt, 0 AS IsRevoked;
END
GO

-- Получение токена и связанных данных пользователя
CREATE OR ALTER PROCEDURE [sp_RefreshTokens_GetByTokenWithUser]
    @Token NVARCHAR(450)
AS
BEGIN
    SELECT
        rt.Id,
        rt.UserId,
        rt.Token,
        rt.DeviceName,
        rt.ExpiresAt,
        rt.CreatedAt,
        rt.IsRevoked,
        u.Id,
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
    WHERE rt.[Token] = @Token 
      AND rt.[IsRevoked] = 0
      AND rt.[ExpiresAt] > GETUTCDATE();
END
GO
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


/* =========================================================================================
   ЧАТ С АДМИНИСТРАТОРОМ
========================================================================================= */
USE [AuthDb];
GO

-- Таблица диалогов пользователей с администратором
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChatConversations')
BEGIN
    CREATE TABLE [ChatConversations] (
        [Id] UNIQUEIDENTIFIER PRIMARY KEY,
        [UserId] UNIQUEIDENTIFIER NOT NULL,
        [AdminId] UNIQUEIDENTIFIER NULL,
        [Status] NVARCHAR(20) NOT NULL DEFAULT 'Open',
        [LastMessageAt] DATETIME2 NULL,
        [CreatedAt] DATETIME2 NOT NULL,
        [UpdatedAt] DATETIME2 NOT NULL,
        CONSTRAINT [FK_ChatConversations_Users] FOREIGN KEY ([UserId]) 
            REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ChatConversations_UserId' AND object_id = OBJECT_ID('ChatConversations'))
        CREATE UNIQUE INDEX [IX_ChatConversations_UserId] ON [ChatConversations] ([UserId]);
END
GO

-- Таблица сообщений чата
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChatMessages')
BEGIN
    CREATE TABLE [ChatMessages] (
        [Id] UNIQUEIDENTIFIER PRIMARY KEY,
        [ConversationId] UNIQUEIDENTIFIER NOT NULL,
        [SenderId] UNIQUEIDENTIFIER NOT NULL,
        [SenderRole] NVARCHAR(10) NOT NULL,
        [Content] NVARCHAR(MAX) NOT NULL,
        [IsRead] BIT NOT NULL DEFAULT 0,
        [CreatedAt] DATETIME2 NOT NULL,
        CONSTRAINT [FK_ChatMessages_Conversations] FOREIGN KEY ([ConversationId]) 
            REFERENCES [ChatConversations] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ChatMessages_Sender] FOREIGN KEY ([SenderId]) 
            REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ChatMessages_ConversationId' AND object_id = OBJECT_ID('ChatMessages'))
        CREATE INDEX [IX_ChatMessages_ConversationId] ON [ChatMessages] ([ConversationId]);
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ChatMessages_IsRead' AND object_id = OBJECT_ID('ChatMessages'))
        CREATE INDEX [IX_ChatMessages_IsRead] ON [ChatMessages] ([IsRead]);
END
GO

-- Получить или создать диалог пользователя
IF NOT EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_ChatConversations_GetOrCreate')
BEGIN
    EXEC('CREATE PROCEDURE [sp_ChatConversations_GetOrCreate] AS BEGIN SELECT 1 END');
END
GO
ALTER PROCEDURE [sp_ChatConversations_GetOrCreate]
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    DECLARE @ConversationId UNIQUEIDENTIFIER;
    
    SELECT @ConversationId = Id FROM [ChatConversations] WHERE [UserId] = @UserId;
    
    IF @ConversationId IS NULL
    BEGIN
        SET @ConversationId = NEWID();
        INSERT INTO [ChatConversations] (Id, UserId, Status, CreatedAt, UpdatedAt)
        VALUES (@ConversationId, @UserId, 'Open', GETUTCDATE(), GETUTCDATE());
    END
    
    SELECT * FROM [ChatConversations] WHERE [Id] = @ConversationId;
END
GO

-- Получить все диалоги (для админа)
IF NOT EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_ChatConversations_GetAll')
BEGIN
    EXEC('CREATE PROCEDURE [sp_ChatConversations_GetAll] AS BEGIN SELECT 1 END');
END
GO
ALTER PROCEDURE [sp_ChatConversations_GetAll]
    @Status NVARCHAR(20) = NULL
AS
BEGIN
    SELECT * FROM [ChatConversations] 
    WHERE @Status IS NULL OR [Status] = @Status
    ORDER BY [LastMessageAt] DESC;
END
GO

-- Обновить статус диалога
IF NOT EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_ChatConversations_UpdateStatus')
BEGIN
    EXEC('CREATE PROCEDURE [sp_ChatConversations_UpdateStatus] AS BEGIN SELECT 1 END');
END
GO
ALTER PROCEDURE [sp_ChatConversations_UpdateStatus]
    @Id UNIQUEIDENTIFIER,
    @Status NVARCHAR(20),
    @AdminId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    UPDATE [ChatConversations]
    SET [Status] = @Status, 
        [AdminId] = CASE WHEN @AdminId IS NOT NULL THEN @AdminId ELSE [AdminId] END,
        [UpdatedAt] = GETUTCDATE()
    WHERE [Id] = @Id;
END
GO

-- Добавить сообщение
IF NOT EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_ChatMessages_Insert')
BEGIN
    EXEC('CREATE PROCEDURE [sp_ChatMessages_Insert] AS BEGIN SELECT 1 END');
END
GO
ALTER PROCEDURE [sp_ChatMessages_Insert]
    @Id UNIQUEIDENTIFIER,
    @ConversationId UNIQUEIDENTIFIER,
    @SenderId UNIQUEIDENTIFIER,
    @SenderRole NVARCHAR(10),
    @Content NVARCHAR(MAX)
AS
BEGIN
    INSERT INTO [ChatMessages] (Id, ConversationId, SenderId, SenderRole, Content, IsRead, CreatedAt)
    VALUES (@Id, @ConversationId, @SenderId, @SenderRole, @Content, 0, GETUTCDATE());
    
    UPDATE [ChatConversations]
    SET [LastMessageAt] = GETUTCDATE(), [UpdatedAt] = GETUTCDATE()
    WHERE [Id] = @ConversationId;
    
    SELECT * FROM [ChatMessages] WHERE [Id] = @Id;
END
GO

-- Получить сообщения диалога
IF NOT EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_ChatMessages_GetByConversation')
BEGIN
    EXEC('CREATE PROCEDURE [sp_ChatMessages_GetByConversation] AS BEGIN SELECT 1 END');
END
GO
ALTER PROCEDURE [sp_ChatMessages_GetByConversation]
    @ConversationId UNIQUEIDENTIFIER
AS
BEGIN
    SELECT * FROM [ChatMessages] 
    WHERE [ConversationId] = @ConversationId
    ORDER BY [CreatedAt] ASC;
END
GO

-- Получить непрочитанные сообщения для админа
IF NOT EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_ChatMessages_GetUnreadForAdmin')
BEGIN
    EXEC('CREATE PROCEDURE [sp_ChatMessages_GetUnreadForAdmin] AS BEGIN SELECT 1 END');
END
GO
ALTER PROCEDURE [sp_ChatMessages_GetUnreadForAdmin]
AS
BEGIN
    SELECT m.*, c.UserId, u.FirstName, u.LastName, u.Email
    FROM [ChatMessages] m
    INNER JOIN [ChatConversations] c ON m.ConversationId = c.Id
    INNER JOIN [Users] u ON c.UserId = u.Id
    WHERE m.[IsRead] = 0 AND m.[SenderRole] = 'User'
    ORDER BY m.[CreatedAt] DESC;
END
GO

-- Отметить сообщения как прочитанные
IF NOT EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_ChatMessages_MarkAsRead')
BEGIN
    EXEC('CREATE PROCEDURE [sp_ChatMessages_MarkAsRead] AS BEGIN SELECT 1 END');
END
GO
ALTER PROCEDURE [sp_ChatMessages_MarkAsRead]
    @ConversationId UNIQUEIDENTIFIER,
    @ReaderId UNIQUEIDENTIFIER
AS
BEGIN
    UPDATE [ChatMessages]
    SET [IsRead] = 1
    WHERE [ConversationId] = @ConversationId AND [SenderId] != @ReaderId;
END
GO


/* =========================================================================================
    ОТЗЫВЫ И ОЦЕНКИ ПОЛЬЗОВАТЕЛЕЙ
========================================================================================= */

use [AuthDb];
go
-- Таблица отзывов пользователей
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Feedbacks')
BEGIN
    CREATE TABLE [Feedbacks] (
        [Id] UNIQUEIDENTIFIER PRIMARY KEY,
        [UserId] UNIQUEIDENTIFIER NOT NULL,
        [Rating] INT NOT NULL CHECK ([Rating] >= 1 AND [Rating] <= 5),
        [Comment] NVARCHAR(MAX) NULL,
        [CreatedAt] DATETIME2 NOT NULL,
        [UpdatedAt] DATETIME2 NOT NULL,
        CONSTRAINT [FK_Feedbacks_Users] FOREIGN KEY ([UserId]) 
            REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Feedbacks_UserId' AND object_id = OBJECT_ID('Feedbacks'))
        CREATE UNIQUE INDEX [IX_Feedbacks_UserId] ON [Feedbacks] ([UserId]);
END
GO

-- Создать отзыв или обновить существующий
IF NOT EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_Feedbacks_Upsert')
BEGIN
    EXEC('CREATE PROCEDURE [sp_Feedbacks_Upsert] AS BEGIN SELECT 1 END');
END
GO
ALTER PROCEDURE [sp_Feedbacks_Upsert]
    @Id UNIQUEIDENTIFIER,
    @UserId UNIQUEIDENTIFIER,
    @Rating INT,
    @Comment NVARCHAR(MAX) = NULL,
    @CreatedAt DATETIME2
AS
BEGIN
    -- Проверяем, существует ли уже отзыв пользователя
    DECLARE @ExistingId UNIQUEIDENTIFIER;
    
    SELECT @ExistingId = Id FROM [Feedbacks] WHERE [UserId] = @UserId;
    
    IF @ExistingId IS NOT NULL
    BEGIN
        -- Обновляем существующий отзыв
        UPDATE [Feedbacks]
        SET [Rating] = @Rating,
            [Comment] = @Comment,
            [UpdatedAt] = GETUTCDATE()
        WHERE [UserId] = @UserId;
        
        SELECT * FROM [Feedbacks] WHERE [UserId] = @UserId;
    END
    ELSE
    BEGIN
        -- Создаём новый отзыв
        INSERT INTO [Feedbacks] (Id, UserId, Rating, Comment, CreatedAt, UpdatedAt)
        VALUES (@Id, @UserId, @Rating, @Comment, @CreatedAt, @CreatedAt);
        
        SELECT * FROM [Feedbacks] WHERE [Id] = @Id;
    END
END
GO

-- Получить отзыв пользователя
IF NOT EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_Feedbacks_GetByUserId')
BEGIN
    EXEC('CREATE PROCEDURE [sp_Feedbacks_GetByUserId] AS BEGIN SELECT 1 END');
END
GO
ALTER PROCEDURE [sp_Feedbacks_GetByUserId]
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    SELECT * FROM [Feedbacks] WHERE [UserId] = @UserId;
END
GO

-- Получить все отзывы (для админа)
IF NOT EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_Feedbacks_GetAll')
BEGIN
    EXEC('CREATE PROCEDURE [sp_Feedbacks_GetAll] AS BEGIN SELECT 1 END');
END
GO
ALTER PROCEDURE [sp_Feedbacks_GetAll]
    @PageNumber INT = 1,
    @PageSize INT = 10
AS
BEGIN
    DECLARE @TotalCount INT;
    
    SELECT @TotalCount = COUNT(*) FROM [Feedbacks];
    
    SELECT * FROM [Feedbacks]
    ORDER BY [CreatedAt] DESC
    OFFSET ((@PageNumber - 1) * @PageSize) ROWS
    FETCH NEXT @PageSize ROWS ONLY;
    
    SELECT @TotalCount AS TotalCount;
END
GO

-- Получить средний рейтинг
IF NOT EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_Feedbacks_GetAverageRating')
BEGIN
    EXEC('CREATE PROCEDURE [sp_Feedbacks_GetAverageRating] AS BEGIN SELECT 1 END');
END
GO
ALTER PROCEDURE [sp_Feedbacks_GetAverageRating]
AS
BEGIN
    SELECT 
        COUNT(*) AS TotalCount,
        AVG(CAST([Rating] AS FLOAT)) AS AverageRating
    FROM [Feedbacks];
END
GO

-- Последние отзывы для публичного блока в профиле (имя + первая буква фамилии)
IF NOT EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_Feedbacks_GetRecentPublic')
BEGIN
    EXEC('CREATE PROCEDURE [sp_Feedbacks_GetRecentPublic] AS BEGIN SELECT 1 END');
END
GO
ALTER PROCEDURE [sp_Feedbacks_GetRecentPublic]
    @Take INT = 8
AS
BEGIN
    IF @Take < 1 SET @Take = 8;
    IF @Take > 50 SET @Take = 50;

    SELECT TOP (@Take)
        f.[Id],
        f.[Rating],
        f.[Comment],
        f.[UpdatedAt],
        u.[FirstName],
        u.[LastName]
    FROM [Feedbacks] f
    INNER JOIN [Users] u ON u.[Id] = f.[UserId]
    ORDER BY f.[UpdatedAt] DESC;
END
GO