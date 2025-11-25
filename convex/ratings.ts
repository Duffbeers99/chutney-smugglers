import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Add a new rating
export const add = mutation({
  args: {
    restaurantId: v.id("restaurants"),
    visitDate: v.number(),
    food: v.number(),
    service: v.number(),
    extras: v.number(),
    atmosphere: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Validate ratings are between 0 and 5
    const ratings = [args.food, args.service, args.extras, args.atmosphere];
    for (const rating of ratings) {
      if (rating < 0 || rating > 5) {
        throw new Error("Ratings must be between 0 and 5");
      }
    }

    // Check if user already rated this restaurant
    const existingRating = await ctx.db
      .query("ratings")
      .withIndex("by_user_and_restaurant", (q) =>
        q.eq("userId", userId).eq("restaurantId", args.restaurantId)
      )
      .first();

    if (existingRating) {
      throw new Error("You have already rated this restaurant. Use update instead.");
    }

    // Create the rating
    const ratingId = await ctx.db.insert("ratings", {
      userId,
      restaurantId: args.restaurantId,
      visitDate: args.visitDate,
      food: args.food,
      service: args.service,
      extras: args.extras,
      atmosphere: args.atmosphere,
      notes: args.notes,
      createdAt: Date.now(),
    });

    // Update user's rating count
    const user = await ctx.db.get(userId);
    if (user) {
      await ctx.db.patch(userId, {
        curriesRated: (user.curriesRated || 0) + 1,
      });
    }

    // Trigger restaurant aggregate update
    const { updateRestaurantAggregates } = await import("./restaurants");
    await updateRestaurantAggregates(ctx, args.restaurantId);

    return ratingId;
  },
});

// Update an existing rating
export const update = mutation({
  args: {
    ratingId: v.id("ratings"),
    visitDate: v.optional(v.number()),
    food: v.optional(v.number()),
    service: v.optional(v.number()),
    extras: v.optional(v.number()),
    atmosphere: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const rating = await ctx.db.get(args.ratingId);
    if (!rating) throw new Error("Rating not found");

    if (rating.userId !== userId) {
      throw new Error("You can only update your own ratings");
    }

    // Validate ratings if provided
    const ratings = [args.food, args.service, args.extras, args.atmosphere];
    for (const rating of ratings) {
      if (rating !== undefined && (rating < 0 || rating > 5)) {
        throw new Error("Ratings must be between 0 and 5");
      }
    }

    const updates: Record<string, unknown> = {};
    if (args.visitDate !== undefined) updates.visitDate = args.visitDate;
    if (args.food !== undefined) updates.food = args.food;
    if (args.service !== undefined) updates.service = args.service;
    if (args.extras !== undefined) updates.extras = args.extras;
    if (args.atmosphere !== undefined) updates.atmosphere = args.atmosphere;
    if (args.notes !== undefined) updates.notes = args.notes;

    await ctx.db.patch(args.ratingId, updates);

    // Trigger restaurant aggregate update
    const { updateRestaurantAggregates } = await import("./restaurants");
    await updateRestaurantAggregates(ctx, rating.restaurantId);

    return { success: true };
  },
});

// Delete a rating
export const remove = mutation({
  args: { ratingId: v.id("ratings") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const rating = await ctx.db.get(args.ratingId);
    if (!rating) throw new Error("Rating not found");

    if (rating.userId !== userId) {
      throw new Error("You can only delete your own ratings");
    }

    await ctx.db.delete(args.ratingId);

    // Update user's rating count
    const user = await ctx.db.get(userId);
    if (user && user.curriesRated) {
      await ctx.db.patch(userId, {
        curriesRated: user.curriesRated - 1,
      });
    }

    // Trigger restaurant aggregate update
    const { updateRestaurantAggregates } = await import("./restaurants");
    await updateRestaurantAggregates(ctx, rating.restaurantId);

    return { success: true };
  },
});

// Get ratings by user
export const getUserRatings = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const userId = args.userId || (await getAuthUserId(ctx));
    if (!userId) return [];

    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    // Enrich with restaurant data
    const enriched = await Promise.all(
      ratings.map(async (rating) => {
        const restaurant = await ctx.db.get(rating.restaurantId);
        return {
          ...rating,
          restaurant,
        };
      })
    );

    return enriched;
  },
});

// Get ratings for a restaurant
export const getRestaurantRatings = query({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, args) => {
    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
      .order("desc")
      .collect();

    // Enrich with user data
    const enriched = await Promise.all(
      ratings.map(async (rating) => {
        const user = await ctx.db.get(rating.userId);
        let profileImageUrl: string | null = null;
        if (user?.profileImageId) {
          profileImageUrl = await ctx.storage.getUrl(user.profileImageId);
        }

        return {
          ...rating,
          user: user
            ? {
                _id: user._id,
                nickname: user.nickname,
                profileImageUrl,
              }
            : null,
        };
      })
    );

    return enriched;
  },
});

// Get recent ratings across all users (for activity feed)
export const getRecentRatings = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    const ratings = await ctx.db
      .query("ratings")
      .order("desc")
      .take(limit);

    // Enrich with user and restaurant data
    const enriched = await Promise.all(
      ratings.map(async (rating) => {
        const user = await ctx.db.get(rating.userId);
        const restaurant = await ctx.db.get(rating.restaurantId);

        let profileImageUrl: string | null = null;
        if (user?.profileImageId) {
          profileImageUrl = await ctx.storage.getUrl(user.profileImageId);
        }

        return {
          ...rating,
          user: user
            ? {
                _id: user._id,
                nickname: user.nickname,
                profileImageUrl,
              }
            : null,
          restaurant,
        };
      })
    );

    return enriched;
  },
});

// Get most active raters (leaderboard)
export const getMostActiveRaters = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    const users = await ctx.db.query("users").collect();

    // Filter and sort by rating count
    const activeUsers = users
      .filter((u) => (u.curriesRated || 0) > 0)
      .sort((a, b) => (b.curriesRated || 0) - (a.curriesRated || 0))
      .slice(0, limit);

    // Enrich with profile images
    const enriched = await Promise.all(
      activeUsers.map(async (user) => {
        let profileImageUrl: string | null = null;
        if (user.profileImageId) {
          profileImageUrl = await ctx.storage.getUrl(user.profileImageId);
        }

        return {
          _id: user._id,
          nickname: user.nickname,
          profileImageUrl,
          curriesRated: user.curriesRated || 0,
          curriesAdded: user.curriesAdded || 0,
          averageRating: user.averageRating || 0,
        };
      })
    );

    return enriched;
  },
});
