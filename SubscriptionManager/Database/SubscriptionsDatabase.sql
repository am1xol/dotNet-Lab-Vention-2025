USE [SubscriptionsDb];
GO

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

CREATE TABLE [Subscriptions] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY,
    [Name] NVARCHAR(100) NOT NULL,
    [Description] NVARCHAR(500) NOT NULL,
    [DescriptionMarkdown] NVARCHAR(4000) NOT NULL,
    [Price] DECIMAL(18, 2) NOT NULL,
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

CREATE TABLE [UserSubscriptions] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY,
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [StartDate] DATETIME2 NOT NULL,
    [NextBillingDate] DATETIME2 NOT NULL,
    [CancelledAt] DATETIME2 NULL,
    [ValidUntil] DATETIME2 NULL,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedAt] DATETIME2 NOT NULL,
    [UpdatedAt] DATETIME2 NOT NULL
);
GO
CREATE INDEX [IX_UserSubscriptions_UserId] ON [UserSubscriptions] ([UserId]);
GO

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
ALTER TABLE [Payments] ADD CONSTRAINT [DF_Payments_CardLastFour] DEFAULT ('') FOR [CardLastFour];
ALTER TABLE [Payments] ADD CONSTRAINT [DF_Payments_CardBrand] DEFAULT ('') FOR [CardBrand];
GO

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

CREATE TABLE [Periods] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY,
    [Name] NVARCHAR(25) NOT NULL,
    [MonthsCount] INT NOT NULL
);
GO

CREATE TABLE [SubscriptionPrices] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY,
    [SubscriptionId] UNIQUEIDENTIFIER NOT NULL,
    [PeriodId] UNIQUEIDENTIFIER NOT NULL,
    [FinalPrice] DECIMAL(18, 2) NOT NULL,
    CONSTRAINT [FK_SubscriptionPrices_Subscriptions] FOREIGN KEY ([SubscriptionId]) 
        REFERENCES [Subscriptions] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_SubscriptionPrices_Periods] FOREIGN KEY ([PeriodId]) 
        REFERENCES [Periods] ([Id])
);
GO


/* =========================================================================================
   УПРАВЛЕНИЕ ФАЙЛАМИ (STORED FILES)
========================================================================================= */

CREATE OR ALTER PROCEDURE [sp_StoredFiles_Insert]
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

CREATE OR ALTER PROCEDURE [sp_StoredFiles_Delete]
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


/* =========================================================================================
   КАТАЛОГ ПОДПИСОК (АДМИНКА И ПУБЛИЧНЫЙ ДОСТУП)
========================================================================================= */

CREATE OR ALTER PROCEDURE [sp_Subscriptions_GetById]
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    SELECT * FROM [Subscriptions] WHERE [Id] = @Id;
END
GO

CREATE OR ALTER PROCEDURE [sp_Subscriptions_GetCategories]
AS
BEGIN
    SELECT DISTINCT [Category] FROM [Subscriptions] WHERE [IsActive] = 1 ORDER BY [Category];
END
GO

CREATE OR ALTER PROCEDURE [sp_Subscriptions_GetPaged]
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

CREATE OR ALTER PROCEDURE [sp_Subscriptions_GetPagedExtended]
    @PageNumber INT,
    @PageSize INT,
    @Category NVARCHAR(MAX) = NULL,
    @SearchTerm NVARCHAR(MAX) = NULL,
    @MinPrice DECIMAL(18,2) = NULL,
    @MaxPrice DECIMAL(18,2) = NULL,
    @OrderBy NVARCHAR(50) = 'date',
    @Descending BIT = 1,
    @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT @TotalCount = COUNT(*) FROM Subscriptions
    WHERE IsActive = 1
      AND (@Category IS NULL OR Category = @Category)
      AND (@SearchTerm IS NULL OR Name LIKE '%' + @SearchTerm + '%' OR Description LIKE '%' + @SearchTerm + '%')
      AND (@MinPrice IS NULL OR Price >= @MinPrice)
      AND (@MaxPrice IS NULL OR Price <= @MaxPrice);

    DECLARE @PageIds TABLE (Id UNIQUEIDENTIFIER PRIMARY KEY);
    
    INSERT INTO @PageIds (Id)
    SELECT Id FROM Subscriptions
    WHERE IsActive = 1
      AND (@Category IS NULL OR Category = @Category)
      AND (@SearchTerm IS NULL OR Name LIKE '%' + @SearchTerm + '%' OR Description LIKE '%' + @SearchTerm + '%')
      AND (@MinPrice IS NULL OR Price >= @MinPrice)
      AND (@MaxPrice IS NULL OR Price <= @MaxPrice)
    ORDER BY
        CASE WHEN @OrderBy = 'name' AND @Descending = 0 THEN Name END ASC,
        CASE WHEN @OrderBy = 'name' AND @Descending = 1 THEN Name END DESC,
        CASE WHEN @OrderBy = 'price' AND @Descending = 0 THEN Price END ASC,
        CASE WHEN @OrderBy = 'price' AND @Descending = 1 THEN Price END DESC,
        CASE WHEN @OrderBy = 'date' AND @Descending = 0 THEN CreatedAt END ASC,
        CASE WHEN @OrderBy = 'date' AND @Descending = 1 THEN CreatedAt END DESC
    OFFSET ((@PageNumber - 1) * @PageSize) ROWS
    FETCH NEXT @PageSize ROWS ONLY;

    SELECT s.* FROM Subscriptions s INNER JOIN @PageIds p ON s.Id = p.Id;
    SELECT sp.*, p.Name AS PeriodName, p.MonthsCount FROM SubscriptionPrices sp
    INNER JOIN Periods p ON sp.PeriodId = p.Id
    INNER JOIN @PageIds p_id ON sp.SubscriptionId = p_id.Id;
