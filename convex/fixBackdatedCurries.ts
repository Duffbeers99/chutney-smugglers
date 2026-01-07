/**
 * Migration script to fix backdated curry events
 *
 * This script:
 * 1. Finds all completed curry events with 0 or missing attendees (backdated events)
 * 2. Links existing ratings to these events via eventId
 * 3. Populates the hasVoted array with users who submitted ratings
 * 4. Creates placeholder attendees array if needed
 *
 * Run with: npx convex run fixBackdatedCurries:fixBackdatedEvents --groupId <groupId>
 */

import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Query to preview which events will be fixed
 */
export const previewBackdatedEvents = query({
  args: {
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const allCompletedEvents = await ctx.db
      .query("curryEvents")
      .withIndex("by_group_and_status", (q) =>
        q.eq("groupId", args.groupId).eq("status", "completed")
      )
      .filter((q) => q.eq(q.field("ratingsRevealed"), true))
      .collect();

    // Filter to events with 0 or missing attendees (backdated events)
    const backdatedEvents = allCompletedEvents.filter(
      (event) => !event.attendees || event.attendees.length === 0
    );

    return {
      total: backdatedEvents.length,
      events: backdatedEvents.map((e) => ({
        _id: e._id,
        restaurantName: e.restaurantName,
        scheduledDate: e.scheduledDate,
        attendeeCount: e.attendees?.length || 0,
        hasVotedCount: e.hasVoted?.length || 0,
      })),
    };
  },
});

/**
 * Main mutation to fix backdated curry events
 */
export const fixBackdatedEvents = internalMutation({
  args: {
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    console.log("Starting backdated curry event fix...");

    // Find all completed events with 0 or missing attendees
    const allCompletedEvents = await ctx.db
      .query("curryEvents")
      .withIndex("by_group_and_status", (q) =>
        q.eq("groupId", args.groupId).eq("status", "completed")
      )
      .filter((q) => q.eq(q.field("ratingsRevealed"), true))
      .collect();

    const backdatedEvents = allCompletedEvents.filter(
      (event) => !event.attendees || event.attendees.length === 0
    );

    console.log(`Found ${backdatedEvents.length} backdated events to fix`);

    let eventsFixed = 0;
    let ratingsLinked = 0;

    for (const event of backdatedEvents) {
      console.log(`Processing event: ${event.restaurantName} on ${new Date(event.scheduledDate).toLocaleDateString()}`);

      // Find all ratings for this restaurant around the event date
      // We'll match by restaurantId and look for ratings within a 7-day window of the event
      const allRatings = await ctx.db
        .query("ratings")
        .withIndex("by_restaurant", (q) => q.eq("restaurantId", event.restaurantId))
        .collect();

      // Filter to ratings that:
      // 1. Don't already have an eventId, OR
      // 2. Match this event's date (within 7 days)
      const eventDate = event.scheduledDate;
      const sevenDays = 7 * 24 * 60 * 60 * 1000;

      const relevantRatings = allRatings.filter((rating) => {
        const dateDiff = Math.abs(rating.visitDate - eventDate);
        const isCloseDate = dateDiff < sevenDays;
        const needsLinking = !rating.eventId;

        return isCloseDate && needsLinking;
      });

      console.log(`  Found ${relevantRatings.length} ratings to link`);

      // Collect unique user IDs who rated
      const raterUserIds = new Set();

      // Link ratings to this event
      for (const rating of relevantRatings) {
        await ctx.db.patch(rating._id, {
          eventId: event._id,
        });
        raterUserIds.add(rating.userId);
        ratingsLinked++;
      }

      // Convert Set to Array for hasVoted
      const hasVoted = Array.from(raterUserIds) as any;

      // Create a placeholder attendees array with the same users
      // (This ensures attendees.length will return the correct count)
      const attendees = hasVoted.length > 0 ? hasVoted : ([] as any);

      // Update the event with hasVoted and attendees arrays
      await ctx.db.patch(event._id, {
        hasVoted,
        attendees,
      });

      console.log(`  Updated event with ${hasVoted.length} users in hasVoted/attendees`);
      eventsFixed++;
    }

    return {
      success: true,
      message: `Fixed ${eventsFixed} backdated events and linked ${ratingsLinked} ratings`,
      eventsFixed,
      ratingsLinked,
    };
  },
});
