import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { updateRestaurantAggregates } from "./restaurants";

/**
 * Get the next upcoming curry event
 */
export const getNextEvent = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Find the next upcoming event (status = "upcoming")
    const events = await ctx.db
      .query("curryEvents")
      .withIndex("by_status", (q) => q.eq("status", "upcoming"))
      .collect();

    // Filter to only future events (combining date + time) and sort by scheduled datetime
    const futureEvents = events
      .filter((event) => {
        // Parse the time (HH:mm format)
        const [hours, minutes] = event.scheduledTime.split(":").map(Number);

        // Create full datetime for the event
        const eventDateTime = new Date(event.scheduledDate);
        eventDateTime.setHours(hours, minutes, 0, 0);

        // Only include if event datetime is in the future
        return eventDateTime.getTime() > now;
      })
      .sort((a, b) => {
        // Sort by combining date + time for accurate ordering
        const [aHours, aMinutes] = a.scheduledTime.split(":").map(Number);
        const aDateTime = new Date(a.scheduledDate);
        aDateTime.setHours(aHours, aMinutes, 0, 0);

        const [bHours, bMinutes] = b.scheduledTime.split(":").map(Number);
        const bDateTime = new Date(b.scheduledDate);
        bDateTime.setHours(bHours, bMinutes, 0, 0);

        return aDateTime.getTime() - bDateTime.getTime();
      });

    return futureEvents[0] ?? null;
  },
});

/**
 * Get all upcoming curry events
 */
export const getAllUpcomingEvents = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const events = await ctx.db
      .query("curryEvents")
      .withIndex("by_status", (q) => q.eq("status", "upcoming"))
      .collect();

    // Filter to only future events (combining date + time) and sort by scheduled datetime
    return events
      .filter((event) => {
        // Parse the time (HH:mm format)
        const [hours, minutes] = event.scheduledTime.split(":").map(Number);

        // Create full datetime for the event
        const eventDateTime = new Date(event.scheduledDate);
        eventDateTime.setHours(hours, minutes, 0, 0);

        // Only include if event datetime is in the future
        return eventDateTime.getTime() > now;
      })
      .sort((a, b) => {
        // Sort by combining date + time for accurate ordering
        const [aHours, aMinutes] = a.scheduledTime.split(":").map(Number);
        const aDateTime = new Date(a.scheduledDate);
        aDateTime.setHours(aHours, aMinutes, 0, 0);

        const [bHours, bMinutes] = b.scheduledTime.split(":").map(Number);
        const bDateTime = new Date(b.scheduledDate);
        bDateTime.setHours(bHours, bMinutes, 0, 0);

        return aDateTime.getTime() - bDateTime.getTime();
      });
  },
});

/**
 * Get all curry events (for admin purposes)
 */
export const getAllEvents = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db
      .query("curryEvents")
      .collect();

    // Sort by scheduled date (most recent first)
    return events.sort((a, b) => {
      const [aHours, aMinutes] = a.scheduledTime.split(":").map(Number);
      const aDateTime = new Date(a.scheduledDate);
      aDateTime.setHours(aHours, aMinutes, 0, 0);

      const [bHours, bMinutes] = b.scheduledTime.split(":").map(Number);
      const bDateTime = new Date(b.scheduledDate);
      bDateTime.setHours(bHours, bMinutes, 0, 0);

      return bDateTime.getTime() - aDateTime.getTime();
    });
  },
});

/**
 * Get the current user whose turn it is to book
 */
export const getCurrentBooker = query({
  args: {},
  handler: async (ctx) => {
    const rotation = await ctx.db
      .query("bookingRotation")
      .withIndex("by_current_booker", (q) => q.eq("isCurrentBooker", true))
      .first();

    if (!rotation) return null;

    const user = await ctx.db.get(rotation.userId);
    return { rotation, user };
  },
});

/**
 * Get all users in the booking rotation order
 */
export const getBookingRotation = query({
  args: {},
  handler: async (ctx) => {
    const rotations = await ctx.db
      .query("bookingRotation")
      .withIndex("by_rotation_order")
      .collect();

    const rotationsWithUsers = await Promise.all(
      rotations.map(async (rotation) => {
        const user = await ctx.db.get(rotation.userId);
        return { ...rotation, user };
      })
    );

    return rotationsWithUsers.sort((a, b) => a.rotationOrder - b.rotationOrder);
  },
});