END
GO

CREATE OR ALTER PROCEDURE [sp_Subscriptions_Insert]
    @Id UNIQUEIDENTIFIER,
    @Name NVARCHAR(100),
    @Description NVARCHAR(500),
    @DescriptionMarkdown NVARCHAR(4000),
    @Price DECIMAL(18,2),
    @Category NVARCHAR(MAX),
    @IconFileId UNIQUEIDENTIFIER = NULL,
    @IsActive BIT = 1
AS
BEGIN
    INSERT INTO [Subscriptions] (Id, Name, Description, DescriptionMarkdown, Price, Category, IconFileId, IsActive, CreatedAt, UpdatedAt)
    VALUES (@Id, @Name, @Description, @DescriptionMarkdown, @Price, @Category, @IconFileId, @IsActive, GETUTCDATE(), GETUTCDATE());
END
GO

CREATE OR ALTER PROCEDURE [sp_Subscriptions_Update]
    @Id UNIQUEIDENTIFIER,
    @Name NVARCHAR(100),
    @Description NVARCHAR(500),
    @DescriptionMarkdown NVARCHAR(4000),
    @Price DECIMAL(18,2),
    @Category NVARCHAR(MAX),
    @IconFileId UNIQUEIDENTIFIER = NULL,
    @IsActive BIT
AS
BEGIN
    UPDATE [Subscriptions]
    SET [Name] = @Name, [Description] = @Description, [DescriptionMarkdown] = @DescriptionMarkdown, [Price] = @Price,
        [Category] = @Category, [IconFileId] = @IconFileId, [IsActive] = @IsActive, [UpdatedAt] = GETUTCDATE()
    WHERE [Id] = @Id;
END
GO

CREATE OR ALTER PROCEDURE [sp_Subscriptions_UpdateActive]
    @Id UNIQUEIDENTIFIER,
    @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM Subscriptions WHERE Id = @Id) RETURN 404;

    BEGIN TRY
        BEGIN TRANSACTION;
        IF @IsActive = 0
        BEGIN
            UPDATE UserSubscriptions SET CancelledAt = GETUTCDATE(), ValidUntil = NextBillingDate
            WHERE SubscriptionId = @Id AND IsActive = 1;
        END
        UPDATE Subscriptions SET IsActive = @IsActive, UpdatedAt = GETUTCDATE() WHERE Id = @Id;
        COMMIT TRANSACTION;
        RETURN 204;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE [sp_Subscriptions_InsertWithPrice]
    @Id UNIQUEIDENTIFIER,
    @Name NVARCHAR(100),
    @Description NVARCHAR(50),
    @DescriptionMarkdown NVARCHAR(4000),
    @Price DECIMAL(18, 2),
    @Category NVARCHAR(MAX),
    @IconFileId UNIQUEIDENTIFIER = NULL,
    @PeriodId UNIQUEIDENTIFIER,
    @FinalPrice DECIMAL(18, 2)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM Periods WHERE Id = @PeriodId) THROW 50001, 'Selected period does not exist', 1;
    IF @IconFileId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM StoredFiles WHERE Id = @IconFileId) THROW 50002, 'Icon file not found', 1;
    IF @Price NOT IN (10, 20, 50) THROW 50003, 'Invalid base price. Allowed prices: 10, 20, 50', 1;

    BEGIN TRY
        BEGIN TRANSACTION;
        INSERT INTO Subscriptions (Id, Name, [Description], DescriptionMarkdown, Price, Category, IconFileId, IsActive, CreatedAt, UpdatedAt)
        VALUES (@Id, @Name, @Description, @DescriptionMarkdown, @Price, @Category, @IconFileId, 1, GETUTCDATE(), GETUTCDATE());
        
        INSERT INTO SubscriptionPrices (Id, SubscriptionId, PeriodId, FinalPrice)
        VALUES (NEWID(), @Id, @PeriodId, @FinalPrice);
        COMMIT TRANSACTION;

        SELECT * FROM Subscriptions WHERE Id = @Id;
        SELECT sp.*, p.Name AS PeriodName, p.MonthsCount FROM SubscriptionPrices sp
        INNER JOIN Periods p ON sp.PeriodId = p.Id WHERE sp.SubscriptionId = @Id;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO


