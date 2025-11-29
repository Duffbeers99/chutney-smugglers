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

// Get top rated restaurants
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

    return sorted;
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
  const overall = (avgFood + avgService + avgExtras + avgAtmosphere) / 4;

  await ctx.db.patch(restaurantId, {
    averageFood: Math.round(avgFood * 10) / 10,
    averageService: Math.round(avgService * 10) / 10,
    averageExtras: Math.round(avgExtras * 10) / 10,
    averageAtmosphere: Math.round(avgAtmosphere * 10) / 10,
    overallAverage: Math.round(overall * 10) / 10,
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

