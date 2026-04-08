using Backend.db.Models;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.db
{
    public class ApplicationDb : DbContext
    {
        public ApplicationDb(DbContextOptions<ApplicationDb> options) : base(options) { }

        public DbSet<Timetable> Timetable { get; set; }
        public DbSet<Staff> Staff { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
    }
}