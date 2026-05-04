-- =============================================
-- Заполнение каталога подписок (русские категории, описания и названия периодов)
-- Категории: Стриминг, Программы, Игры, Продуктивность, Развлечения, Другое
-- Базовая цена (месяц): 10, 20 или 50 (квартал = ×3, год = ×12)
-- =============================================

USE [SubscriptionsDb];
GO

-- Названия периодов в справочнике — на русском (по MonthsCount, без зависимости от старых строк)
UPDATE [dbo].[Periods] SET [Name] = N'Месяц' WHERE [MonthsCount] = 1;
UPDATE [dbo].[Periods] SET [Name] = N'Квартал' WHERE [MonthsCount] = 3;
UPDATE [dbo].[Periods] SET [Name] = N'Год' WHERE [MonthsCount] = 12;
GO

-- =============================================
-- СТРИМИНГ (базовая цена: 10–20)
-- =============================================

-- Netflix (Base: 15 -> Quarter: 45 -> Year: 180, но Year = Base*12=180 не 159)
-- Using Base = 10 -> Quarter = 30 -> Year = 120
DECLARE @NetflixId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@NetflixId, N'Netflix', N'Стриминг фильмов и сериалов', N'## Netflix Премиум
- Без рекламы
- 4K Ultra HD
- Смотрите на любом устройстве
- Офлайн-загрузка', 10, N'Стриминг', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @NetflixId, [Id], 10 FROM [Periods] WHERE [MonthsCount] = 1;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @NetflixId, [Id], 30 FROM [Periods] WHERE [MonthsCount] = 3;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @NetflixId, [Id], 120 FROM [Periods] WHERE [MonthsCount] = 12;

-- YouTube Premium (Base: 10)
DECLARE @YouTubeId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@YouTubeId, N'YouTube Premium', N'YouTube без рекламы и с подпиской Premium', N'## YouTube Premium
- Без рекламы
- Фоновый просмотр
- Офлайн-загрузка
- YouTube Music в подписке', 10, N'Стриминг', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @YouTubeId, [Id], 10 FROM [Periods] WHERE [MonthsCount] = 1;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @YouTubeId, [Id], 30 FROM [Periods] WHERE [MonthsCount] = 3;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @YouTubeId, [Id], 120 FROM [Periods] WHERE [MonthsCount] = 12;

-- Twitch Prime (Base: 10)
DECLARE @TwitchId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@TwitchId, N'Twitch Prime', N'Подписка на Twitch с бонусами', N'## Twitch Prime
- Бесплатные игры каждый месяц
- Эксклюзивный инвентарь
- Без рекламы
- Ранний доступ к предзаказам', 10, N'Стриминг', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @TwitchId, [Id], 10 FROM [Periods] WHERE [MonthsCount] = 1;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @TwitchId, [Id], 30 FROM [Periods] WHERE [MonthsCount] = 3;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @TwitchId, [Id], 120 FROM [Periods] WHERE [MonthsCount] = 12;

-- Apple TV+ (Base: 10)
DECLARE @AppleTVId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@AppleTVId, N'Apple TV+', N'Оригинальные шоу от Apple', N'## Apple TV+
- Эксклюзивные оригиналы
- 4K HDR качество
- Семейный доступ
- Офлайн-просмотр', 10, N'Стриминг', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @AppleTVId, [Id], 10 FROM [Periods] WHERE [MonthsCount] = 1;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @AppleTVId, [Id], 30 FROM [Periods] WHERE [MonthsCount] = 3;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @AppleTVId, [Id], 120 FROM [Periods] WHERE [MonthsCount] = 12;

-- Disney+ (Base: 10)
DECLARE @DisneyId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@DisneyId, N'Disney+', N'Disney, Pixar, Marvel, Star Wars', N'## Disney+
- Полный каталог Disney
- Эксклюзивные оригиналы
- 4K HDR
- Семейный доступ', 10, N'Стриминг', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @DisneyId, [Id], 10 FROM [Periods] WHERE [MonthsCount] = 1;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @DisneyId, [Id], 30 FROM [Periods] WHERE [MonthsCount] = 3;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @DisneyId, [Id], 120 FROM [Periods] WHERE [MonthsCount] = 12;

