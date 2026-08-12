using System.ComponentModel.DataAnnotations;

namespace VaccinationEmailService.Models;

public class EmailRequest
{
    [Required, EmailAddress]
    public string To { get; set; } = "";

    [Required, MaxLength(150)]
    public string Subject { get; set; } = "";

    [Required, MaxLength(5000)]
    public string Message { get; set; } = "";

    [Required]
    public string Type { get; set; } = "GENERAL";

    [RegularExpression("^[0-9]{6}$")]
    public string? OtpCode { get; set; }
}

public record EmailSendResult(bool Sent, string Message, DateTime SentAt);
