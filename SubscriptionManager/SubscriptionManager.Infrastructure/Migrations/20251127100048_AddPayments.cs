using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SubscriptionManager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPayments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Payments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserSubscriptionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false),
                    PaymentDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PeriodStart = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PeriodEnd = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CardLastFour = table.Column<string>(type: "nvarchar(4)", maxLength: 4, nullable: false),
                    CardBrand = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Payments_UserSubscriptions_UserSubscriptionId",
                        column: x => x.UserSubscriptionId,
                        principalTable: "UserSubscriptions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Payments_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Payments_UserId",
                table: "Payments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_UserSubscriptionId",
                table: "Payments",
                column: "UserSubscriptionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Payments");
        }
    }
}
