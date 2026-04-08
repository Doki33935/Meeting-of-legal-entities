using Backend.db;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/")]
    [Tags("Admin")]
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
                    DROP TABLE IF EXISTS users;
                    DROP TABLE IF EXISTS Appointments;
                    

                    CREATE TABLE staff (
                        Id INT AUTO_INCREMENT PRIMARY KEY,
                        Name VARCHAR(32) NOT NULL,
                        Age INT NOT NULL,
                        Image VARCHAR(256) NOT NULL,
                        Description VARCHAR(128) NOT NULL
                    );

                    CREATE TABLE timetable (
                        Id INT AUTO_INCREMENT PRIMARY KEY, 
                        StaffId INT NOT NULL,                      
                        Slot DATETIME NOT NULL,
                        FOREIGN KEY (StaffId) REFERENCES staff(Id) ON DELETE CASCADE
                    );

                    -- 🔹 Создаём новую таблицу Appointments
                    CREATE TABLE Appointments (
                        Id INT AUTO_INCREMENT PRIMARY KEY,
                        Token VARCHAR(255) NOT NULL,
                        StaffId INT NOT NULL,
                        Reason VARCHAR(500) NOT NULL,
                        AppointmentTime DATETIME NOT NULL,
                        FOREIGN KEY (StaffId) REFERENCES staff(Id)
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

                    -- 🔹 Заполняем Appointments примерами
                    INSERT INTO Appointments (Token, StaffId, Reason, AppointmentTime) VALUES
                    ('token_abc123', 1, 'Consultation', '2026-04-10 10:00:00'),
                    ('token_xyz789', 2, 'Follow-up', '2026-04-11 14:30:00'),
                    ('token_abc123', 1, 'Review', '2026-04-12 09:00:00');

                    -- 🔹 Заполняем timetable (свободные слоты)
                    INSERT INTO timetable (StaffId, Slot) VALUES

                    -- ===== ДЕНЬ 1 =====
                    (1, '2026-04-01 10:00:00'), (2, '2026-04-01 10:00:00'), (3, '2026-04-01 10:00:00'),
                    (4, '2026-04-01 12:00:00'), (5, '2026-04-01 12:00:00'),
                    (6, '2026-04-01 14:00:00'),

                    -- ===== ДЕНЬ 2 =====
                    (1, '2026-04-02 10:00:00'), (7, '2026-04-02 10:00:00'),
                    (2, '2026-04-02 12:00:00'), (3, '2026-04-02 12:00:00'), (4, '2026-04-02 12:00:00'),
                    (5, '2026-04-02 15:00:00'),

                    -- ===== ДЕНЬ 3 =====
                    (6, '2026-04-03 09:00:00'),
                    (1, '2026-04-03 11:00:00'), (2, '2026-04-03 11:00:00'),
                    (3, '2026-04-03 13:00:00'), (4, '2026-04-03 13:00:00'), (5, '2026-04-03 13:00:00'),

                    -- ===== ДЕНЬ 4 =====
                    (7, '2026-04-04 10:00:00'), (8, '2026-04-04 10:00:00'),
                    (9, '2026-04-04 12:00:00'),
                    (10, '2026-04-04 14:00:00'),

                    -- ===== ДЕНЬ 5 =====
                    (1, '2026-04-05 10:00:00'), (2, '2026-04-05 10:00:00'), (3, '2026-04-05 10:00:00'), (4, '2026-04-05 10:00:00'), (5, '2026-04-05 10:00:00'),
                    (6, '2026-04-05 12:00:00'), (7, '2026-04-05 12:00:00'),
                    (8, '2026-04-05 15:00:00'),

                    -- ===== ДЕНЬ 6 =====
                    (9, '2026-04-06 09:00:00'),
                    (1, '2026-04-06 11:00:00'), (2, '2026-04-06 11:00:00'),
                    (3, '2026-04-06 13:00:00'), (4, '2026-04-06 13:00:00'),

                    -- ===== ДЕНЬ 7 =====
                    (5, '2026-04-07 10:00:00'), (6, '2026-04-07 10:00:00'),
                    (7, '2026-04-07 12:00:00'), (8, '2026-04-07 12:00:00'), (9, '2026-04-07 12:00:00'),
                    (10, '2026-04-07 14:00:00'),

                    -- ===== ДЕНЬ 8 =====
                    (1, '2026-04-08 09:00:00'),
                    (2, '2026-04-08 11:00:00'), (3, '2026-04-08 11:00:00'),
                    (4, '2026-04-08 13:00:00'),

                    -- ===== ДЕНЬ 9 =====
                    (5, '2026-04-09 10:00:00'),
                    (6, '2026-04-09 12:00:00'), (7, '2026-04-09 12:00:00'),
                    (8, '2026-04-09 14:00:00'), (9, '2026-04-09 14:00:00'),

                    -- ===== ДЕНЬ 10 =====
                    (10, '2026-04-10 09:00:00'),
                    (1, '2026-04-10 11:00:00'), (2, '2026-04-10 11:00:00'),
                    (3, '2026-04-10 13:00:00'), (4, '2026-04-10 13:00:00'),

                    -- ===== ДЕНЬ 11 =====
                    (5, '2026-04-11 10:00:00'), (6, '2026-04-11 10:00:00'),
                    (7, '2026-04-11 12:00:00'),
                    (8, '2026-04-11 14:00:00'), (9, '2026-04-11 14:00:00'),

                    -- ===== ДЕНЬ 12 =====
                    (10, '2026-04-12 09:00:00'),
                    (1, '2026-04-12 11:00:00'), (2, '2026-04-12 11:00:00'),
                    (3, '2026-04-12 13:00:00'),

                    -- ===== ДЕНЬ 13 =====
                    (4, '2026-04-13 10:00:00'),
                    (5, '2026-04-13 12:00:00'), (6, '2026-04-13 12:00:00'),
                    (7, '2026-04-13 14:00:00'),

                    -- ===== ДЕНЬ 14 =====
                    (8, '2026-04-14 09:00:00'),
                    (9, '2026-04-14 11:00:00'), (10, '2026-04-14 11:00:00'),
                    (1, '2026-04-14 13:00:00'),

                    -- ===== ДЕНЬ 15 =====
                    (2, '2026-04-15 10:00:00'), (3, '2026-04-15 10:00:00'),
                    (4, '2026-04-15 12:00:00'),
                    (5, '2026-04-15 14:00:00'),

                    -- ===== ДЕНЬ 16 =====
                    (6, '2026-04-16 09:00:00'),
                    (7, '2026-04-16 11:00:00'), (8, '2026-04-16 11:00:00'),
                    (9, '2026-04-16 13:00:00'),

                    -- ===== ДЕНЬ 17 =====
                    (10, '2026-04-17 10:00:00'),
                    (1, '2026-04-17 12:00:00'), (2, '2026-04-17 12:00:00'),
                    (3, '2026-04-17 14:00:00'),

                    -- ===== ДЕНЬ 18 =====
                    (4, '2026-04-18 09:00:00'),
                    (5, '2026-04-18 11:00:00'), (6, '2026-04-18 11:00:00'),
                    (7, '2026-04-18 13:00:00'),

                    -- ===== ДЕНЬ 19 =====
                    (8, '2026-04-19 10:00:00'),
                    (9, '2026-04-19 12:00:00'), (10, '2026-04-19 12:00:00'),
                    (1, '2026-04-19 14:00:00'),

                    -- ===== ДЕНЬ 20 =====
                    (2, '2026-04-20 09:00:00'),
                    (3, '2026-04-20 11:00:00'), (4, '2026-04-20 11:00:00'),
                    (5, '2026-04-20 13:00:00'), (6, '2026-04-20 13:00:00');

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