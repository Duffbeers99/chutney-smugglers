import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get current authenticated user with profile image URL
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    // Get profile image URL if user has one
    let profileImageUrl: string | null = null;
    if (user.profileImageId) {
      profileImageUrl = await ctx.storage.getUrl(user.profileImageId);
    }

    return {
      ...user,
      profileImageUrl,
    };
  },
});

// Get user by ID (for displaying other users)
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    let profileImageUrl: string | null = null;
    if (user.profileImageId) {
      profileImageUrl = await ctx.storage.getUrl(user.profileImageId);
    }

    return {
      _id: user._id,
      nickname: user.nickname,
      profileImageUrl,
      curriesRated: user.curriesRated,
      curriesAdded: user.curriesAdded,
      averageRating: user.averageRating,
    };
  },
});

// Get user statistics
export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    // Get this month's ratings count
    const now = Date.now();
    const startOfMonth = new Date(new Date(now).getFullYear(), new Date(now).getMonth(), 1).getTime();

    const ratingsThisMonth = await ctx.db
      .query("ratings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("createdAt"), startOfMonth))
      .collect();

    // Get all ratings for average calculation
    const allRatings = await ctx.db
      .query("ratings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const totalRatings = allRatings.length;
    const averageRating = totalRatings > 0
      ? allRatings.reduce((sum, r) => sum + (r.food + r.service + r.extras + r.atmosphere) / 4, 0) / totalRatings
      : 0;

    return {
      ratingsThisMonth: ratingsThisMonth.length,
      totalRatings,
      averageRating: Math.round(averageRating * 10) / 10,
      curriesAdded: user.curriesAdded || 0,
    };
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    nickname: v.optional(v.string()),
    profileImageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const updates: Record<string, unknown> = {};
    if (args.nickname !== undefined) {
      // Validate nickname
      if (args.nickname.length < 2 || args.nickname.length > 30) {
        throw new Error("Nickname must be between 2 and 30 characters");
      }
      updates.nickname = args.nickname;
    }
    if (args.profileImageId !== undefined) {
      updates.profileImageId = args.profileImageId;
    }

    await ctx.db.patch(userId, updates);
    return { success: true };
  },
});

// Complete onboarding
export const completeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(userId, {
      onboardingComplete: true,
    });
    return { success: true };
  },
});

// Remove profile image
export const removeProfileImage = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Delete the old image from storage if it exists
    if (user.profileImageId) {
      await ctx.storage.delete(user.profileImageId);
    }

    await ctx.db.patch(userId, { profileImageId: undefined });
    return { success: true };
  },
});

// Initialize user statistics
export const initializeUserStats = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Initialize stats if they don't exist
    if (user.curriesRated === undefined) {
      await ctx.db.patch(userId, {
        curriesRated: 0,
        curriesAdded: 0,
        averageRating: 0,
        createdAt: Date.now(),
      });
    }
  },
});
