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
    [UpdatedAt] DATETIME2 NOT NULL,
    [FrozenAt] DATETIME2 NULL,
    [FrozenUntil] DATETIME2 NULL
);
GO
CREATE INDEX [IX_UserSubscriptions_UserId] ON [UserSubscriptions] ([UserId]);
GO
IF COL_LENGTH('dbo.UserSubscriptions', 'FrozenAt') IS NULL
BEGIN
    ALTER TABLE [dbo].[UserSubscriptions] ADD [FrozenAt] DATETIME2 NULL, [FrozenUntil] DATETIME2 NULL;
END
GO

IF COL_LENGTH('AuthDb.dbo.Users', 'SubscriptionExpiryReminderDays') IS NULL
BEGIN
    ALTER TABLE [AuthDb].[dbo].[Users]
        ADD [SubscriptionExpiryReminderDays] INT NOT NULL
            CONSTRAINT [DF_Users_SubscriptionExpiryReminderDays] DEFAULT 3;
END
GO

CREATE TABLE [SubscriptionCancellationReasons] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY,
    [UserSubscriptionId] UNIQUEIDENTIFIER NOT NULL,
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [SubscriptionId] UNIQUEIDENTIFIER NOT NULL,
    [Reason] NVARCHAR(100) NOT NULL,
    [CustomReason] NVARCHAR(MAX) NULL,
    [CancelledAt] DATETIME2 NOT NULL,
    CONSTRAINT [FK_SubscriptionCancellationReasons_UserSubscriptions] FOREIGN KEY ([UserSubscriptionId]) 
        REFERENCES [UserSubscriptions] ([Id]) ON DELETE CASCADE
);
GO
CREATE INDEX [IX_SubscriptionCancellationReasons_UserId] ON [SubscriptionCancellationReasons] ([UserId]);
GO
CREATE INDEX [IX_SubscriptionCancellationReasons_SubscriptionId] ON [SubscriptionCancellationReasons] ([SubscriptionId]);
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

CREATE TABLE [PromoCodes] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY,
    [Code] NVARCHAR(50) NOT NULL,
    [Title] NVARCHAR(150) NOT NULL,
    [Description] NVARCHAR(500) NULL,
    [DiscountType] INT NOT NULL,
    [DiscountValue] DECIMAL(18, 2) NOT NULL,
    [MaxDiscountAmount] DECIMAL(18, 2) NULL,
    [ValidFrom] DATETIME2 NOT NULL,
    [ValidTo] DATETIME2 NOT NULL,
    [TotalUsageLimit] INT NULL,
    [PerUserUsageLimit] INT NOT NULL DEFAULT 1,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedAt] DATETIME2 NOT NULL,
    [UpdatedAt] DATETIME2 NOT NULL
);
GO
CREATE UNIQUE INDEX [IX_PromoCodes_Code] ON [PromoCodes] ([Code]);
GO

CREATE TABLE [PromoCodeConditions] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY,
    [PromoCodeId] UNIQUEIDENTIFIER NOT NULL,
    [SubscriptionId] UNIQUEIDENTIFIER NULL,
    [PeriodId] UNIQUEIDENTIFIER NULL,
    [MinAmount] DECIMAL(18, 2) NULL,
    [CreatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [FK_PromoCodeConditions_PromoCodes] FOREIGN KEY ([PromoCodeId])
        REFERENCES [PromoCodes] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_PromoCodeConditions_Subscriptions] FOREIGN KEY ([SubscriptionId])
        REFERENCES [Subscriptions] ([Id]) ON DELETE SET NULL,
    CONSTRAINT [FK_PromoCodeConditions_Periods] FOREIGN KEY ([PeriodId])
        REFERENCES [Periods] ([Id]) ON DELETE SET NULL
);
GO
CREATE INDEX [IX_PromoCodeConditions_PromoCodeId] ON [PromoCodeConditions] ([PromoCodeId]);
GO

CREATE TABLE [UserPromoCodes] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY,
    [PromoCodeId] UNIQUEIDENTIFIER NOT NULL,
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [AssignedAt] DATETIME2 NOT NULL,
    [AssignedByAdminId] UNIQUEIDENTIFIER NULL,
    [IsActive] BIT NOT NULL DEFAULT 1,
    CONSTRAINT [FK_UserPromoCodes_PromoCodes] FOREIGN KEY ([PromoCodeId])
        REFERENCES [PromoCodes] ([Id]) ON DELETE CASCADE
);
GO
CREATE UNIQUE INDEX [IX_UserPromoCodes_UserId_PromoCodeId] ON [UserPromoCodes] ([UserId], [PromoCodeId]);
GO

CREATE TABLE [PromoCodeUsages] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY,
    [PromoCodeId] UNIQUEIDENTIFIER NOT NULL,
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [PaymentId] UNIQUEIDENTIFIER NOT NULL,
    [UsedAt] DATETIME2 NOT NULL,
    [DiscountAmount] DECIMAL(18, 2) NOT NULL,
    CONSTRAINT [FK_PromoCodeUsages_PromoCodes] FOREIGN KEY ([PromoCodeId])
        REFERENCES [PromoCodes] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_PromoCodeUsages_Payments] FOREIGN KEY ([PaymentId])
        REFERENCES [Payments] ([Id]) ON DELETE CASCADE
);
GO
CREATE UNIQUE INDEX [IX_PromoCodeUsages_PaymentId] ON [PromoCodeUsages] ([PaymentId]);
GO

IF COL_LENGTH('dbo.Payments', 'AppliedPromoCodeId') IS NULL
BEGIN
    ALTER TABLE [dbo].[Payments] ADD [AppliedPromoCodeId] UNIQUEIDENTIFIER NULL;
END
GO

IF COL_LENGTH('dbo.Payments', 'DiscountAmount') IS NULL
BEGIN
    ALTER TABLE [dbo].[Payments] ADD [DiscountAmount] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_Payments_DiscountAmount] DEFAULT 0;
END
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
    INNER JOIN @PageIds p_id ON sp.SubscriptionId = p_id.Id
    WHERE sp.FinalPrice > 0;
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
    @IsActive BIT = NULL
AS
BEGIN
    UPDATE [Subscriptions]
    SET [Name] = @Name, [Description] = @Description, [DescriptionMarkdown] = @DescriptionMarkdown, [Price] = @Price,
        [Category] = @Category, [IconFileId] = @IconFileId, [IsActive] = ISNULL(@IsActive, [IsActive]), [UpdatedAt] = GETUTCDATE()
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
        INNER JOIN Periods p ON sp.PeriodId = p.Id
        WHERE sp.SubscriptionId = @Id
          AND sp.FinalPrice > 0;
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
    WHERE sp.SubscriptionId = @SubscriptionId
      AND sp.FinalPrice > 0;
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
    IF EXISTS (
        SELECT 1
        FROM SubscriptionPrices
        WHERE SubscriptionId = @SubscriptionId
          AND PeriodId = @PeriodId
          AND FinalPrice > 0
    ) THROW 50003, 'Price for this subscription and period already exists', 1;

    INSERT INTO SubscriptionPrices (Id, SubscriptionId, PeriodId, FinalPrice)
    VALUES (@Id, @SubscriptionId, @PeriodId, @FinalPrice);

    SELECT sp.*, p.Name AS PeriodName, p.MonthsCount
    FROM SubscriptionPrices sp
    INNER JOIN Periods p ON sp.PeriodId = p.Id
    WHERE sp.Id = @Id
      AND sp.FinalPrice > 0;
END
GO

CREATE OR ALTER PROCEDURE [sp_SubscriptionPrices_Delete]
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (
        SELECT 1
        FROM SubscriptionPrices sp
        WHERE sp.Id = @Id
          AND sp.FinalPrice > 0
    ) RETURN 404;

    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE us
        SET
            us.CancelledAt = GETUTCDATE(),
            us.ValidUntil = us.NextBillingDate,
            us.FrozenAt = NULL,
            us.FrozenUntil = NULL,
            us.IsActive = 1,
            us.UpdatedAt = GETUTCDATE()
        FROM UserSubscriptions us
        WHERE us.SubscriptionPriceId = @Id
          AND (
                us.IsActive = 1
                OR (us.FrozenUntil IS NOT NULL AND us.FrozenUntil > GETUTCDATE())
              );

        IF EXISTS (SELECT 1 FROM UserSubscriptions WHERE SubscriptionPriceId = @Id)
        BEGIN
            UPDATE SubscriptionPrices
            SET FinalPrice = -ABS(FinalPrice)
            WHERE Id = @Id;
        END
        ELSE
        BEGIN
            DELETE FROM SubscriptionPrices WHERE Id = @Id;
        END

        COMMIT TRANSACTION;
        RETURN 204;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO


