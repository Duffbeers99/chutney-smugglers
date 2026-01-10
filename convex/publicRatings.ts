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

// Public version: Get recent ratings across all users (for activity feed, hides unrevealed event ratings)
export const getRecentRatingsPublic = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const groupId = await getChutneySmugglersGroupId(ctx);

    const limit = args.limit || 10;

    // Get ratings filtered by group
    const allRatings = await ctx.db
      .query("ratings")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .order("desc")
      .collect();

    const ratings = allRatings.slice(0, limit * 2); // Take more to account for filtered ratings

    // Filter out unrevealed event ratings and enrich with user and restaurant data
    const enriched = await Promise.all(
      ratings.map(async (rating) => {
        // Check if this is an event-based rating
        if (rating.eventId) {
          const event = await ctx.db.get(rating.eventId);
          // Hide rating if event exists and ratings not revealed
          if (event && !event.ratingsRevealed) {
            return null;
          }
        }

        const user = await ctx.db.get(rating.userId);
        const restaurant = await ctx.db.get(rating.restaurantId);

        let profileImageUrl: string | null = null;
        if (user?.profileImageId) {
          profileImageUrl = await ctx.storage.getUrl(user.profileImageId);
        }

        // Get claimed user full data if rating was claimed
        let claimedByUser = null;
        if (rating.claimedBy) {
          const claimedUser = await ctx.db.get(rating.claimedBy);
          if (claimedUser) {
            let claimedProfileImageUrl: string | null = null;
            if (claimedUser.profileImageId) {
              claimedProfileImageUrl = await ctx.storage.getUrl(claimedUser.profileImageId);
            }
            claimedByUser = {
              _id: claimedUser._id,
              nickname: claimedUser.nickname,
              profileImageUrl: claimedProfileImageUrl,
            };
          }
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
          claimedByUser,
        };
      })
    );

    // Filter out nulls (hidden ratings) and limit to requested amount
    return enriched.filter((rating) => rating !== null).slice(0, limit);
  },
});

// Public version: Get top bookers leaderboard (users who book curries)
export const getTopBookersPublic = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const groupId = await getChutneySmugglersGroupId(ctx);

    const limit = args.limit || 10;

    // Get ratings from the group only
    const allRatings = await ctx.db
      .query("ratings")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();

    // Group ratings by event/restaurant visit to calculate average per curry
    const visitMap = new Map<string, {
      bookerId: string | null,
      restaurantId: string,
      restaurantName: string,
      ratings: number[]
    }>();

    for (const rating of allRatings) {
      // Skip solo missions (they don't count toward leaderboards)
      if (rating.isSoloMission) continue;

      // Skip ratings where we can't determine the booker
      let bookerId: string | null = null;
      let visitKey: string;

      // Identify the booker
      if (rating.eventId) {
        const event = await ctx.db.get(rating.eventId);
        if (event && event.ratingsRevealed) {
          bookerId = event.createdBy;
          visitKey = rating.eventId; // Use eventId as visit key
        } else {
          continue; // Skip unrevealed event ratings
        }
      } else if (rating.claimedBy) {
        bookerId = rating.claimedBy;
        // For claimed ratings, use combination of booker+restaurant+date as visit key
        visitKey = `${rating.claimedBy}_${rating.restaurantId}_${rating.visitDate}`;
      } else {
        // Skip unclaimed backdated ratings (only bookerName)
        continue;
      }

      if (!bookerId) continue;

      // Calculate overall rating (0-20 scale)
      const overallRating = rating.food + rating.service + rating.extras + rating.atmosphere;

      // Get restaurant name
      const restaurant = await ctx.db.get(rating.restaurantId);
      const restaurantName = restaurant?.name || "Unknown";

      if (visitMap.has(visitKey)) {
        visitMap.get(visitKey)!.ratings.push(overallRating);
      } else {
        visitMap.set(visitKey, {
          bookerId,
          restaurantId: rating.restaurantId,
          restaurantName,
          ratings: [overallRating]
        });
      }
    }

    // Calculate average per curry visit and group by booker
    const bookerMap = new Map<string, {
      userId: string,
      curryScores: number[],
      curries: Array<{ restaurantId: string, restaurantName: string, score: number }>
    }>();

    for (const [_, visit] of visitMap) {
      if (!visit.bookerId) continue;

      // Calculate average rating for this curry
      const avgRating = visit.ratings.reduce((sum, r) => sum + r, 0) / visit.ratings.length;

      if (bookerMap.has(visit.bookerId)) {
        const booker = bookerMap.get(visit.bookerId)!;
        booker.curryScores.push(avgRating);
        booker.curries.push({
          restaurantId: visit.restaurantId,
          restaurantName: visit.restaurantName,
          score: avgRating
        });
      } else {
        bookerMap.set(visit.bookerId, {
          userId: visit.bookerId,
          curryScores: [avgRating],
          curries: [{
            restaurantId: visit.restaurantId,
            restaurantName: visit.restaurantName,
            score: avgRating
          }]
        });
      }
    }

    // Calculate final stats and sort
    const bookers = Array.from(bookerMap.values())
      .map(b => {
        const averageScore = b.curryScores.reduce((sum, s) => sum + s, 0) / b.curryScores.length;
        // Find best curry
        const bestCurry = b.curries.reduce((best, curr) =>
          curr.score > best.score ? curr : best
        );

        // Round to nearest 0.5
        const roundToHalf = (num: number) => Math.round(num * 2) / 2;

        return {
          userId: b.userId,
          curriesBooked: b.curryScores.length,
          averageScore: roundToHalf(averageScore),
          bestCurry: {
            name: bestCurry.restaurantName,
            score: roundToHalf(bestCurry.score)
          },
          curries: b.curries.map(c => ({
            restaurantName: c.restaurantName,
            score: roundToHalf(c.score)
          }))
        };
      })
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, limit);

    // Enrich with user data
    const enriched = await Promise.all(
      bookers.map(async (booker) => {
        // Type assertion for user ID
        const userId = booker.userId as any as ReturnType<typeof ctx.db.normalizeId<"users">>;
        const user = await ctx.db.get(userId as any);
        if (!user || !("nickname" in user)) return null;

        let profileImageUrl: string | null = null;
        if ("profileImageId" in user && user.profileImageId) {
          profileImageUrl = await ctx.storage.getUrl(user.profileImageId);
        }

        return {
          _id: user._id,
          nickname: user.nickname,
          profileImageUrl,
          curriesBooked: booker.curriesBooked,
          averageScore: booker.averageScore,
          bestCurry: booker.bestCurry,
          curries: booker.curries,
        };
      })
    );

    // Filter out nulls
    return enriched.filter((b) => b !== null);
  },
});
