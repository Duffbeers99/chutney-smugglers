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

export default crons;
