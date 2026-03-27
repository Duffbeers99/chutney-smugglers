import { v } from "convex/values";
import { mutation, query, internalAction, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getUserActiveGroup } from "./groups";
import { startOfMonth, addMonths, endOfMonth } from "date-fns";
import { internal } from "./_generated/api";

/**
 * Get all votes for the next month with user details
 * Returns votes grouped by date with user information
 */
export const getNextMonthVotes = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const groupId = await getUserActiveGroup(ctx, userId);
    if (!groupId) return null;

    // Calculate date range for next month
    const now = new Date();
    const nextMonth = addMonths(now, 1);
    const startOfNextMonth = startOfMonth(nextMonth).getTime();
    const endOfNextMonth = endOfMonth(nextMonth).getTime();

    // Get all votes for next month in this group
    const votes = await ctx.db
      .query("dateVotes")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), startOfNextMonth),
          q.lte(q.field("date"), endOfNextMonth)
        )
      )
      .collect();

    // Enrich votes with user information
    const votesWithUsers = await Promise.all(
      votes.map(async (vote) => {
        const user = await ctx.db.get(vote.userId);
        return {
          ...vote,
          user: user
            ? {
                _id: user._id,
                nickname: user.nickname,
                name: user.name,
                profileImageId: user.profileImageId,
              }
            : null,
        };
      })
    );

    return votesWithUsers;
  },
});

/**
 * Get vote summary aggregated by date
 * Returns each date with count and list of users who voted
 */
export const getVoteSummary = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const groupId = await getUserActiveGroup(ctx, userId);
    if (!groupId) return null;

    // Calculate date range for next month
    const now = new Date();
    const nextMonth = addMonths(now, 1);
    const startOfNextMonth = startOfMonth(nextMonth).getTime();
    const endOfNextMonth = endOfMonth(nextMonth).getTime();

    // Get all votes for next month in this group
    const votes = await ctx.db
      .query("dateVotes")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), startOfNextMonth),
          q.lte(q.field("date"), endOfNextMonth)
        )
      )
      .collect();

    // Get all unique dates and count votes
    const dateMap = new Map<
      number,
      { date: number; count: number; users: any[] }
    >();

    for (const vote of votes) {
      const existing = dateMap.get(vote.date);
      const user = await ctx.db.get(vote.userId);

      if (existing) {
        existing.count++;
        if (user) {
          existing.users.push({
            _id: user._id,
            nickname: user.nickname,
            name: user.name,
            profileImageId: user.profileImageId,
          });
        }
      } else {
        dateMap.set(vote.date, {
          date: vote.date,
          count: 1,
          users: user
            ? [
                {
                  _id: user._id,
                  nickname: user.nickname,
                  name: user.name,
                  profileImageId: user.profileImageId,
                },
              ]
            : [],
        });
      }
    }

    // Convert to array and sort by vote count (descending)
    const summary = Array.from(dateMap.values()).sort(
      (a, b) => b.count - a.count
    );

    return summary;
  },
});

/**
 * Get current user's voted dates for next month
 */
export const getUserVotes = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const groupId = await getUserActiveGroup(ctx, userId);
    if (!groupId) return [];

    // Calculate date range for next month
    const now = new Date();
    const nextMonth = addMonths(now, 1);
    const startOfNextMonth = startOfMonth(nextMonth).getTime();
    const endOfNextMonth = endOfMonth(nextMonth).getTime();

    // Get user's votes for next month
    const votes = await ctx.db
      .query("dateVotes")
      .withIndex("by_user_and_group", (q) =>
        q.eq("userId", userId).eq("groupId", groupId)
      )
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), startOfNextMonth),
          q.lte(q.field("date"), endOfNextMonth)
        )
      )
      .collect();

    return votes.map((v) => v.date);
  },
});

/**
 * Toggle a date vote for the current user
 * If vote exists, remove it. If it doesn't exist, add it.
 */
export const toggleDateVote = mutation({
  args: {
    date: v.number(), // Timestamp of the date (should be midnight UTC)
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const groupId = await getUserActiveGroup(ctx, userId);
    if (!groupId) throw new Error("No active group");

    // Normalize date to midnight UTC to ensure consistent storage
    // regardless of client/server timezone differences
    const d = new Date(args.date);
    const normalizedDate = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

    // Check if vote already exists
    const existingVote = await ctx.db
      .query("dateVotes")
      .withIndex("by_user_and_group", (q) =>
        q.eq("userId", userId).eq("groupId", groupId)
      )
      .filter((q) => q.eq(q.field("date"), normalizedDate))
      .first();

    if (existingVote) {
      // Remove vote
      await ctx.db.delete(existingVote._id);
      return { action: "removed", date: normalizedDate };
    } else {
      // Add vote
      await ctx.db.insert("dateVotes", {
        userId,
        date: normalizedDate,
        groupId,
        votedAt: Date.now(),
      });
      return { action: "added", date: normalizedDate };
    }
  },
});