-- =============================================
-- ПРОГРАММЫ (базовая цена: 10–20)
-- =============================================

-- Microsoft 365 (Base: 10)
DECLARE @MicrosoftId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@MicrosoftId, N'Microsoft 365', N'Word, Excel, PowerPoint и облако', N'## Microsoft 365
- Word, Excel, PowerPoint
- 1 ТБ OneDrive
- Outlook
- Microsoft Teams', 10, N'Программы', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @MicrosoftId, [Id], 10 FROM [Periods] WHERE [MonthsCount] = 1;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @MicrosoftId, [Id], 30 FROM [Periods] WHERE [MonthsCount] = 3;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @MicrosoftId, [Id], 120 FROM [Periods] WHERE [MonthsCount] = 12;

-- Adobe Creative Cloud (Base: 50)
DECLARE @AdobeId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@AdobeId, N'Adobe Creative Cloud', N'Все приложения Adobe', N'## Adobe Creative Cloud
- Photoshop
- Illustrator
- Premiere Pro
- 100 ГБ облака', 50, N'Программы', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @AdobeId, [Id], 50 FROM [Periods] WHERE [MonthsCount] = 1;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @AdobeId, [Id], 150 FROM [Periods] WHERE [MonthsCount] = 3;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @AdobeId, [Id], 600 FROM [Periods] WHERE [MonthsCount] = 12;

-- Google One (Base: 10)
DECLARE @GoogleOneId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@GoogleOneId, N'Google One', N'Облако Google и дополнительные функции', N'## Google One
- Расширенное хранилище
- Доступ к экспертам Google
- Кэшбэк в Google Play
- Семейный доступ', 10, N'Программы', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @GoogleOneId, [Id], 10 FROM [Periods] WHERE [MonthsCount] = 1;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @GoogleOneId, [Id], 30 FROM [Periods] WHERE [MonthsCount] = 3;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @GoogleOneId, [Id], 120 FROM [Periods] WHERE [MonthsCount] = 12;

-- Dropbox (Base: 10)
DECLARE @DropboxId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@DropboxId, N'Dropbox Plus', N'Облачное хранилище 2 ТБ', N'## Dropbox Plus
- 2 ТБ хранилища
- Смарт-синхронизация
- Восстановление файлов
- Шифрование', 10, N'Программы', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @DropboxId, [Id], 10 FROM [Periods] WHERE [MonthsCount] = 1;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @DropboxId, [Id], 30 FROM [Periods] WHERE [MonthsCount] = 3;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @DropboxId, [Id], 120 FROM [Periods] WHERE [MonthsCount] = 12;

-- NordVPN (Base: 10)
DECLARE @NordVPNId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@NordVPNId, N'NordVPN Premium', N'Защита и приватность', N'## NordVPN Premium
- 5000+ серверов
- 6 устройств
- Kill Switch
- Double VPN', 10, N'Программы', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @NordVPNId, [Id], 10 FROM [Periods] WHERE [MonthsCount] = 1;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @NordVPNId, [Id], 30 FROM [Periods] WHERE [MonthsCount] = 3;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @NordVPNId, [Id], 120 FROM [Periods] WHERE [MonthsCount] = 12;

-- ChatGPT Plus (Base: 20)
DECLARE @ChatGPTId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@ChatGPTId, N'ChatGPT Plus', N'Доступ к GPT-4 и генерации изображений', N'## ChatGPT Plus
- Доступ к GPT-4
- Генерация изображений
- Приоритетные ответы
- Расширения и плагины', 20, N'Программы', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @ChatGPTId, [Id], 20 FROM [Periods] WHERE [MonthsCount] = 1;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @ChatGPTId, [Id], 60 FROM [Periods] WHERE [MonthsCount] = 3;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @ChatGPTId, [Id], 240 FROM [Periods] WHERE [MonthsCount] = 12;