/**
 * Check if current user can create/edit events
 */
export const canManageEvents = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const rotation = await ctx.db
      .query("bookingRotation")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!rotation) return false;

    // User can manage if it's their turn OR they have override permission
    return rotation.isCurrentBooker || rotation.canOverride;
  },
});

/**
 * Check if current user is the admin (can override rating reveals)
 */
export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    // Only this specific user ID is the admin
    const ADMIN_USER_ID = "k573zewczry92fgnxw80ndz89d7w33he" as const;
    return userId === ADMIN_USER_ID;
  },
});

/**
 * Create a new curry event
 */
export const createEvent = mutation({
  args: {
    restaurantId: v.id("restaurants"),
    restaurantName: v.string(),
    address: v.string(),
    scheduledDate: v.number(),
    scheduledTime: v.string(),
    notes: v.optional(v.string()),
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
    if (!userId) {
      throw new Error("Must be authenticated to create events");
    }

    // Check if user has permission
    const rotation = await ctx.db
      .query("bookingRotation")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!rotation) {
      throw new Error("User is not in the booking rotation");
    }

    if (!rotation.isCurrentBooker && !rotation.canOverride) {
      throw new Error("It's not your turn to book. Contact an admin for override.");
    }

    // Verify the restaurant exists
    const restaurant = await ctx.db.get(args.restaurantId);
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    // Validate that the event is not in the past
    const [hours, minutes] = args.scheduledTime.split(":").map(Number);
    const eventDateTime = new Date(args.scheduledDate);
    eventDateTime.setHours(hours, minutes, 0, 0);

    if (eventDateTime.getTime() <= Date.now()) {
      throw new Error("Cannot create an event in the past");
    }

    // Create the event
    const eventId = await ctx.db.insert("curryEvents", {
      restaurantId: args.restaurantId,
      restaurantName: args.restaurantName,
      address: args.address,
      googlePlaceId: args.googlePlaceId,
      location: args.location,
      scheduledDate: args.scheduledDate,
      scheduledTime: args.scheduledTime,
      createdBy: userId,
      createdAt: Date.now(),
      status: "upcoming",
      notes: args.notes,
    });

    return eventId;
  },
});

/**
 * Update an existing curry event
 */
export const updateEvent = mutation({
  args: {
    eventId: v.id("curryEvents"),
    restaurantId: v.optional(v.id("restaurants")),
    restaurantName: v.optional(v.string()),
    address: v.optional(v.string()),
    scheduledDate: v.optional(v.number()),
    scheduledTime: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.optional(v.string()),
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
    if (!userId) {
      throw new Error("Must be authenticated to update events");
    }

    // Check if user has permission
    const rotation = await ctx.db
      .query("bookingRotation")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!rotation) {
      throw new Error("User is not in the booking rotation");
    }

    if (!rotation.isCurrentBooker && !rotation.canOverride) {
      throw new Error("You don't have permission to edit events");
    }

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Validate that the updated event is not in the past (if date or time is being changed)
    if (args.scheduledDate !== undefined || args.scheduledTime !== undefined) {
      const updatedDate = args.scheduledDate ?? event.scheduledDate;
      const updatedTime = args.scheduledTime ?? event.scheduledTime;

      const [hours, minutes] = updatedTime.split(":").map(Number);
      const eventDateTime = new Date(updatedDate);
      eventDateTime.setHours(hours, minutes, 0, 0);

      if (eventDateTime.getTime() <= Date.now()) {
        throw new Error("Cannot update event to a time in the past");
      }
    }

    // Build update object with only provided fields
    const updates: any = {};
    if (args.restaurantId !== undefined) updates.restaurantId = args.restaurantId;
    if (args.restaurantName !== undefined) updates.restaurantName = args.restaurantName;
    if (args.address !== undefined) updates.address = args.address;
    if (args.scheduledDate !== undefined) updates.scheduledDate = args.scheduledDate;
    if (args.scheduledTime !== undefined) updates.scheduledTime = args.scheduledTime;
    if (args.notes !== undefined) updates.notes = args.notes;
    if (args.status !== undefined) updates.status = args.status;
    if (args.googlePlaceId !== undefined) updates.googlePlaceId = args.googlePlaceId;
    if (args.location !== undefined) updates.location = args.location;

    await ctx.db.patch(args.eventId, updates);

    return args.eventId;
  },
});

