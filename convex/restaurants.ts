import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// List all restaurants
export const list = query({
  args: {},
  handler: async (ctx) => {
    const restaurants = await ctx.db
      .query("restaurants")
      .order("desc")
      .collect();

    return restaurants;
  },
});

// Get a single restaurant by ID
export const get = query({
  args: { id: v.id("restaurants") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Search restaurants by name
export const search = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const allRestaurants = await ctx.db.query("restaurants").collect();

    const searchLower = args.searchTerm.toLowerCase();
    return allRestaurants.filter((restaurant) =>
      restaurant.name.toLowerCase().includes(searchLower) ||
      restaurant.address.toLowerCase().includes(searchLower)
    );
  },
});

// Get top rated restaurants with most recent rating info
export const getTopRated = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    const restaurants = await ctx.db
      .query("restaurants")
      .filter((q) => q.gt(q.field("totalRatings"), 0))
      .collect();

    // Sort by overall average rating
    const sorted = restaurants
      .sort((a, b) => (b.overallAverage || 0) - (a.overallAverage || 0))
      .slice(0, limit);

    // Enrich with most recent rating info
    const enriched = await Promise.all(
      sorted.map(async (restaurant) => {
        // Get most recent rating for this restaurant
        const recentRating = await ctx.db
          .query("ratings")
          .withIndex("by_restaurant", (q) => q.eq("restaurantId", restaurant._id))
          .order("desc")
          .first();

        let mostRecentVisit = null;
        if (recentRating) {
          const user = recentRating.claimedBy
            ? await ctx.db.get(recentRating.claimedBy)
            : null;

          mostRecentVisit = {
            visitDate: recentRating.visitDate,
            bookerName: recentRating.bookerName,
            claimedBy: user?.nickname || null,
          };
        }

        return {
          ...restaurant,
          mostRecentVisit,
        };
      })
    );

    return enriched;
  },
});

// Get restaurants by category leader
export const getCategoryLeaders = query({
  args: {
    category: v.union(
      v.literal("food"),
      v.literal("service"),
      v.literal("extras"),
      v.literal("atmosphere")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;

    const restaurants = await ctx.db
      .query("restaurants")
      .filter((q) => q.gt(q.field("totalRatings"), 0))
      .collect();

    // Sort by the specified category
    const fieldMap = {
      food: "averageFood",
      service: "averageService",
      extras: "averageExtras",
      atmosphere: "averageAtmosphere",
    };

    const field = fieldMap[args.category];
    const sorted = restaurants
      .sort((a, b) => ((b as any)[field] || 0) - ((a as any)[field] || 0))
      .slice(0, limit);

    return sorted;
  },
});

// Add a new restaurant
export const add = mutation({
  args: {
    name: v.string(),
    address: v.string(),
    cuisine: v.optional(v.string()),
    googlePlaceId: v.optional(v.string()),
    location: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if restaurant already exists
    const existing = await ctx.db
      .query("restaurants")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existing) {
      throw new Error("A restaurant with this name already exists");
    }

    const restaurantId = await ctx.db.insert("restaurants", {
      name: args.name,
      address: args.address,
      cuisine: args.cuisine,
      googlePlaceId: args.googlePlaceId,
      location: args.location,
      addedBy: userId,
      addedAt: Date.now(),
      totalRatings: 0,
    });

    // Update user's curriesAdded count
    const user = await ctx.db.get(userId);
    if (user) {
      await ctx.db.patch(userId, {
        curriesAdded: (user.curriesAdded || 0) + 1,
      });
    }

    return restaurantId;
  },
});

// Internal function to update aggregates (can be called from other functions)
export async function updateRestaurantAggregates(
  ctx: any,
  restaurantId: any
) {
  const ratings = await ctx.db
    .query("ratings")
    .withIndex("by_restaurant", (q: any) => q.eq("restaurantId", restaurantId))
    .collect();

  if (ratings.length === 0) {
    await ctx.db.patch(restaurantId, {
      averageFood: undefined,
      averageService: undefined,
      averageExtras: undefined,
      averageAtmosphere: undefined,
      overallAverage: undefined,
      totalRatings: 0,
    });
    return;
  }

  const avgFood = ratings.reduce((sum: number, r: any) => sum + r.food, 0) / ratings.length;
  const avgService = ratings.reduce((sum: number, r: any) => sum + r.service, 0) / ratings.length;
  const avgExtras = ratings.reduce((sum: number, r: any) => sum + r.extras, 0) / ratings.length;
  const avgAtmosphere = ratings.reduce((sum: number, r: any) => sum + r.atmosphere, 0) / ratings.length;
  const overall = avgFood + avgService + avgExtras + avgAtmosphere; // Sum of averages (out of 20)

  // Round to nearest 0.5
  const roundToHalf = (num: number) => Math.round(num * 2) / 2;

  await ctx.db.patch(restaurantId, {
    averageFood: roundToHalf(avgFood),
    averageService: roundToHalf(avgService),
    averageExtras: roundToHalf(avgExtras),
    averageAtmosphere: roundToHalf(avgAtmosphere),
    overallAverage: roundToHalf(overall),
    totalRatings: ratings.length,
  });
}

// Update restaurant aggregate ratings (mutation wrapper)
export const updateAggregates = mutation({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, args) => {
    await updateRestaurantAggregates(ctx, args.restaurantId);
  },
});

// Update restaurant details (for completing incomplete backdated restaurants)
export const updateRestaurantDetails = mutation({
  args: {
    restaurantId: v.id("restaurants"),
    name: v.string(),
    address: v.string(),
    googlePlaceId: v.optional(v.string()),
    location: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const restaurant = await ctx.db.get(args.restaurantId);
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    // Update restaurant with complete details and mark as complete
    await ctx.db.patch(args.restaurantId, {
      name: args.name,
      address: args.address,
      googlePlaceId: args.googlePlaceId,
      location: args.location,
      isIncomplete: false,
    });

    return { success: true };
  },
});

