-- =============================================
-- Seed Data for Subscriptions
-- Categories: Streaming, Software, Gaming, Productivity, Entertainment, Other
-- Prices: Base monthly = 10, 20 or 50 (Quarter = x3, Year = x12)
-- =============================================

USE [SubscriptionsDb];
GO

-- =============================================
-- STREAMING (Base price: 10-20)
-- =============================================

-- Netflix (Base: 15 -> Quarter: 45 -> Year: 180, но Year = Base*12=180 не 159)
-- Using Base = 10 -> Quarter = 30 -> Year = 120
DECLARE @NetflixId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@NetflixId, N'Netflix', N'Стриминг фильмов и сериалов', N'## Netflix Premium
- Без рекланы
- 4K Ultra HD
- Смотрите на любом устройстве
- Офлайн-загрузка', 10, N'Streaming', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @NetflixId, [Id], 10 FROM [Periods] WHERE [Name] = N'Month';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @NetflixId, [Id], 30 FROM [Periods] WHERE [Name] = N'Quarter';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @NetflixId, [Id], 120 FROM [Periods] WHERE [Name] = N'Year';

-- YouTube Premium (Base: 10)
DECLARE @YouTubeId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@YouTubeId, N'YouTube Premium', N'YouTube без рекламы и с Premium контентом', N'## YouTube Premium
- Без рекламы
- Фоновый просмотр
- Офлайн-загрузка
- YouTube Music Premium', 10, N'Streaming', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @YouTubeId, [Id], 10 FROM [Periods] WHERE [Name] = N'Month';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @YouTubeId, [Id], 30 FROM [Periods] WHERE [Name] = N'Quarter';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @YouTubeId, [Id], 120 FROM [Periods] WHERE [Name] = N'Year';

-- Twitch Prime (Base: 10)
DECLARE @TwitchId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@TwitchId, N'Twitch Prime', N'Подписка на Twitch с бонусами', N'## Twitch Prime
- Бесплатные игры каждый месяц
- Эксклюзивный инвентарь
- Без рекламы
- Ранний доступ к предзаказам', 10, N'Streaming', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @TwitchId, [Id], 10 FROM [Periods] WHERE [Name] = N'Month';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @TwitchId, [Id], 30 FROM [Periods] WHERE [Name] = N'Quarter';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @TwitchId, [Id], 120 FROM [Periods] WHERE [Name] = N'Year';

-- Apple TV+ (Base: 10)
DECLARE @AppleTVId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@AppleTVId, N'Apple TV+', N'Оригинальные шоу от Apple', N'## Apple TV+
- Эксклюзивные оригиналы
- 4K HDR качество
- Семейный доступ
- Офлайн-просмотр', 10, N'Streaming', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @AppleTVId, [Id], 10 FROM [Periods] WHERE [Name] = N'Month';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @AppleTVId, [Id], 30 FROM [Periods] WHERE [Name] = N'Quarter';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @AppleTVId, [Id], 120 FROM [Periods] WHERE [Name] = N'Year';

-- Disney+ (Base: 10)
DECLARE @DisneyId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@DisneyId, N'Disney+', N'Disney, Pixar, Marvel, Star Wars', N'## Disney+
- Полный каталог Disney
- Эксклюзивные оригиналы
- 4K HDR
- Семейный доступ', 10, N'Streaming', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @DisneyId, [Id], 10 FROM [Periods] WHERE [Name] = N'Month';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @DisneyId, [Id], 30 FROM [Periods] WHERE [Name] = N'Quarter';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @DisneyId, [Id], 120 FROM [Periods] WHERE [Name] = N'Year';

-- =============================================
-- SOFTWARE (Base price: 10-20)
-- =============================================

-- Microsoft 365 (Base: 10)
DECLARE @MicrosoftId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@MicrosoftId, N'Microsoft 365', N'Word, Excel, PowerPoint и облако', N'## Microsoft 365
- Word, Excel, PowerPoint
- 1 ТБ OneDrive
- Outlook
- Microsoft Teams', 10, N'Software', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @MicrosoftId, [Id], 10 FROM [Periods] WHERE [Name] = N'Month';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @MicrosoftId, [Id], 30 FROM [Periods] WHERE [Name] = N'Quarter';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @MicrosoftId, [Id], 120 FROM [Periods] WHERE [Name] = N'Year';

-- Adobe Creative Cloud (Base: 50)
DECLARE @AdobeId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@AdobeId, N'Adobe Creative Cloud', N'Все приложения Adobe', N'## Adobe Creative Cloud
- Photoshop
- Illustrator
- Premiere Pro
- 100 ГБ облака', 50, N'Software', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @AdobeId, [Id], 50 FROM [Periods] WHERE [Name] = N'Month';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @AdobeId, [Id], 150 FROM [Periods] WHERE [Name] = N'Quarter';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @AdobeId, [Id], 600 FROM [Periods] WHERE [Name] = N'Year';

