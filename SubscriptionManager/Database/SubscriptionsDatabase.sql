-- Таблица StoredFiles
CREATE TABLE [StoredFiles] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY,
    [FileName] NVARCHAR(255) NOT NULL,
    [BucketName] NVARCHAR(50) NOT NULL,
    [ObjectName] NVARCHAR(255) NOT NULL,
    [ContentType] NVARCHAR(100) NOT NULL,
    [Size] BIGINT NOT NULL,
    [UserId] UNIQUEIDENTIFIER NULL,
    [CreatedAt] DATETIME2 NOT NULL,
    [UpdatedAt] DATETIME2 NOT NULL
);
GO
CREATE UNIQUE INDEX [IX_StoredFiles_ObjectName] ON [StoredFiles] ([ObjectName]);
GO

-- Таблица Subscriptions
CREATE TABLE [Subscriptions] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY,
    [Name] NVARCHAR(100) NOT NULL,
    [Description] NVARCHAR(500) NOT NULL,
    [DescriptionMarkdown] NVARCHAR(4000) NOT NULL,
    [Price] DECIMAL(18, 2) NOT NULL,
    [Period] NVARCHAR(MAX) NOT NULL,
    [Category] NVARCHAR(MAX) NOT NULL,
    [IconFileId] UNIQUEIDENTIFIER NULL,
    [IconUrl] NVARCHAR(MAX) NULL,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedAt] DATETIME2 NOT NULL,
    [UpdatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [FK_Subscriptions_StoredFiles] FOREIGN KEY ([IconFileId]) 
        REFERENCES [StoredFiles] ([Id]) ON DELETE SET NULL
);
GO

-- Таблица UserSubscriptions
CREATE TABLE [UserSubscriptions] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY,
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [SubscriptionId] UNIQUEIDENTIFIER NOT NULL,
    [StartDate] DATETIME2 NOT NULL,
    [NextBillingDate] DATETIME2 NOT NULL,
    [CancelledAt] DATETIME2 NULL,
    [ValidUntil] DATETIME2 NULL,
    [IsActive] BIT NOT NULL DEFAULT 1,
    CONSTRAINT [FK_UserSubscriptions_Subscriptions] FOREIGN KEY ([SubscriptionId]) 
        REFERENCES [Subscriptions] ([Id]) ON DELETE CASCADE
);
GO
CREATE INDEX [IX_UserSubscriptions_UserId] ON [UserSubscriptions] ([UserId]);
GO

-- Таблица Payments
CREATE TABLE [Payments] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY,
    [UserSubscriptionId] UNIQUEIDENTIFIER NOT NULL,
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [Amount] DECIMAL(18, 2) NOT NULL,
    [Currency] NVARCHAR(3) NOT NULL DEFAULT 'BYN',
    [PaymentDate] DATETIME2 NOT NULL,
    [PeriodStart] DATETIME2 NOT NULL,
    [PeriodEnd] DATETIME2 NOT NULL,
    [Status] INT NOT NULL,
    [CardLastFour] NVARCHAR(4) NOT NULL DEFAULT '',
    [CardBrand] NVARCHAR(20) NOT NULL DEFAULT '',
    [ExternalTransactionId] NVARCHAR(100) NULL,
    CONSTRAINT [FK_Payments_UserSubscriptions] FOREIGN KEY ([UserSubscriptionId]) 
        REFERENCES [UserSubscriptions] ([Id]) ON DELETE CASCADE
);
GO

-- ограничение для CardLastFour
ALTER TABLE [Payments] 
ADD CONSTRAINT [DF_Payments_CardLastFour] DEFAULT ('') FOR [CardLastFour];
GO

-- ограничение для CardBrand
ALTER TABLE [Payments] 
ADD CONSTRAINT [DF_Payments_CardBrand] DEFAULT ('') FOR [CardBrand];
GO

-- Таблица Notifications
CREATE TABLE [Notifications] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY,
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [Title] NVARCHAR(MAX) NOT NULL,
    [Message] NVARCHAR(MAX) NOT NULL,
    [Type] INT NOT NULL,
    [IsRead] BIT NOT NULL DEFAULT 0,
    [CreatedAt] DATETIME2 NOT NULL
);
GO

USE [SubscriptionsDb];
GO

