using Backend.db;
using Backend.Models;
using Backend.Schemas;
using Microsoft.EntityFrameworkCore;
using System;

namespace Backend.Services
{
    public class BookService
    {
        private readonly ApplicationDb _db;

        public BookService(ApplicationDb db)
        {
            _db = db;
        }

        public async Task BookAppointment(string userToken, BookRequest request)
        {
            // 🔹 1. Проверяем, что слот существует
            var slot = await _db.Timetable
    .FirstOrDefaultAsync(t => t.StaffId == request.StaffId && t.Slot == request.AppointmentTime);

            if (slot == null)
                throw new Exception("Слот недоступен");

            // создаём встречу
            var appointment = new Appointment
            {
                Token = userToken,
                StaffId = request.StaffId,
                Reason = request.Reason,
                AppointmentTime = request.AppointmentTime
            };

            _db.Appointments.Add(appointment);

            // удаляем найденный слот
            _db.Timetable.Remove(slot);

            await _db.SaveChangesAsync();

        }
    }
}