/* =========================================================================================
   ЖИЗНЕННЫЙ ЦИКЛ ПОДПИСОК ПОЛЬЗОВАТЕЛЯ (USER SUBSCRIPTIONS)
========================================================================================= */

CREATE OR ALTER PROCEDURE [dbo].[sp_UserSubscriptions_GetActiveByUserId]
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    SELECT
        us.[Id], us.[UserId], us.[SubscriptionPriceId], us.[StartDate], us.[NextBillingDate],
        us.[CancelledAt], us.[ValidUntil], us.[IsActive], us.[CreatedAt], us.[UpdatedAt],
        us.[FrozenAt], us.[FrozenUntil],
        CASE WHEN us.[FrozenAt] IS NOT NULL AND us.[CancelledAt] IS NULL THEN 1 ELSE 0 END AS IsFrozen,
        ABS(sp.[FinalPrice]) AS FinalPrice,
        p.[Name] AS PeriodName,
        p.[MonthsCount],
        s.[Name] AS SubscriptionName,
        s.[Category],
        s.[IconUrl]
    FROM [dbo].[UserSubscriptions] us
    INNER JOIN [dbo].[SubscriptionPrices] sp ON us.[SubscriptionPriceId] = sp.[Id]
    INNER JOIN [dbo].[Subscriptions] s ON sp.[SubscriptionId] = s.[Id]
    INNER JOIN [dbo].[Periods] p ON sp.[PeriodId] = p.[Id]
    WHERE us.[UserId] = @UserId AND (
        (us.[IsActive] = 1 AND (us.[CancelledAt] IS NULL OR us.[ValidUntil] >= GETUTCDATE()))
        OR (us.[FrozenAt] IS NOT NULL AND us.[CancelledAt] IS NULL)
    );
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
    WHERE us.[UserId] = @UserId AND (
        (us.[IsActive] = 1 AND (us.[CancelledAt] IS NULL OR us.[ValidUntil] >= GETUTCDATE()))
        OR (us.[FrozenAt] IS NOT NULL AND us.[CancelledAt] IS NULL)
    ) AND (@Category IS NULL OR s.[Category] = @Category);

    SELECT us.Id, us.UserId, us.SubscriptionPriceId, us.StartDate, us.NextBillingDate, us.CancelledAt, us.ValidUntil, us.IsActive, us.CreatedAt, us.UpdatedAt,
        us.FrozenAt, us.FrozenUntil,
        CASE WHEN us.FrozenAt IS NOT NULL AND us.CancelledAt IS NULL THEN 1 ELSE 0 END AS IsFrozen,
        ABS(sp.FinalPrice) AS FinalPrice, per.Name AS PeriodName, s.Id AS SubscriptionId, s.Name AS SubscriptionName, s.Category, s.Price, s.IconFileId, s.IconUrl, s.Description, s.DescriptionMarkdown, s.IsActive AS SubscriptionIsActive, s.CreatedAt AS SubscriptionCreatedAt, s.UpdatedAt AS SubscriptionUpdatedAt
    FROM [UserSubscriptions] us
    INNER JOIN [SubscriptionPrices] sp ON us.[SubscriptionPriceId] = sp.[Id]
    INNER JOIN [Subscriptions] s ON sp.[SubscriptionId] = s.[Id]
    INNER JOIN [Periods] per ON sp.[PeriodId] = per.[Id]
    WHERE us.[UserId] = @UserId AND (
        (us.[IsActive] = 1 AND (us.[CancelledAt] IS NULL OR us.[ValidUntil] >= GETUTCDATE()))
        OR (us.[FrozenAt] IS NOT NULL AND us.[CancelledAt] IS NULL)
    ) AND (@Category IS NULL OR s.[Category] = @Category)
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
        us.FrozenAt, us.FrozenUntil,
        CASE WHEN us.FrozenAt IS NOT NULL AND us.CancelledAt IS NULL THEN 1 ELSE 0 END AS IsFrozen,
        CASE WHEN us.FrozenAt IS NOT NULL AND us.CancelledAt IS NULL THEN 0 WHEN us.IsActive = 1 AND (us.ValidUntil IS NULL OR us.ValidUntil >= SYSUTCDATETIME()) THEN 1 ELSE 0 END AS IsValid,
        CASE WHEN us.FrozenAt IS NOT NULL AND us.CancelledAt IS NULL THEN 'Frozen' WHEN us.IsActive = 1 AND (us.ValidUntil IS NULL OR us.ValidUntil >= SYSUTCDATETIME()) THEN 'Active' WHEN us.CancelledAt IS NOT NULL THEN 'Cancelled' WHEN us.ValidUntil IS NOT NULL AND us.ValidUntil < SYSUTCDATETIME() THEN 'Expired' ELSE 'Unknown' END AS Status,
        s.Name AS SubscriptionName, s.Category, s.Price, s.IconFileId, s.IconUrl, s.IsActive AS SubscriptionIsActive, s.CreatedAt AS SubscriptionCreatedAt, s.UpdatedAt AS SubscriptionUpdatedAt, s.Description, s.DescriptionMarkdown, p.Name AS PeriodName, ABS(sp.FinalPrice) AS FinalPrice
    FROM [UserSubscriptions] us
    INNER JOIN [SubscriptionPrices] sp ON us.[SubscriptionPriceId] = sp.[Id]
    INNER JOIN [Subscriptions] s ON sp.[SubscriptionId] = s.[Id]
    INNER JOIN [Periods] p ON sp.[PeriodId] = p.[Id]
    WHERE us.[UserId] = @UserId
    ORDER BY us.[StartDate] DESC OFFSET (@PageNumber - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END;
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
    INNER JOIN Subscriptions s ON sp.SubscriptionId = s.Id INNER JOIN Periods p ON sp.PeriodId = p.Id
    WHERE sp.Id = @SubscriptionPriceId
      AND sp.FinalPrice > 0;

    IF @SubscriptionId IS NULL RETURN 404;
    IF @IsActive = 0 RETURN 400;
    IF EXISTS (
        SELECT 1 FROM UserSubscriptions us INNER JOIN SubscriptionPrices sp ON us.SubscriptionPriceId = sp.Id
        WHERE us.UserId = @UserId AND sp.SubscriptionId = @SubscriptionId
        AND (
            (us.IsActive = 1 AND (us.CancelledAt IS NULL OR us.ValidUntil >= GETUTCDATE()))
            OR (us.FrozenAt IS NOT NULL AND us.CancelledAt IS NULL)
        )
    ) RETURN 409;

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
    @Now DATETIME2,
    @Reason NVARCHAR(100) = NULL,
    @CustomReason NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @UserSubId UNIQUEIDENTIFIER, @NextBillingDate DATETIME2;
    
    SELECT TOP 1 @UserSubId = us.Id, @NextBillingDate = us.NextBillingDate 
    FROM UserSubscriptions us
    INNER JOIN SubscriptionPrices sp ON us.SubscriptionPriceId = sp.Id 
    WHERE us.UserId = @UserId AND sp.SubscriptionId = @SubscriptionId AND us.CancelledAt IS NULL
        AND (us.IsActive = 1 OR (us.FrozenAt IS NOT NULL AND us.CancelledAt IS NULL));

    IF @UserSubId IS NULL RETURN 404;

    UPDATE UserSubscriptions 
    SET CancelledAt = @Now, 
        ValidUntil = @NextBillingDate,
        FrozenAt = NULL,
        FrozenUntil = NULL,
        IsActive = 1,
        UpdatedAt = GETUTCDATE()
    WHERE Id = @UserSubId;
    
    IF @Reason IS NOT NULL
    BEGIN
        INSERT INTO [SubscriptionCancellationReasons] ([Id], [UserSubscriptionId], [UserId], [SubscriptionId], [Reason], [CustomReason], [CancelledAt])
        VALUES (NEWID(), @UserSubId, @UserId, @SubscriptionId, @Reason, @CustomReason, @Now);
    END
    
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

CREATE OR ALTER PROCEDURE [sp_Payments_UpdateStatus]
    @Id UNIQUEIDENTIFIER, @Status INT, @ExternalTransactionId NVARCHAR(100) = NULL, @CardLastFour NVARCHAR(4) = NULL, @CardBrand NVARCHAR(20) = NULL
AS
BEGIN
    UPDATE [Payments] SET [Status] = @Status, [ExternalTransactionId] = ISNULL(@ExternalTransactionId, [ExternalTransactionId]), [CardLastFour] = ISNULL(@CardLastFour, [CardLastFour]), [CardBrand] = ISNULL(@CardBrand, [CardBrand]) WHERE [Id] = @Id;
END
GO

CREATE OR ALTER PROCEDURE [sp_Payments_Initiate]
    @UserId UNIQUEIDENTIFIER,
    @SubscriptionPriceId UNIQUEIDENTIFIER,
    @PromoCode NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @BasePrice DECIMAL(18, 2), @FinalPrice DECIMAL(18, 2), @DiscountAmount DECIMAL(18, 2) = 0;
    DECLARE @SubscriptionId UNIQUEIDENTIFIER, @PeriodId UNIQUEIDENTIFIER, @MonthsCount INT, @SubName NVARCHAR(100), @PeriodName NVARCHAR(100), @IsActive BIT;
    DECLARE @PromoCodeId UNIQUEIDENTIFIER = NULL;

    SELECT @BasePrice = sp.FinalPrice, @SubscriptionId = s.Id, @PeriodId = p.Id, @MonthsCount = p.MonthsCount, @SubName = s.Name, @PeriodName = p.Name, @IsActive = s.IsActive
    FROM SubscriptionPrices sp INNER JOIN Subscriptions s ON sp.SubscriptionId = s.Id INNER JOIN Periods p ON sp.PeriodId = p.Id
    WHERE sp.Id = @SubscriptionPriceId
      AND sp.FinalPrice > 0;

    IF @BasePrice IS NULL THROW 50404, 'Subscription price not found', 1;
    IF @IsActive = 0 THROW 50001, 'Subscription is not active', 1;
    IF EXISTS (
        SELECT 1 FROM UserSubscriptions us INNER JOIN SubscriptionPrices sp ON us.SubscriptionPriceId = sp.Id
        WHERE us.UserId = @UserId AND sp.SubscriptionId = @SubscriptionId
        AND (
            (us.IsActive = 1 AND (us.CancelledAt IS NULL OR us.ValidUntil >= GETUTCDATE()))
            OR (us.FrozenUntil IS NOT NULL AND us.FrozenUntil > GETUTCDATE())
        )
    ) THROW 50002, 'User already subscribed to this service', 1;

    IF @PromoCode IS NOT NULL AND LTRIM(RTRIM(@PromoCode)) <> ''
    BEGIN
        DECLARE @PromoNow DATETIME2 = GETUTCDATE(), @CodeTrimmed NVARCHAR(50) = UPPER(LTRIM(RTRIM(@PromoCode)));
        DECLARE @DiscountType INT, @DiscountValue DECIMAL(18,2), @MaxDiscountAmount DECIMAL(18,2), @TotalUsageLimit INT, @PerUserUsageLimit INT;
        DECLARE @ConditionSubscriptionId UNIQUEIDENTIFIER, @ConditionPeriodId UNIQUEIDENTIFIER, @ConditionMinAmount DECIMAL(18,2);
        DECLARE @UserHasAssignment BIT = 0;
        DECLARE @TotalUsages INT = 0, @UserUsages INT = 0;

        SELECT TOP 1
            @PromoCodeId = pc.Id,
            @DiscountType = pc.DiscountType,
            @DiscountValue = pc.DiscountValue,
            @MaxDiscountAmount = pc.MaxDiscountAmount,
            @TotalUsageLimit = pc.TotalUsageLimit,
            @PerUserUsageLimit = pc.PerUserUsageLimit
        FROM PromoCodes pc
        WHERE UPPER(pc.Code) = @CodeTrimmed
            AND pc.IsActive = 1
            AND @PromoNow >= pc.ValidFrom
            AND @PromoNow <= pc.ValidTo;

        IF @PromoCodeId IS NULL THROW 50010, 'Promo code is invalid or expired', 1;

        SELECT TOP 1
            @ConditionSubscriptionId = SubscriptionId,
            @ConditionPeriodId = PeriodId,
            @ConditionMinAmount = MinAmount
        FROM PromoCodeConditions
        WHERE PromoCodeId = @PromoCodeId;

        IF @ConditionSubscriptionId IS NOT NULL AND @ConditionSubscriptionId <> @SubscriptionId
            THROW 50011, 'Promo code is not applicable for selected subscription', 1;

        IF @ConditionPeriodId IS NOT NULL AND @ConditionPeriodId <> @PeriodId
            THROW 50012, 'Promo code is not applicable for selected period', 1;

        IF @ConditionMinAmount IS NOT NULL AND @BasePrice < @ConditionMinAmount
            THROW 50013, 'Order amount does not satisfy promo code conditions', 1;

        SELECT @UserHasAssignment =
            CASE WHEN EXISTS (
                SELECT 1
                FROM UserPromoCodes upc
                WHERE upc.PromoCodeId = @PromoCodeId AND upc.UserId = @UserId AND upc.IsActive = 1
            ) THEN 1 ELSE 0 END;

        IF @UserHasAssignment = 0 THROW 50014, 'Promo code is not assigned to this user', 1;

        SELECT @TotalUsages = COUNT(*) FROM PromoCodeUsages WHERE PromoCodeId = @PromoCodeId;
        SELECT @UserUsages = COUNT(*) FROM PromoCodeUsages WHERE PromoCodeId = @PromoCodeId AND UserId = @UserId;

        IF @TotalUsageLimit IS NOT NULL AND @TotalUsages >= @TotalUsageLimit
            THROW 50015, 'Promo code usage limit exceeded', 1;

        IF @PerUserUsageLimit IS NOT NULL AND @UserUsages >= @PerUserUsageLimit
            THROW 50016, 'You have already used this promo code', 1;

        IF @DiscountType = 1
        BEGIN
            SET @DiscountAmount = ROUND((@BasePrice * @DiscountValue) / 100.0, 2);
        END
        ELSE
        BEGIN
            SET @DiscountAmount = @DiscountValue;
        END

        IF @MaxDiscountAmount IS NOT NULL AND @DiscountAmount > @MaxDiscountAmount
            SET @DiscountAmount = @MaxDiscountAmount;

        IF @DiscountAmount > @BasePrice
            SET @DiscountAmount = @BasePrice;
    END

    SET @FinalPrice = @BasePrice - @DiscountAmount;

    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @UserSubId UNIQUEIDENTIFIER = NEWID(), @PaymentId UNIQUEIDENTIFIER = NEWID(), @Now DATETIME2 = GETUTCDATE();
        DECLARE @NextBillingDate DATETIME2 = DATEADD(MONTH, @MonthsCount, @Now);

        INSERT INTO UserSubscriptions (Id, UserId, SubscriptionPriceId, StartDate, NextBillingDate, IsActive, CreatedAt, UpdatedAt) VALUES (@UserSubId, @UserId, @SubscriptionPriceId, @Now, @NextBillingDate, 0, @Now, @Now);
        INSERT INTO Payments (Id, UserSubscriptionId, UserId, Amount, Currency, Status, PaymentDate, PeriodStart, PeriodEnd, AppliedPromoCodeId, DiscountAmount)
        VALUES (@PaymentId, @UserSubId, @UserId, @FinalPrice, 'BYN', 0, @Now, @Now, @NextBillingDate, @PromoCodeId, @DiscountAmount);
        COMMIT TRANSACTION;

        SELECT @PaymentId AS PaymentId, @FinalPrice AS Amount, @BasePrice AS BaseAmount, @DiscountAmount AS DiscountAmount, @SubName AS SubscriptionName, @PeriodName AS PeriodName;
    END TRY
    BEGIN CATCH IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION; THROW; END CATCH
END
GO

CREATE OR ALTER PROCEDURE [sp_PromoCodes_Create]
    @Id UNIQUEIDENTIFIER,
    @Code NVARCHAR(50),
    @Title NVARCHAR(150),
    @Description NVARCHAR(500) = NULL,
    @DiscountType INT,
    @DiscountValue DECIMAL(18,2),
    @MaxDiscountAmount DECIMAL(18,2) = NULL,
    @ValidFrom DATETIME2,
    @ValidTo DATETIME2,
    @TotalUsageLimit INT = NULL,
    @PerUserUsageLimit INT = 1,
    @SubscriptionId UNIQUEIDENTIFIER = NULL,
    @PeriodId UNIQUEIDENTIFIER = NULL,
    @MinAmount DECIMAL(18,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @CodeNormalized NVARCHAR(50) = UPPER(LTRIM(RTRIM(@Code)));

    IF @CodeNormalized = '' THROW 50020, 'Promo code is required', 1;
    IF @DiscountType NOT IN (1, 2) THROW 50021, 'Invalid discount type', 1;
    IF @DiscountValue <= 0 THROW 50022, 'Discount value must be greater than zero', 1;
    IF @ValidTo <= @ValidFrom THROW 50023, 'ValidTo must be greater than ValidFrom', 1;
    IF EXISTS (SELECT 1 FROM PromoCodes WHERE Code = @CodeNormalized) THROW 50024, 'Promo code already exists', 1;
    IF @SubscriptionId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Subscriptions WHERE Id = @SubscriptionId) THROW 50025, 'Subscription not found', 1;
    IF @PeriodId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Periods WHERE Id = @PeriodId) THROW 50026, 'Period not found', 1;

    BEGIN TRY
        BEGIN TRANSACTION;
        INSERT INTO PromoCodes (Id, Code, Title, Description, DiscountType, DiscountValue, MaxDiscountAmount, ValidFrom, ValidTo, TotalUsageLimit, PerUserUsageLimit, IsActive, CreatedAt, UpdatedAt)
        VALUES (@Id, @CodeNormalized, @Title, @Description, @DiscountType, @DiscountValue, @MaxDiscountAmount, @ValidFrom, @ValidTo, @TotalUsageLimit, @PerUserUsageLimit, 1, GETUTCDATE(), GETUTCDATE());

        INSERT INTO PromoCodeConditions (Id, PromoCodeId, SubscriptionId, PeriodId, MinAmount, CreatedAt)
        VALUES (NEWID(), @Id, @SubscriptionId, @PeriodId, @MinAmount, GETUTCDATE());

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;

    SELECT pc.*, c.SubscriptionId, c.PeriodId, c.MinAmount
    FROM PromoCodes pc
    LEFT JOIN PromoCodeConditions c ON c.PromoCodeId = pc.Id
    WHERE pc.Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE [sp_PromoCodes_SetConditions]
    @PromoCodeId UNIQUEIDENTIFIER,
    @ConditionsJson NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM [PromoCodes] WHERE [Id] = @PromoCodeId)
        THROW 50062, 'Promo code not found', 1;

    DELETE FROM [PromoCodeConditions]
    WHERE [PromoCodeId] = @PromoCodeId;

    IF @ConditionsJson IS NULL OR ISJSON(@ConditionsJson) <> 1
    BEGIN
        INSERT INTO [PromoCodeConditions] ([Id], [PromoCodeId], [SubscriptionId], [PeriodId], [MinAmount], [CreatedAt])
        VALUES (NEWID(), @PromoCodeId, NULL, NULL, NULL, GETUTCDATE());
        RETURN;
    END

    ;WITH ParsedConditions AS
    (
        SELECT
            TRY_CONVERT(UNIQUEIDENTIFIER, JSON_VALUE([value], '$.SubscriptionId')) AS [SubscriptionId],
            TRY_CONVERT(UNIQUEIDENTIFIER, JSON_VALUE([value], '$.PeriodId')) AS [PeriodId],
            TRY_CONVERT(DECIMAL(18,2), JSON_VALUE([value], '$.MinAmount')) AS [MinAmount]
        FROM OPENJSON(@ConditionsJson)
    )
    INSERT INTO [PromoCodeConditions] ([Id], [PromoCodeId], [SubscriptionId], [PeriodId], [MinAmount], [CreatedAt])
    SELECT DISTINCT
        NEWID(),
        @PromoCodeId,
        [SubscriptionId],
        [PeriodId],
        [MinAmount],
        GETUTCDATE()
    FROM ParsedConditions;

    IF @@ROWCOUNT = 0
    BEGIN
        INSERT INTO [PromoCodeConditions] ([Id], [PromoCodeId], [SubscriptionId], [PeriodId], [MinAmount], [CreatedAt])
        VALUES (NEWID(), @PromoCodeId, NULL, NULL, NULL, GETUTCDATE());
    END
