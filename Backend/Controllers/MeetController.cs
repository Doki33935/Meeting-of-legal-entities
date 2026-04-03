using Backend.Schemas;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;


namespace Backend.Controllers
{
    [ApiController]
    [Route("api/")]
    public class MeetController : ControllerBase
    {
        private readonly MeetService _meetService;

        public MeetController(MeetService meetService)
        {
            _meetService = meetService;
        }

        [HttpPost("meet")]
        public async Task<IActionResult> GetAvailableStaff([FromBody] MeetRequest request)
        {
            var data = await _meetService.GetAvailableStaff(request.Slot);

            if (data == null || !data.Any())
            {
                return NotFound(new
                {
                    message = "Нет свободных сотрудников на выбранное время"
                });
            }

            return Ok(data);
        }
    }
}
