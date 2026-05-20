import { query } from "./_generated/server";
import { getEventStartTime } from "./lib/eventTime";

// Helper to get the Chutney Smugglers group ID
async function getChutneySmugglersGroupId(ctx: any) {
  const group = await ctx.db
    .query("groups")
    .filter((q: any) => q.eq(q.field("name"), "Chutney Smugglers"))
    .first();

  if (!group) {
    throw new Error("Chutney Smugglers group not found");
  }

  return group._id;
}

/**
 * Public version: Get all curry events
 */
export const getAllEventsPublic = query({
  args: {},
  handler: async (ctx) => {
    const groupId = await getChutneySmugglersGroupId(ctx);

    const events = await ctx.db
      .query("curryEvents")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();

    // Sort by scheduled date (most recent first)
    return events.sort(
      (a, b) =>
        getEventStartTime(b.scheduledDate, b.scheduledTime) -
        getEventStartTime(a.scheduledDate, a.scheduledTime),
    );
  },
});

/**
 * Public version: Get group journey progress towards Mumbai goal (50 completed curries)
 */
export const getGroupJourneyProgressPublic = query({
  args: {},
  handler: async (ctx) => {
    const groupId = await getChutneySmugglersGroupId(ctx);

    // Count all completed events with ratings revealed
    const completedEvents = await ctx.db
      .query("curryEvents")
      .withIndex("by_group_and_status", (q) => q.eq("groupId", groupId).eq("status", "completed"))
      .collect();

    // Filter to only events with ratings revealed (fully completed)
    const rankedEvents = completedEvents.filter(event => event.ratingsRevealed === true);

    const curriesCompleted = rankedEvents.length;
    const goal = 50;
    const percentage = Math.min((curriesCompleted / goal) * 100, 100);

    return {
      curriesCompleted,
      goal,
      percentage,
    };
  },
});
