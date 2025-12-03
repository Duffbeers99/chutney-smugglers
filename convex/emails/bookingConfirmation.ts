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

interface BookingConfirmationParams {
  recipientEmail: string;
  recipientName: string;
  venueName: string;
  address: string;
  date: string; // Formatted date string
  time: string; // HH:mm format
  googlePlaceId?: string;
  attendeeNames?: string[];
  bookerName: string;
}

/**
 * Send a booking confirmation email to a user
 */
export async function sendBookingConfirmation(params: BookingConfirmationParams): Promise<void> {
  const {
    recipientEmail,
    recipientName,
    venueName,
    address,
    date,
    time,
    googlePlaceId,
    attendeeNames,
    bookerName,
  } = params;

  // Build Google Maps URL if place ID is available
  const mapUrl = googlePlaceId
    ? `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${googlePlaceId}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  // Build email content
  const content = contentCard(`
    ${heading(`New Curry Booked! 🎉`)}
    ${paragraph(`Good news, ${recipientName}! ${bookerName} has booked the next curry adventure.`)}
    ${eventDetails({
      venueName,
      date,
      time,
      address,
    })}
    ${attendeeNames && attendeeNames.length > 0 ? attendeeList(attendeeNames) : ''}
    ${button(mapUrl, 'View on Google Maps')}
    ${smallText('Make sure to confirm your attendance in the app!')}
  `) + footer("Time to prepare your taste buds for another curry conquest!");

  const htmlContent = emailWrapper(content);

  await sendEmail({
    to: [{ email: recipientEmail, name: recipientName }],
    subject: `New Curry Booked: ${venueName} - ${date}`,
    htmlContent,
    textContent: `
      New Curry Booked!

      ${bookerName} has booked the next curry at ${venueName}.

      Date: ${date}
      Time: ${time}
      Address: ${address}

      ${attendeeNames && attendeeNames.length > 0 ? `Who's coming:\n${attendeeNames.map(name => `- ${name}`).join('\n')}` : ''}

      View on Google Maps: ${mapUrl}

      Make sure to confirm your attendance in the app!
    `,
  });
}