/**
 * Delete a curry event
 */
export const deleteEvent = mutation({
  args: {
    eventId: v.id("curryEvents"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to delete events");
    }

    // Check if user has permission
    const rotation = await ctx.db
      .query("bookingRotation")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!rotation) {
      throw new Error("User is not in the booking rotation");
    }

    if (!rotation.isCurrentBooker && !rotation.canOverride) {
      throw new Error("You don't have permission to delete events");
    }

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    const restaurantId = event.restaurantId;

    // Delete the event
    await ctx.db.delete(args.eventId);

    // Check if we should also delete the restaurant
    // Only delete if it has no ratings and no other events
    const restaurant = await ctx.db.get(restaurantId);
    if (restaurant) {
      // Check if restaurant has any ratings
      const hasRatings = restaurant.totalRatings > 0;

      // Check if there are any other events for this restaurant
      const otherEvents = await ctx.db
        .query("curryEvents")
        .filter((q) => q.eq(q.field("restaurantId"), restaurantId))
        .collect();

      // If no ratings and no other events, safe to delete the restaurant
      if (!hasRatings && otherEvents.length === 0) {
        await ctx.db.delete(restaurantId);

        // Decrement the user's curriesAdded count (since we're removing the restaurant they added)
        const addedBy = await ctx.db.get(restaurant.addedBy);
        if (addedBy && addedBy.curriesAdded && addedBy.curriesAdded > 0) {
          await ctx.db.patch(restaurant.addedBy, {
            curriesAdded: addedBy.curriesAdded - 1,
          });
        }
      }
    }

    return { success: true };
  },
});

/**
 * Add a user to the booking rotation
 */
export const addToRotation = mutation({
  args: {
    userId: v.id("users"),
    canOverride: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Must be authenticated");
    }

    // Check if current user has override permission to add others
    const currentRotation = await ctx.db
      .query("bookingRotation")
      .withIndex("by_user", (q) => q.eq("userId", currentUserId))
      .first();

    if (!currentRotation?.canOverride) {
      throw new Error("You don't have permission to manage the rotation");
    }

    // Check if user already in rotation
    const existing = await ctx.db
      .query("bookingRotation")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      throw new Error("User is already in the rotation");
    }

    // Get the highest rotation order and add 1
    const allRotations = await ctx.db
      .query("bookingRotation")
      .withIndex("by_rotation_order")
      .collect();

    const maxOrder = allRotations.length > 0
      ? Math.max(...allRotations.map((r) => r.rotationOrder))
      : -1;

    await ctx.db.insert("bookingRotation", {
      userId: args.userId,
      rotationOrder: maxOrder + 1,
      isCurrentBooker: false,
      canOverride: args.canOverride ?? false,
      addedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Move to the next person in the booking rotation
 */
export const advanceRotation = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    // Check if current user has override permission
    const currentRotation = await ctx.db
      .query("bookingRotation")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!currentRotation?.canOverride) {
      throw new Error("You don't have permission to advance the rotation");
    }

    // Get current booker
    const currentBooker = await ctx.db
      .query("bookingRotation")
      .withIndex("by_current_booker", (q) => q.eq("isCurrentBooker", true))
      .first();

    if (!currentBooker) {
      throw new Error("No current booker set");
    }

    // Get all rotations sorted by order
    const allRotations = await ctx.db
      .query("bookingRotation")
      .withIndex("by_rotation_order")
      .collect();

    const sorted = allRotations.sort((a, b) => a.rotationOrder - b.rotationOrder);

    // Find next person in rotation (wrap around to 0 if at end)
    const currentIndex = sorted.findIndex((r) => r._id === currentBooker._id);
    const nextIndex = (currentIndex + 1) % sorted.length;
    const nextBooker = sorted[nextIndex];

    // Update current booker to false
    await ctx.db.patch(currentBooker._id, { isCurrentBooker: false });

    // Update next booker to true
    await ctx.db.patch(nextBooker._id, { isCurrentBooker: true });

    return { success: true, nextBooker: nextBooker.userId };
  },
});

/**
 * Initialize the current user in the booking rotation
 * This sets them as the current booker with override permissions
 */