/**
 * Clear all votes for a specific group
 * Should be called when a curry event is created
 * This is an internal function meant to be called from other mutations
 */
export async function clearAllVotes(ctx: any, groupId: any) {
  // Get all votes for this group
  const votes = await ctx.db
    .query("dateVotes")
    .withIndex("by_group", (q: any) => q.eq("groupId", groupId))
    .collect();

  // Delete all votes
  await Promise.all(votes.map((vote: any) => ctx.db.delete(vote._id)));

  return { cleared: votes.length };
}

/**
 * Internal query to get all groups
 */
export const getAllGroups = internalQuery({
  handler: async (ctx) => {
    const groups = await ctx.db.query("groups").collect();
    return groups;
  },
});

/**
 * Internal query to get users who haven't voted yet in a group
 */
export const getUsersWithoutVotes = internalQuery({
  args: {
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    // Calculate date range for next month
    const now = new Date();
    const nextMonth = addMonths(now, 1);
    const startOfNextMonth = startOfMonth(nextMonth).getTime();
    const endOfNextMonth = endOfMonth(nextMonth).getTime();

    // Get all votes for next month in this group
    const votes = await ctx.db
      .query("dateVotes")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), startOfNextMonth),
          q.lte(q.field("date"), endOfNextMonth)
        )
      )
      .collect();

    // Get unique user IDs who have voted
    const usersWhoVoted = new Set(votes.map((vote) => vote.userId));

    // Get all active group members
    const memberships = await ctx.db
      .query("groupMemberships")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Filter to only users who haven't voted
    const usersWithoutVotes = [];
    for (const membership of memberships) {
      if (!usersWhoVoted.has(membership.userId)) {
        const user = await ctx.db.get(membership.userId);
        if (user && user.email) {
          usersWithoutVotes.push({
            _id: user._id,
            email: user.email,
            name: user.nickname || user.name || "Curry Lover",
          });
        }
      }
    }

    return usersWithoutVotes;
  },
});

/**
 * Internal action to send voting reminder emails
 * Called by cron job twice a week
 */
export const sendVotingReminders = internalAction({
  handler: async (ctx) => {
    const { sendVotingReminder } = await import("./emails/votingReminder");

    // Get all groups
    const groups = await ctx.runQuery(internal.dateVotes.getAllGroups);

    let totalEmailsSent = 0;
    const failedEmails: string[] = [];

    console.log(`📧 Starting voting reminder emails for ${groups.length} groups...`);

    for (const group of groups) {
      // Check if there's already an upcoming curry scheduled for this group
      const upcomingEvents = await ctx.runQuery(
        internal.curryEvents.getUpcomingEventsForReminders
      );

      const groupHasUpcomingEvent = upcomingEvents.some(
        (event) => event.groupId === group._id
      );

      if (groupHasUpcomingEvent) {
        console.log(
          `✓ Group "${group.name}" already has a curry scheduled, skipping voting reminders`
        );
        continue;
      }

      // Get users who haven't voted in this group
      const usersWithoutVotes = await ctx.runQuery(
        internal.dateVotes.getUsersWithoutVotes,
        { groupId: group._id }
      );

      console.log(
        `Group "${group.name}": ${usersWithoutVotes.length} users need reminders`
      );

      // Send email to each user who hasn't voted
      for (const user of usersWithoutVotes) {
        try {
          const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL
            ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
            : "https://chutney-smugglers.vercel.app/dashboard";

          await sendVotingReminder({
            recipientEmail: user.email,
            recipientName: user.name,
            groupName: group.name,
            dashboardUrl,
          });

          totalEmailsSent++;
          console.log(`✅ Sent reminder to ${user.name} (${user.email})`);
        } catch (error) {
          console.error(`❌ Failed to send to ${user.email}:`, error);
          failedEmails.push(user.email);
        }
      }
    }

    console.log(
      `📊 Voting reminders complete: ${totalEmailsSent} sent, ${failedEmails.length} failed`
    );

    return {
      emailsSent: totalEmailsSent,
      failedEmails,
    };
  },
});
