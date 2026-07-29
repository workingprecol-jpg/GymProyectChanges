using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GymSaaS.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddProgressRecordArmAndLeg : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "ArmCm",
                table: "ProgressRecords",
                type: "numeric(6,2)",
                precision: 6,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "LegCm",
                table: "ProgressRecords",
                type: "numeric(6,2)",
                precision: 6,
                scale: 2,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ArmCm",
                table: "ProgressRecords");

            migrationBuilder.DropColumn(
                name: "LegCm",
                table: "ProgressRecords");
        }
    }
}