export const initializeCurrentUserAsBooker = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

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
      return { success: true, message: "Updated as current booker" };
    }

    // Get count of existing rotations to determine order
    const allRotations = await ctx.db
      .query("bookingRotation")
      .collect();

    // Add user to rotation
    await ctx.db.insert("bookingRotation", {
      userId,
      rotationOrder: allRotations.length,
      isCurrentBooker: true,
      canOverride: true,
      addedAt: Date.now(),
    });

    return { success: true, message: "Added to booking rotation as current booker" };
  },
});

/**
 * Confirm attendance for a curry event
 */
export const confirmAttendance = mutation({
  args: {
    eventId: v.id("curryEvents"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to confirm attendance");
    }

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Check if event is still upcoming
    if (event.status !== "upcoming") {
      throw new Error("Can only confirm attendance for upcoming events");
    }

    // Get current attendees or initialize empty array
    const attendees = event.attendees || [];

    // Check if user already confirmed
    if (attendees.includes(userId)) {
      return { success: true, message: "Already confirmed" };
    }

    // Add user to attendees
    await ctx.db.patch(args.eventId, {
      attendees: [...attendees, userId],
    });

    return { success: true, message: "Attendance confirmed" };
  },
});

/**
 * Cancel attendance for a curry event
 */
export const cancelAttendance = mutation({
  args: {
    eventId: v.id("curryEvents"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to cancel attendance");
    }

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Get current attendees
    const attendees = event.attendees || [];

    // Remove user from attendees
    await ctx.db.patch(args.eventId, {
      attendees: attendees.filter((id) => id !== userId),
    });

    return { success: true, message: "Attendance cancelled" };
  },
});

/**
 * Get enriched list of attendees for an event
 */
export const getEventAttendees = query({
  args: {
    eventId: v.id("curryEvents"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      return [];
    }

    const attendees = event.attendees || [];

    // Enrich with user data
    const enriched = await Promise.all(
      attendees.map(async (userId) => {
        const user = await ctx.db.get(userId);
        if (!user) return null;

        let profileImageUrl: string | null = null;
        if (user.profileImageId) {
          profileImageUrl = await ctx.storage.getUrl(user.profileImageId);
        }

        return {
          _id: user._id,
          nickname: user.nickname,
          profileImageUrl,
        };
      })
    );

    // Filter out null values
    return enriched.filter((user) => user !== null);
  },
});

/**
 * Get the currently active curry event (started but not completed)
 */
export const getActiveEvent = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Find events with status "upcoming" that have already started
    const events = await ctx.db
      .query("curryEvents")
      .withIndex("by_status", (q) => q.eq("status", "upcoming"))
      .collect();

    // Filter to events that have started but ratings not revealed yet
    const activeEvents = events
      .filter((event) => {
        // Parse the time (HH:mm format)
        const [hours, minutes] = event.scheduledTime.split(":").map(Number);

        // Create full datetime for the event
        const eventDateTime = new Date(event.scheduledDate);
        eventDateTime.setHours(hours, minutes, 0, 0);

        // Event has started if datetime is in the past
        const hasStarted = eventDateTime.getTime() <= now;

        // Only include if event has started and ratings not completed
        return hasStarted && !event.ratingsRevealed;
      })
      .sort((a, b) => {
        // Sort by date (oldest first - the event that started first)
        const [aHours, aMinutes] = a.scheduledTime.split(":").map(Number);
        const aDateTime = new Date(a.scheduledDate);
        aDateTime.setHours(aHours, aMinutes, 0, 0);

        const [bHours, bMinutes] = b.scheduledTime.split(":").map(Number);
        const bDateTime = new Date(b.scheduledDate);
        bDateTime.setHours(bHours, bMinutes, 0, 0);

        return aDateTime.getTime() - bDateTime.getTime();
      });

    return activeEvents[0] ?? null;
  },
});

/**
 * Manually reveal ratings and complete an event (admin override)
 */
