using Backend.db;
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

        public async Task<List<SlotResponse>> GetAvailableSlots()
        {
            return await _db.Timetable
                .GroupBy(t => t.Slot)
                .Select(g => new SlotResponse
                {
                    Slot = g.Key,
                    Count = g.Count()
                })
                .OrderBy(x => x.Slot)
                .ToListAsync();
        }
    }
}