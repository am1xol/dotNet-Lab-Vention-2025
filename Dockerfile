FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["SubscriptionManager/SubscriptionManager.API/SubscriptionManager.API.csproj", "SubscriptionManager/SubscriptionManager.API/"]
COPY ["SubscriptionManager/SubscriptionManager.Core/SubscriptionManager.Core.csproj", "SubscriptionManager/SubscriptionManager.Core/"]
COPY ["SubscriptionManager/SubscriptionManager.Infrastructure/SubscriptionManager.Infrastructure.csproj", "SubscriptionManager/SubscriptionManager.Infrastructure/"]
RUN dotnet restore "SubscriptionManager/SubscriptionManager.API/SubscriptionManager.API.csproj"
COPY . .
WORKDIR "/src/SubscriptionManager/SubscriptionManager.API"
RUN dotnet build "SubscriptionManager.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "SubscriptionManager.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/api/health || exit 1
ENTRYPOINT ["dotnet", "SubscriptionManager.API.dll"]