export const revealEventRatings = mutation({
  args: {
    eventId: v.id("curryEvents"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    // Only the admin user can manually reveal ratings
    const ADMIN_USER_ID = "k573zewczry92fgnxw80ndz89d7w33he" as const;
    if (userId !== ADMIN_USER_ID) {
      throw new Error("Only the admin can manually reveal ratings");
    }

    // Reveal ratings and mark as completed
    await ctx.db.patch(args.eventId, {
      ratingsRevealed: true,
      status: "completed",
    });

    return { success: true };
  },
});

/**
 * Reassign an event to a different user (admin only)
 */
export const reassignEventCreator = mutation({
  args: {
    eventId: v.id("curryEvents"),
    newCreatorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    // Check if current user has override permission
    const rotation = await ctx.db
      .query("bookingRotation")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!rotation?.canOverride) {
      throw new Error("You don't have permission to reassign events");
    }

    // Verify the event exists
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Verify the new creator exists
    const newCreator = await ctx.db.get(args.newCreatorId);
    if (!newCreator) {
      throw new Error("New creator user not found");
    }

    // Update the event's createdBy field
    await ctx.db.patch(args.eventId, {
      createdBy: args.newCreatorId,
    });

    return {
      success: true,
      message: `Event reassigned to ${newCreator.nickname || newCreator.name || "user"}`
    };
  },
});

/**
 * Internal mutation to reassign event creator (for admin use via dashboard)
 * This bypasses authentication and can be run from the Convex dashboard
 */
export const reassignEventCreatorInternal = internalMutation({
  args: {
    eventId: v.id("curryEvents"),
    newCreatorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify the event exists
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Verify the new creator exists
    const newCreator = await ctx.db.get(args.newCreatorId);
    if (!newCreator) {
      throw new Error("New creator user not found");
    }

    // Update the event's createdBy field
    await ctx.db.patch(args.eventId, {
      createdBy: args.newCreatorId,
    });

    return {
      success: true,
      message: `Event reassigned to ${newCreator.nickname || newCreator.name || "user"}`,
      eventId: args.eventId,
      newCreatorId: args.newCreatorId,
    };
  },
});

/**
 * Internal mutation to migrate all existing ratings to half-point increments
 * This rounds all existing ratings to the nearest 0.5 and recalculates aggregates
 */
export const migrateRatingsToHalfPoints = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Helper function to round to nearest 0.5
    const roundToHalf = (num: number) => Math.round(num * 2) / 2;

    // Get all ratings
    const allRatings = await ctx.db.query("ratings").collect();

    console.log(`Found ${allRatings.length} ratings to migrate`);

    let updatedCount = 0;

    // Update each rating
    for (const rating of allRatings) {
      const roundedFood = roundToHalf(rating.food);
      const roundedService = roundToHalf(rating.service);
      const roundedExtras = roundToHalf(rating.extras);
      const roundedAtmosphere = roundToHalf(rating.atmosphere);

      // Only update if values changed
      if (
        roundedFood !== rating.food ||
        roundedService !== rating.service ||
        roundedExtras !== rating.extras ||
        roundedAtmosphere !== rating.atmosphere
      ) {
        await ctx.db.patch(rating._id, {
          food: roundedFood,
          service: roundedService,
          extras: roundedExtras,
          atmosphere: roundedAtmosphere,
        });
        updatedCount++;
      }
    }

    // Get all unique restaurants to recalculate aggregates
    const restaurantIds = new Set(allRatings.map((r) => r.restaurantId));
    console.log(`Recalculating aggregates for ${restaurantIds.size} restaurants`);

    // Recalculate aggregates for each restaurant
    for (const restaurantId of restaurantIds) {
      await updateRestaurantAggregates(ctx, restaurantId);
    }

    return {
      success: true,
      message: `Migration complete: ${updatedCount} ratings updated, ${restaurantIds.size} restaurants recalculated`,
      ratingsUpdated: updatedCount,
      restaurantsRecalculated: restaurantIds.size,
      totalRatings: allRatings.length,
    };
  },
});

/**
 * Internal mutation to backfill curry events for restaurants that don't have them
 * This creates events based on existing ratings with bookerName/claimedBy data
 */
