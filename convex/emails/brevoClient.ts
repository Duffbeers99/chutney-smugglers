/**
 * Shared Brevo email client for sending transactional emails
 */

interface EmailRecipient {
  email: string;
  name?: string;
}

interface SendEmailParams {
  to: EmailRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
}

/**
 * Send a transactional email via Brevo API
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_FROM_EMAIL || "noreply@chutneysmugglers.app";

  if (!apiKey) {
    throw new Error("BREVO_API_KEY environment variable is not set");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        email: fromEmail,
        name: "Chutney Smugglers",
      },
      to: params.to,
      subject: params.subject,
      htmlContent: params.htmlContent,
      textContent: params.textContent,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email via Brevo: ${error}`);
  }

  const result = await response.json();
  console.log(`Email sent successfully. Message ID: ${result.messageId}`);
}
