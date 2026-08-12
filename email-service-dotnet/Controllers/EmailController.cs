using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using VaccinationEmailService.Models;
using VaccinationEmailService.Options;
using VaccinationEmailService.Services;

namespace VaccinationEmailService.Controllers;

[ApiController]
[Route("api/email")]
public class EmailController : ControllerBase
{
    private readonly IEmailSender sender;
    private readonly EmailOptions options;

    public EmailController(IEmailSender sender, IOptions<EmailOptions> options)
    {
        this.sender = sender;
        this.options = options.Value;
    }

    [HttpGet("configuration")]
    public IActionResult Configuration() => Ok(new
    {
        configured = options.IsConfigured(),
        options.Host,
        options.Port,
        options.FromEmail,
        options.FromName
    });

    [HttpPost("send")]
    public async Task<IActionResult> Send([FromBody] EmailRequest request, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await sender.SendAsync(request, cancellationToken));
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { status = "failure", message = ex.Message });
        }
    }

    [HttpPost("test")]
    public Task<IActionResult> Test([FromQuery] string to, CancellationToken cancellationToken)
    {
        var request = new EmailRequest
        {
            To = to,
            Subject = "VaccineCare email test",
            Message = "Your new ASP.NET Core MailKit email service is configured correctly.",
            Type = "GENERAL"
        };
        return Send(request, cancellationToken);
    }
}
