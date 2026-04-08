using Backend.Schemas;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/")]
    public class BookController : ControllerBase
    {
        private readonly BookService _bookService;
        private readonly CookieTokenService _cookieService;

        public BookController(BookService bookService, CookieTokenService cookieService)
        {
            _bookService = bookService;
            _cookieService = cookieService;
        }

        [HttpPost("book")]
        public async Task<IActionResult> Book([FromBody] BookRequest request)
        {
            var token = _cookieService.GetOrCreateUserToken();

            try
            {
                await _bookService.BookAppointment(token, request);
                return Ok(new { message = "Встреча успешно забронирована" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}