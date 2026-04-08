using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/")]
    public class StartController : ControllerBase
    {
        private readonly StartService _startService;
        private readonly CookieTokenService _cookieService;

        public StartController(StartService startService, CookieTokenService cookieService)
        {
            _startService = startService;
            _cookieService = cookieService;
        }

        [HttpGet("start")]
        public async Task<IActionResult> GetAvailableSlots()
        {
            // 🔹 Получаем или создаём токен
            var token = _cookieService.GetOrCreateUserToken();

            // 🔹 Получаем timetable
            var timetable = await _startService.GetAvailableSlots();

            // 🔹 Проверяем есть ли встречи по токену
            var appointments = await _startService.GetAppointmentsByToken(token);

            // 🔹 Формируем ответ
            var response = new
            {
                Token = token,
                Timetable = timetable,
                Appointments = appointments // если нет встреч, вернется пустой список
            };

            return Ok(response);
        }
    }
}