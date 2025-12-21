import { sendEmail } from "./brevoClient";
import {
  emailWrapper,
  contentCard,
  heading,
  paragraph,
  smallText,
  footer,
  eventDetails,
} from "./templates";

interface AttendanceReminderParams {
  recipientEmail: string;
  recipientName: string;
  groupName: string;
  venueName: string;
  address: string;
  date: string; // Formatted date string
  time: string; // HH:mm format
  attendeeCount: number;
}

/**
 * Send an attendance confirmation reminder email to users who haven't confirmed
 */
export async function sendAttendanceReminder(params: AttendanceReminderParams): Promise<void> {
  const {
    recipientEmail,
    recipientName,
    groupName,
    venueName,
    address,
    date,
    time,
    attendeeCount,
  } = params;

  const attendanceText = attendeeCount === 0
    ? "No one has confirmed yet - be the first!"
    : attendeeCount === 1
    ? "1 person has confirmed their attendance so far."
    : `${attendeeCount} people have confirmed their attendance so far.`;

  // Build email content
  const content = contentCard(`
    ${heading(`Confirm Your Attendance 🍛`)}
    ${paragraph(`Hi ${recipientName}! The next ${groupName} curry has been booked.`)}
    ${eventDetails({
      venueName,
      date,
      time,
      address,
    })}
    ${paragraph(attendanceText)}
    ${paragraph(`Please open the app to confirm whether you'll be joining us. This helps us get an accurate headcount for the restaurant.`)}
    ${smallText('This reminder is sent twice a week on Tuesdays and Thursdays until you confirm.')}
  `) + footer("Looking forward to seeing you there!");

  const htmlContent = emailWrapper(content);

  await sendEmail({
    to: [{ email: recipientEmail, name: recipientName }],
    subject: `🍛 Confirm Attendance: ${groupName} Curry at ${venueName}`,
    htmlContent,
    textContent: `
      Confirm Your Attendance

      Hi ${recipientName}! The next ${groupName} curry has been booked.

      Venue: ${venueName}
      Date: ${date}
      Time: ${time}
      Address: ${address}

      ${attendanceText}

      Please open the app to confirm whether you'll be joining us. This helps us get an accurate headcount for the restaurant.

      This reminder is sent twice a week on Tuesdays and Thursdays until you confirm.

      Looking forward to seeing you there!
    `,
  });
}
