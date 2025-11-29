import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * One-time migration to set a specific user as the current booker
 * Run this from the Convex dashboard with the auth account ID
 */
export const setUserAsCurrentBooker = mutation({
  args: {
    authAccountId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the user by looking up their auth account
    const authAccount = await ctx.db
      .query("authAccounts")
      .filter((q) => q.eq(q.field("_id"), args.authAccountId))
      .first();

    if (!authAccount) {
      throw new Error(`Auth account not found: ${args.authAccountId}`);
    }

    const userId = authAccount.userId;

    // Check if user already exists in rotation
    const existing = await ctx.db
      .query("bookingRotation")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      // Update existing entry to be current booker
      await ctx.db.patch(existing._id, {
        isCurrentBooker: true,
        canOverride: true,
      });

      // Set all other users to not be current booker
      const allRotations = await ctx.db
        .query("bookingRotation")
        .collect();

      for (const rotation of allRotations) {
        if (rotation._id !== existing._id) {
          await ctx.db.patch(rotation._id, { isCurrentBooker: false });
        }
      }

      return {
        success: true,
        message: `Updated user ${userId} as current booker`,
        userId
      };
    }

    // Get count of existing rotations to determine order
    const allRotations = await ctx.db
      .query("bookingRotation")
      .collect();

    // Set all existing users to not be current booker
    for (const rotation of allRotations) {
      await ctx.db.patch(rotation._id, { isCurrentBooker: false });
    }

    // Add user to rotation as current booker
    await ctx.db.insert("bookingRotation", {
      userId,
      rotationOrder: allRotations.length,
      isCurrentBooker: true,
      canOverride: true,
      addedAt: Date.now(),
    });

    return {
      success: true,
      message: `Added user ${userId} to booking rotation as current booker`,
      userId
    };
  },
});

/**
 * One-time migration to import 21 historical curry visits
 * Run this from the Convex dashboard with your auth account ID
 * Creates restaurants with placeholder addresses and ratings with booker names
 */
