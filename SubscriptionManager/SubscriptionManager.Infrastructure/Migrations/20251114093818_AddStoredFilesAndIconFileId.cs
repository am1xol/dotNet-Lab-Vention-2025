using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SubscriptionManager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStoredFilesAndIconFileId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "IconFileId",
                table: "Subscriptions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "StoredFiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    BucketName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ObjectName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Size = table.Column<long>(type: "bigint", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StoredFiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StoredFiles_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserSubscriptions_UserId",
                table: "UserSubscriptions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_IconFileId",
                table: "Subscriptions",
                column: "IconFileId");

            migrationBuilder.CreateIndex(
                name: "IX_StoredFiles_ObjectName",
                table: "StoredFiles",
                column: "ObjectName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StoredFiles_UserId",
                table: "StoredFiles",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Subscriptions_StoredFiles_IconFileId",
                table: "Subscriptions",
                column: "IconFileId",
                principalTable: "StoredFiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Subscriptions_StoredFiles_IconFileId",
                table: "Subscriptions");

            migrationBuilder.DropTable(
                name: "StoredFiles");

            migrationBuilder.DropIndex(
                name: "IX_UserSubscriptions_UserId",
                table: "UserSubscriptions");

            migrationBuilder.DropIndex(
                name: "IX_Subscriptions_IconFileId",
                table: "Subscriptions");

            migrationBuilder.DropColumn(
                name: "IconFileId",
                table: "Subscriptions");
        }
    }
}