-- iCloud+ (Base: 10)
DECLARE @iCloudId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@iCloudId, N'iCloud+ 200 ГБ', N'Облако Apple', N'## iCloud+ 200 ГБ
- 200 ГБ хранилища
- Семейный доступ
- Частный узел iCloud
- Безопасное видео HomeKit', 10, N'Программы', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @iCloudId, [Id], 10 FROM [Periods] WHERE [MonthsCount] = 1;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @iCloudId, [Id], 30 FROM [Periods] WHERE [MonthsCount] = 3;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @iCloudId, [Id], 120 FROM [Periods] WHERE [MonthsCount] = 12;

-- =============================================
-- ИГРЫ (базовая цена: 10–20)
-- =============================================

-- Xbox Game Pass (Base: 20)
DECLARE @XboxId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@XboxId, N'Xbox Game Pass Ultimate', N'Игры Xbox и PC', N'## Xbox Game Pass Ultimate
- Сотни игр
- EA Play включено
- Облачные игры
- Скидки', 20, N'Игры', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @XboxId, [Id], 20 FROM [Periods] WHERE [MonthsCount] = 1;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @XboxId, [Id], 60 FROM [Periods] WHERE [MonthsCount] = 3;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @XboxId, [Id], 240 FROM [Periods] WHERE [MonthsCount] = 12;

-- PlayStation Plus (Base: 10)
DECLARE @PlayStationId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@PlayStationId, N'PlayStation Plus Extra', N'Игры PS4 и PS5', N'## PlayStation Plus Extra
- Каталог из 400+ игр
- Ежемесячные игры
- Облачные сохранения
- Эксклюзивные скидки', 10, N'Игры', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @PlayStationId, [Id], 10 FROM [Periods] WHERE [MonthsCount] = 1;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @PlayStationId, [Id], 30 FROM [Periods] WHERE [MonthsCount] = 3;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @PlayStationId, [Id], 120 FROM [Periods] WHERE [MonthsCount] = 12;

-- Nintendo Switch Online (Base: 10)
DECLARE @NintendoId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@NintendoId, N'Nintendo Switch Online', N'Онлайн-игры и эксклюзивы', N'## Nintendo Switch Online
- Онлайн-мультиплеер
- NES/SNES/N64 игры
- Облачные сохранения
- Эксклюзивные предложения', 10, N'Игры', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @NintendoId, [Id], 10 FROM [Periods] WHERE [MonthsCount] = 1;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @NintendoId, [Id], 30 FROM [Periods] WHERE [MonthsCount] = 3;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @NintendoId, [Id], 120 FROM [Periods] WHERE [MonthsCount] = 12;

-- EA Play (Base: 10)
DECLARE @EAPlayId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@EAPlayId, N'EA Play', N'Игры EA с подпиской', N'## EA Play
- Доступ к каталогу игр
- Испытания на 10 часов
- Скидки 10%
- Ранний доступ', 10, N'Игры', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @EAPlayId, [Id], 10 FROM [Periods] WHERE [MonthsCount] = 1;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @EAPlayId, [Id], 30 FROM [Periods] WHERE [MonthsCount] = 3;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @EAPlayId, [Id], 120 FROM [Periods] WHERE [MonthsCount] = 12;

-- =============================================
-- ПРОДУКТИВНОСТЬ (базовая цена: 10)
-- =============================================

-- Notion (Base: 10)
DECLARE @NotionId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@NotionId, N'Notion Plus', N'Всё в одном рабочем пространстве', N'## Notion Plus
- Неограниченные файлы
- История 90 дней
- Приоритетная поддержка
- Без рекламы', 10, N'Продуктивность', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @NotionId, [Id], 10 FROM [Periods] WHERE [MonthsCount] = 1;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @NotionId, [Id], 30 FROM [Periods] WHERE [MonthsCount] = 3;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @NotionId, [Id], 120 FROM [Periods] WHERE [MonthsCount] = 12;

-- Figma (Base: 20)
DECLARE @FigmaId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@FigmaId, N'Figma Professional', N'Дизайн и прототипирование', N'## Figma Professional
- Неограниченные проекты
- Векторная сетка
- Компоненты
- Прототипы', 20, N'Продуктивность', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @FigmaId, [Id], 20 FROM [Periods] WHERE [MonthsCount] = 1;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @FigmaId, [Id], 60 FROM [Periods] WHERE [MonthsCount] = 3;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @FigmaId, [Id], 240 FROM [Periods] WHERE [MonthsCount] = 12;