/* =========================================================================================
   УПРАВЛЕНИЕ ЦЕНАМИ ПОДПИСОК (SUBSCRIPTION PRICES)
========================================================================================= */

CREATE OR ALTER PROCEDURE [sp_SubscriptionPrices_GetBySubscriptionId]
    @SubscriptionId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT sp.*, p.Name AS PeriodName, p.MonthsCount
    FROM SubscriptionPrices sp
    INNER JOIN Periods p ON sp.PeriodId = p.Id
    WHERE sp.SubscriptionId = @SubscriptionId;
END
GO

CREATE OR ALTER PROCEDURE [sp_SubscriptionPrices_Create]
    @Id UNIQUEIDENTIFIER,
    @SubscriptionId UNIQUEIDENTIFIER,
    @PeriodId UNIQUEIDENTIFIER,
    @FinalPrice DECIMAL(18, 2)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM Subscriptions WHERE Id = @SubscriptionId) THROW 50001, 'Subscription not found', 1;
    IF NOT EXISTS (SELECT 1 FROM Periods WHERE Id = @PeriodId) THROW 50002, 'Period not found', 1;
    IF EXISTS (SELECT 1 FROM SubscriptionPrices WHERE SubscriptionId = @SubscriptionId AND PeriodId = @PeriodId) THROW 50003, 'Price for this subscription and period already exists', 1;

    INSERT INTO SubscriptionPrices (Id, SubscriptionId, PeriodId, FinalPrice)
    VALUES (@Id, @SubscriptionId, @PeriodId, @FinalPrice);

    SELECT sp.*, p.Name AS PeriodName, p.MonthsCount
    FROM SubscriptionPrices sp
    INNER JOIN Periods p ON sp.PeriodId = p.Id
    WHERE sp.Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE [sp_SubscriptionPrices_Delete]
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM SubscriptionPrices WHERE Id = @Id) RETURN 404;
    IF EXISTS (SELECT 1 FROM UserSubscriptions WHERE SubscriptionPriceId = @Id AND IsActive = 1) RETURN 400;

    DELETE FROM SubscriptionPrices WHERE Id = @Id;
    RETURN 204;
END
GO


/* =========================================================================================
   ЖИЗНЕННЫЙ ЦИКЛ ПОДПИСОК ПОЛЬЗОВАТЕЛЯ (USER SUBSCRIPTIONS)
========================================================================================= */

CREATE OR ALTER PROCEDURE [sp_UserSubscriptions_GetActiveByUserId]
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    SELECT us.*, sp.FinalPrice, p.Name AS PeriodName, p.MonthsCount, s.Name AS SubscriptionName, s.Category, s.IconUrl
    FROM [UserSubscriptions] us
    INNER JOIN [SubscriptionPrices] sp ON us.[SubscriptionPriceId] = sp.[Id]
    INNER JOIN [Subscriptions] s ON sp.[SubscriptionId] = s.[Id]
    INNER JOIN [Periods] p ON sp.[PeriodId] = p.[Id]
    WHERE us.[UserId] = @UserId AND us.[IsActive] = 1;
END
GO

