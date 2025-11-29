import { v } from "convex/values";
import { mutation } from "./_generated/server";

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
