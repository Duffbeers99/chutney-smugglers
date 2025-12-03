import { sendEmail } from "./brevoClient";
import {
  emailWrapper,
  contentCard,
  heading,
  paragraph,
  button,
  smallText,
  footer,
} from "./templates";

interface VotingReminderParams {
  recipientEmail: string;
  recipientName: string;
  groupName: string;
  dashboardUrl: string;
}

/**
 * Send a reminder email to users who haven't voted for next curry dates
 */
export async function sendVotingReminder(params: VotingReminderParams): Promise<void> {
  const {
    recipientEmail,
    recipientName,
    groupName,
    dashboardUrl,
  } = params;

  // Build email content
  const content = contentCard(`
    ${heading(`Vote for Next Curry Date! 📅`)}
    ${paragraph(`Hi ${recipientName}! We're planning the next ${groupName} curry and need your input.`)}
    ${paragraph(`Help us find the perfect date by selecting all the days you're available in the calendar. The more people who vote, the easier it is to find a date that works for everyone!`)}
    ${button(dashboardUrl, 'Vote for Dates')}
    ${smallText('This reminder is sent twice a week to members who haven\'t voted yet.')}
  `) + footer("Let's find a date that works for everyone!");

  const htmlContent = emailWrapper(content);

  await sendEmail({
    to: [{ email: recipientEmail, name: recipientName }],
    subject: `🍛 Vote for Next ${groupName} Curry Date`,
    htmlContent,
    textContent: `
      Vote for Next Curry Date!

      Hi ${recipientName}! We're planning the next ${groupName} curry and need your input.

      Help us find the perfect date by selecting all the days you're available in the calendar. The more people who vote, the easier it is to find a date that works for everyone!

      Vote now: ${dashboardUrl}

      This reminder is sent twice a week to members who haven't voted yet.

      Let's find a date that works for everyone!
    `,
  });
}