END
GO

CREATE OR ALTER PROCEDURE [sp_PromoCodes_AssignToUser]
    @PromoCodeId UNIQUEIDENTIFIER,
    @UserId UNIQUEIDENTIFIER,
    @AssignedByAdminId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM PromoCodes WHERE Id = @PromoCodeId AND IsActive = 1) THROW 50030, 'Promo code not found or inactive', 1;

    IF EXISTS (SELECT 1 FROM UserPromoCodes WHERE PromoCodeId = @PromoCodeId AND UserId = @UserId)
    BEGIN
        UPDATE UserPromoCodes
        SET IsActive = 1, AssignedAt = GETUTCDATE(), AssignedByAdminId = @AssignedByAdminId
        WHERE PromoCodeId = @PromoCodeId AND UserId = @UserId;
    END
    ELSE
    BEGIN
        INSERT INTO UserPromoCodes (Id, PromoCodeId, UserId, AssignedAt, AssignedByAdminId, IsActive)
        VALUES (NEWID(), @PromoCodeId, @UserId, GETUTCDATE(), @AssignedByAdminId, 1);
    END
END
GO

CREATE OR ALTER PROCEDURE [sp_PromoCodes_GetAssignedByUserId]
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Now DATETIME2 = GETUTCDATE();

    SELECT
        pc.Id,
        pc.Code,
        pc.Title,
        pc.Description,
        pc.DiscountType,
        pc.DiscountValue,
        pc.MaxDiscountAmount,
        pc.ValidFrom,
        pc.ValidTo,
        pc.TotalUsageLimit,
        pc.PerUserUsageLimit,
        c.SubscriptionId,
        c.PeriodId,
        c.MinAmount,
        ISNULL(u.UserUsageCount, 0) AS UserUsageCount
    FROM UserPromoCodes upc
    INNER JOIN PromoCodes pc ON upc.PromoCodeId = pc.Id
    LEFT JOIN PromoCodeConditions c ON c.PromoCodeId = pc.Id
    OUTER APPLY (
        SELECT COUNT(*) AS UserUsageCount
        FROM PromoCodeUsages u
        WHERE u.PromoCodeId = pc.Id AND u.UserId = @UserId
    ) u
    OUTER APPLY (
        SELECT COUNT(*) AS TotalUsageCount
        FROM PromoCodeUsages tu
        WHERE tu.PromoCodeId = pc.Id
    ) t
    WHERE upc.UserId = @UserId
      AND upc.IsActive = 1
      AND pc.IsActive = 1
      AND @Now BETWEEN pc.ValidFrom AND pc.ValidTo
      AND (
            pc.PerUserUsageLimit IS NULL
            OR ISNULL(u.UserUsageCount, 0) < pc.PerUserUsageLimit
          )
      AND (
            pc.TotalUsageLimit IS NULL
            OR ISNULL(t.TotalUsageCount, 0) < pc.TotalUsageLimit
          )
    ORDER BY pc.ValidTo ASC;