-- Google One (Base: 10)
DECLARE @GoogleOneId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@GoogleOneId, N'Google One', N'Облако Google и дополнительные функции', N'## Google One
- Расширенное хранилище
- Доступ к экспертам Google
- Кэшбэк в Google Play
- Семейный доступ', 10, N'Software', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @GoogleOneId, [Id], 10 FROM [Periods] WHERE [Name] = N'Month';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @GoogleOneId, [Id], 30 FROM [Periods] WHERE [Name] = N'Quarter';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @GoogleOneId, [Id], 120 FROM [Periods] WHERE [Name] = N'Year';

-- Dropbox (Base: 10)
DECLARE @DropboxId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@DropboxId, N'Dropbox Plus', N'Облачное хранилище 2 ТБ', N'## Dropbox Plus
- 2 ТБ хранилища
- Смарт-синхронизация
- Восстановление файлов
- Шифрование', 10, N'Software', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @DropboxId, [Id], 10 FROM [Periods] WHERE [Name] = N'Month';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @DropboxId, [Id], 30 FROM [Periods] WHERE [Name] = N'Quarter';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @DropboxId, [Id], 120 FROM [Periods] WHERE [Name] = N'Year';

-- NordVPN (Base: 10)
DECLARE @NordVPNId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@NordVPNId, N'NordVPN Premium', N'Защита и приватность', N'## NordVPN Premium
- 5000+ серверов
- 6 устройств
- Kill Switch
- Double VPN', 10, N'Software', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @NordVPNId, [Id], 10 FROM [Periods] WHERE [Name] = N'Month';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @NordVPNId, [Id], 30 FROM [Periods] WHERE [Name] = N'Quarter';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @NordVPNId, [Id], 120 FROM [Periods] WHERE [Name] = N'Year';

-- ChatGPT Plus (Base: 20)
DECLARE @ChatGPTId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@ChatGPTId, N'ChatGPT Plus', N'Доступ к GPT-4 и DALL-E', N'## ChatGPT Plus
- GPT-4 доступ
- DALL-E генерация
- Быстрые ответы
- Плагины', 20, N'Software', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @ChatGPTId, [Id], 20 FROM [Periods] WHERE [Name] = N'Month';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @ChatGPTId, [Id], 60 FROM [Periods] WHERE [Name] = N'Quarter';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @ChatGPTId, [Id], 240 FROM [Periods] WHERE [Name] = N'Year';

-- iCloud+ (Base: 10)
DECLARE @iCloudId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@iCloudId, N'iCloud+ 200GB', N'Облако Apple', N'## iCloud+ 200GB
- 200 ГБ хранилища
- Family Sharing
- iCloud Private Relay
- HomeKit Secure Video', 10, N'Software', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @iCloudId, [Id], 10 FROM [Periods] WHERE [Name] = N'Month';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @iCloudId, [Id], 30 FROM [Periods] WHERE [Name] = N'Quarter';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @iCloudId, [Id], 120 FROM [Periods] WHERE [Name] = N'Year';

-- =============================================
-- GAMING (Base price: 10-20)
-- =============================================

-- Xbox Game Pass (Base: 20)
DECLARE @XboxId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@XboxId, N'Xbox Game Pass Ultimate', N'Игры Xbox и PC', N'## Xbox Game Pass Ultimate
- Сотни игр
- EA Play включено
- Облачные игры
- Скидки', 20, N'Gaming', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @XboxId, [Id], 20 FROM [Periods] WHERE [Name] = N'Month';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @XboxId, [Id], 60 FROM [Periods] WHERE [Name] = N'Quarter';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @XboxId, [Id], 240 FROM [Periods] WHERE [Name] = N'Year';

-- PlayStation Plus (Base: 10)
DECLARE @PlayStationId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@PlayStationId, N'PlayStation Plus Extra', N'Игры PS4 и PS5', N'## PlayStation Plus Extra
- Каталог из 400+ игр
- Ежемесячные игры
- Облачные сохранения
- Эксклюзивные скидки', 10, N'Gaming', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @PlayStationId, [Id], 10 FROM [Periods] WHERE [Name] = N'Month';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @PlayStationId, [Id], 30 FROM [Periods] WHERE [Name] = N'Quarter';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @PlayStationId, [Id], 120 FROM [Periods] WHERE [Name] = N'Year';

