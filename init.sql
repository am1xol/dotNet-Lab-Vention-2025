#!/bin/bash
# Wait for SQL Server to start
sleep 30s

# Create database
/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "YourPassword123!" -d master -Q "IF NOT EXISTS(SELECT name FROM sys.databases WHERE name = 'SubscriptionManagerDb') CREATE DATABASE SubscriptionManagerDb;"