CREATE OR ALTER PROCEDURE [sp_UserSubscriptions_GetActiveByUserIdPaged]
    @UserId UNIQUEIDENTIFIER, @PageNumber INT, @PageSize INT, @Category NVARCHAR(MAX) = NULL, @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT @TotalCount = COUNT(*) FROM [UserSubscriptions] us
    INNER JOIN [SubscriptionPrices] sp ON us.[SubscriptionPriceId] = sp.[Id]
    INNER JOIN [Subscriptions] s ON sp.[SubscriptionId] = s.[Id]
    WHERE us.[UserId] = @UserId AND us.[IsActive] = 1 AND (us.[CancelledAt] IS NULL OR us.[ValidUntil] >= GETUTCDATE()) AND (@Category IS NULL OR s.[Category] = @Category);

    SELECT us.Id, us.UserId, us.SubscriptionPriceId, us.StartDate, us.NextBillingDate, us.CancelledAt, us.ValidUntil, us.IsActive, us.CreatedAt, us.UpdatedAt, sp.FinalPrice, per.Name AS PeriodName, s.Id AS SubscriptionId, s.Name AS SubscriptionName, s.Category, s.Price, s.IconFileId, s.IconUrl, s.Description, s.DescriptionMarkdown, s.IsActive AS SubscriptionIsActive, s.CreatedAt AS SubscriptionCreatedAt, s.UpdatedAt AS SubscriptionUpdatedAt
    FROM [UserSubscriptions] us
    INNER JOIN [SubscriptionPrices] sp ON us.[SubscriptionPriceId] = sp.[Id]
    INNER JOIN [Subscriptions] s ON sp.[SubscriptionId] = s.[Id]
    INNER JOIN [Periods] per ON sp.[PeriodId] = per.[Id]
    WHERE us.[UserId] = @UserId AND us.[IsActive] = 1 AND (us.[CancelledAt] IS NULL OR us.[ValidUntil] >= GETUTCDATE()) AND (@Category IS NULL OR s.[Category] = @Category)
    ORDER BY us.[StartDate] DESC OFFSET ((@PageNumber - 1) * @PageSize) ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_UserSubscriptions_GetHistoryByUserIdPaged]
    @UserId UNIQUEIDENTIFIER, @PageNumber INT, @PageSize INT, @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF (@PageNumber IS NULL OR @PageNumber < 1) SET @PageNumber = 1;
    IF (@PageSize IS NULL OR @PageSize <= 0) SET @PageSize = 10;

    SELECT @TotalCount = COUNT(*) FROM [UserSubscriptions] us WHERE us.[UserId] = @UserId;

    SELECT us.Id, us.UserId, us.SubscriptionPriceId, sp.SubscriptionId, us.StartDate, us.NextBillingDate, us.CancelledAt, us.ValidUntil, us.IsActive,
        CASE WHEN us.IsActive = 1 AND (us.ValidUntil IS NULL OR us.ValidUntil >= SYSUTCDATETIME()) THEN 1 ELSE 0 END AS IsValid,
        CASE WHEN us.IsActive = 1 AND (us.ValidUntil IS NULL OR us.ValidUntil >= SYSUTCDATETIME()) THEN 'Active' WHEN us.CancelledAt IS NOT NULL THEN 'Cancelled' WHEN us.ValidUntil IS NOT NULL AND us.ValidUntil < SYSUTCDATETIME() THEN 'Expired' ELSE 'Unknown' END AS Status,
        s.Name AS SubscriptionName, s.Category, s.Price, s.IconFileId, s.IconUrl, s.IsActive AS SubscriptionIsActive, s.CreatedAt AS SubscriptionCreatedAt, s.UpdatedAt AS SubscriptionUpdatedAt, s.Description, s.DescriptionMarkdown, p.Name AS PeriodName, sp.FinalPrice
    FROM [UserSubscriptions] us
    INNER JOIN [SubscriptionPrices] sp ON us.[SubscriptionPriceId] = sp.[Id]
    INNER JOIN [Subscriptions] s ON sp.[SubscriptionId] = s.[Id]
    INNER JOIN [Periods] p ON sp.[PeriodId] = p.[Id]
    WHERE us.[UserId] = @UserId
    ORDER BY us.[StartDate] DESC OFFSET (@PageNumber - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END;
GO

CREATE OR ALTER PROCEDURE [sp_UserSubscriptions_Insert]
    @Id UNIQUEIDENTIFIER, @UserId UNIQUEIDENTIFIER, @SubscriptionPriceId UNIQUEIDENTIFIER, @StartDate DATETIME2, @NextBillingDate DATETIME2, @IsActive BIT = 0
AS
BEGIN
    INSERT INTO [UserSubscriptions] (Id, UserId, SubscriptionPriceId, StartDate, NextBillingDate, IsActive, CreatedAt, UpdatedAt)
    VALUES (@Id, @UserId, @SubscriptionPriceId, @StartDate, @NextBillingDate, @IsActive, GETUTCDATE(), GETUTCDATE());
END
GO

CREATE OR ALTER PROCEDURE [sp_UserSubscriptions_Update]
    @Id UNIQUEIDENTIFIER, @CancelledAt DATETIME2 = NULL, @ValidUntil DATETIME2 = NULL, @NextBillingDate DATETIME2 = NULL, @IsActive BIT = NULL
AS
BEGIN
    UPDATE [UserSubscriptions]
    SET [CancelledAt] = ISNULL(@CancelledAt, [CancelledAt]), [ValidUntil] = ISNULL(@ValidUntil, [ValidUntil]), [NextBillingDate] = ISNULL(@NextBillingDate, [NextBillingDate]), [IsActive] = ISNULL(@IsActive, [IsActive])
    WHERE [Id] = @Id;
END
GO

CREATE OR ALTER PROCEDURE [sp_UserSubscriptions_Subscribe]
    @UserId UNIQUEIDENTIFIER,
    @SubscriptionPriceId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @SubscriptionId UNIQUEIDENTIFIER, @MonthsCount INT, @IsActive BIT;
    SELECT @SubscriptionId = sp.SubscriptionId, @MonthsCount = p.MonthsCount, @IsActive = s.IsActive FROM SubscriptionPrices sp
    INNER JOIN Subscriptions s ON sp.SubscriptionId = s.Id INNER JOIN Periods p ON sp.PeriodId = p.Id WHERE sp.Id = @SubscriptionPriceId;

    IF @SubscriptionId IS NULL RETURN 404;
    IF @IsActive = 0 RETURN 400;
    IF EXISTS (SELECT 1 FROM UserSubscriptions us INNER JOIN SubscriptionPrices sp ON us.SubscriptionPriceId = sp.Id WHERE us.UserId = @UserId AND sp.SubscriptionId = @SubscriptionId AND us.IsActive = 1) RETURN 409;

    BEGIN TRY
        DECLARE @NewId UNIQUEIDENTIFIER = NEWID(), @Now DATETIME2 = GETUTCDATE();
        DECLARE @NextBilling DATE = DATEADD(MONTH, @MonthsCount, @Now);

        INSERT INTO UserSubscriptions (Id, UserId, SubscriptionPriceId, StartDate, NextBillingDate, IsActive, CreatedAt, UpdatedAt)
        VALUES (@NewId, @UserId, @SubscriptionPriceId, @Now, @NextBilling, 1, @Now, @Now);

        SELECT Id, UserId, SubscriptionPriceId, StartDate, NextBillingDate, IsActive, @SubscriptionId AS SubscriptionId FROM UserSubscriptions WHERE Id = @NewId;
        RETURN 200;
    END TRY
    BEGIN CATCH THROW; END CATCH
END
GO

use [SubscriptionsDb];
GO
CREATE OR ALTER PROCEDURE [sp_UserSubscriptions_Unsubscribe]
    @UserId UNIQUEIDENTIFIER,
    @SubscriptionId UNIQUEIDENTIFIER,
    @Now DATETIME2
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @UserSubId UNIQUEIDENTIFIER, @NextBillingDate DATETIME2;
    
    SELECT TOP 1 @UserSubId = us.Id, @NextBillingDate = us.NextBillingDate 
    FROM UserSubscriptions us
    INNER JOIN SubscriptionPrices sp ON us.SubscriptionPriceId = sp.Id 
    WHERE us.UserId = @UserId AND sp.SubscriptionId = @SubscriptionId AND us.IsActive = 1;

    IF @UserSubId IS NULL RETURN 404;

    UPDATE UserSubscriptions 
    SET CancelledAt = @Now, 
        ValidUntil = @NextBillingDate
    WHERE Id = @UserSubId;
    
    SELECT @NextBillingDate AS ValidUntil;
    RETURN 200;
END
GO

CREATE OR ALTER PROCEDURE [sp_UserSubscriptions_AdminExpire]
    @UserSubscriptionId UNIQUEIDENTIFIER,
    @Now DATETIME2
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM UserSubscriptions WHERE Id = @UserSubscriptionId) RETURN 404;

    UPDATE UserSubscriptions SET CancelledAt = @Now, ValidUntil = @Now, IsActive = 0, NextBillingDate = NULL WHERE Id = @UserSubscriptionId;
    SELECT us.UserId, s.Name AS SubscriptionName FROM UserSubscriptions us INNER JOIN SubscriptionPrices sp ON us.SubscriptionPriceId = sp.Id INNER JOIN Subscriptions s ON sp.SubscriptionId = s.Id WHERE us.Id = @UserSubscriptionId;
    RETURN 200;
