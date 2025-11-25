import Resend from "@auth/core/providers/resend";

export const ResendPasswordReset = Resend({
  id: "resend-password-reset",
  apiKey: process.env.AUTH_RESEND_KEY ?? process.env.RESEND_API_KEY,
  from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
  async sendVerificationRequest({ identifier: email, url, provider }) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: provider.from,
        to: email,
        subject: "Reset your password - Chutney Smugglers",
        html: `
          <div style="font-family: 'Georgia', serif; max-width: 500px; margin: 0 auto; background: linear-gradient(to bottom, #FFF8E7, #FFEFD5); padding: 32px; border: 2px solid #D2691E;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #8B4513; font-size: 28px; margin: 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">🍛 Chutney Smugglers</h1>
            </div>
            <div style="background: #FFFAF0; padding: 24px; border-radius: 8px; border-left: 4px solid #FF6347;">
              <h2 style="color: #8B4513; font-size: 20px; margin-top: 0;">Reset your password</h2>
              <p style="color: #654321; font-size: 16px; line-height: 1.6;">Click the link below to reset your password and get back to rating those curries:</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #FF6347, #FF4500); color: white; padding: 14px 32px; text-decoration: none; border-radius: 24px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">Reset Password</a>
              </div>
              <p style="color: #8B4513; font-size: 14px; margin-bottom: 0;">This link will expire in 24 hours.</p>
            </div>
            <p style="color: #A0826D; font-size: 13px; text-align: center; margin-top: 16px; font-style: italic;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send password reset email: ${error}`);
    }
  },
});
