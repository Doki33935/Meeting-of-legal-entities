using Backend.db;
using Backend.Models;
using Backend.Schemas;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public class StartService
    {
        private readonly ApplicationDb _db;

        public StartService(ApplicationDb db)
        {
            _db = db;
        }

        // 🔹 Возвращаем расписание (как раньше)
        public async Task<List<SlotResponse>> GetAvailableSlots()
        {
            var now = DateTime.UtcNow; // или DateTime.Now если используешь локальное время

            return await _db.Timetable
                .Where(t => t.Slot >= now)
                .GroupBy(t => t.Slot)
                .Select(g => new SlotResponse
                {
                    Slot = g.Key,
                    Count = g.Count()
                })
                .OrderBy(x => x.Slot)
                .ToListAsync();
        }

        // 🔹 Получаем встречи по токену
        public async Task<List<AppointmentResponse>> GetAppointmentsByToken(string token)
        {
            var now = DateTime.UtcNow; // или DateTime.Now, если используешь локальное время

            return await _db.Appointments
                .Where(a => a.Token == token && a.AppointmentTime >= now) 
                .Include(a => a.Staff)
                .OrderBy(a => a.AppointmentTime)
                .Select(a => new AppointmentResponse
                {
                    StaffImage = a.Staff.Image,
                    StaffName = a.Staff.Name,
                    Reason = a.Reason,
                    AppointmentTime = a.AppointmentTime
                })
                .ToListAsync();
        }
    }
}