END
GO

CREATE OR ALTER PROCEDURE [sp_PromoCodes_ValidateForPayment]
    @UserId UNIQUEIDENTIFIER,
    @SubscriptionPriceId UNIQUEIDENTIFIER,
    @PromoCode NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Now DATETIME2 = GETUTCDATE();
    DECLARE @CodeTrimmed NVARCHAR(50) = UPPER(LTRIM(RTRIM(ISNULL(@PromoCode, ''))));
    DECLARE @BaseAmount DECIMAL(18,2), @FinalAmount DECIMAL(18,2), @DiscountAmount DECIMAL(18,2) = 0;
    DECLARE @SubscriptionId UNIQUEIDENTIFIER, @PeriodId UNIQUEIDENTIFIER;
    DECLARE @PromoCodeId UNIQUEIDENTIFIER, @DiscountType INT, @DiscountValue DECIMAL(18,2), @MaxDiscountAmount DECIMAL(18,2);
    DECLARE @TotalUsageLimit INT, @PerUserUsageLimit INT;
    DECLARE @ConditionSubscriptionId UNIQUEIDENTIFIER, @ConditionPeriodId UNIQUEIDENTIFIER, @ConditionMinAmount DECIMAL(18,2);
    DECLARE @TotalUsages INT, @UserUsages INT;

    SELECT @BaseAmount = sp.FinalPrice, @SubscriptionId = sp.SubscriptionId, @PeriodId = sp.PeriodId
    FROM SubscriptionPrices sp
    WHERE sp.Id = @SubscriptionPriceId
      AND sp.FinalPrice > 0;

    IF @BaseAmount IS NULL THROW 50040, 'Subscription price not found', 1;
    IF @CodeTrimmed = '' THROW 50041, 'Promo code is required', 1;

    SELECT TOP 1
        @PromoCodeId = pc.Id,
        @DiscountType = pc.DiscountType,
        @DiscountValue = pc.DiscountValue,
        @MaxDiscountAmount = pc.MaxDiscountAmount,
        @TotalUsageLimit = pc.TotalUsageLimit,
        @PerUserUsageLimit = pc.PerUserUsageLimit
    FROM PromoCodes pc
    WHERE UPPER(pc.Code) = @CodeTrimmed
      AND pc.IsActive = 1
      AND @Now BETWEEN pc.ValidFrom AND pc.ValidTo;

    IF @PromoCodeId IS NULL THROW 50042, 'Promo code is invalid or expired', 1;

    IF NOT EXISTS (
        SELECT 1 FROM UserPromoCodes upc
        WHERE upc.PromoCodeId = @PromoCodeId AND upc.UserId = @UserId AND upc.IsActive = 1
    ) THROW 50043, 'Promo code is not assigned to this user', 1;

    SELECT TOP 1
        @ConditionSubscriptionId = c.SubscriptionId,
        @ConditionPeriodId = c.PeriodId,
        @ConditionMinAmount = c.MinAmount
    FROM PromoCodeConditions c
    WHERE c.PromoCodeId = @PromoCodeId;

    IF @ConditionSubscriptionId IS NOT NULL AND @ConditionSubscriptionId <> @SubscriptionId
        THROW 50044, 'Promo code is not applicable for selected subscription', 1;

    IF @ConditionPeriodId IS NOT NULL AND @ConditionPeriodId <> @PeriodId
        THROW 50045, 'Promo code is not applicable for selected period', 1;

    IF @ConditionMinAmount IS NOT NULL AND @BaseAmount < @ConditionMinAmount
        THROW 50046, 'Order amount does not satisfy promo code conditions', 1;

    SELECT @TotalUsages = COUNT(*) FROM PromoCodeUsages WHERE PromoCodeId = @PromoCodeId;
    SELECT @UserUsages = COUNT(*) FROM PromoCodeUsages WHERE PromoCodeId = @PromoCodeId AND UserId = @UserId;

    IF @TotalUsageLimit IS NOT NULL AND @TotalUsages >= @TotalUsageLimit
        THROW 50047, 'Promo code usage limit exceeded', 1;

    IF @PerUserUsageLimit IS NOT NULL AND @UserUsages >= @PerUserUsageLimit
        THROW 50048, 'You have already used this promo code', 1;

    IF @DiscountType = 1
        SET @DiscountAmount = ROUND((@BaseAmount * @DiscountValue) / 100.0, 2);
    ELSE
        SET @DiscountAmount = @DiscountValue;

    IF @MaxDiscountAmount IS NOT NULL AND @DiscountAmount > @MaxDiscountAmount
        SET @DiscountAmount = @MaxDiscountAmount;

    IF @DiscountAmount > @BaseAmount
        SET @DiscountAmount = @BaseAmount;

    SET @FinalAmount = @BaseAmount - @DiscountAmount;

    SELECT
        @PromoCodeId AS PromoCodeId,
        @CodeTrimmed AS PromoCode,
        @BaseAmount AS BaseAmount,
        @DiscountAmount AS DiscountAmount,
        @FinalAmount AS FinalAmount;