END
GO


/* =========================================================================================
   ПЛАТЕЖИ И БИЛЛИНГ (PAYMENTS)
========================================================================================= */

CREATE OR ALTER PROCEDURE [sp_Payments_Insert]
    @Id UNIQUEIDENTIFIER, @UserSubscriptionId UNIQUEIDENTIFIER, @UserId UNIQUEIDENTIFIER, @Amount DECIMAL(18,2), @Currency NVARCHAR(3), @ExternalTransactionId NVARCHAR(100), @Status INT, @PeriodStart DATETIME2, @PeriodEnd DATETIME2
AS
BEGIN
    INSERT INTO [Payments] (Id, UserSubscriptionId, UserId, Amount, Currency, ExternalTransactionId, Status, PaymentDate, PeriodStart, PeriodEnd)
    VALUES (@Id, @UserSubscriptionId, @UserId, @Amount, @Currency, @ExternalTransactionId, @Status, GETUTCDATE(), @PeriodStart, @PeriodEnd);
END
GO

CREATE OR ALTER PROCEDURE [sp_Payments_UpdateStatus]
    @Id UNIQUEIDENTIFIER, @Status INT, @ExternalTransactionId NVARCHAR(100) = NULL, @CardLastFour NVARCHAR(4) = NULL, @CardBrand NVARCHAR(20) = NULL
AS
BEGIN
    UPDATE [Payments] SET [Status] = @Status, [ExternalTransactionId] = ISNULL(@ExternalTransactionId, [ExternalTransactionId]), [CardLastFour] = ISNULL(@CardLastFour, [CardLastFour]), [CardBrand] = ISNULL(@CardBrand, [CardBrand]) WHERE [Id] = @Id;
END
GO

