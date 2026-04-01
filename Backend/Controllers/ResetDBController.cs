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
                        Image VARCHAR(256) NOT NULL,
                        Description VARCHAR(128) NOT NULL
                    );

                    CREATE TABLE timetable (
                        Id INT NOT NULL,
                        Slot DATETIME NOT NULL,
                        FOREIGN KEY (Id) REFERENCES staff(Id) ON DELETE CASCADE
                    );

                    -- 🔹 Заполняем staff
                    INSERT INTO staff (Name, Age, Description, Image) VALUES
                    ('Alice Johnson', 30, 'Corporate lawyer', '/images/staff/alice.jpg'),
                    ('Bob Smith', 45, 'Tax consultant', '/images/staff/bob.jpg'),
                    ('Charlie Brown', 28, 'Junior legal assistant', '/images/staff/charlie.jpg'),
                    ('Diana Prince', 35, 'Contract specialist', '/images/staff/diana.jpg'),
                    ('Ethan Hunt', 40, 'Risk analyst', '/images/staff/ethan.jpg'),
                    ('Fiona Gallagher', 33, 'HR manager', '/images/staff/fiona.jpg'),
                    ('George Martin', 50, 'Senior advisor', '/images/staff/george.jpg'),
                    ('Hannah Lee', 27, 'Paralegal', '/images/staff/hannah.jpg'),
                    ('Ivan Petrov', 38, 'Compliance officer', '/images/staff/ivan.jpg'),
                    ('Julia Roberts', 42, 'Business consultant', '/images/staff/julia.jpg');

                    -- 🔹 Заполняем timetable (свободные слоты)
                    INSERT INTO timetable (Id, Slot) VALUES
                    (1, '2026-04-05 10:00:00'),
                    (1, '2026-04-05 14:00:00'),

                    (2, '2026-04-05 11:00:00'),
                    (2, '2026-04-06 15:00:00'),

                    (3, '2026-04-05 09:00:00'),
                    (3, '2026-04-07 13:00:00'),

                    (4, '2026-04-06 12:00:00'),
                    (4, '2026-04-06 16:00:00'),

                    (5, '2026-04-05 10:30:00'),
                    (5, '2026-04-08 14:30:00'),

                    (6, '2026-04-05 08:00:00'),
                    (6, '2026-04-07 11:00:00'),

                    (7, '2026-04-06 09:30:00'),
                    (7, '2026-04-06 13:30:00'),

                    (8, '2026-04-05 15:00:00'),
                    (8, '2026-04-08 10:00:00'),

                    (9, '2026-04-07 12:00:00'),
                    (9, '2026-04-06 13:30:00'),

                    (10, '2026-04-05 11:30:00'),
                    (10, '2026-04-08 16:00:00');

                    SET FOREIGN_KEY_CHECKS = 1;
                ";

                await _db.Database.ExecuteSqlRawAsync(sql);

                return Ok(new { message = "Database reset and seeded successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error resetting database", error = ex.Message });
            }
        }
    }
}