import { v } from "convex/values";
import { query } from "./_generated/server";

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

// Public version: List all restaurants with booker information
export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const groupId = await getChutneySmugglersGroupId(ctx);

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
              visitDate: rating.visitDate,
              price: rating.price,
              isSoloMission: rating.isSoloMission || false,
            };
          })
        );

        // Check if this restaurant has any solo missions
        const hasSoloMissions = ratings.some((r) => r.isSoloMission);

        // Calculate solo mission averages (if any)
        const soloMissionRatings = ratings.filter((r) => r.isSoloMission);
        let soloMissionAverage = null;
        let soloMissionPrice = null;
        let mostRecentSoloMissionDate = 0;

        if (soloMissionRatings.length > 0) {
          // Find most recent solo mission
          const sortedSoloMissions = soloMissionRatings.sort((a, b) => b.visitDate - a.visitDate);
          mostRecentSoloMissionDate = sortedSoloMissions[0].visitDate;

          // Calculate average from most recent solo mission
          const recentSolo = sortedSoloMissions[0];
          soloMissionAverage = recentSolo.food + recentSolo.service + recentSolo.extras + recentSolo.atmosphere;
          soloMissionPrice = recentSolo.price;
        }

        // Use solo mission date if more recent than event date
        const finalMostRecentVisitDate = Math.max(mostRecentVisitDate, mostRecentSoloMissionDate);

        return {
          ...restaurant,
          booker,
          mostRecentVisitDate: finalMostRecentVisitDate,
          ratings: enrichedRatings.filter((r) => r !== null),
          hasSoloMissions,
          soloMissionAverage,
          soloMissionPrice,
        };
      })
    );

    // Sort restaurants by most recent visit date (descending)
    const sorted = enriched.sort((a, b) => b.mostRecentVisitDate - a.mostRecentVisitDate);

    return sorted;
  },
});

// Public version: Get a single restaurant by ID
export const getPublic = query({
  args: { id: v.id("restaurants") },
  handler: async (ctx, args) => {
    const groupId = await getChutneySmugglersGroupId(ctx);

    const restaurant = await ctx.db.get(args.id);

    // Verify restaurant belongs to the public group
    if (!restaurant || restaurant.groupId !== groupId) {
      return null;
    }

    return restaurant;
  },
});

// Public version: Get top rated restaurants with most recent rating info
export const getTopRatedPublic = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const groupId = await getChutneySmugglersGroupId(ctx);

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

// Public version: Get restaurants by category leader
export const getCategoryLeadersPublic = query({
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
    const groupId = await getChutneySmugglersGroupId(ctx);

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