END
GO

CREATE OR ALTER PROCEDURE [sp_PromoCodes_RegisterUsageForPayment]
    @PaymentId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @PromoCodeId UNIQUEIDENTIFIER, @UserId UNIQUEIDENTIFIER, @DiscountAmount DECIMAL(18,2);

    SELECT
        @PromoCodeId = p.AppliedPromoCodeId,
        @UserId = p.UserId,
        @DiscountAmount = ISNULL(p.DiscountAmount, 0)
    FROM Payments p
    WHERE p.Id = @PaymentId AND p.Status = 1;

    IF @PromoCodeId IS NULL RETURN 204;
    IF EXISTS (SELECT 1 FROM PromoCodeUsages WHERE PaymentId = @PaymentId) RETURN 204;

    INSERT INTO PromoCodeUsages (Id, PromoCodeId, UserId, PaymentId, UsedAt, DiscountAmount)
    VALUES (NEWID(), @PromoCodeId, @UserId, @PaymentId, GETUTCDATE(), @DiscountAmount);
END
GO

CREATE OR ALTER PROCEDURE [sp_PromoCodes_GetAudienceUsers]
    @AudienceType INT = 1,      -- 1: paid in last N days, 2: most active users, 3: all users with successful payments, 4: no purchases for more than N days
    @DaysBack INT = 30,
    @TopUsersCount INT = 100
AS
BEGIN
    SET NOCOUNT ON;
    IF @DaysBack < 1 SET @DaysBack = 1;
    IF @DaysBack > 365 SET @DaysBack = 365;
    IF @TopUsersCount < 1 SET @TopUsersCount = 1;
    IF @TopUsersCount > 1000 SET @TopUsersCount = 1000;

    DECLARE @FromDate DATETIME2 = DATEADD(DAY, -@DaysBack, GETUTCDATE());

    IF @AudienceType = 1
    BEGIN
        SELECT
            p.UserId,
            u.Email,
            COUNT(*) AS PaymentsCount,
            SUM(p.Amount) AS TotalSpent,
            MAX(p.PaymentDate) AS LastPaymentDate
        FROM [SubscriptionsDb].[dbo].[Payments] p
        INNER JOIN AuthDb.dbo.Users u ON u.Id = p.UserId
        WHERE p.Status = 1
            AND p.PaymentDate >= @FromDate
        GROUP BY p.UserId, u.Email
        ORDER BY MAX(p.PaymentDate) DESC, COUNT(*) DESC;
        RETURN;
    END

    IF @AudienceType = 2
    BEGIN
        SELECT TOP (@TopUsersCount)
            p.UserId,
            u.Email,
            COUNT(*) AS PaymentsCount,
            SUM(p.Amount) AS TotalSpent,
            MAX(p.PaymentDate) AS LastPaymentDate
        FROM Payments p
        INNER JOIN AuthDb.dbo.Users u ON u.Id = p.UserId
        WHERE p.Status = 1
        GROUP BY p.UserId, u.Email
        ORDER BY COUNT(*) DESC, SUM(p.Amount) DESC, MAX(p.PaymentDate) DESC;
        RETURN;
    END

    IF @AudienceType = 3
    BEGIN
        SELECT
            p.UserId,
            u.Email,
            COUNT(*) AS PaymentsCount,
            SUM(p.Amount) AS TotalSpent,
            MAX(p.PaymentDate) AS LastPaymentDate
        FROM Payments p
        INNER JOIN AuthDb.dbo.Users u ON u.Id = p.UserId
        WHERE p.Status = 1
        GROUP BY p.UserId, u.Email
        ORDER BY MAX(p.PaymentDate) DESC;
        RETURN;
    END

    IF @AudienceType = 4
    BEGIN
        SELECT
            p.UserId,
            u.Email,
            COUNT(*) AS PaymentsCount,
            SUM(p.Amount) AS TotalSpent,
            MAX(p.PaymentDate) AS LastPaymentDate
        FROM Payments p
        INNER JOIN AuthDb.dbo.Users u ON u.Id = p.UserId
        WHERE p.Status = 1
        GROUP BY p.UserId, u.Email
        HAVING MAX(p.PaymentDate) < @FromDate
        ORDER BY MAX(p.PaymentDate) ASC, COUNT(*) DESC;
        RETURN;
    END

    ;THROW 50060, 'Unknown audience type', 1;
