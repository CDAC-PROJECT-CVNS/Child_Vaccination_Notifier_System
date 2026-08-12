using System.Net;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using VaccinationEmailService.Models;
using VaccinationEmailService.Options;

namespace VaccinationEmailService.Services;

public class SmtpEmailSender : IEmailSender
{
    private readonly EmailOptions options;
    private readonly ILogger<SmtpEmailSender> logger;

    public SmtpEmailSender(IOptions<EmailOptions> options, ILogger<SmtpEmailSender> logger)
    {
        this.options = options.Value;
        this.logger = logger;
    }

    public async Task<EmailSendResult> SendAsync(EmailRequest request, CancellationToken cancellationToken = default)
    {
        if (!options.IsConfigured())
            throw new InvalidOperationException("SMTP is not configured. Set SMTP_ENABLED=true and provide SMTP credentials in the root .env file.");

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(options.FromName, options.FromEmail));
        message.To.Add(MailboxAddress.Parse(request.To));
        message.Subject = request.Subject;
        message.Body = new BodyBuilder { HtmlBody = BuildTemplate(request) }.ToMessageBody();

        using var client = new SmtpClient();
        client.Timeout = options.TimeoutSeconds * 1000;
        var security = options.Port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls;

        try
        {
            await client.ConnectAsync(options.Host, options.Port, security, cancellationToken);
            await client.AuthenticateAsync(options.Username, options.Password, cancellationToken);
            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);
            logger.LogInformation("Email sent to {Recipient} with type {Type}", request.To, request.Type);
            return new EmailSendResult(true, "Email sent successfully", DateTime.UtcNow);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unable to send email to {Recipient}", request.To);
            throw new InvalidOperationException("SMTP delivery failed: " + ex.Message, ex);
        }
    }

    private static string BuildTemplate(EmailRequest request)
    {
        var title = request.Type.ToUpperInvariant() switch
        {
            "EMAIL_OTP" => "Verify Your Email",
            "REGISTRATION" => "Welcome to VaccineCare",
            "APPOINTMENT_BOOKED" => "Appointment Confirmed",
            "APPOINTMENT_CANCELLED" => "Appointment Cancelled",
            "VACCINATION_REMINDER" => "Vaccination Reminder",
            "VACCINATION_COMPLETED" => "Vaccination Completed",
            _ => "VaccineCare Notification"
        };

        var safeMessage = WebUtility.HtmlEncode(request.Message).Replace("\n", "<br/>");
        var otpBlock = request.Type.Equals("EMAIL_OTP", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(request.OtpCode)
            ? $"<div style=\"margin:24px 0;padding:18px;border-radius:14px;background:#ecfeff;text-align:center;font-size:34px;font-weight:800;letter-spacing:10px;color:#0f766e\">{WebUtility.HtmlEncode(request.OtpCode)}</div>"
            : "";
        return $$"""
        <!doctype html>
        <html>
        <body style="margin:0;background:#f3f6fb;font-family:Arial,sans-serif;color:#172033">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:white;border-radius:18px;overflow:hidden;box-shadow:0 12px 35px rgba(15,23,42,.10)">
                <tr><td style="padding:26px 32px;background:linear-gradient(135deg,#0f766e,#2563eb);color:white">
                  <div style="font-size:13px;letter-spacing:1.5px;text-transform:uppercase;opacity:.9">Child Vaccination Notifier</div>
                  <h1 style="margin:8px 0 0;font-size:26px">{{title}}</h1>
                </td></tr>
                <tr><td style="padding:32px;font-size:16px;line-height:1.7">{{safeMessage}}{{otpBlock}}</td></tr>
                <tr><td style="padding:18px 32px;background:#f8fafc;color:#64748b;font-size:12px">This is an automated message from VaccineCare.</td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """;
    }
}
