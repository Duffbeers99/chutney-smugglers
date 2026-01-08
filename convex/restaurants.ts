import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getUserActiveGroup, checkGroupAccess } from "./groups";

// List all restaurants with booker information
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const groupId = await getUserActiveGroup(ctx, userId);
    if (!groupId) return [];

    const restaurants = await ctx.db
      .query("restaurants")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();

    // Enrich each restaurant with booker information and ratings from most recent event
    const enriched = await Promise.all(
      restaurants.map(async (restaurant) => {
        // Find the most recent curry event for this restaurant
        const events = await ctx.db
          .query("curryEvents")
          .filter((q) => q.eq(q.field("restaurantId"), restaurant._id))
          .collect();

        // Sort by date (most recent first)
        const sortedEvents = events.sort((a, b) => {
          const [aHours, aMinutes] = a.scheduledTime.split(":").map(Number);
          const aDateTime = new Date(a.scheduledDate);
          aDateTime.setHours(aHours, aMinutes, 0, 0);

          const [bHours, bMinutes] = b.scheduledTime.split(":").map(Number);
          const bDateTime = new Date(b.scheduledDate);
          bDateTime.setHours(bHours, bMinutes, 0, 0);

          return bDateTime.getTime() - aDateTime.getTime();
        });

        const mostRecentEvent = sortedEvents[0];

        let booker = null;
        let mostRecentVisitDate = 0;
        if (mostRecentEvent) {
          const bookerUser = await ctx.db.get(mostRecentEvent.createdBy);
          if (bookerUser) {
            let profileImageUrl: string | null = null;
            if (bookerUser.profileImageId) {
              profileImageUrl = await ctx.storage.getUrl(bookerUser.profileImageId);
            }

            booker = {
              _id: bookerUser._id,
              nickname: bookerUser.nickname,
              profileImageUrl,
            };
          }

          // Calculate the full date/time for sorting
          const [hours, minutes] = mostRecentEvent.scheduledTime.split(":").map(Number);
          const visitDateTime = new Date(mostRecentEvent.scheduledDate);
          visitDateTime.setHours(hours, minutes, 0, 0);
          mostRecentVisitDate = visitDateTime.getTime();
        }

        // Fetch all ratings for this restaurant with user info
        const ratings = await ctx.db
          .query("ratings")
          .filter((q) => q.eq(q.field("restaurantId"), restaurant._id))
          .collect();

        // Enrich ratings with user information
        const enrichedRatings = await Promise.all(
          ratings.map(async (rating) => {
            const user = await ctx.db.get(rating.userId);
            if (!user) return null;

            let profileImageUrl: string | null = null;
            if (user.profileImageId) {
              profileImageUrl = await ctx.storage.getUrl(user.profileImageId);
            }

            return {
              _id: rating._id,
              userId: user._id,
              userName: user.nickname || user.name,
              profileImageUrl,
              food: rating.food,
              service: rating.service,
              extras: rating.extras,
              atmosphere: rating.atmosphere,
              overallScore: rating.food + rating.service + rating.extras + rating.atmosphere,
              notes: rating.notes,
              createdAt: rating._creationTime,
              isSoloMission: rating.isSoloMission || false,
            };
          })
        );

        // Check if this restaurant has any solo missions
        const hasSoloMissions = ratings.some((r) => r.isSoloMission);

        return {
          ...restaurant,
          booker,
          mostRecentVisitDate,
          ratings: enrichedRatings.filter((r) => r !== null),
          hasSoloMissions,
        };
      })
    );

    // Sort restaurants by most recent visit date (descending)
    const sorted = enriched.sort((a, b) => b.mostRecentVisitDate - a.mostRecentVisitDate);

    return sorted;
  },
});

// Get a single restaurant by ID
export const get = query({
  args: { id: v.id("restaurants") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const groupId = await getUserActiveGroup(ctx, userId);
    if (!groupId) return null;

    const restaurant = await ctx.db.get(args.id);

    // Verify restaurant belongs to user's group
    if (!restaurant || restaurant.groupId !== groupId) {
      return null;
    }

    return restaurant;
  },
});

// Search restaurants by name
export const search = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const groupId = await getUserActiveGroup(ctx, userId);
    if (!groupId) return [];

    const allRestaurants = await ctx.db
      .query("restaurants")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();

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
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const groupId = await getUserActiveGroup(ctx, userId);
    if (!groupId) return [];

    const limit = args.limit || 10;

    const restaurants = await ctx.db
      .query("restaurants")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
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
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const groupId = await getUserActiveGroup(ctx, userId);
    if (!groupId) return [];

    const limit = args.limit || 5;

    const restaurants = await ctx.db
      .query("restaurants")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
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

    const groupId = await getUserActiveGroup(ctx, userId);
    if (!groupId) throw new Error("You must be in a group to add restaurants");

    // Check if restaurant already exists in this group
    const existing = await ctx.db
      .query("restaurants")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existing) {
      throw new Error("A restaurant with this name already exists in your group");
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
      groupId,
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
  const allRatings = await ctx.db
    .query("ratings")
    .withIndex("by_restaurant", (q: any) => q.eq("restaurantId", restaurantId))
    .collect();

  // Filter out solo missions - they don't count toward leaderboard aggregates
  const ratings = allRatings.filter((r: any) => !r.isSoloMission);

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

  // Calculate average price from events (not ratings)
  // This includes both prices from user ratings and retrospectively set prices
  const events = await ctx.db
    .query("curryEvents")
    .filter((q: any) => q.eq(q.field("restaurantId"), restaurantId))
    .collect();

  const eventsWithPrice = events.filter((e: any) => e.averagePriceRanking !== undefined && e.averagePriceRanking !== null);
  let avgPrice: number | undefined = undefined;
  if (eventsWithPrice.length > 0) {
    const totalPrice = eventsWithPrice.reduce((sum: number, e: any) => sum + e.averagePriceRanking, 0);
    avgPrice = Math.round(totalPrice / eventsWithPrice.length); // Round to nearest integer (1-5)
  }

  // Round to nearest 0.5
  const roundToHalf = (num: number) => Math.round(num * 2) / 2;

  await ctx.db.patch(restaurantId, {
    averageFood: roundToHalf(avgFood),
    averageService: roundToHalf(avgService),
    averageExtras: roundToHalf(avgExtras),
    averageAtmosphere: roundToHalf(avgAtmosphere),
    overallAverage: roundToHalf(overall),
    averagePriceRanking: avgPrice,
    totalRatings: ratings.length,
  });
}

// Update restaurant aggregate ratings (mutation wrapper)
export const updateAggregates = mutation({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const groupId = await getUserActiveGroup(ctx, userId);
    if (!groupId) throw new Error("You must be in a group");

    // Verify restaurant belongs to user's group
    const restaurant = await ctx.db.get(args.restaurantId);
    if (!restaurant || restaurant.groupId !== groupId) {
      throw new Error("Restaurant not found or you don't have access");
    }

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

    const groupId = await getUserActiveGroup(ctx, userId);
    if (!groupId) throw new Error("You must be in a group");

    const restaurant = await ctx.db.get(args.restaurantId);
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    // Verify restaurant belongs to user's group
    if (restaurant.groupId !== groupId) {
      throw new Error("You don't have access to this restaurant");
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

