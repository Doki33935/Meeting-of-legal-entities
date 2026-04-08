using Backend.db;
using Backend.Services;
using Microsoft.EntityFrameworkCore;
using System;

var builder = WebApplication.CreateBuilder(args);

// 1️ Настройка CORS (для React фронта)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactDev", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // React dev сервер
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 2️ Добавляем только API Controllers
builder.Services.AddControllers();

// 3️ Swagger для документации API
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 4️ Настройка базы данных (MariaDB)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<ApplicationDb>(options =>
    options.UseMySql(
        connectionString,
        new MySqlServerVersion(new Version(10, 6, 0))
    ));

// 5️ Регистрация сервисов
builder.Services.AddScoped<BookService>();
builder.Services.AddScoped<MeetService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<CookieTokenService>();
builder.Services.AddScoped<StartService>();

// Регулярная чистка проведенных встреч
builder.Services.AddHostedService<PastAppointmentsCleanupService>();

// 6️ Строим приложение
var app = builder.Build();


// 7 Включаем CORS, Роуты, Проверка прав пользователя на этот роут и Контроллеры и Картинки
app.UseCors("AllowReactDev");
app.UseRouting();
app.UseAuthorization();
app.MapControllers();
app.UseStaticFiles();

// 8 Swagger (только в Development (Debug режим сверху))
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Meetings API V1");
        c.RoutePrefix = "swagger";
    });
}

// 9 Запуск приложения
app.Run();