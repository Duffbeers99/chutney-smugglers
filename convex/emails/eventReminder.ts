import { sendEmail } from "./brevoClient";
import {
  emailWrapper,
  contentCard,
  heading,
  paragraph,
  button,
  smallText,
  footer,
  eventDetails,
  attendeeList,
} from "./templates";

interface EventReminderParams {
  recipientEmail: string;
  recipientName: string;
  venueName: string;
  address: string;
  date: string; // Formatted date string
  time: string; // HH:mm format
  googlePlaceId?: string;
  attendeeNames?: string[];
  hoursUntilEvent: number;
}

/**
 * Send an event reminder email to a user
 */
export async function sendEventReminder(params: EventReminderParams): Promise<void> {
  const {
    recipientEmail,
    recipientName,
    venueName,
    address,
    date,
    time,
    googlePlaceId,
    attendeeNames,
    hoursUntilEvent,
  } = params;

  // Build Google Maps URL if place ID is available
  const mapUrl = googlePlaceId
    ? `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${googlePlaceId}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  // Determine reminder message based on time until event
  const reminderText = hoursUntilEvent <= 24
    ? `Your curry adventure is tomorrow!`
    : `Your curry adventure is coming up in ${Math.round(hoursUntilEvent / 24)} days!`;

  // Build email content
  const content = contentCard(`
    ${heading(`Curry Reminder 🍛`)}
    ${paragraph(`Hey ${recipientName}! ${reminderText}`)}
    ${eventDetails({
      venueName,
      date,
      time,
      address,
    })}
    ${attendeeNames && attendeeNames.length > 0 ? attendeeList(attendeeNames) : ''}
    ${button(mapUrl, 'View on Google Maps')}
    ${smallText("Don't forget to bring your appetite and your rating skills!")}
  `) + footer("See you there for another curry conquest!");

  const htmlContent = emailWrapper(content);

  await sendEmail({
    to: [{ email: recipientEmail, name: recipientName }],
    subject: `Reminder: Curry at ${venueName} - ${date}`,
    htmlContent,
    textContent: `
      Curry Reminder!

      ${reminderText}

      Venue: ${venueName}
      Date: ${date}
      Time: ${time}
      Address: ${address}

      ${attendeeNames && attendeeNames.length > 0 ? `Who's coming:\n${attendeeNames.map(name => `- ${name}`).join('\n')}` : ''}

      View on Google Maps: ${mapUrl}

      Don't forget to bring your appetite and your rating skills!
    `,
  });
}
