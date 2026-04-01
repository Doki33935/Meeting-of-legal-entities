using Backend.db;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/")]
    public class ResetDBController : ControllerBase
    {
        private readonly ApplicationDb _db;

        public ResetDBController(ApplicationDb db)
        {
            _db = db;
        }

        [HttpPost("resetdb")]
        public async Task<IActionResult> ResetDatabase()
        {
            try
            {
                string sql = @"
                    SET FOREIGN_KEY_CHECKS = 0;

                    DROP TABLE IF EXISTS timetable;
                    DROP TABLE IF EXISTS staff;

                    CREATE TABLE staff (
                        Id INT AUTO_INCREMENT PRIMARY KEY,
                        Name VARCHAR(32) NOT NULL,
                        Age INT NOT NULL,
                        Description VARCHAR(128) NOT NULL
                    );

                    CREATE TABLE timetable (
                        Id INT PRIMARY KEY, -- будет совпадать с Id из staff
                        Slot DATETIME NOT NULL,
                        FOREIGN KEY (Id) REFERENCES staff(Id) ON DELETE CASCADE
                    );

                    SET FOREIGN_KEY_CHECKS = 1;
                ";

                await _db.Database.ExecuteSqlRawAsync(sql);

                return Ok(new { message = "Database reset successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error resetting database", error = ex.Message });
            }
        }
    }
}