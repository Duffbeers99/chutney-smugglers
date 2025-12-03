import { v } from "convex/values";
import { mutation, query, internalMutation, internalAction, action, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { updateRestaurantAggregates } from "./restaurants";
import { getUserActiveGroup, checkGroupAccess } from "./groups";
import { internal } from "./_generated/api";
import { clearAllVotes } from "./dateVotes";

/**
 * Get the next upcoming curry event
 */
export const getNextEvent = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const groupId = await getUserActiveGroup(ctx, userId);
    if (!groupId) return null;

    const now = Date.now();

    // Find the next upcoming event for the user's group
    const events = await ctx.db
      .query("curryEvents")
      .withIndex("by_group_and_status", (q) => q.eq("groupId", groupId).eq("status", "upcoming"))
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
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const groupId = await getUserActiveGroup(ctx, userId);
    if (!groupId) return [];

    const now = Date.now();

    const events = await ctx.db
      .query("curryEvents")
      .withIndex("by_group_and_status", (q) => q.eq("groupId", groupId).eq("status", "upcoming"))
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
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const groupId = await getUserActiveGroup(ctx, userId);
    if (!groupId) return [];

    const events = await ctx.db
      .query("curryEvents")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
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
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const groupId = await getUserActiveGroup(ctx, userId);
    if (!groupId) return null;

    const rotation = await ctx.db
      .query("bookingRotation")
      .withIndex("by_group_and_current_booker", (q) => q.eq("groupId", groupId).eq("isCurrentBooker", true))
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
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const groupId = await getUserActiveGroup(ctx, userId);
    if (!groupId) return [];

    const rotations = await ctx.db
      .query("bookingRotation")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
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

    const groupId = await getUserActiveGroup(ctx, userId);
    if (!groupId) return false;

    const rotation = await ctx.db
      .query("bookingRotation")
      .withIndex("by_group_and_user", (q) => q.eq("groupId", groupId).eq("userId", userId))
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

    const groupId = await getUserActiveGroup(ctx, userId);
    if (!groupId) {
      throw new Error("You must be in a group to create events");
    }

    // Check if user has permission
    const rotation = await ctx.db
      .query("bookingRotation")
      .withIndex("by_group_and_user", (q) => q.eq("groupId", groupId).eq("userId", userId))
      .first();

    if (!rotation) {
      throw new Error("User is not in the booking rotation");
    }

    if (!rotation.isCurrentBooker && !rotation.canOverride) {
      throw new Error("It's not your turn to book. Contact an admin for override.");
    }

    // Verify the restaurant exists and belongs to the user's group
    const restaurant = await ctx.db.get(args.restaurantId);
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    if (restaurant.groupId !== groupId) {
      throw new Error("Restaurant does not belong to your group");
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
      groupId,
    });

    // Clear all date votes now that curry is scheduled
    await clearAllVotes(ctx, groupId);

    // Schedule action to send booking confirmation emails (async, won't block event creation)
    await ctx.scheduler.runAfter(0, internal.curryEvents.sendBookingConfirmationEmails, {
      eventId,
      groupId,
      creatorId: userId,
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

    const groupId = await getUserActiveGroup(ctx, userId);
    if (!groupId) {
      throw new Error("You must be in a group to update events");
    }

    // Check if user has permission
    const rotation = await ctx.db
      .query("bookingRotation")
      .withIndex("by_group_and_user", (q) => q.eq("groupId", groupId).eq("userId", userId))
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

    // Verify event belongs to user's group
    if (event.groupId !== groupId) {
      throw new Error("Event does not belong to your group");
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

    const groupId = await getUserActiveGroup(ctx, userId);
    if (!groupId) {
      throw new Error("You must be in a group to delete events");
    }

    // Check if user has permission
    const rotation = await ctx.db
      .query("bookingRotation")
      .withIndex("by_group_and_user", (q) => q.eq("groupId", groupId).eq("userId", userId))
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

    // Verify event belongs to user's group
    if (event.groupId !== groupId) {
      throw new Error("Event does not belong to your group");
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

    const groupId = await getUserActiveGroup(ctx, currentUserId);
    if (!groupId) {
      throw new Error("You must be in a group to manage the rotation");
    }

    // Check if current user has override permission to add others
    const currentRotation = await ctx.db
      .query("bookingRotation")
      .withIndex("by_group_and_user", (q) => q.eq("groupId", groupId).eq("userId", currentUserId))
      .first();

    if (!currentRotation?.canOverride) {
      throw new Error("You don't have permission to manage the rotation");
    }

    // Verify the user being added has access to the group
    await checkGroupAccess(ctx, args.userId, groupId);

    // Check if user already in rotation
    const existing = await ctx.db
      .query("bookingRotation")
      .withIndex("by_group_and_user", (q) => q.eq("groupId", groupId).eq("userId", args.userId))
      .first();

    if (existing) {
      throw new Error("User is already in the rotation");
    }

    // Get the highest rotation order for this group and add 1
    const allRotations = await ctx.db
      .query("bookingRotation")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();

    const maxOrder = allRotations.length > 0
      ? Math.max(...allRotations.map((r) => r.rotationOrder))
      : -1;

    await ctx.db.insert("bookingRotation", {
      userId: args.userId,
      groupId,
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

    const groupId = await getUserActiveGroup(ctx, userId);
    if (!groupId) {
      throw new Error("You must be in a group to advance the rotation");
    }

    // Check if current user has override permission
    const currentRotation = await ctx.db
      .query("bookingRotation")
      .withIndex("by_group_and_user", (q) => q.eq("groupId", groupId).eq("userId", userId))
      .first();

    if (!currentRotation?.canOverride) {
      throw new Error("You don't have permission to advance the rotation");
    }

    // Get current booker for this group
    const currentBooker = await ctx.db
      .query("bookingRotation")
      .withIndex("by_group_and_current_booker", (q) => q.eq("groupId", groupId).eq("isCurrentBooker", true))
      .first();

    if (!currentBooker) {
      throw new Error("No current booker set");
    }

    // Get all rotations for this group sorted by order
    const allRotations = await ctx.db
      .query("bookingRotation")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
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

    const groupId = await getUserActiveGroup(ctx, userId);
    if (!groupId) {
      throw new Error("You must be in a group to initialize as booker");
    }

    // Check if user already exists in rotation
    const existing = await ctx.db
      .query("bookingRotation")
      .withIndex("by_group_and_user", (q) => q.eq("groupId", groupId).eq("userId", userId))
      .first();

    if (existing) {
      // Update existing entry to be current booker
      await ctx.db.patch(existing._id, {
        isCurrentBooker: true,
        canOverride: true,
      });
      return { success: true, message: "Updated as current booker" };
    }

    // Get count of existing rotations for this group to determine order
    const allRotations = await ctx.db
      .query("bookingRotation")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();

    // Add user to rotation
    await ctx.db.insert("bookingRotation", {
      userId,
      groupId,
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

    const groupId = await getUserActiveGroup(ctx, userId);
    if (!groupId) {
      throw new Error("You must be in a group to confirm attendance");
    }

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Verify event belongs to user's group
    if (event.groupId !== groupId) {
      throw new Error("Event does not belong to your group");
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

    const groupId = await getUserActiveGroup(ctx, userId);
    if (!groupId) {
      throw new Error("You must be in a group to cancel attendance");
    }

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Verify event belongs to user's group
    if (event.groupId !== groupId) {
      throw new Error("Event does not belong to your group");
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
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const groupId = await getUserActiveGroup(ctx, userId);
    if (!groupId) return [];

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      return [];
    }

    // Verify event belongs to user's group
    if (event.groupId !== groupId) {
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
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const groupId = await getUserActiveGroup(ctx, userId);
    if (!groupId) return null;

    const now = Date.now();

    // Find events with status "upcoming" that have already started in the user's group
    const events = await ctx.db
      .query("curryEvents")
      .withIndex("by_group_and_status", (q) => q.eq("groupId", groupId).eq("status", "upcoming"))
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

    const groupId = await getUserActiveGroup(ctx, userId);
    if (!groupId) {
      throw new Error("You must be in a group to reveal ratings");
    }

    // Only the admin user can manually reveal ratings
    const ADMIN_USER_ID = "k573zewczry92fgnxw80ndz89d7w33he" as const;
    if (userId !== ADMIN_USER_ID) {
      throw new Error("Only the admin can manually reveal ratings");
    }

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Verify event belongs to user's group
    if (event.groupId !== groupId) {
      throw new Error("Event does not belong to your group");
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

    const groupId = await getUserActiveGroup(ctx, userId);
    if (!groupId) {
      throw new Error("You must be in a group to reassign events");
    }

    // Check if current user has override permission
    const rotation = await ctx.db
      .query("bookingRotation")
      .withIndex("by_group_and_user", (q) => q.eq("groupId", groupId).eq("userId", userId))
      .first();

    if (!rotation?.canOverride) {
      throw new Error("You don't have permission to reassign events");
    }

    // Verify the event exists
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Verify event belongs to user's group
    if (event.groupId !== groupId) {
      throw new Error("Event does not belong to your group");
    }

    // Verify the new creator exists and has access to the group
    const newCreator = await ctx.db.get(args.newCreatorId);
    if (!newCreator) {
      throw new Error("New creator user not found");
    }

    await checkGroupAccess(ctx, args.newCreatorId, groupId);

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

/**
 * Internal action to send reminder emails for upcoming events
 * Called by cron job daily at 9:00 AM
 */
export const sendEventReminders = internalAction({
  args: {},
  handler: async (ctx) => {
    const { sendEventReminder } = await import("./emails/eventReminder");
    const now = Date.now();
    const twentyFourHoursFromNow = now + (24 * 60 * 60 * 1000);
    const fortyEightHoursFromNow = now + (48 * 60 * 60 * 1000);

    // Get all upcoming events via query
    const allEvents = await ctx.runQuery(internal.curryEvents.getUpcomingEventsForReminders);

    let emailsSent = 0;
    let eventsProcessed = 0;

    for (const event of allEvents) {
      // Parse the event datetime
      const [hours, minutes] = event.scheduledTime.split(":").map(Number);
      const eventDateTime = new Date(event.scheduledDate);
      eventDateTime.setHours(hours, minutes, 0, 0);
      const eventTime = eventDateTime.getTime();

      // Only send reminders for events happening in the next 24-48 hours
      if (eventTime > twentyFourHoursFromNow && eventTime <= fortyEightHoursFromNow) {
        eventsProcessed++;

        try {
          // Skip events without a group
          if (!event.groupId) {
            continue;
          }

          // Get all attendees (or all group members if no attendees confirmed yet)
          const groupMembers = await ctx.runQuery(internal.curryEvents.getGroupMembers, {
            groupId: event.groupId,
          });

          const recipients = event.attendees && event.attendees.length > 0
            ? groupMembers.filter(m => event.attendees!.some(a => a === m._id))
            : groupMembers;

          // Get attendee names for the email
          const attendeeNames = recipients.map(r => r.nickname || r.name || "Curry lover");

          // Format the date for display
          const formattedDate = eventDateTime.toLocaleDateString("en-GB", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          // Calculate hours until event
          const hoursUntilEvent = (eventTime - now) / (60 * 60 * 1000);

          // Send reminder to each recipient
          console.log(`⏰ Sending reminders for "${event.restaurantName}" (${Math.round(hoursUntilEvent)}h away) to ${recipients.length} recipients...`);

          let sentCount = 0;
          for (const recipient of recipients) {
            if (recipient.email) {
              try {
                await sendEventReminder({
                  recipientEmail: recipient.email,
                  recipientName: recipient.nickname || recipient.name || "Curry lover",
                  venueName: event.restaurantName,
                  address: event.address,
                  date: formattedDate,
                  time: event.scheduledTime,
                  googlePlaceId: event.googlePlaceId,
                  attendeeNames,
                  hoursUntilEvent,
                });

                emailsSent++;
                sentCount++;
              } catch (error) {
                console.error(`❌ Failed to send reminder to ${recipient.email}:`, error);
              }
            }
          }

          console.log(`✅ Event reminder summary: ${sentCount}/${recipients.length} sent for "${event.restaurantName}"`);
        } catch (error) {
          console.error(`Failed to send reminders for event ${event._id}:`, error);
        }
      }
    }

    return {
      success: true,
      message: `Processed ${eventsProcessed} events and sent ${emailsSent} reminder emails`,
      eventsProcessed,
      emailsSent,
    };
  },
});

/**
 * Internal action to send booking confirmation emails
 * Called by scheduler after event is created
 */
export const sendBookingConfirmationEmails = internalAction({
  args: {
    eventId: v.id("curryEvents"),
    groupId: v.id("groups"),
    creatorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { sendBookingConfirmation } = await import("./emails/bookingConfirmation");

    // Get the event details
    const event = await ctx.runQuery(internal.curryEvents.getEventById, {
      eventId: args.eventId,
    });

    if (!event) {
      console.error(`Event ${args.eventId} not found`);
      return;
    }

    // Get the creator's info
    const creator = await ctx.runQuery(internal.curryEvents.getUserById, {
      userId: args.creatorId,
    });
    const creatorName = creator?.nickname || creator?.name || "A curry enthusiast";

    // Get all group members
    const groupMembers = await ctx.runQuery(internal.curryEvents.getGroupMembers, {
      groupId: args.groupId,
    });

    // Format the date for display
    const eventDate = new Date(event.scheduledDate);
    const formattedDate = eventDate.toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Send email to each group member
    let emailsSent = 0;
    const failedEmails: string[] = [];

    console.log(`📧 Sending booking confirmations for "${event.restaurantName}" to ${groupMembers.length} group members...`);

    for (const member of groupMembers) {
      if (member.email) {
        try {
          await sendBookingConfirmation({
            recipientEmail: member.email,
            recipientName: member.nickname || member.name || "Curry lover",
            venueName: event.restaurantName,
            address: event.address,
            date: formattedDate,
            time: event.scheduledTime,
            googlePlaceId: event.googlePlaceId,
            bookerName: creatorName,
          });
          emailsSent++;
        } catch (error) {
          failedEmails.push(member.email);
          console.error(`❌ Failed to send to ${member.email}:`, error);
        }
      }
    }

    console.log(`✅ Booking confirmation summary: ${emailsSent} sent successfully${failedEmails.length > 0 ? `, ${failedEmails.length} failed (${failedEmails.join(", ")})` : ""}`);
  },
});

/**
 * Internal query to get event by ID (for actions)
 */
export const getEventById = internalQuery({
  args: { eventId: v.id("curryEvents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.eventId);
  },
});

/**
 * Internal query to get user by ID (for actions)
 */
export const getUserById = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

/**
 * Internal query to get group members (for actions)
 */
export const getGroupMembers = internalQuery({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("groupMemberships")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const members = [];
    for (const membership of memberships) {
      const user = await ctx.db.get(membership.userId);
      if (user) {
        members.push({
          _id: user._id,
          email: user.email,
          nickname: user.nickname,
          name: user.name,
        });
      }
    }

    return members;
  },
});

/**
 * Internal query to get upcoming events (for reminder action)
 */
export const getUpcomingEventsForReminders = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("curryEvents")
      .withIndex("by_status", (q) => q.eq("status", "upcoming"))
      .collect();
  },
});