-- 1. Получение активных подписок пользователя (с данными о самой подписке)
CREATE PROCEDURE [sp_UserSubscriptions_GetActiveByUserId]
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    SELECT us.*, s.* FROM [UserSubscriptions] us
    INNER JOIN [Subscriptions] s ON us.[SubscriptionId] = s.[Id]
    WHERE us.[UserId] = @UserId AND us.[IsActive] = 1;
END
GO

-- 2. Поиск и фильтрация всех доступных подписок (базовая пагинация)
CREATE PROCEDURE [sp_Subscriptions_GetPaged]
    @PageNumber INT,
    @PageSize INT,
    @Category NVARCHAR(MAX) = NULL,
    @OrderBy NVARCHAR(50) = 'date',
    @TotalCount INT OUTPUT
AS
BEGIN
    SELECT @TotalCount = COUNT(*) FROM [Subscriptions] 
    WHERE [IsActive] = 1 AND (@Category IS NULL OR [Category] = @Category);

    SELECT * FROM [Subscriptions]
    WHERE [IsActive] = 1 AND (@Category IS NULL OR [Category] = @Category)
    ORDER BY 
        CASE WHEN @OrderBy = 'name' THEN [Name] END ASC,
        CASE WHEN @OrderBy = 'price' THEN [Price] END ASC,
        CASE WHEN @OrderBy = 'date' THEN [CreatedAt] END DESC
    OFFSET ((@PageNumber - 1) * @PageSize) ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO

-- 3. Создание платежа (инициирование)
CREATE OR ALTER PROCEDURE [sp_Payments_Insert]
    @Id UNIQUEIDENTIFIER,
    @UserSubscriptionId UNIQUEIDENTIFIER,
    @UserId UNIQUEIDENTIFIER,
    @Amount DECIMAL(18,2),
    @Currency NVARCHAR(3),
    @ExternalTransactionId NVARCHAR(100),
    @Status INT,
    @PeriodStart DATETIME2,
    @PeriodEnd DATETIME2
AS
BEGIN
    INSERT INTO [Payments] (
    Id, UserSubscriptionId, UserId, Amount, Currency, 
    ExternalTransactionId, Status, PaymentDate, PeriodStart, PeriodEnd
    )
    VALUES (
        @Id, @UserSubscriptionId, @UserId, @Amount, @Currency, 
        @ExternalTransactionId, @Status, GETUTCDATE(), @PeriodStart, @PeriodEnd
    );
END
GO

-- 4. Обработка Webhook: Успешная оплата (Обновляет и платеж, и подписку)
CREATE OR ALTER PROCEDURE [sp_Payments_Complete]
    @ExternalTransactionId NVARCHAR(100),
    @CardLastFour NVARCHAR(4),
    @CardBrand NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @OutputTable TABLE (UserSubId UNIQUEIDENTIFIER);
    DECLARE @TargetSubId UNIQUEIDENTIFIER;
    
    UPDATE [Payments] 
    SET [Status] = 1,
        [CardLastFour] = @CardLastFour,
        [CardBrand] = @CardBrand
    OUTPUT inserted.UserSubscriptionId INTO @OutputTable(UserSubId)
    WHERE [ExternalTransactionId] = @ExternalTransactionId;

    SELECT TOP 1 @TargetSubId = UserSubId FROM @OutputTable;

    IF @TargetSubId IS NOT NULL
    BEGIN
        UPDATE [UserSubscriptions] 
        SET [IsActive] = 1 
        WHERE [Id] = @TargetSubId;
    END
END
GO

-- 5. JOB: Поиск зависших платежей (старше 35 минут)
CREATE PROCEDURE [sp_Jobs_GetStuckPayments]
AS
BEGIN
    SELECT p.*, us.* FROM [Payments] p
    INNER JOIN [UserSubscriptions] us ON p.[UserSubscriptionId] = us.[Id]
    WHERE p.[Status] = 0
      AND p.[PaymentDate] < DATEADD(MINUTE, -35, GETUTCDATE());
END
GO

-- 6. JOB: Обработка истекших подписок
CREATE PROCEDURE [sp_Jobs_ProcessExpiredSubscriptions]
AS
BEGIN
    UPDATE [UserSubscriptions]
    SET [IsActive] = 0
    OUTPUT inserted.[Id], inserted.[UserId], inserted.[SubscriptionId]
    WHERE [IsActive] = 1 
      AND (
          ([CancelledAt] IS NOT NULL AND [ValidUntil] <= GETUTCDATE())
          OR 
          ([CancelledAt] IS NULL AND [NextBillingDate] <= GETUTCDATE())
      );
