import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getUserActiveGroup } from "./groups";
import { startOfMonth, addMonths, startOfDay, endOfMonth } from "date-fns";

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

    // Normalize date to start of day
    const normalizedDate = startOfDay(new Date(args.date)).getTime();

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