END
GO

CREATE OR ALTER PROCEDURE [sp_PromoCodes_GetDeliveryReport]
    @PromoCodeId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM PromoCodes WHERE Id = @PromoCodeId)
        THROW 50061, 'Promo code not found', 1;

    SELECT
        pc.Id AS PromoCodeId,
        pc.Code,
        pc.Title,
        COUNT(DISTINCT upc.UserId) AS AssignedUsersCount,
        COUNT(DISTINCT u.UserId) AS UsedUsersCount,
        COUNT(u.Id) AS TotalUsagesCount
    FROM PromoCodes pc
    LEFT JOIN UserPromoCodes upc ON upc.PromoCodeId = pc.Id AND upc.IsActive = 1
    LEFT JOIN PromoCodeUsages u ON u.PromoCodeId = pc.Id
    WHERE pc.Id = @PromoCodeId
    GROUP BY pc.Id, pc.Code, pc.Title;

    SELECT
        upc.UserId,
        users.Email,
        upc.AssignedAt,
        upc.IsActive,
        ISNULL(usages.UserUsageCount, 0) AS UserUsageCount
    FROM UserPromoCodes upc
    INNER JOIN AuthDb.dbo.Users users ON users.Id = upc.UserId
    OUTER APPLY (
        SELECT COUNT(*) AS UserUsageCount
        FROM PromoCodeUsages u
        WHERE u.PromoCodeId = upc.PromoCodeId AND u.UserId = upc.UserId
    ) usages
    WHERE upc.PromoCodeId = @PromoCodeId
    ORDER BY upc.AssignedAt DESC;
END
GO

CREATE OR ALTER PROCEDURE [sp_PromoCodes_GetAssignedHistoryByUserId]
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        pc.Id,
        pc.Code,
        pc.Title,
        pc.Description,
        pc.DiscountType,
        pc.DiscountValue,
        pc.MaxDiscountAmount,
        pc.ValidFrom,
        pc.ValidTo,
        pc.TotalUsageLimit,
        pc.PerUserUsageLimit,
        cond.SubscriptionId,
        cond.PeriodId,
        cond.MinAmount,
        ISNULL(usageStats.UserUsageCount, 0) AS UserUsageCount
    FROM [UserPromoCodes] upc
    INNER JOIN [PromoCodes] pc ON pc.Id = upc.PromoCodeId
    OUTER APPLY (
        SELECT TOP 1
            c.SubscriptionId,
            c.PeriodId,
            c.MinAmount
        FROM [PromoCodeConditions] c
        WHERE c.PromoCodeId = pc.Id
        ORDER BY c.Id
    ) cond
    OUTER APPLY (
        SELECT COUNT(1) AS UserUsageCount
        FROM [PromoCodeUsages] u
        WHERE u.PromoCodeId = pc.Id
          AND u.UserId = @UserId
    ) usageStats
    WHERE upc.UserId = @UserId
    ORDER BY upc.AssignedAt DESC;
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
    SELECT p.*, s.[Name] as SubscriptionName, ABS(sp.[FinalPrice]) AS FinalPrice, per.[Name] as PeriodName
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
    SELECT p.*, s.Id AS SubscriptionId, s.Name, ABS(sp.FinalPrice) AS Price, per.Name AS Period
    FROM Payments p
    INNER JOIN UserSubscriptions us ON p.UserSubscriptionId = us.Id INNER JOIN SubscriptionPrices sp ON us.SubscriptionPriceId = sp.Id INNER JOIN Subscriptions s ON sp.SubscriptionId = s.Id INNER JOIN Periods per ON sp.PeriodId = per.Id
    WHERE p.UserId = @UserId ORDER BY p.PaymentDate DESC OFFSET ((@PageNumber - 1) * @PageSize) ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO

CREATE OR ALTER PROCEDURE [sp_GetRecentPayments]
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    SELECT TOP 10 p.*, s.Id AS SubscriptionId, s.Name AS SubscriptionName, ABS(sp.FinalPrice) AS Price, per.Name AS PeriodName
    FROM Payments p INNER JOIN UserSubscriptions us ON p.UserSubscriptionId = us.Id INNER JOIN SubscriptionPrices sp ON us.SubscriptionPriceId = sp.Id INNER JOIN Subscriptions s ON sp.SubscriptionId = s.Id INNER JOIN Periods per ON sp.PeriodId = per.Id
    WHERE p.UserId = @UserId ORDER BY p.PaymentDate DESC;
END
GO

CREATE OR ALTER PROCEDURE [sp_GetUpcomingPayments]
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    SELECT us.NextBillingDate, s.Id AS SubscriptionId, s.Name AS SubscriptionName, ABS(sp.FinalPrice) AS Amount, per.Name AS PeriodName
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
    DECLARE @Now DATETIME2 = GETUTCDATE();

    SELECT @TotalSpent = ISNULL(SUM(Amount), 0) FROM [Payments] WHERE [UserId] = @UserId AND [Status] = 1;
    SELECT @ActiveCount = COUNT(*)
    FROM [UserSubscriptions]
    WHERE [UserId] = @UserId
      AND [IsActive] = 1
      AND [CancelledAt] IS NULL
      AND ([ValidUntil] IS NULL OR [ValidUntil] >= @Now);

    SELECT @TotalCount = COUNT(*)
    FROM [UserSubscriptions]
    WHERE [UserId] = @UserId
      AND [CancelledAt] IS NULL
      AND ([ValidUntil] IS NULL OR [ValidUntil] >= @Now);

    SELECT TOP 1 @NextBilling = [NextBillingDate]
    FROM [UserSubscriptions]
    WHERE [UserId] = @UserId
      AND [IsActive] = 1
      AND [CancelledAt] IS NULL
      AND ([ValidUntil] IS NULL OR [ValidUntil] >= @Now)
    ORDER BY [NextBillingDate];

    SELECT @TotalSpent AS TotalSpent, @ActiveCount AS ActiveSubscriptionsCount, @TotalCount AS TotalSubscriptionsCount, @NextBilling AS NextBillingDate;
END
GO