-- Nintendo Switch Online (Base: 10)
DECLARE @NintendoId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@NintendoId, N'Nintendo Switch Online', N'Онлайн-игры и эксклюзивы', N'## Nintendo Switch Online
- Онлайн-мультиплеер
- NES/SNES/N64 игры
- Облачные сохранения
- Эксклюзивные предложения', 10, N'Gaming', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @NintendoId, [Id], 10 FROM [Periods] WHERE [Name] = N'Month';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @NintendoId, [Id], 30 FROM [Periods] WHERE [Name] = N'Quarter';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @NintendoId, [Id], 120 FROM [Periods] WHERE [Name] = N'Year';

-- EA Play (Base: 10)
DECLARE @EAPlayId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@EAPlayId, N'EA Play', N'Игры EA с подпиской', N'## EA Play
- Доступ к каталогу игр
- Испытания на 10 часов
- Скидки 10%
- Ранний доступ', 10, N'Gaming', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @EAPlayId, [Id], 10 FROM [Periods] WHERE [Name] = N'Month';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @EAPlayId, [Id], 30 FROM [Periods] WHERE [Name] = N'Quarter';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @EAPlayId, [Id], 120 FROM [Periods] WHERE [Name] = N'Year';

-- =============================================
-- PRODUCTIVITY (Base price: 10)
-- =============================================

-- Notion (Base: 10)
DECLARE @NotionId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@NotionId, N'Notion Plus', N'Все в одном workspace', N'## Notion Plus
- Неограниченные файлы
- История 90 дней
- Приоритетная поддержка
- Без рекламы', 10, N'Productivity', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @NotionId, [Id], 10 FROM [Periods] WHERE [Name] = N'Month';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @NotionId, [Id], 30 FROM [Periods] WHERE [Name] = N'Quarter';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @NotionId, [Id], 120 FROM [Periods] WHERE [Name] = N'Year';

-- Figma (Base: 20)
DECLARE @FigmaId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@FigmaId, N'Figma Professional', N'Дизайн и прототипирование', N'## Figma Professional
- Неограниченные проекты
- Векторная сетка
- Компоненты
- Прототипы', 20, N'Productivity', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @FigmaId, [Id], 20 FROM [Periods] WHERE [Name] = N'Month';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @FigmaId, [Id], 60 FROM [Periods] WHERE [Name] = N'Quarter';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @FigmaId, [Id], 240 FROM [Periods] WHERE [Name] = N'Year';

-- Canva Pro (Base: 10)
DECLARE @CanvaId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@CanvaId, N'Canva Pro', N'Дизайн для всех', N'## Canva Pro
- 100+ млн шаблонов
- Brand Kit
- Resize в один клик
- Офлайн-доступ', 10, N'Productivity', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @CanvaId, [Id], 10 FROM [Periods] WHERE [Name] = N'Month';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @CanvaId, [Id], 30 FROM [Periods] WHERE [Name] = N'Quarter';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @CanvaId, [Id], 120 FROM [Periods] WHERE [Name] = N'Year';

-- Coursera (Base: 50)
DECLARE @CourseraId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@CourseraId, N'Coursera Plus', N'Онлайн-курсы от топовых университетов', N'## Coursera Plus
- 7000+ курсов
- Сертификаты
- Проекты
- Степени', 50, N'Productivity', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @CourseraId, [Id], 50 FROM [Periods] WHERE [Name] = N'Month';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @CourseraId, [Id], 150 FROM [Periods] WHERE [Name] = N'Quarter';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @CourseraId, [Id], 600 FROM [Periods] WHERE [Name] = N'Year';

-- Udemy Business (Base: 50)
DECLARE @UdemyId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@UdemyId, N'Udemy Business', N'Курсы для бизнеса', N'## Udemy Business
- 25000+ курсов
- Обучение команд
- Аналитика
- Без рекламы', 50, N'Productivity', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @UdemyId, [Id], 50 FROM [Periods] WHERE [Name] = N'Month';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @UdemyId, [Id], 150 FROM [Periods] WHERE [Name] = N'Quarter';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @UdemyId, [Id], 600 FROM [Periods] WHERE [Name] = N'Year';

-- Slack Pro (Base: 10)
DECLARE @SlackId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@SlackId, N'Slack Pro', N'Командная коммуникация', N'## Slack Pro
- Неограниченные сообщения
- 10 ГБ файлов
- Интеграции
- Приоритетная поддержка', 10, N'Productivity', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @SlackId, [Id], 10 FROM [Periods] WHERE [Name] = N'Month';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @SlackId, [Id], 30 FROM [Periods] WHERE [Name] = N'Quarter';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @SlackId, [Id], 120 FROM [Periods] WHERE [Name] = N'Year';

-- =============================================
-- ENTERTAINMENT (Base price: 10)
-- =============================================