CREATE OR ALTER PROCEDURE [sp_Payments_Initiate]
    @UserId UNIQUEIDENTIFIER,
    @SubscriptionPriceId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @FinalPrice DECIMAL(18, 2), @SubscriptionId UNIQUEIDENTIFIER, @MonthsCount INT, @SubName NVARCHAR(100), @PeriodName NVARCHAR(100), @IsActive BIT;
    SELECT @FinalPrice = sp.FinalPrice, @SubscriptionId = s.Id, @MonthsCount = p.MonthsCount, @SubName = s.Name, @PeriodName = p.Name, @IsActive = s.IsActive
    FROM SubscriptionPrices sp INNER JOIN Subscriptions s ON sp.SubscriptionId = s.Id INNER JOIN Periods p ON sp.PeriodId = p.Id WHERE sp.Id = @SubscriptionPriceId;

    IF @FinalPrice IS NULL THROW 50404, 'Subscription price not found', 1;
    IF @IsActive = 0 THROW 50001, 'Subscription is not active', 1;
    IF EXISTS (SELECT 1 FROM UserSubscriptions us INNER JOIN SubscriptionPrices sp ON us.SubscriptionPriceId = sp.Id WHERE us.UserId = @UserId AND sp.SubscriptionId = @SubscriptionId AND us.IsActive = 1) THROW 50002, 'User already subscribed to this service', 1;

    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @UserSubId UNIQUEIDENTIFIER = NEWID(), @PaymentId UNIQUEIDENTIFIER = NEWID(), @Now DATETIME2 = GETUTCDATE();
        DECLARE @NextBillingDate DATETIME2 = DATEADD(MONTH, @MonthsCount, @Now);

        INSERT INTO UserSubscriptions (Id, UserId, SubscriptionPriceId, StartDate, NextBillingDate, IsActive, CreatedAt, UpdatedAt) VALUES (@UserSubId, @UserId, @SubscriptionPriceId, @Now, @NextBillingDate, 0, @Now, @Now);
        INSERT INTO Payments (Id, UserSubscriptionId, UserId, Amount, Currency, Status, PaymentDate, PeriodStart, PeriodEnd) VALUES (@PaymentId, @UserSubId, @UserId, @FinalPrice, 'BYN', 0, @Now, @Now, @NextBillingDate);
        COMMIT TRANSACTION;

        SELECT @PaymentId AS PaymentId, @FinalPrice AS Amount, @SubName AS SubscriptionName, @PeriodName AS PeriodName;
    END TRY
    BEGIN CATCH IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION; THROW; END CATCH
END
GO

CREATE OR ALTER PROCEDURE [sp_Payments_SyncStatus]
    @PaymentId UNIQUEIDENTIFIER,
    @Status INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @UserSubId UNIQUEIDENTIFIER, @SubName NVARCHAR(100);

    SELECT @UserSubId = p.UserSubscriptionId, @SubName = s.Name
    FROM Payments p LEFT JOIN UserSubscriptions us ON p.UserSubscriptionId = us.Id LEFT JOIN SubscriptionPrices sp ON us.SubscriptionPriceId = sp.Id LEFT JOIN Subscriptions s ON sp.SubscriptionId = s.Id WHERE p.Id = @PaymentId;

    BEGIN TRY
        BEGIN TRANSACTION;
        UPDATE Payments SET Status = @Status WHERE Id = @PaymentId;
        IF @Status = 1 AND @UserSubId IS NOT NULL
        BEGIN
            UPDATE UserSubscriptions SET IsActive = 1 WHERE Id = @UserSubId;
        END
        COMMIT TRANSACTION;

        SELECT @SubName AS SubscriptionName, UserId FROM Payments WHERE Id = @PaymentId;
    END TRY
    BEGIN CATCH IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION; THROW; END CATCH
END
GO

CREATE OR ALTER PROCEDURE [sp_Payments_GetHistory]
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    SELECT p.*, s.[Name] as SubscriptionName, sp.[FinalPrice], per.[Name] as PeriodName
    FROM [Payments] p
    INNER JOIN [UserSubscriptions] us ON p.[UserSubscriptionId] = us.[Id]
    INNER JOIN [SubscriptionPrices] sp ON us.[SubscriptionPriceId] = sp.[Id]
    INNER JOIN [Subscriptions] s ON sp.[SubscriptionId] = s.[Id]
    INNER JOIN [Periods] per ON sp.[PeriodId] = per.[Id]
    WHERE p.[UserId] = @UserId ORDER BY p.[PaymentDate] DESC;
END
GO

CREATE OR ALTER PROCEDURE [sp_Payments_GetHistoryPaged]
    @UserId UNIQUEIDENTIFIER, @PageNumber INT, @PageSize INT, @TotalCount INT OUTPUT
AS
BEGIN
    SELECT @TotalCount = COUNT(*) FROM Payments WHERE UserId = @UserId;
    SELECT p.*, s.Id AS SubscriptionId, s.Name, sp.FinalPrice AS Price, per.Name AS Period
    FROM Payments p
    INNER JOIN UserSubscriptions us ON p.UserSubscriptionId = us.Id INNER JOIN SubscriptionPrices sp ON us.SubscriptionPriceId = sp.Id INNER JOIN Subscriptions s ON sp.SubscriptionId = s.Id INNER JOIN Periods per ON sp.PeriodId = per.Id
    WHERE p.UserId = @UserId ORDER BY p.PaymentDate DESC OFFSET ((@PageNumber - 1) * @PageSize) ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO

CREATE OR ALTER PROCEDURE [sp_GetRecentPayments]
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    SELECT TOP 10 p.*, s.Id AS SubscriptionId, s.Name AS SubscriptionName, sp.FinalPrice AS Price, per.Name AS PeriodName
    FROM Payments p INNER JOIN UserSubscriptions us ON p.UserSubscriptionId = us.Id INNER JOIN SubscriptionPrices sp ON us.SubscriptionPriceId = sp.Id INNER JOIN Subscriptions s ON sp.SubscriptionId = s.Id INNER JOIN Periods per ON sp.PeriodId = per.Id
    WHERE p.UserId = @UserId ORDER BY p.PaymentDate DESC;
END
GO

CREATE OR ALTER PROCEDURE [sp_GetUpcomingPayments]
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    SELECT us.NextBillingDate, s.Id AS SubscriptionId, s.Name AS SubscriptionName, sp.FinalPrice AS Amount, per.Name AS PeriodName
    FROM UserSubscriptions us INNER JOIN SubscriptionPrices sp ON us.SubscriptionPriceId = sp.Id INNER JOIN Subscriptions s ON sp.SubscriptionId = s.Id INNER JOIN Periods per ON sp.PeriodId = per.Id
    WHERE us.UserId = @UserId AND us.IsActive = 1 AND us.CancelledAt IS NULL AND us.NextBillingDate > GETUTCDATE() ORDER BY us.NextBillingDate;
END
GO


/* =========================================================================================
   УВЕДОМЛЕНИЯ ПОЛЬЗОВАТЕЛЕЙ (NOTIFICATIONS)
========================================================================================= */

CREATE OR ALTER PROCEDURE [sp_Notifications_Create]
    @Id UNIQUEIDENTIFIER, @UserId UNIQUEIDENTIFIER, @Title NVARCHAR(MAX), @Message NVARCHAR(MAX), @Type INT, @CreatedAt DATETIME2
AS
BEGIN
    INSERT INTO [Notifications] (Id, UserId, Title, [Message], [Type], IsRead, CreatedAt) VALUES (@Id, @UserId, @Title, @Message, @Type, 0, @CreatedAt);
END
GO

CREATE OR ALTER PROCEDURE [sp_Notifications_GetPaged]
    @UserId UNIQUEIDENTIFIER, @PageNumber INT, @PageSize INT, @TotalCount INT OUTPUT
AS
BEGIN
    SELECT @TotalCount = COUNT(*) FROM [Notifications] WHERE [UserId] = @UserId;
    SELECT * FROM [Notifications] WHERE [UserId] = @UserId ORDER BY [CreatedAt] DESC OFFSET ((@PageNumber - 1) * @PageSize) ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO

CREATE OR ALTER PROCEDURE [sp_Notifications_GetByUserId]
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    SELECT * FROM [Notifications] WHERE [UserId] = @UserId ORDER BY [CreatedAt] DESC;
END
GO

CREATE OR ALTER PROCEDURE [sp_Notifications_MarkAllRead]
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    UPDATE [Notifications] SET [IsRead] = 1 WHERE [UserId] = @UserId AND [IsRead] = 0;
END
GO

CREATE OR ALTER PROCEDURE [sp_Notifications_MarkAsRead]
    @Id UNIQUEIDENTIFIER, @UserId UNIQUEIDENTIFIER
AS
BEGIN
    UPDATE [Notifications] SET [IsRead] = 1 WHERE [Id] = @Id AND [UserId] = @UserId;
END
GO


/* =========================================================================================
   ФОНОВЫЕ ЗАДАЧИ
========================================================================================= */

CREATE OR ALTER PROCEDURE [sp_Jobs_GetStuckPayments]
AS
BEGIN
    SELECT p.*, us.*, s.*
    FROM [Payments] p
    INNER JOIN [UserSubscriptions] us ON p.[UserSubscriptionId] = us.[Id]
    INNER JOIN [SubscriptionPrices] sp ON us.[SubscriptionPriceId] = sp.[Id]
    INNER JOIN [Subscriptions] s ON sp.[SubscriptionId] = s.[Id]
    WHERE p.[Status] = 0 AND p.[PaymentDate] < DATEADD(MINUTE, -35, GETUTCDATE());
END
GO

CREATE OR ALTER PROCEDURE [sp_Jobs_ProcessExpiredSubscriptions]
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Now DATETIME2 = GETUTCDATE();
    DECLARE @ExpiredTable TABLE (UserId UNIQUEIDENTIFIER, SubscriptionName NVARCHAR(100));

    UPDATE us
    SET us.IsActive = 0, us.UpdatedAt = @Now
    OUTPUT inserted.UserId, s.Name INTO @ExpiredTable(UserId, SubscriptionName)
    FROM UserSubscriptions us
    INNER JOIN SubscriptionPrices sp ON us.SubscriptionPriceId = sp.Id
    INNER JOIN Subscriptions s ON sp.SubscriptionId = s.Id
    WHERE us.IsActive = 1 AND us.NextBillingDate < @Now;

    SELECT UserId, SubscriptionName FROM @ExpiredTable;