-- Canva Pro (Base: 10)
DECLARE @CanvaId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@CanvaId, N'Canva Pro', N'Дизайн для всех', N'## Canva Pro
- 100+ млн шаблонов
- Brand Kit
- Resize в один клик
- Офлайн-доступ', 10, N'Продуктивность', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @CanvaId, [Id], 10 FROM [Periods] WHERE [MonthsCount] = 1;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @CanvaId, [Id], 30 FROM [Periods] WHERE [MonthsCount] = 3;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @CanvaId, [Id], 120 FROM [Periods] WHERE [MonthsCount] = 12;

-- Coursera (Base: 50)
DECLARE @CourseraId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@CourseraId, N'Coursera Plus', N'Онлайн-курсы от топовых университетов', N'## Coursera Plus
- 7000+ курсов
- Сертификаты
- Проекты
- Степени', 50, N'Продуктивность', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @CourseraId, [Id], 50 FROM [Periods] WHERE [MonthsCount] = 1;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @CourseraId, [Id], 150 FROM [Periods] WHERE [MonthsCount] = 3;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @CourseraId, [Id], 600 FROM [Periods] WHERE [MonthsCount] = 12;

-- Udemy Business (Base: 50)
DECLARE @UdemyId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@UdemyId, N'Udemy Business', N'Курсы для бизнеса', N'## Udemy Business
- 25000+ курсов
- Обучение команд
- Аналитика
- Без рекламы', 50, N'Продуктивность', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @UdemyId, [Id], 50 FROM [Periods] WHERE [MonthsCount] = 1;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @UdemyId, [Id], 150 FROM [Periods] WHERE [MonthsCount] = 3;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @UdemyId, [Id], 600 FROM [Periods] WHERE [MonthsCount] = 12;

-- Slack Pro (Base: 10)
DECLARE @SlackId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@SlackId, N'Slack Pro', N'Командная коммуникация', N'## Slack Pro
- Неограниченные сообщения
- 10 ГБ файлов
- Интеграции
- Приоритетная поддержка', 10, N'Продуктивность', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @SlackId, [Id], 10 FROM [Periods] WHERE [MonthsCount] = 1;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @SlackId, [Id], 30 FROM [Periods] WHERE [MonthsCount] = 3;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @SlackId, [Id], 120 FROM [Periods] WHERE [MonthsCount] = 12;

-- =============================================
-- РАЗВЛЕЧЕНИЯ (базовая цена: 10)
-- =============================================

-- Spotify Premium (Base: 10)
DECLARE @SpotifyId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@SpotifyId, N'Spotify Premium', N'Музыка без рекламы в высоком качестве', N'## Spotify Premium
- Без рекламы
- Высокое качество звука
- Офлайн-прослушивание
- Неограниченные пропуски', 10, N'Развлечения', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @SpotifyId, [Id], 10 FROM [Periods] WHERE [MonthsCount] = 1;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @SpotifyId, [Id], 30 FROM [Periods] WHERE [MonthsCount] = 3;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @SpotifyId, [Id], 120 FROM [Periods] WHERE [MonthsCount] = 12;

-- VK Combo (Base: 10)
DECLARE @VKId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@VKId, N'VK Combo', N'Музыка, облако и без рекламы ВКонтакте', N'## VK Combo
- VK Музыка без рекламы
- Облако 50 ГБ
- Без рекламы в VK
- Скидки в VK Маркете', 10, N'Развлечения', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @VKId, [Id], 10 FROM [Periods] WHERE [MonthsCount] = 1;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @VKId, [Id], 30 FROM [Periods] WHERE [MonthsCount] = 3;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @VKId, [Id], 120 FROM [Periods] WHERE [MonthsCount] = 12;