DROP PROCEDURE IF EXISTS [dbo].[sp_Report_UserActivityByPeriod];
GO
CREATE OR ALTER PROCEDURE [dbo].[sp_Report_UserActivityByPeriod]
    @StartDate DATETIME2, @EndDate DATETIME2
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH PaymentStats AS
    (
        SELECT
            p.UserId,
            COUNT(*) AS SuccessfulPaymentsCount,
            SUM(p.Amount) AS TotalSpent,
            MAX(p.PaymentDate) AS LastPaymentDate
        FROM Payments p
        WHERE p.Status = 1
          AND p.PaymentDate >= @StartDate
          AND p.PaymentDate < @EndDate
        GROUP BY p.UserId
    ),
    StartedStats AS
    (
        SELECT
            us.UserId,
            COUNT(*) AS SubscriptionsStartedCount,
            MAX(us.StartDate) AS LastStartDate
        FROM [SubscriptionsDb].[dbo].[UserSubscriptions] us
        WHERE us.StartDate >= @StartDate
          AND us.StartDate < @EndDate
        GROUP BY us.UserId
    ),
    CancelledStats AS
    (
        SELECT
            us.UserId,
            COUNT(*) AS SubscriptionsCancelledCount,
            MAX(us.CancelledAt) AS LastCancelledDate
        FROM [SubscriptionsDb].[dbo].[UserSubscriptions] us
        WHERE us.CancelledAt IS NOT NULL
          AND us.CancelledAt >= @StartDate
          AND us.CancelledAt < @EndDate
        GROUP BY us.UserId
    )
    SELECT
        u.Id AS UserId,
        u.Email,
        ISNULL(u.FirstName, '') AS FirstName,
        ISNULL(u.LastName, '') AS LastName,
        ISNULL(ps.SuccessfulPaymentsCount, 0) AS SuccessfulPaymentsCount,
        ISNULL(ps.TotalSpent, 0) AS TotalSpent,
        ISNULL(ss.SubscriptionsStartedCount, 0) AS SubscriptionsStartedCount,
        ISNULL(cs.SubscriptionsCancelledCount, 0) AS SubscriptionsCancelledCount,
        (
            SELECT MAX(v.ActivityDate)
            FROM (VALUES (ps.LastPaymentDate), (ss.LastStartDate), (cs.LastCancelledDate)) v(ActivityDate)
        ) AS LastActivityAt
    FROM AuthDb.dbo.Users u
    LEFT JOIN PaymentStats ps ON ps.UserId = u.Id
    LEFT JOIN StartedStats ss ON ss.UserId = u.Id
    LEFT JOIN CancelledStats cs ON cs.UserId = u.Id
    WHERE ISNULL(ps.SuccessfulPaymentsCount, 0) > 0
       OR ISNULL(ss.SubscriptionsStartedCount, 0) > 0
       OR ISNULL(cs.SubscriptionsCancelledCount, 0) > 0
    ORDER BY LastActivityAt DESC, u.Email ASC;
END
GO

DROP PROCEDURE IF EXISTS [dbo].[sp_Report_SubscriptionsByPeriod];
GO
CREATE OR ALTER PROCEDURE [dbo].[sp_Report_SubscriptionsByPeriod]
    @StartDate DATETIME2, @EndDate DATETIME2
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH NewSubscriptions AS
    (
        SELECT
            us.SubscriptionPriceId,
            COUNT(*) AS NewSubscriptionsCount
        FROM [SubscriptionsDb].[dbo].[UserSubscriptions] us
        WHERE us.StartDate >= @StartDate
          AND us.StartDate < @EndDate
        GROUP BY us.SubscriptionPriceId
    ),
    ActiveSubscribers AS
    (
        SELECT
            us.SubscriptionPriceId,
            COUNT(DISTINCT us.UserId) AS ActiveSubscribersCount
        FROM UserSubscriptions us
        WHERE us.IsActive = 1
          AND (us.CancelledAt IS NULL OR us.ValidUntil >= GETUTCDATE())
        GROUP BY us.SubscriptionPriceId
    ),
    PaymentStats AS
    (
        SELECT
            us.SubscriptionPriceId,
            COUNT(*) AS SuccessfulPaymentsCount,
            SUM(p.Amount) AS Revenue
        FROM [SubscriptionsDb].[dbo].[Payments] p
        INNER JOIN [SubscriptionsDb].[dbo].[UserSubscriptions] us ON us.Id = p.UserSubscriptionId
        WHERE p.Status = 1
          AND p.PaymentDate >= @StartDate
          AND p.PaymentDate < @EndDate
        GROUP BY us.SubscriptionPriceId
    )
    SELECT
        s.Id AS SubscriptionId,
        s.Name AS SubscriptionName,
        per.Id AS PeriodId,
        per.Name AS PeriodName,
        ISNULL(ns.NewSubscriptionsCount, 0) AS NewSubscriptionsCount,
        ISNULL(act.ActiveSubscribersCount, 0) AS ActiveSubscribersCount,
        ISNULL(pay.SuccessfulPaymentsCount, 0) AS SuccessfulPaymentsCount,
        ISNULL(pay.Revenue, 0) AS Revenue
    FROM [SubscriptionsDb].[dbo].[SubscriptionPrices] sp
    INNER JOIN [SubscriptionsDb].[dbo].[Subscriptions] s ON s.Id = sp.SubscriptionId
    INNER JOIN [SubscriptionsDb].[dbo].[Periods] per ON per.Id = sp.PeriodId
    LEFT JOIN NewSubscriptions ns ON ns.SubscriptionPriceId = sp.Id
    LEFT JOIN ActiveSubscribers act ON act.SubscriptionPriceId = sp.Id
    LEFT JOIN PaymentStats pay ON pay.SubscriptionPriceId = sp.Id
    ORDER BY s.Name ASC, per.MonthsCount ASC;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Report_UserSubscriptions]
    @Email NVARCHAR(256)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT us.Id AS UserSubscriptionId, us.UserId, s.Id AS SubscriptionId, s.Name AS SubscriptionName, s.Category, p.Name AS PeriodName, ABS(sp.FinalPrice) AS FinalPrice, us.StartDate, us.NextBillingDate, us.CancelledAt, us.ValidUntil, us.IsActive
    FROM UserSubscriptions us 
    INNER JOIN SubscriptionPrices sp ON us.SubscriptionPriceId = sp.Id 
    INNER JOIN Subscriptions s ON sp.SubscriptionId = s.Id 
    INNER JOIN Periods p ON sp.PeriodId = p.Id
    INNER JOIN AuthDb.dbo.Users u ON us.UserId = u.Id
    WHERE u.Email = @Email 
    ORDER BY us.StartDate DESC;
END
GO

CREATE OR ALTER PROCEDURE [sp_Report_AdminAnalyticsDashboard]
    @PeriodStart DATETIME2,
    @ExpiringWithinDays INT = 7
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Now DATETIME2 = SYSUTCDATETIME();
    DECLARE @ExpiringUntil DATETIME2 = DATEADD(DAY, @ExpiringWithinDays, @Now);

    SELECT COUNT(DISTINCT us.UserId) AS ActiveUsersCount
    FROM UserSubscriptions us
    WHERE (
            (us.IsActive = 1 AND us.CancelledAt IS NULL AND (us.ValidUntil IS NULL OR us.ValidUntil >= @Now))
            OR (us.FrozenUntil IS NOT NULL AND us.FrozenUntil > @Now AND us.CancelledAt IS NULL)
          );

    SELECT COUNT(*) AS NewSubscriptionsCount
    FROM UserSubscriptions us
    WHERE us.StartDate >= @PeriodStart;

    SELECT COUNT(*) AS CancelledSubscriptionsCount
    FROM UserSubscriptions us
    WHERE us.CancelledAt IS NOT NULL
      AND us.CancelledAt >= @PeriodStart;

    SELECT COUNT(DISTINCT p.UserSubscriptionId) AS PaidSubscriptionsCount
    FROM Payments p
    WHERE p.Status = 1
      AND p.PaymentDate >= @PeriodStart;

    SELECT COUNT(*) AS ExpiringSubscriptionsCount
    FROM UserSubscriptions us
    WHERE us.CancelledAt IS NULL
      AND us.NextBillingDate >= @Now
      AND us.NextBillingDate <= @ExpiringUntil;

    SELECT COUNT(*) AS SuccessfulPaymentsCount
    FROM Payments p
    WHERE p.Status = 1
      AND p.PaymentDate >= @PeriodStart;

    SELECT COUNT(*) AS FailedPaymentsCount
    FROM Payments p
    WHERE p.Status = 2
      AND p.PaymentDate >= @PeriodStart;

    SELECT s.Category, COUNT(*) AS SubscriptionsCount
    FROM UserSubscriptions us
    INNER JOIN SubscriptionPrices sp ON sp.Id = us.SubscriptionPriceId
    INNER JOIN Subscriptions s ON s.Id = sp.SubscriptionId
    WHERE (
            (us.IsActive = 1 AND us.CancelledAt IS NULL AND (us.ValidUntil IS NULL OR us.ValidUntil >= @Now))
            OR (us.FrozenUntil IS NOT NULL AND us.FrozenUntil > @Now AND us.CancelledAt IS NULL)
          )
    GROUP BY s.Category
    ORDER BY SubscriptionsCount DESC, s.Category ASC;
END
GO