-- Spotify Premium (Base: 10)
DECLARE @SpotifyId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@SpotifyId, N'Spotify Premium', N'Музыка без рекламы в высоком качестве', N'## Spotify Premium
- Без рекламы
- Высокое качество звука
- Офлайн-прослушивание
- Неограниченные пропуски', 10, N'Entertainment', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @SpotifyId, [Id], 10 FROM [Periods] WHERE [Name] = N'Month';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @SpotifyId, [Id], 30 FROM [Periods] WHERE [Name] = N'Quarter';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @SpotifyId, [Id], 120 FROM [Periods] WHERE [Name] = N'Year';

-- VK Combo (Base: 10)
DECLARE @VKId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@VKId, N'VK Combo', N'Музыка, облако и без рекламы ВКонтакте', N'## VK Combo
- VK Музыка без рекламы
- Облако 50 ГБ
- Без рекламы в VK
- Скидки в VK Маркете', 10, N'Entertainment', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @VKId, [Id], 10 FROM [Periods] WHERE [Name] = N'Month';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @VKId, [Id], 30 FROM [Periods] WHERE [Name] = N'Quarter';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @VKId, [Id], 120 FROM [Periods] WHERE [Name] = N'Year';

-- Discord Nitro (Base: 10)
DECLARE @DiscordId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@DiscordId, N'Discord Nitro', N'Улучшенный Discord с бонусами', N'## Discord Nitro
- Качествомо стриминг в 4K
- Большие файлы до 500 МБ
- Пользовательские эмодзи
- Профили и анимации', 10, N'Entertainment', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @DiscordId, [Id], 10 FROM [Periods] WHERE [Name] = N'Month';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @DiscordId, [Id], 30 FROM [Periods] WHERE [Name] = N'Quarter';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @DiscordId, [Id], 120 FROM [Periods] WHERE [Name] = N'Year';

-- Strava (Base: 10)
DECLARE @StravaId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@StravaId, N'Strava Summit', N'Трекинг активности и тренировок', N'## Strava Summit
- Детальная аналитика
- Маршруты
- Сегменты
- Без рекламы', 10, N'Entertainment', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @StravaId, [Id], 10 FROM [Periods] WHERE [Name] = N'Month';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @StravaId, [Id], 30 FROM [Periods] WHERE [Name] = N'Quarter';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @StravaId, [Id], 120 FROM [Periods] WHERE [Name] = N'Year';

-- Headspace (Base: 10)
DECLARE @HeadspaceId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@HeadspaceId, N'Headspace', N'Медитация и mindfulness', N'## Headspace
- Медитации
- Сон
- Фокус
- Оригинальные шоу', 10, N'Entertainment', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @HeadspaceId, [Id], 10 FROM [Periods] WHERE [Name] = N'Month';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @HeadspaceId, [Id], 30 FROM [Periods] WHERE [Name] = N'Quarter';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @HeadspaceId, [Id], 120 FROM [Periods] WHERE [Name] = N'Year';

-- Peloton (Base: 10)
DECLARE @PelotonId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@PelotonId, N'Peloton App', N'Фитнес дома', N'## Peloton App
- Тренировки
- Йога
- Медитации
- Лидерборды', 10, N'Entertainment', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @PelotonId, [Id], 10 FROM [Periods] WHERE [Name] = N'Month';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @PelotonId, [Id], 30 FROM [Periods] WHERE [Name] = N'Quarter';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @PelotonId, [Id], 120 FROM [Periods] WHERE [Name] = N'Year';

-- =============================================
-- OTHER (Base price: 10)
-- =============================================

-- Amazon Prime (Base: 10)
DECLARE @AmazonId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@AmazonId, N'Amazon Prime', N'Доставка и стриминг', N'## Amazon Prime
- Бесплатная доставка
- Prime Video
- Prime Music
- Ранний доступ к акциям', 10, N'Other', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @AmazonId, [Id], 10 FROM [Periods] WHERE [Name] = N'Month';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @AmazonId, [Id], 30 FROM [Periods] WHERE [Name] = N'Quarter';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @AmazonId, [Id], 120 FROM [Periods] WHERE [Name] = N'Year';

-- LinkedIn Premium (Base: 20)
DECLARE @LinkedInId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@LinkedInId, N'LinkedIn Premium', N'Профессиональная сеть', N'## LinkedIn Premium
- Кто просмотрел профиль
- InMail сообщения
- Обучение
- Продвижение', 20, N'Other', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @LinkedInId, [Id], 20 FROM [Periods] WHERE [Name] = N'Month';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @LinkedInId, [Id], 60 FROM [Periods] WHERE [Name] = N'Quarter';
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @LinkedInId, [Id], 240 FROM [Periods] WHERE [Name] = N'Year';

-- Show result
PRINT 'Successfully seeded subscriptions!';
SELECT COUNT(*) AS TotalSubscriptions FROM Subscriptions;
SELECT [Category], COUNT(*) AS Count FROM Subscriptions GROUP BY [Category];
GO
