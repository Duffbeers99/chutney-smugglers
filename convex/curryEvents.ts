import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

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