END
GO

-- 7. Получение истории платежей пользователя
CREATE PROCEDURE [sp_Payments_GetHistory]
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    SELECT p.*, s.[Name] as SubscriptionName
    FROM [Payments] p
    INNER JOIN [UserSubscriptions] us ON p.[UserSubscriptionId] = us.[Id]
    INNER JOIN [Subscriptions] s ON us.[SubscriptionId] = s.[Id]
    WHERE p.[UserId] = @UserId
    ORDER BY p.[PaymentDate] DESC;
END
GO

-- 8. Создание уведомления
CREATE PROCEDURE [sp_Notifications_Create]
    @Id UNIQUEIDENTIFIER,
    @UserId UNIQUEIDENTIFIER,
    @Title NVARCHAR(MAX),
    @Message NVARCHAR(MAX),
    @Type INT,
    @CreatedAt DATETIME2
AS
BEGIN
    INSERT INTO [Notifications] (Id, UserId, Title, [Message], [Type], IsRead, CreatedAt)
    VALUES (@Id, @UserId, @Title, @Message, @Type, 0, @CreatedAt);
END
GO

-- 9. Получение уведомлений пользователя (пагинация)
CREATE PROCEDURE [sp_Notifications_GetPaged]
    @UserId UNIQUEIDENTIFIER,
    @PageNumber INT,
    @PageSize INT,
    @TotalCount INT OUTPUT
AS
BEGIN
    SELECT @TotalCount = COUNT(*) FROM [Notifications] WHERE [UserId] = @UserId;

    SELECT * FROM [Notifications]
    WHERE [UserId] = @UserId
    ORDER BY [CreatedAt] DESC
    OFFSET ((@PageNumber - 1) * @PageSize) ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO

-- 10. Пометить все уведомления пользователя как прочитанные
CREATE PROCEDURE [sp_Notifications_MarkAllRead]
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    UPDATE [Notifications]
    SET [IsRead] = 1
    WHERE [UserId] = @UserId AND [IsRead] = 0;
END
GO

-- 11. Регистрация нового файла (после загрузки в MinIO)
CREATE PROCEDURE [sp_StoredFiles_Insert]
    @Id UNIQUEIDENTIFIER,
    @FileName NVARCHAR(255),
    @BucketName NVARCHAR(50),
    @ObjectName NVARCHAR(255),
    @ContentType NVARCHAR(100),
    @Size BIGINT,
    @UserId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    INSERT INTO [StoredFiles] (Id, [FileName], BucketName, ObjectName, ContentType, [Size], UserId, CreatedAt, UpdatedAt)
    VALUES (@Id, @FileName, @BucketName, @ObjectName, @ContentType, @Size, @UserId, GETUTCDATE(), GETUTCDATE());
END
GO

-- 12. Удаление файла (из базы)
CREATE PROCEDURE [sp_StoredFiles_Delete]
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    DELETE FROM [StoredFiles] WHERE [Id] = @Id;
END
GO

CREATE OR ALTER PROCEDURE [sp_StoredFiles_GetById]
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    SELECT * FROM [StoredFiles] WHERE [Id] = @Id;
END
GO

-- 13. Получение подписки по Id
CREATE PROCEDURE [sp_Subscriptions_GetById]
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    SELECT * FROM [Subscriptions] WHERE [Id] = @Id;
END
GO

-- 14. Вставка новой подписки (админка)
CREATE PROCEDURE [sp_Subscriptions_Insert]
    @Id UNIQUEIDENTIFIER,
    @Name NVARCHAR(100),
    @Description NVARCHAR(500),
    @DescriptionMarkdown NVARCHAR(4000),
    @Price DECIMAL(18,2),
    @Period NVARCHAR(MAX),
    @Category NVARCHAR(MAX),
    @IconFileId UNIQUEIDENTIFIER = NULL,
    @IsActive BIT = 1
AS
BEGIN
    INSERT INTO [Subscriptions] (Id, Name, Description, DescriptionMarkdown, Price, Period, Category, IconFileId, IsActive, CreatedAt, UpdatedAt)
    VALUES (@Id, @Name, @Description, @DescriptionMarkdown, @Price, @Period, @Category, @IconFileId, @IsActive, GETUTCDATE(), GETUTCDATE());
END
GO

