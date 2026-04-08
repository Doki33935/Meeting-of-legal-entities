using Microsoft.AspNetCore.Http;

namespace Backend.Services
{
    public class CookieTokenService
    {
        private readonly IHttpContextAccessor _httpContext;
        private const string COOKIE_NAME = "user_token";

        public CookieTokenService(IHttpContextAccessor httpContext)
        {
            _httpContext = httpContext;
        }

        public string GetOrCreateUserToken()
        {
            var context = _httpContext.HttpContext!;
            var request = context.Request;
            var response = context.Response;

            // 🔹 1. Если cookie уже есть — просто возвращаем
            if (request.Cookies.TryGetValue(COOKIE_NAME, out var existingToken))
            {
                return existingToken;
            }

            // 🔹 2. Генерируем новый токен
            var token = Guid.NewGuid().ToString();

            // 🔹 3. Ставим cookie БЕЗ срока (session cookie)
            response.Cookies.Append(COOKIE_NAME, token, new CookieOptions
            {
                HttpOnly = true,       // только сервер может читать
                Secure = true,         // HTTPS
                SameSite = SameSiteMode.Lax
                // ❗ Expires нет → cookie сессионная
            });

            return token;
        }
    }
}