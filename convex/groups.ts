import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

/**
 * Generate a unique access code for a group
 * Format: curry-word-year-random (e.g., "curry-club-2024-xk7p")
 */
async function generateAccessCode(ctx: any): Promise<string> {
  const words = [
    "spice", "flavor", "masala", "tandoor", "naan", "chutney",
    "tikka", "korma", "vindaloo", "biryani", "samosa", "paneer"
  ];

  const year = new Date().getFullYear();
  const word = words[Math.floor(Math.random() * words.length)];

  // Generate 4 random alphanumeric characters (no ambiguous characters)
  const chars = "abcdefghjkmnpqrstuvwxyz23456789"; // Removed: 0, O, 1, l, I
  let random = "";
  for (let i = 0; i < 4; i++) {
    random += chars[Math.floor(Math.random() * chars.length)];
  }

  const code = `curry-${word}-${year}-${random}`;

  // Check if code already exists (very unlikely but better safe)
  const existing = await ctx.db
    .query("groups")
    .withIndex("by_access_code", (q: any) => q.eq("accessCode", code))
    .first();

  // If collision, generate a new one (recursive)
  if (existing) {
    return generateAccessCode(ctx);
  }

  return code;
}

/**
 * Get the user's active group ID
 */
export async function getUserActiveGroup(
  ctx: any,
  userId: Id<"users">
): Promise<Id<"groups"> | null> {
  const user = await ctx.db.get(userId);
  if (!user?.activeGroupId) return null;

  return user.activeGroupId;
}

/**
 * Check if user has access to a specific group
 * Throws error if not authorized
 */
export async function checkGroupAccess(
  ctx: any,
  userId: Id<"users">,
  groupId: Id<"groups">
): Promise<void> {
  const membership = await ctx.db
    .query("groupMemberships")
    .withIndex("by_user_and_group", (q: any) =>
      q.eq("userId", userId).eq("groupId", groupId)
    )
    .first();

  if (!membership || !membership.isActive) {
    throw new Error("You don't have access to this group");
  }
}

/**
 * Create a new group
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to create a group");
    }

    // Generate unique access code
    const accessCode = await generateAccessCode(ctx);

    // Create the group
    const groupId = await ctx.db.insert("groups", {
      name: args.name,
      accessCode,
      createdBy: userId,
      createdAt: Date.now(),
      description: args.description,
    });

    // Add creator as owner
    await ctx.db.insert("groupMemberships", {
      userId,
      groupId,
      role: "owner",
      joinedAt: Date.now(),
      isActive: true,
    });

    // Set as user's active group
    await ctx.db.patch(userId, {
      activeGroupId: groupId,
    });

    return {
      groupId,
      accessCode,
      message: `Group "${args.name}" created successfully!`,
    };
  },
});

/**
 * Join a group with an access code
 */
export const join = mutation({
  args: {
    accessCode: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to join a group");
    }

    // Find group by access code
    const group = await ctx.db
      .query("groups")
      .withIndex("by_access_code", (q) => q.eq("accessCode", args.accessCode.toLowerCase().trim()))
      .first();

    if (!group) {
      throw new Error("Invalid access code. Please check and try again.");
    }

    // Check if user is already a member
    const existingMembership = await ctx.db
      .query("groupMemberships")
      .withIndex("by_user_and_group", (q) =>
        q.eq("userId", userId).eq("groupId", group._id)
      )
      .first();

    if (existingMembership) {
      if (existingMembership.isActive) {
        // Already a member, just set as active group
        await ctx.db.patch(userId, {
          activeGroupId: group._id,
        });
        return {
          groupId: group._id,
          message: `You're already a member of "${group.name}"`,
        };
      } else {
        // Reactivate membership
        await ctx.db.patch(existingMembership._id, {
          isActive: true,
          joinedAt: Date.now(),
        });
      }
    } else {
      // Add as new member
      await ctx.db.insert("groupMemberships", {
        userId,
        groupId: group._id,
        role: "member",
        joinedAt: Date.now(),
        isActive: true,
      });
    }

    // Set as user's active group
    await ctx.db.patch(userId, {
      activeGroupId: group._id,
    });

    return {
      groupId: group._id,
      message: `Welcome to "${group.name}"!`,
    };
  },
});

/**
 * Get the user's current group information
 */