-- 15. Обновление подписки (админка)
CREATE PROCEDURE [sp_Subscriptions_Update]
    @Id UNIQUEIDENTIFIER,
    @Name NVARCHAR(100),
    @Description NVARCHAR(500),
    @DescriptionMarkdown NVARCHAR(4000),
    @Price DECIMAL(18,2),
    @Period NVARCHAR(MAX),
    @Category NVARCHAR(MAX),
    @IconFileId UNIQUEIDENTIFIER = NULL,
    @IsActive BIT
AS
BEGIN
    UPDATE [Subscriptions]
    SET [Name] = @Name,
        [Description] = @Description,
        [DescriptionMarkdown] = @DescriptionMarkdown,
        [Price] = @Price,
        [Period] = @Period,
        [Category] = @Category,
        [IconFileId] = @IconFileId,
        [IsActive] = @IsActive,
        [UpdatedAt] = GETUTCDATE()
    WHERE [Id] = @Id;
END
GO

-- 16. Частичное обновление активности подписки
CREATE PROCEDURE [sp_Subscriptions_UpdateActive]
    @Id UNIQUEIDENTIFIER,
    @IsActive BIT
AS
BEGIN
    UPDATE [Subscriptions]
    SET [IsActive] = @IsActive,
        [UpdatedAt] = GETUTCDATE()
    WHERE [Id] = @Id;
END
GO

-- 17. Получение уникальных категорий активных подписок
CREATE PROCEDURE [sp_Subscriptions_GetCategories]
AS
BEGIN
    SELECT DISTINCT [Category] FROM [Subscriptions] WHERE [IsActive] = 1 ORDER BY [Category];
END
GO

-- 18. Расширенная пагинация подписок со всеми фильтрами (search, period, minPrice, maxPrice, сортировка)
CREATE OR ALTER PROCEDURE [sp_Subscriptions_GetPagedExtended]
    @PageNumber INT,
    @PageSize INT,
    @Category NVARCHAR(MAX) = NULL,
    @SearchTerm NVARCHAR(MAX) = NULL,
    @Period NVARCHAR(MAX) = NULL,
    @MinPrice DECIMAL(18,2) = NULL,
    @MaxPrice DECIMAL(18,2) = NULL,
    @OrderBy NVARCHAR(50) = 'date',
    @Descending BIT = 1,
    @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- Таблица для хранения ID отфильтрованных подписок
    DECLARE @FilteredIds TABLE (Id UNIQUEIDENTIFIER);

    -- Вставка ID подходящих подписок
    INSERT INTO @FilteredIds (Id)
    SELECT Id
    FROM Subscriptions
    WHERE IsActive = 1
      AND (@Category IS NULL OR Category = @Category)
      AND (@SearchTerm IS NULL OR Name LIKE '%' + @SearchTerm + '%' OR Description LIKE '%' + @SearchTerm + '%')
      AND (@Period IS NULL OR Period IN (SELECT value FROM STRING_SPLIT(@Period, ',')))
      AND (@MinPrice IS NULL OR Price >= @MinPrice)
      AND (@MaxPrice IS NULL OR Price <= @MaxPrice);

    -- Получаем общее количество
    SELECT @TotalCount = COUNT(*) FROM @FilteredIds;

    -- Основная выборка с пагинацией
    SELECT s.*
    FROM Subscriptions s
    INNER JOIN @FilteredIds f ON s.Id = f.Id
    ORDER BY
        CASE WHEN @OrderBy = 'name' AND @Descending = 0 THEN s.Name END ASC,
        CASE WHEN @OrderBy = 'name' AND @Descending = 1 THEN s.Name END DESC,
        CASE WHEN @OrderBy = 'price' AND @Descending = 0 THEN s.Price END ASC,
        CASE WHEN @OrderBy = 'price' AND @Descending = 1 THEN s.Price END DESC,
        CASE WHEN @OrderBy = 'date' AND @Descending = 0 THEN s.CreatedAt END ASC,
        CASE WHEN @OrderBy = 'date' AND @Descending = 1 THEN s.CreatedAt END DESC
    OFFSET ((@PageNumber - 1) * @PageSize) ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO

-- 19. Вставка пользовательской подписки (при инициализации платежа)
CREATE PROCEDURE [sp_UserSubscriptions_Insert]
    @Id UNIQUEIDENTIFIER,
    @UserId UNIQUEIDENTIFIER,
    @SubscriptionId UNIQUEIDENTIFIER,
    @StartDate DATETIME2,
    @NextBillingDate DATETIME2,
    @IsActive BIT = 0