-- Discord Nitro (Base: 10)
DECLARE @DiscordId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@DiscordId, N'Discord Nitro', N'Улучшенный Discord с бонусами', N'## Discord Nitro
- Качественный стриминг в 4K
- Большие файлы до 500 МБ
- Пользовательские эмодзи
- Профили и анимации', 10, N'Развлечения', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @DiscordId, [Id], 10 FROM [Periods] WHERE [MonthsCount] = 1;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @DiscordId, [Id], 30 FROM [Periods] WHERE [MonthsCount] = 3;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @DiscordId, [Id], 120 FROM [Periods] WHERE [MonthsCount] = 12;

-- Strava (Base: 10)
DECLARE @StravaId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@StravaId, N'Strava Summit', N'Трекинг активности и тренировок', N'## Strava Summit
- Детальная аналитика
- Маршруты
- Сегменты
- Без рекламы', 10, N'Развлечения', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @StravaId, [Id], 10 FROM [Periods] WHERE [MonthsCount] = 1;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @StravaId, [Id], 30 FROM [Periods] WHERE [MonthsCount] = 3;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @StravaId, [Id], 120 FROM [Periods] WHERE [MonthsCount] = 12;

-- Headspace (Base: 10)
DECLARE @HeadspaceId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@HeadspaceId, N'Headspace', N'Медитация и практики осознанности', N'## Headspace
- Медитации
- Сон
- Фокус
- Оригинальные шоу', 10, N'Развлечения', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @HeadspaceId, [Id], 10 FROM [Periods] WHERE [MonthsCount] = 1;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @HeadspaceId, [Id], 30 FROM [Periods] WHERE [MonthsCount] = 3;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @HeadspaceId, [Id], 120 FROM [Periods] WHERE [MonthsCount] = 12;

-- Peloton (Base: 10)
DECLARE @PelotonId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@PelotonId, N'Peloton App', N'Фитнес дома', N'## Peloton App
- Тренировки
- Йога
- Медитации
- Лидерборды', 10, N'Развлечения', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @PelotonId, [Id], 10 FROM [Periods] WHERE [MonthsCount] = 1;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @PelotonId, [Id], 30 FROM [Periods] WHERE [MonthsCount] = 3;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @PelotonId, [Id], 120 FROM [Periods] WHERE [MonthsCount] = 12;

-- =============================================
-- ДРУГОЕ (базовая цена: 10)
-- =============================================

-- Amazon Prime (Base: 10)
DECLARE @AmazonId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@AmazonId, N'Amazon Prime', N'Доставка и стриминг', N'## Amazon Prime
- Бесплатная доставка
- Prime Video
- Prime Music
- Ранний доступ к акциям', 10, N'Другое', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @AmazonId, [Id], 10 FROM [Periods] WHERE [MonthsCount] = 1;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @AmazonId, [Id], 30 FROM [Periods] WHERE [MonthsCount] = 3;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @AmazonId, [Id], 120 FROM [Periods] WHERE [MonthsCount] = 12;

-- LinkedIn Premium (Base: 20)
DECLARE @LinkedInId UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Subscriptions] ([Id], [Name], [Description], [DescriptionMarkdown], [Price], [Category], [IconFileId], [IconUrl], [IsActive], [CreatedAt], [UpdatedAt])
VALUES (@LinkedInId, N'LinkedIn Premium', N'Профессиональная сеть', N'## LinkedIn Premium
- Кто просматривал профиль
- Сообщения InMail
- Обучение и курсы
- Продвижение профиля', 20, N'Другое', NULL, NULL, 1, GETDATE(), GETDATE());

INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @LinkedInId, [Id], 20 FROM [Periods] WHERE [MonthsCount] = 1;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @LinkedInId, [Id], 60 FROM [Periods] WHERE [MonthsCount] = 3;
INSERT INTO [SubscriptionPrices] ([Id], [SubscriptionId], [PeriodId], [FinalPrice])
SELECT NEWID(), @LinkedInId, [Id], 240 FROM [Periods] WHERE [MonthsCount] = 12;

-- Итог
PRINT N'Каталог подписок успешно заполнен.';
SELECT COUNT(*) AS TotalSubscriptions FROM Subscriptions;
SELECT [Category], COUNT(*) AS Count FROM Subscriptions GROUP BY [Category];
GO
