import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { updateRestaurantAggregates } from "./restaurants";

// Add a new rating (event-based)
export const add = mutation({
  args: {
    eventId: v.id("curryEvents"),
    food: v.number(),
    service: v.number(),
    extras: v.number(),
    atmosphere: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get the event
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Check if event has started
    const [hours, minutes] = event.scheduledTime.split(":").map(Number);
    const eventDateTime = new Date(event.scheduledDate);
    eventDateTime.setHours(hours, minutes, 0, 0);
    const now = Date.now();

    if (eventDateTime.getTime() > now) {
      throw new Error("Cannot rate an event that hasn't started yet");
    }

    // Check if user attended this event
    const attendees = event.attendees || [];
    if (!attendees.includes(userId)) {
      throw new Error("You must have confirmed attendance to rate this event");
    }

    // Check if user already rated this event
    const existingEventRating = await ctx.db
      .query("ratings")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (existingEventRating) {
      throw new Error("You have already rated this event");
    }

    // Validate ratings are between 0 and 5
    const ratings = [args.food, args.service, args.extras, args.atmosphere];
    for (const rating of ratings) {
      if (rating < 0 || rating > 5) {
        throw new Error("Ratings must be between 0 and 5");
      }
    }

    // Create the rating
    const ratingId = await ctx.db.insert("ratings", {
      userId,
      restaurantId: event.restaurantId,
      eventId: args.eventId,
      visitDate: event.scheduledDate,
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

    // Add user to hasVoted array on event
    const hasVoted = event.hasVoted || [];
    await ctx.db.patch(args.eventId, {
      hasVoted: [...hasVoted, userId],
    });

    // Check if all attendees have voted
    const updatedHasVoted = [...hasVoted, userId];
    const allVoted = attendees.every((attendeeId) =>
      updatedHasVoted.includes(attendeeId)
    );

    // If all attendees have voted, reveal ratings and mark event as completed
    if (allVoted && attendees.length > 0) {
      await ctx.db.patch(args.eventId, {
        ratingsRevealed: true,
        status: "completed",
      });
    }

    // Trigger restaurant aggregate update
    await updateRestaurantAggregates(ctx, event.restaurantId);

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

// Get ratings for a restaurant (hides unrevealed event ratings)
export const getRestaurantRatings = query({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, args) => {
    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
      .order("desc")
      .collect();

    // Filter out unrevealed event ratings and enrich with user data
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
          claimedByUser,
        };
      })
    );

    // Filter out nulls (hidden ratings)
    return enriched.filter((rating) => rating !== null);
  },
});

// Get recent ratings across all users (for activity feed, hides unrevealed event ratings)
export const getRecentRatings = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    const ratings = await ctx.db
      .query("ratings")
      .order("desc")
      .take(limit * 2); // Fetch more to account for filtered ratings

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

// Claim a rating (for backdated ratings that can be claimed by users)
export const claimRating = mutation({
  args: { ratingId: v.id("ratings") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const rating = await ctx.db.get(args.ratingId);
    if (!rating) {
      throw new Error("Rating not found");
    }

    // Check if already claimed
    if (rating.claimedBy) {
      throw new Error("This rating has already been claimed");
    }

    // Check if bookerName exists (only backdated ratings can be claimed)
    if (!rating.bookerName) {
      throw new Error("This rating cannot be claimed");
    }

    // Claim the rating
    await ctx.db.patch(args.ratingId, {
      claimedBy: userId,
    });

    return { success: true };
  },
});

// Get ratings for a specific event with visibility logic
export const getEventRatings = query({
  args: { eventId: v.id("curryEvents") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      return { ratings: [], ratingsRevealed: false };
    }

    // Get ratings for this event
    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
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

    return {
      ratings: enriched,
      ratingsRevealed: event.ratingsRevealed || false,
    };
  },
});

// Get top bookers leaderboard (users who book curries)
export const getTopBookers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    // Get all ratings
    const allRatings = await ctx.db.query("ratings").collect();

    // Group ratings by event/restaurant visit to calculate average per curry
    const visitMap = new Map<string, {
      bookerId: string | null,
      restaurantId: string,
      restaurantName: string,
      ratings: number[]
    }>();

    for (const rating of allRatings) {
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

        return {
          userId: b.userId,
          curriesBooked: b.curryScores.length,
          averageScore: Math.round(averageScore * 10) / 10,
          bestCurry: {
            name: bestCurry.restaurantName,
            score: Math.round(bestCurry.score * 10) / 10
          }
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
        };
      })
    );

    // Filter out nulls
    return enriched.filter((b) => b !== null);
  },
});