AS
BEGIN
    INSERT INTO [UserSubscriptions] (Id, UserId, SubscriptionId, StartDate, NextBillingDate, IsActive)
    VALUES (@Id, @UserId, @SubscriptionId, @StartDate, @NextBillingDate, @IsActive);
END
GO

-- 20. Обновление пользовательской подписки (отмена, продление)
CREATE PROCEDURE [sp_UserSubscriptions_Update]
    @Id UNIQUEIDENTIFIER,
    @CancelledAt DATETIME2 = NULL,
    @ValidUntil DATETIME2 = NULL,
    @NextBillingDate DATETIME2 = NULL,
    @IsActive BIT = NULL
AS
BEGIN
    UPDATE [UserSubscriptions]
    SET
        [CancelledAt] = ISNULL(@CancelledAt, [CancelledAt]),
        [ValidUntil] = ISNULL(@ValidUntil, [ValidUntil]),
        [NextBillingDate] = ISNULL(@NextBillingDate, [NextBillingDate]),
        [IsActive] = ISNULL(@IsActive, [IsActive])
    WHERE [Id] = @Id;
END
GO

-- 21. Пагинация активных подписок пользователя с фильтром по категории
CREATE PROCEDURE [sp_UserSubscriptions_GetActiveByUserIdPaged]
    @UserId UNIQUEIDENTIFIER,
    @PageNumber INT,
    @PageSize INT,
    @Category NVARCHAR(MAX) = NULL,
    @TotalCount INT OUTPUT
AS
BEGIN
    SELECT @TotalCount = COUNT(*)
    FROM [UserSubscriptions] us
    INNER JOIN [Subscriptions] s ON us.[SubscriptionId] = s.[Id]
    WHERE us.[UserId] = @UserId
      AND us.[IsActive] = 1
      AND (us.[CancelledAt] IS NULL OR us.[ValidUntil] >= GETUTCDATE())
      AND (@Category IS NULL OR s.[Category] = @Category);

    SELECT us.*, s.*
    FROM [UserSubscriptions] us
    INNER JOIN [Subscriptions] s ON us.[SubscriptionId] = s.[Id]
    WHERE us.[UserId] = @UserId
      AND us.[IsActive] = 1
      AND (us.[CancelledAt] IS NULL OR us.[ValidUntil] >= GETUTCDATE())
      AND (@Category IS NULL OR s.[Category] = @Category)
    ORDER BY us.[StartDate] DESC
    OFFSET ((@PageNumber - 1) * @PageSize) ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO

-- 22. Обновление статуса платежа (используется в вебхуках и джобах)
CREATE PROCEDURE [sp_Payments_UpdateStatus]
    @Id UNIQUEIDENTIFIER,
    @Status INT,
    @ExternalTransactionId NVARCHAR(100) = NULL,
    @CardLastFour NVARCHAR(4) = NULL,
    @CardBrand NVARCHAR(20) = NULL
AS
BEGIN
    UPDATE [Payments]
    SET [Status] = @Status,
        [ExternalTransactionId] = ISNULL(@ExternalTransactionId, [ExternalTransactionId]),
        [CardLastFour] = ISNULL(@CardLastFour, [CardLastFour]),
        [CardBrand] = ISNULL(@CardBrand, [CardBrand])
    WHERE [Id] = @Id;
END
GO

-- 23. Получение платежа по Id
CREATE PROCEDURE [sp_Payments_GetById]
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    SELECT * FROM [Payments] WHERE [Id] = @Id;
END
GO

-- 24. Получение уведомлений пользователя без пагинации
CREATE PROCEDURE [sp_Notifications_GetByUserId]
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    SELECT * FROM [Notifications]
    WHERE [UserId] = @UserId
    ORDER BY [CreatedAt] DESC;
END
GO

-- 25. Пометка одного уведомления как прочитанного
CREATE PROCEDURE [sp_Notifications_MarkAsRead]
    @Id UNIQUEIDENTIFIER,
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    UPDATE [Notifications]
    SET [IsRead] = 1
    WHERE [Id] = @Id AND [UserId] = @UserId;
END
GO