END
GO


/* =========================================================================================
   ОТЧЕТЫ И СТАТИСТИКА
========================================================================================= */

CREATE OR ALTER PROCEDURE [sp_UserStatistics_Get]
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    DECLARE @TotalSpent DECIMAL(18,2), @ActiveCount INT, @TotalCount INT, @NextBilling DATETIME2;

    SELECT @TotalSpent = ISNULL(SUM(Amount), 0) FROM [Payments] WHERE [UserId] = @UserId AND [Status] = 1;
    SELECT @ActiveCount = COUNT(*) FROM [UserSubscriptions] WHERE [UserId] = @UserId AND [IsActive] = 1 AND ([CancelledAt] IS NULL OR [ValidUntil] >= GETUTCDATE());
    SELECT @TotalCount = COUNT(*) FROM [UserSubscriptions] WHERE [UserId] = @UserId AND [IsActive] = 1;
    SELECT TOP 1 @NextBilling = [NextBillingDate] FROM [UserSubscriptions] WHERE [UserId] = @UserId AND [IsActive] = 1 AND [CancelledAt] IS NULL ORDER BY [NextBillingDate];

    SELECT @TotalSpent AS TotalSpent, @ActiveCount AS ActiveSubscriptionsCount, @TotalCount AS TotalSubscriptionsCount, @NextBilling AS NextBillingDate;
END
GO

CREATE OR ALTER PROCEDURE [sp_Report_ActiveSubscriptionsByPlan]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT s.Id AS SubscriptionId, s.Name AS SubscriptionName, p.Id AS PeriodId, p.Name AS PeriodName, sp.FinalPrice, COUNT(us.Id) AS ActiveSubscriptionsCount
    FROM Subscriptions s INNER JOIN SubscriptionPrices sp ON sp.SubscriptionId = s.Id INNER JOIN Periods p ON sp.PeriodId = p.Id LEFT JOIN UserSubscriptions us ON us.SubscriptionPriceId = sp.Id AND us.IsActive = 1 AND (us.CancelledAt IS NULL OR us.ValidUntil >= GETUTCDATE())
    GROUP BY s.Id, s.Name, p.Id, p.Name, sp.FinalPrice ORDER BY s.Name, p.Name;
END
GO

CREATE OR ALTER PROCEDURE [sp_Report_SubscriptionsWithPlans]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT s.Id AS SubscriptionId, s.Name AS SubscriptionName, s.Category, s.Price AS BasePrice, p.Id AS PeriodId, p.Name AS PeriodName, p.MonthsCount, sp.Id AS SubscriptionPriceId, sp.FinalPrice
    FROM Subscriptions s INNER JOIN SubscriptionPrices sp ON sp.SubscriptionId = s.Id INNER JOIN Periods p ON sp.PeriodId = p.Id ORDER BY s.Name, p.MonthsCount;
END
GO

CREATE OR ALTER PROCEDURE [sp_Report_TopPopularSubscriptions]
    @TopCount INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@TopCount) s.Id AS SubscriptionId, s.Name AS SubscriptionName, s.Category, COUNT(us.Id) AS TotalSubscriptionsCount
    FROM Subscriptions s LEFT JOIN SubscriptionPrices sp ON sp.SubscriptionId = s.Id LEFT JOIN UserSubscriptions us ON us.SubscriptionPriceId = sp.Id
    GROUP BY s.Id, s.Name, s.Category ORDER BY TotalSubscriptionsCount DESC, s.Name;
END
GO

CREATE OR ALTER PROCEDURE [sp_Report_SubscriptionsByMonth]
    @StartDate DATETIME2, @EndDate DATETIME2
AS
BEGIN
    SET NOCOUNT ON;
    SELECT YEAR(us.StartDate) AS [Year], MONTH(us.StartDate) AS [Month], COUNT(us.Id) AS SubscriptionsCount
    FROM UserSubscriptions us WHERE us.StartDate >= @StartDate AND us.StartDate < @EndDate GROUP BY YEAR(us.StartDate), MONTH(us.StartDate) ORDER BY [Year], [Month];
END
GO

CREATE OR ALTER PROCEDURE [sp_Report_UserSubscriptions]
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT us.Id AS UserSubscriptionId, us.UserId, s.Id AS SubscriptionId, s.Name AS SubscriptionName, s.Category, p.Name AS PeriodName, sp.FinalPrice, us.StartDate, us.NextBillingDate, us.CancelledAt, us.ValidUntil, us.IsActive
    FROM UserSubscriptions us INNER JOIN SubscriptionPrices sp ON us.SubscriptionPriceId = sp.Id INNER JOIN Subscriptions s ON sp.SubscriptionId = s.Id INNER JOIN Periods p ON sp.PeriodId = p.Id
    WHERE us.UserId = @UserId ORDER BY us.StartDate DESC;
END
GO