export const getUserGroup = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user?.activeGroupId) return null;

    const group = await ctx.db.get(user.activeGroupId);
    if (!group) return null;

    // Get membership to check role
    const membership = await ctx.db
      .query("groupMemberships")
      .withIndex("by_user_and_group", (q) =>
        q.eq("userId", userId).eq("groupId", group._id)
      )
      .first();

    if (!membership || !membership.isActive) return null;

    // Get member count
    const memberships = await ctx.db
      .query("groupMemberships")
      .withIndex("by_group", (q) => q.eq("groupId", group._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return {
      ...group,
      role: membership.role,
      memberCount: memberships.length,
    };
  },
});

/**
 * Validate an access code without joining
 */
export const validateCode = query({
  args: {
    accessCode: v.string(),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db
      .query("groups")
      .withIndex("by_access_code", (q) => q.eq("accessCode", args.accessCode.toLowerCase().trim()))
      .first();

    if (!group) {
      return { valid: false, name: null };
    }

    return {
      valid: true,
      name: group.name,
    };
  },
});

/**
 * Internal mutation to create the default "Chutney Smugglers" group
 * and migrate all existing data
 */
export const createDefaultGroup = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting default group creation and data migration...");

    // Check if default group already exists
    const existingGroups = await ctx.db.query("groups").collect();
    if (existingGroups.length > 0) {
      console.log("Groups already exist, skipping default group creation");
      return {
        success: false,
        message: "Groups already exist",
      };
    }

    // Generate access code
    const accessCode = await generateAccessCode(ctx);

    // Get all existing users
    const allUsers = await ctx.db.query("users").collect();
    if (allUsers.length === 0) {
      throw new Error("No users found to create default group");
    }

    // Use first user as creator (or the admin user if exists)
    const adminUserId = "k573zewczry92fgnxw80ndz89d7w33he" as any;
    const adminUser = allUsers.find((u) => u._id === adminUserId);
    const creatorId = adminUser ? adminUser._id : allUsers[0]._id;

    // Create default group
    const groupId = await ctx.db.insert("groups", {
      name: "Chutney Smugglers",
      accessCode,
      createdBy: creatorId,
      createdAt: Date.now(),
      description: "The original curry crew",
    });

    console.log(`Created default group: ${groupId} with code: ${accessCode}`);

    // Add all existing users as members
    let memberCount = 0;
    for (const user of allUsers) {
      await ctx.db.insert("groupMemberships", {
        userId: user._id,
        groupId,
        role: user._id === creatorId ? "owner" : "member",
        joinedAt: Date.now(),
        isActive: true,
      });

      // Set as active group for each user
      await ctx.db.patch(user._id, {
        activeGroupId: groupId,
      });

      memberCount++;
    }

    console.log(`Added ${memberCount} users to default group`);

    // Backfill group ID for all restaurants
    const allRestaurants = await ctx.db.query("restaurants").collect();
    for (const restaurant of allRestaurants) {
      await ctx.db.patch(restaurant._id, {
        groupId,
      });
    }
    console.log(`Updated ${allRestaurants.length} restaurants with groupId`);

    // Backfill group ID for all ratings
    const allRatings = await ctx.db.query("ratings").collect();
    for (const rating of allRatings) {
      await ctx.db.patch(rating._id, {
        groupId,
      });
    }
    console.log(`Updated ${allRatings.length} ratings with groupId`);

    // Backfill group ID for all curry events
    const allEvents = await ctx.db.query("curryEvents").collect();
    for (const event of allEvents) {
      await ctx.db.patch(event._id, {
        groupId,
      });
    }
    console.log(`Updated ${allEvents.length} curry events with groupId`);

    // Backfill group ID for all booking rotation entries
    const allRotations = await ctx.db.query("bookingRotation").collect();
    for (const rotation of allRotations) {
      await ctx.db.patch(rotation._id, {
        groupId,
      });
    }
    console.log(`Updated ${allRotations.length} booking rotation entries with groupId`);

    return {
      success: true,
      groupId,
      accessCode,
      message: `Default group created with ${memberCount} members. Access code: ${accessCode}`,
      stats: {
        users: memberCount,
        restaurants: allRestaurants.length,
        ratings: allRatings.length,
        events: allEvents.length,
        rotations: allRotations.length,
      },
    };
  },
});
