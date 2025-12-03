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

interface BookerReminderParams {
  recipientEmail: string;
  recipientName: string;
  groupName: string;
  dashboardUrl: string;
}

/**
 * Send a reminder email to the current booker to schedule the next curry
 */
export async function sendBookerReminder(params: BookerReminderParams): Promise<void> {
  const {
    recipientEmail,
    recipientName,
    groupName,
    dashboardUrl,
  } = params;

  // Build email content
  const content = contentCard(`
    ${heading(`Time to Book the Next Curry! 🍛`)}
    ${paragraph(`Hi ${recipientName}! You're up next in the ${groupName} booking rotation.`)}
    ${paragraph(`It's your turn to pick our next curry destination and schedule the event. The team is counting on you to keep our curry tradition going!`)}
    ${paragraph(`Choose a restaurant from our list or add a new one, then set a date and time that works for the group.`)}
    ${button(dashboardUrl, 'Book the Curry Now')}
    ${smallText('This reminder is sent weekly until the curry is booked.')}
  `) + footer("Let's keep the curry nights rolling!");

  const htmlContent = emailWrapper(content);

  await sendEmail({
    to: [{ email: recipientEmail, name: recipientName }],
    subject: `🍛 It's Your Turn: Book the Next ${groupName} Curry`,
    htmlContent,
    textContent: `
      Time to Book the Next Curry!

      Hi ${recipientName}! You're up next in the ${groupName} booking rotation.

      It's your turn to pick our next curry destination and schedule the event. The team is counting on you to keep our curry tradition going!

      Choose a restaurant from our list or add a new one, then set a date and time that works for the group.

      Book now: ${dashboardUrl}

      This reminder is sent weekly until the curry is booked.

      Let's keep the curry nights rolling!
    `,
  });
}
