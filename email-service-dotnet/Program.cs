using Microsoft.Extensions.Options;
using VaccinationEmailService.Options;
using VaccinationEmailService.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.Configure<EmailOptions>(builder.Configuration.GetSection("Email"));
builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();
app.UseCors();
app.MapControllers();
app.MapGet("/health", (IOptions<EmailOptions> email) => Results.Ok(new
{
    status = "UP",
    smtpConfigured = email.Value.IsConfigured(),
    provider = "MailKit SMTP"
}));
app.Run();