CREATE OR ALTER PROCEDURE [sp_UserSubscriptions_Freeze]
    @UserId UNIQUEIDENTIFIER,
    @SubscriptionId UNIQUEIDENTIFIER,
    @Now DATETIME2
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @UserSubId UNIQUEIDENTIFIER;
    SELECT TOP 1 @UserSubId = us.Id
    FROM UserSubscriptions us
    INNER JOIN SubscriptionPrices sp ON us.SubscriptionPriceId = sp.Id
    WHERE us.UserId = @UserId AND sp.SubscriptionId = @SubscriptionId
        AND us.CancelledAt IS NULL
        AND us.IsActive = 1
        AND us.FrozenAt IS NULL;

    IF @UserSubId IS NULL RETURN 404;

    UPDATE UserSubscriptions
    SET FrozenAt = @Now,
        FrozenUntil = NULL,
        IsActive = 0,
        UpdatedAt = GETUTCDATE()
    WHERE Id = @UserSubId;

    SELECT FrozenAt, FrozenUntil, NextBillingDate, ValidUntil FROM UserSubscriptions WHERE Id = @UserSubId;
    RETURN 200;
END
GO

CREATE OR ALTER PROCEDURE [sp_UserSubscriptions_Resume]
    @UserId UNIQUEIDENTIFIER,
    @SubscriptionId UNIQUEIDENTIFIER,
    @Now DATETIME2
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @UserSubId UNIQUEIDENTIFIER, @FrozenAt DATETIME2;
    SELECT TOP 1 @UserSubId = us.Id
        ,@FrozenAt = us.FrozenAt
    FROM UserSubscriptions us
    INNER JOIN SubscriptionPrices sp ON us.SubscriptionPriceId = sp.Id
    WHERE us.UserId = @UserId AND sp.SubscriptionId = @SubscriptionId
        AND us.FrozenAt IS NOT NULL AND us.CancelledAt IS NULL;

    IF @UserSubId IS NULL RETURN 404;

    UPDATE UserSubscriptions
    SET IsActive = 1,
        NextBillingDate = DATEADD(
            SECOND,
            CASE WHEN DATEDIFF(SECOND, @FrozenAt, @Now) > 0 THEN DATEDIFF(SECOND, @FrozenAt, @Now) ELSE 0 END,
            NextBillingDate
        ),
        ValidUntil = CASE
            WHEN ValidUntil IS NULL THEN NULL
            ELSE DATEADD(
                SECOND,
                CASE WHEN DATEDIFF(SECOND, @FrozenAt, @Now) > 0 THEN DATEDIFF(SECOND, @FrozenAt, @Now) ELSE 0 END,
                ValidUntil
            )
        END,
        FrozenAt = NULL,
        FrozenUntil = NULL,
        UpdatedAt = GETUTCDATE()
    WHERE Id = @UserSubId;

    SELECT NextBillingDate, ValidUntil FROM UserSubscriptions WHERE Id = @UserSubId;
    RETURN 200;
END
GO

CREATE OR ALTER PROCEDURE [sp_UserSubscriptions_ProcessExpiredFreezes]
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE UserSubscriptions
    SET IsActive = 1,
        FrozenAt = NULL,
        FrozenUntil = NULL,
        UpdatedAt = GETUTCDATE()
    WHERE FrozenUntil IS NOT NULL
        AND FrozenUntil <= GETUTCDATE()
        AND CancelledAt IS NULL;

    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

CREATE OR ALTER PROCEDURE [sp_UserSubscriptions_RestoreCancelled]
    @UserId UNIQUEIDENTIFIER,
    @SubscriptionId UNIQUEIDENTIFIER,
    @Now DATETIME2
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @UserSubId UNIQUEIDENTIFIER;
    SELECT TOP 1 @UserSubId = us.Id
    FROM UserSubscriptions us
    INNER JOIN SubscriptionPrices sp ON us.SubscriptionPriceId = sp.Id
    WHERE us.UserId = @UserId AND sp.SubscriptionId = @SubscriptionId
        AND us.CancelledAt IS NOT NULL
        AND us.ValidUntil IS NOT NULL
        AND us.ValidUntil >= @Now
        AND us.FrozenAt IS NULL;

    IF @UserSubId IS NULL RETURN 404;

    UPDATE UserSubscriptions
    SET CancelledAt = NULL,
        ValidUntil = NULL,
        UpdatedAt = GETUTCDATE()
    WHERE Id = @UserSubId;

    RETURN 200;
END
GO

/* =========================================================================================
   ФОНОВЫЕ ЗАДАЧИ / УВЕДОМЛЕНИЯ / ПРОМОКОДЫ (INLINE SQL → PROCEDURES)
========================================================================================= */

CREATE OR ALTER PROCEDURE [sp_Jobs_GetPendingPaymentsTimedOut]
    @PendingStatus INT,
    @TimeoutMinutes INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.*
    FROM [Payments] p
    WHERE p.[Status] = @PendingStatus
      AND p.[PaymentDate] <= DATEADD(MINUTE, -@TimeoutMinutes, GETUTCDATE());
END
GO

CREATE OR ALTER PROCEDURE [sp_Jobs_GetSubscriptionExpiryReminders]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        us.[Id] AS [UserSubscriptionId],
        us.[UserId],
        s.[Name] AS [SubscriptionName],
        us.[NextBillingDate],
        ISNULL(NULLIF(u.[SubscriptionExpiryReminderDays], 0), 3) AS [ReminderDays]
    FROM [UserSubscriptions] us
    INNER JOIN [SubscriptionPrices] sp ON us.[SubscriptionPriceId] = sp.[Id]
    INNER JOIN [Subscriptions] s ON sp.[SubscriptionId] = s.[Id]
    INNER JOIN [AuthDb].[dbo].[Users] u ON u.[Id] = us.[UserId]
    WHERE us.[IsActive] = 1
      AND us.[CancelledAt] IS NULL
      AND us.[NextBillingDate] > GETUTCDATE()
      AND CAST(us.[NextBillingDate] AS DATE) = DATEADD(
            DAY,
            ISNULL(NULLIF(u.[SubscriptionExpiryReminderDays], 0), 3),
            CAST(GETUTCDATE() AS DATE)
        );
END
GO

CREATE OR ALTER PROCEDURE [sp_Notifications_CountSentTodayByUserTitleMessage]
    @UserId UNIQUEIDENTIFIER,
    @Title NVARCHAR(MAX),
    @Message NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT COUNT(1)
    FROM [Notifications]
    WHERE [UserId] = @UserId
      AND [Title] = @Title
      AND [Message] = @Message
      AND [CreatedAt] >= CAST(GETUTCDATE() AS DATE);
END
GO

CREATE OR ALTER PROCEDURE [sp_PromoCodes_GetAdminList]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT pc.[Id], pc.[Code], pc.[Title], pc.[Description], pc.[DiscountType], pc.[DiscountValue], pc.[MaxDiscountAmount],
           pc.[ValidFrom], pc.[ValidTo], pc.[TotalUsageLimit], pc.[PerUserUsageLimit],
           c.[SubscriptionId], c.[PeriodId], c.[MinAmount], 0 AS [UserUsageCount]
    FROM [PromoCodes] pc
    LEFT JOIN [PromoCodeConditions] c ON c.[PromoCodeId] = pc.[Id]
    ORDER BY pc.[CreatedAt] DESC;
END
GO

CREATE OR ALTER PROCEDURE [sp_PromoCodes_GetNotificationHeader]
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (1) [Id], [Code], [Title], [Description]
    FROM [PromoCodes]
    WHERE [Id] = @Id;
END
GO

CREATE OR ALTER PROCEDURE [sp_PromoCodes_GetNotificationConditions]
    @PromoCodeId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        c.[SubscriptionId],
        s.[Name] AS [SubscriptionName],
        c.[PeriodId],
        p.[Name] AS [PeriodName],
        c.[MinAmount]
    FROM [PromoCodeConditions] c
    LEFT JOIN [Subscriptions] s ON s.[Id] = c.[SubscriptionId]
    LEFT JOIN [Periods] p ON p.[Id] = c.[PeriodId]
    WHERE c.[PromoCodeId] = @PromoCodeId;
END
GO
