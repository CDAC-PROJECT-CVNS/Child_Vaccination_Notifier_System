using VaccinationEmailService.Models;

namespace VaccinationEmailService.Services;

public interface IEmailSender
{
    Task<EmailSendResult> SendAsync(EmailRequest request, CancellationToken cancellationToken = default);
}
