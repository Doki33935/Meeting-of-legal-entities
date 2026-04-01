using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/")]
    public class StartController : ControllerBase
    {
        private readonly StartService _startService;

        public StartController(StartService startService)
        {
            _startService = startService;
        }

        [HttpGet("start")]
        public async Task<IActionResult> GetAvailableSlots()
        {
            var data = await _startService.GetAvailableSlots();
            return Ok(data);
        }
    }
}