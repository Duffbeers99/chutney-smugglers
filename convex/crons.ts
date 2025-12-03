import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Send reminder emails for events happening in the next 24-48 hours
 * Runs daily at 9:00 AM UTC (10:00 AM BST / 9:00 AM GMT)
 */
crons.daily(
  "send event reminders",
  { hourUTC: 9, minuteUTC: 0 },
  internal.curryEvents.sendEventReminders
);

/**
 * Send voting reminder emails to users who haven't voted yet
 * Runs twice a week: Monday and Thursday at 10:00 AM UTC (11:00 AM BST / 10:00 AM GMT)
 */
crons.weekly(
  "send voting reminders - Monday",
  { dayOfWeek: "monday", hourUTC: 10, minuteUTC: 0 },
  internal.dateVotes.sendVotingReminders
);

crons.weekly(
  "send voting reminders - Thursday",
  { dayOfWeek: "thursday", hourUTC: 10, minuteUTC: 0 },
  internal.dateVotes.sendVotingReminders
);

/**
 * Send booking reminder to current booker if no curry is scheduled
 * Runs every Wednesday at 10:00 AM UTC (11:00 AM BST / 10:00 AM GMT)
 * Stops automatically when a curry is booked
 */
crons.weekly(
  "send booker reminder - Wednesday",
  { dayOfWeek: "wednesday", hourUTC: 10, minuteUTC: 0 },
  internal.curryEvents.sendBookerReminders
);

export default crons;
