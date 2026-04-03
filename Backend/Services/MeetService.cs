using Backend.db;
using Backend.Schemas;
using Microsoft.EntityFrameworkCore;


namespace Backend.Services
{
    public class MeetService
    {
        private readonly ApplicationDb _db;

        public MeetService(ApplicationDb db)
        {
            _db = db;
        }

        public async Task<List<MeetResponse>> GetAvailableStaff(DateTime slot)
        {
            return await _db.Timetable
                .Where(t => t.Slot == slot)
                .Include(t => t.Staff)
                .Select(t => new MeetResponse
                {
                    Id = t.Staff.Id,
                    Name = t.Staff.Name,
                    Age = t.Staff.Age,
                    Description = t.Staff.Description,
                    Image = t.Staff.Image
                })
                .ToListAsync();
        }
    }
}