export const backfillMissingCurryEvents = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all restaurants
    const allRestaurants = await ctx.db.query("restaurants").collect();
    console.log(`Processing ${allRestaurants.length} restaurants`);

    let eventsCreated = 0;
    let restaurantsSkipped = 0;

    for (const restaurant of allRestaurants) {
      // Check if restaurant already has events
      const existingEvents = await ctx.db
        .query("curryEvents")
        .filter((q) => q.eq(q.field("restaurantId"), restaurant._id))
        .collect();

      if (existingEvents.length > 0) {
        restaurantsSkipped++;
        continue;
      }

      // Get ratings for this restaurant to find booker
      const ratings = await ctx.db
        .query("ratings")
        .withIndex("by_restaurant", (q) => q.eq("restaurantId", restaurant._id))
        .collect();

      if (ratings.length === 0) {
        console.log(`No ratings found for ${restaurant.name}, skipping`);
        restaurantsSkipped++;
        continue;
      }

      // Find the earliest rating (first visit)
      const earliestRating = ratings.reduce((earliest, current) =>
        current.visitDate < earliest.visitDate ? current : earliest
      );

      // Determine the booker
      let createdBy = earliestRating.claimedBy || earliestRating.userId;

      // If no user found, try to match bookerName to a user
      if (!createdBy && earliestRating.bookerName) {
        const allUsers = await ctx.db.query("users").collect();
        const matchedUser = allUsers.find((u) =>
          u.nickname?.toLowerCase() === earliestRating.bookerName?.toLowerCase() ||
          u.name?.toLowerCase() === earliestRating.bookerName?.toLowerCase()
        );
        if (matchedUser) {
          createdBy = matchedUser._id;
        }
      }

      // If still no user, use the restaurant's addedBy as fallback
      if (!createdBy) {
        createdBy = restaurant.addedBy;
      }

      // Create the curry event
      const visitDate = new Date(earliestRating.visitDate);
      const scheduledTime = "19:30"; // Default curry time

      await ctx.db.insert("curryEvents", {
        restaurantId: restaurant._id,
        restaurantName: restaurant.name,
        address: restaurant.address,
        googlePlaceId: restaurant.googlePlaceId,
        location: restaurant.location,
        scheduledDate: earliestRating.visitDate,
        scheduledTime: scheduledTime,
        createdBy: createdBy,
        createdAt: earliestRating.createdAt || earliestRating.visitDate,
        status: "completed",
        ratingsRevealed: true,
      });

      eventsCreated++;
      console.log(`Created event for ${restaurant.name}, booked by user ${createdBy}`);
    }

    return {
      success: true,
      message: `Backfill complete: ${eventsCreated} events created, ${restaurantsSkipped} restaurants skipped`,
      eventsCreated,
      restaurantsSkipped,
      totalRestaurants: allRestaurants.length,
    };
  },
});

/**
 * Internal mutation to add missing ratings for Balham Social
 */
export const addBalhamSocialRatings = internalMutation({
  args: {},
  handler: async (ctx) => {
    const restaurantId = "k171nwrgsgr2w8wm4v0hkrgkc97wcm0g" as any;

    // Find the Balham Social event
    const events = await ctx.db
      .query("curryEvents")
      .filter((q) => q.eq(q.field("restaurantId"), restaurantId))
      .collect();

    if (events.length === 0) {
      throw new Error("No event found for Balham Social");
    }

    const event = events[0]; // Get the most recent event
    const visitDate = event.scheduledDate;
    const now = Date.now();

    // James's rating
    const jamesUserId = "k57fgdy9vb8nj8yjc1aa8t1vg57wct8q" as any;
    await ctx.db.insert("ratings", {
      userId: jamesUserId,
      restaurantId: restaurantId,
      visitDate: visitDate,
      food: 4,
      service: 2.5,
      extras: 2,
      atmosphere: 2.5,
      eventId: event._id,
      createdAt: now,
    });
    console.log("Created rating for James");

    // Casper's rating
    const casperUserId = "k577s9dnmzm1xwtmhnnn4zp6817wd52b" as any;
    await ctx.db.insert("ratings", {
      userId: casperUserId,
      restaurantId: restaurantId,
      visitDate: visitDate,
      food: 3,
      service: 3,
      extras: 2.5,
      atmosphere: 2,
      eventId: event._id,
      createdAt: now,
    });
    console.log("Created rating for Casper");

    // Update the event's hasVoted array
    const currentHasVoted = event.hasVoted || [];
    await ctx.db.patch(event._id, {
      hasVoted: [...currentHasVoted, jamesUserId, casperUserId],
    });

    // Recalculate restaurant aggregates
    await updateRestaurantAggregates(ctx, restaurantId);
    console.log("Recalculated restaurant aggregates");

    return {
      success: true,
      message: "Added ratings for James and Casper, updated event and recalculated aggregates",
    };
  },
});
