FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["SubscriptionManager/Directory.Build.props", "./"]
COPY ["SubscriptionManager/Directory.Packages.props", "./"]
COPY ["SubscriptionManager/SubscriptionManager.Auth.API/SubscriptionManager.Auth.API.csproj", "SubscriptionManager/SubscriptionManager.Auth.API/"]
COPY ["SubscriptionManager/SubscriptionManager.Core/SubscriptionManager.Core.csproj", "SubscriptionManager/SubscriptionManager.Core/"]
COPY ["SubscriptionManager/SubscriptionManager.Auth.Infrastructure/SubscriptionManager.Auth.Infrastructure.csproj", "SubscriptionManager/SubscriptionManager.Auth.Infrastructure/"]
COPY ["SubscriptionManager/SubscriptionManager.Infrastructure.Shared/SubscriptionManager.Infrastructure.Shared.csproj", "SubscriptionManager/SubscriptionManager.Infrastructure.Shared/"]
RUN dotnet restore "SubscriptionManager/SubscriptionManager.Auth.API/SubscriptionManager.Auth.API.csproj"
COPY . .
WORKDIR "/src/SubscriptionManager/SubscriptionManager.Auth.API"
RUN dotnet build "SubscriptionManager.Auth.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "SubscriptionManager.Auth.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "SubscriptionManager.Auth.API.dll"]