-- 26. Статистика пользователя (суммарные траты, количество подписок, ближайший платёж)
CREATE PROCEDURE [sp_UserStatistics_Get]
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    DECLARE @TotalSpent DECIMAL(18,2);
    DECLARE @ActiveCount INT;
    DECLARE @TotalCount INT;
    DECLARE @NextBilling DATETIME2;

    SELECT @TotalSpent = ISNULL(SUM(Amount), 0)
    FROM [Payments]
    WHERE [UserId] = @UserId AND [Status] = 1;

    SELECT @ActiveCount = COUNT(*)
    FROM [UserSubscriptions]
    WHERE [UserId] = @UserId AND [IsActive] = 1
      AND ([CancelledAt] IS NULL OR [ValidUntil] >= GETUTCDATE());

    SELECT @TotalCount = COUNT(*)
    FROM [UserSubscriptions]
    WHERE [UserId] = @UserId AND [IsActive] = 1;

    SELECT TOP 1 @NextBilling = [NextBillingDate]
    FROM [UserSubscriptions]
    WHERE [UserId] = @UserId AND [IsActive] = 1 AND [CancelledAt] IS NULL
    ORDER BY [NextBillingDate];

    SELECT
        @TotalSpent AS TotalSpent,
        @ActiveCount AS ActiveSubscriptionsCount,
        @TotalCount AS TotalSubscriptionsCount,
        @NextBilling AS NextBillingDate;
END
GO

-- 27. Обработка истекших подписок (деактивация отменённых и продление активных)
CREATE PROCEDURE [sp_Subscriptions_ProcessExpired]
AS
BEGIN
    UPDATE [UserSubscriptions]
    SET [IsActive] = 0
    WHERE [IsActive] = 1
      AND [CancelledAt] IS NOT NULL
      AND [ValidUntil] <= GETUTCDATE();

    UPDATE us
    SET [NextBillingDate] = 
        CASE s.[Period]
            WHEN 'monthly' THEN DATEADD(MONTH, 1, GETUTCDATE())
            WHEN 'quarterly' THEN DATEADD(MONTH, 3, GETUTCDATE())
            WHEN 'yearly' THEN DATEADD(YEAR, 1, GETUTCDATE())
            WHEN 'lifetime' THEN DATEADD(YEAR, 100, GETUTCDATE())
            ELSE DATEADD(MONTH, 1, GETUTCDATE())
        END
    FROM [UserSubscriptions] us
    INNER JOIN [Subscriptions] s ON us.[SubscriptionId] = s.[Id]
    WHERE us.[IsActive] = 1
      AND us.[CancelledAt] IS NULL
      AND us.[NextBillingDate] <= GETUTCDATE();

    SELECT @@ROWCOUNT AS ProcessedCount;
END
GO

-- 28. Получение последних 10 платежей пользователя с деталями подписки
CREATE PROCEDURE [sp_GetRecentPayments]
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    SELECT TOP 10 p.*, s.Id, s.Name, s.Price
    FROM Payments p
    INNER JOIN UserSubscriptions us ON p.UserSubscriptionId = us.Id
    INNER JOIN Subscriptions s ON us.SubscriptionId = s.Id
    WHERE p.UserId = @UserId
    ORDER BY p.PaymentDate DESC;
END
GO

-- 29. Получение предстоящих платежей пользователя
CREATE PROCEDURE [sp_GetUpcomingPayments]
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    SELECT us.NextBillingDate, s.Id AS SubscriptionId, s.Name AS SubscriptionName, s.Price AS Amount
    FROM UserSubscriptions us
    INNER JOIN Subscriptions s ON us.SubscriptionId = s.Id
    WHERE us.UserId = @UserId 
      AND us.IsActive = 1 
      AND us.CancelledAt IS NULL 
      AND us.NextBillingDate > GETUTCDATE()
    ORDER BY us.NextBillingDate;
END
GO

-- 30. Пагинированная история платежей с общим количеством
CREATE PROCEDURE [sp_Payments_GetHistoryPaged]
    @UserId UNIQUEIDENTIFIER,
    @PageNumber INT,
    @PageSize INT,
    @TotalCount INT OUTPUT
AS
BEGIN
    SELECT @TotalCount = COUNT(*) FROM Payments WHERE UserId = @UserId;

    SELECT p.*, s.Id, s.Name, s.Price, s.Period
    FROM Payments p
    INNER JOIN UserSubscriptions us ON p.UserSubscriptionId = us.Id
    INNER JOIN Subscriptions s ON us.SubscriptionId = s.Id
    WHERE p.UserId = @UserId
    ORDER BY p.PaymentDate DESC
    OFFSET ((@PageNumber - 1) * @PageSize) ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO