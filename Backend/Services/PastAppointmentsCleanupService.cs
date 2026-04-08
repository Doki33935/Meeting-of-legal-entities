using Backend.db;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Backend.Services
{
    public class PastAppointmentsCleanupService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<PastAppointmentsCleanupService> _logger;

        public PastAppointmentsCleanupService(IServiceProvider serviceProvider, ILogger<PastAppointmentsCleanupService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<ApplicationDb>();

                    var now = DateTime.UtcNow;

                    // 🔹 1. Чистим прошлые встречи
                    var oldAppointments = await db.Appointments
                        .Where(a => a.AppointmentTime < now && a.StaffId != 0) // исключаем placeholder
                        .ToListAsync(stoppingToken);

                    if (oldAppointments.Count > 0)
                    {
                        db.Appointments.RemoveRange(oldAppointments);
                        await db.SaveChangesAsync(stoppingToken);

                        _logger.LogInformation("Removed {Count} past appointments.", oldAppointments.Count);
                        Console.WriteLine($"[Cleanup] {oldAppointments.Count} past appointments removed at {DateTime.Now}");
                    }
                    else
                    {
                        _logger.LogInformation("No past appointments to clean.");
                        Console.WriteLine($"[Cleanup] No past appointments to clean at {DateTime.Now}");
                    }

                    // 🔹 2. Чистим устаревшие слоты из timetable
                    var oldSlots = await db.Timetable
                        .Where(t => t.Slot < now)
                        .ToListAsync(stoppingToken);

                    if (oldSlots.Count > 0)
                    {
                        db.Timetable.RemoveRange(oldSlots);
                        await db.SaveChangesAsync(stoppingToken);

                        _logger.LogInformation("Removed {Count} old timetable slots.", oldSlots.Count);
                        Console.WriteLine($"[Cleanup] {oldSlots.Count} old timetable slots removed at {DateTime.Now}");
                    }
                    else
                    {
                        _logger.LogInformation("No old timetable slots to clean.");
                        Console.WriteLine($"[Cleanup] No old timetable slots to clean at {DateTime.Now}");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while cleaning past appointments and old slots.");
                    Console.WriteLine($"[Cleanup] Error: {ex.Message}");
                }

                // ждем 24 часа до следующей проверки
                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
        }
    }
}