export const importHistoricalCurries = mutation({
  args: {
    authAccountId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the user by looking up their auth account
    const authAccount = await ctx.db
      .query("authAccounts")
      .filter((q) => q.eq(q.field("_id"), args.authAccountId))
      .first();

    if (!authAccount) {
      throw new Error(`Auth account not found: ${args.authAccountId}`);
    }

    const userId = authAccount.userId;

    const now = Date.now();

    // Helper function to create a date timestamp
    const createDate = (month: number, day: number, year: number) => {
      const date = new Date(year, month - 1, day, 19, 0, 0, 0); // Default to 7pm
      return date.getTime();
    };

    // Define all 21 historical curry visits in chronological order
    const historicalVisits = [
      {
        restaurantName: "Coriander",
        location: "Vauxhall",
        visitDate: createDate(11, 23, 2023),
        booker: "Goose",
        food: 2,
        service: 2,
        extras: 3,
        atmosphere: 2,
      },
      {
        restaurantName: "Tayyabs",
        location: "Aldgate East",
        visitDate: createDate(12, 23, 2023),
        booker: "Duff",
        food: 3.5,
        service: 1,
        extras: 2,
        atmosphere: 3.5,
      },
      {
        restaurantName: "Akash",
        location: "Clapham",
        visitDate: createDate(1, 24, 2024),
        booker: "Oli",
        food: 2.5,
        service: 4,
        extras: 2,
        atmosphere: 1,
      },
      {
        restaurantName: "Namak Mandi",
        location: "Balham",
        visitDate: createDate(2, 24, 2024),
        booker: "Fowler",
        food: 2,
        service: 2,
        extras: 0,
        atmosphere: 5,
      },
      {
        restaurantName: "Radha Krishna Bhavan",
        location: "Tooting",
        visitDate: createDate(5, 24, 2024),
        booker: "Toby",
        food: 2.5,
        service: 3.5,
        extras: 2.5,
        atmosphere: 1,
      },
      {
        restaurantName: "Lahore Karahi",
        location: "Tooting",
        visitDate: createDate(6, 24, 2024),
        booker: "Jimbo",
        food: 4.5,
        service: 1.5,
        extras: 1.5,
        atmosphere: 2,
      },
      {
        restaurantName: "Pimlico Tandoori",
        location: "Pimlico",
        visitDate: createDate(7, 24, 2024),
        booker: "Caspar",
        food: 3.5,
        service: 3,
        extras: 3,
        atmosphere: 2.5,
      },
      {
        restaurantName: "Curry Leaf",
        location: "Clapham",
        visitDate: createDate(8, 24, 2024),
        booker: "Goose",
        food: 1,
        service: 2.5,
        extras: 2,
        atmosphere: 3,
      },
      {
        restaurantName: "Lovage",
        location: "Victoria",
        visitDate: createDate(10, 24, 2024),
        booker: "Duff",
        food: 3,
        service: 3.5,
        extras: 4.5,
        atmosphere: 2.5,
      },
      {
        restaurantName: "Palace Spice",
        location: "Clapham",
        visitDate: createDate(11, 24, 2024),
        booker: "Oli",
        food: 2.5,
        service: 2,
        extras: 3.5,
        atmosphere: 0.5,
      },
      {
        restaurantName: "Indian Room Balham",
        location: "Balham",
        visitDate: createDate(12, 24, 2024),
        booker: "Toby",
        food: 4.5,
        service: 3.5,
        extras: 1.5,
        atmosphere: 4,
      },
      {
        restaurantName: "The Tiffin Tree",
        location: "Pimlico",
        visitDate: createDate(1, 25, 2025),
        booker: "Caspar",
        food: 3,
        service: 3,
        extras: 2,
        atmosphere: 2.5,
      },
      {
        restaurantName: "Tiffin Cafe",
        location: "Farringdon",
        visitDate: createDate(2, 25, 2025),
        booker: "Fowler",
        food: 4,
        service: 3.5,
        extras: 2.5,
        atmosphere: 4,
      },
      {
        restaurantName: "Bengal Village",
        location: "Brick Lane",
        visitDate: createDate(4, 25, 2025),
        booker: "Jimbo",
        food: 4,
        service: 3,
        extras: 4.5,
        atmosphere: 4.5,
      },
      {
        restaurantName: "Mirch Masala",
        location: "Tooting",
        visitDate: createDate(5, 25, 2025),
        booker: "Fowler",
        food: 3,
        service: 3,
        extras: 1,
        atmosphere: 2,
      },
      {
        restaurantName: "Needoo Grill",
        location: "Whitechapel",
        visitDate: createDate(6, 25, 2025),
        booker: "Goose",
        food: 3,
        service: 2.5,
        extras: 3,
        atmosphere: 2.5,
      },
      {
        restaurantName: "Chattinad",
        location: "Tottenham Court Road",
        visitDate: createDate(7, 25, 2025),
        booker: "Duff",
        food: 4.5,
        service: 2,
        extras: 2,
        atmosphere: 3.5,
      },
      {
        restaurantName: "Angel Curry Centre",
        location: "Angel",
        visitDate: createDate(8, 25, 2025),
        booker: "Teesh",
        food: 4,
        service: 3,
        extras: 3,
        atmosphere: 2.5,
      },
      {
        restaurantName: "Sheeba",
        location: "Brick Lane",
        visitDate: createDate(9, 25, 2025),
        booker: "Oli",
        food: 3,
        service: 3,
        extras: 3,
        atmosphere: 4,
      },
      {
        restaurantName: "Royal Mahal",
        location: "Tooting",
        visitDate: createDate(10, 25, 2025),
        booker: "Toby",
        food: 3.5,
        service: 2.5,
        extras: 1,
        atmosphere: 3.5,
      },
      {
        restaurantName: "Maharaja of India",
        location: "Leicester Square",
        visitDate: createDate(11, 25, 2025),
        booker: "Caspar",
        food: 2.5,
        service: 4,
        extras: 3.5,
        atmosphere: 2,
      },
    ];

    // Track created restaurants to avoid duplicates
    const restaurantMap = new Map<string, string>(); // name -> restaurantId

    let restaurantsCreated = 0;
    let ratingsCreated = 0;

    // Process each visit
    for (const visit of historicalVisits) {
      let restaurantId: string;

      // Check if restaurant already exists in our map
      if (restaurantMap.has(visit.restaurantName)) {
        restaurantId = restaurantMap.get(visit.restaurantName)!;
      } else {
        // Check if restaurant already exists in database
        const existing = await ctx.db
          .query("restaurants")
          .withIndex("by_name", (q) => q.eq("name", visit.restaurantName))
          .first();

        if (existing) {
          restaurantId = existing._id;
          restaurantMap.set(visit.restaurantName, restaurantId);
        } else {
          // Create new restaurant with placeholder address
          const newRestaurantId = await ctx.db.insert("restaurants", {
            name: visit.restaurantName,
            address: `${visit.location} - Address to be added`,
            addedBy: userId,
            addedAt: now,
            totalRatings: 0,
            isIncomplete: true, // Mark as incomplete so it shows up for editing
          });

          restaurantId = newRestaurantId;
          restaurantMap.set(visit.restaurantName, newRestaurantId);
          restaurantsCreated++;
        }
      }

      // Create the rating
      await ctx.db.insert("ratings", {
        userId: userId, // Assigned to you for now
        restaurantId: restaurantId as any,
        visitDate: visit.visitDate,
        food: visit.food,
        service: visit.service,
        extras: visit.extras,
        atmosphere: visit.atmosphere,
        bookerName: visit.booker, // Original booker name
        claimedBy: undefined, // Not claimed yet
        createdAt: now,
      });

      ratingsCreated++;
    }

    // Update aggregates for all restaurants
    for (const restaurantId of restaurantMap.values()) {
      const ratings = await ctx.db
        .query("ratings")
        .withIndex("by_restaurant", (q) => q.eq("restaurantId", restaurantId as any))
        .collect();

      if (ratings.length > 0) {
        const avgFood = ratings.reduce((sum, r) => sum + r.food, 0) / ratings.length;
        const avgService = ratings.reduce((sum, r) => sum + r.service, 0) / ratings.length;
        const avgExtras = ratings.reduce((sum, r) => sum + r.extras, 0) / ratings.length;
        const avgAtmosphere = ratings.reduce((sum, r) => sum + r.atmosphere, 0) / ratings.length;
        const overall = (avgFood + avgService + avgExtras + avgAtmosphere) / 4;

        await ctx.db.patch(restaurantId as any, {
          averageFood: Math.round(avgFood * 10) / 10,
          averageService: Math.round(avgService * 10) / 10,
          averageExtras: Math.round(avgExtras * 10) / 10,
          averageAtmosphere: Math.round(avgAtmosphere * 10) / 10,
          overallAverage: Math.round(overall * 10) / 10,
          totalRatings: ratings.length,
        });
      }
    }

    // Update user's curriesRated count
    const user = await ctx.db.get(userId);
    if (user) {
      await ctx.db.patch(userId, {
        curriesRated: (user.curriesRated || 0) + ratingsCreated,
        curriesAdded: (user.curriesAdded || 0) + restaurantsCreated,
      });
    }

    return {
      success: true,
      message: `Imported ${ratingsCreated} ratings across ${restaurantsCreated} new restaurants`,
      restaurantsCreated,
      ratingsCreated,
    };
  },
});
