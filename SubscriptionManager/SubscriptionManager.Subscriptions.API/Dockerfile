FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["SubscriptionManager/Directory.Build.props", "./"]
COPY ["SubscriptionManager/Directory.Packages.props", "./"]
COPY ["SubscriptionManager/SubscriptionManager.Subscriptions.API/SubscriptionManager.Subscriptions.API.csproj", "SubscriptionManager/SubscriptionManager.Subscriptions.API/"]
COPY ["SubscriptionManager/SubscriptionManager.Core/SubscriptionManager.Core.csproj", "SubscriptionManager/SubscriptionManager.Core/"]
COPY ["SubscriptionManager/SubscriptionManager.Subscriptions.Infrastructure/SubscriptionManager.Subscriptions.Infrastructure.csproj", "SubscriptionManager/SubscriptionManager.Subscriptions.Infrastructure/"]
COPY ["SubscriptionManager/SubscriptionManager.Infrastructure.Shared/SubscriptionManager.Infrastructure.Shared.csproj", "SubscriptionManager/SubscriptionManager.Infrastructure.Shared/"]
COPY ["SubscriptionManager/SubscriptionManager.Auth.Infrastructure/SubscriptionManager.Auth.Infrastructure.csproj", "SubscriptionManager/SubscriptionManager.Auth.Infrastructure/"]
RUN dotnet restore "SubscriptionManager/SubscriptionManager.Subscriptions.API/SubscriptionManager.Subscriptions.API.csproj"
COPY . .
WORKDIR "/src/SubscriptionManager/SubscriptionManager.Subscriptions.API"
RUN dotnet build "SubscriptionManager.Subscriptions.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "SubscriptionManager.Subscriptions.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "SubscriptionManager.Subscriptions.API.dll"]