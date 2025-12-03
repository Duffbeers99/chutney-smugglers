import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * One-time migration to set the exact booking rotation order
 * This should be run once to establish the correct rotation for the Chutney Smugglers group
 *
 * Rotation order:
 * 0. Goose (j57bmhe8jn1htxv3bjnbmjy0gd7w5n2j) - Current booker
 * 1. j579spxq43qf9nrg6x1g9px1an7w2nfz
 * 2. j574kzws0mf8acpwc664vc8j8s7wdkqc
 * 3. j57acztf4ydrba484hsg91rwx97wc1v3
 * 4. j571enqbnzy1nxg6qy0hytrreh7wcry7
 * 5. j574qhqp2nnrhr7mjs79rftnz97wdsdt
 * 6. j573nynp4myq4anvj5e6jkkpkx7wcm4n
 */
export const setBookingRotationOrder = internalMutation({
  args: {
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const { groupId } = args;

    // User IDs in rotation order (correct Convex IDs)
    const rotationOrder = [
      "k575ngvpxwvmyppfep8s310tmd7w40d2", // Position 0 - Current booker
      "k573zewczry92fgnxw80ndz89d7w33he", // Position 1
      "k57aam20v1n5db4x4kyernbaz97wdnvy", // Position 2
      "k576b7p1wk3jxj19etqwckjv7d7wcpaq", // Position 3
      "k57c28g0np34k0swjgqxgysn8n7wdapk", // Position 4
      "k577s9dnmzm1xwtmhnnn4zp6817wd52b", // Position 5
      "k57fgdy9vb8nj8yjc1aa8t1vg57wct8q", // Position 6
    ];

    console.log(`🔄 Setting booking rotation for group ${groupId}...`);

    // Step 1: Clear all existing rotation entries for this group
    const existingRotations = await ctx.db
      .query("bookingRotation")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();

    console.log(`📋 Found ${existingRotations.length} existing rotation entries`);

    for (const rotation of existingRotations) {
      await ctx.db.delete(rotation._id);
    }

    console.log(`🗑️  Cleared all existing rotation entries`);

    // Step 2: Create new rotation entries
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rotationOrder.length; i++) {
      const userId = rotationOrder[i] as any; // Cast to Id<"users">
      const isCurrentBooker = i === 0; // First person (Goose) is the current booker

      try {
        // Verify user exists
        const user = await ctx.db.get(userId);

        if (!user) {
          console.error(`❌ User ${userId} not found, skipping`);
          errorCount++;
          continue;
        }

        // Check if this is actually a user document
        if (!("email" in user)) {
          console.error(`❌ ${userId} is not a valid user ID, skipping`);
          errorCount++;
          continue;
        }

        // Create rotation entry
        await ctx.db.insert("bookingRotation", {
          userId,
          rotationOrder: i,
          isCurrentBooker,
          canOverride: false, // Set to false for all users initially
          addedAt: Date.now(),
          groupId,
        });

        const userName = (user as any).nickname || (user as any).name || "User";
        console.log(
          `✅ Added ${userName} to position ${i}${isCurrentBooker ? " (CURRENT BOOKER)" : ""}`
        );
        successCount++;
      } catch (error) {
        console.error(`❌ Error adding user ${userId} to rotation:`, error);
        errorCount++;
      }
    }

    console.log(`\n📊 Migration complete:`);
    console.log(`   ✅ Successfully added: ${successCount} users`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   🎯 Current booker: ${rotationOrder[0]}`);

    return {
      success: true,
      addedCount: successCount,
      errorCount,
      currentBooker: rotationOrder[0],
    };
  },
});

/**
 * Helper mutation to set admin override for specific users
 * Run this after the main migration if you want to give certain users override permissions
 */
export const setAdminOverride = internalMutation({
  args: {
    userId: v.id("users"),
    groupId: v.id("groups"),
    canOverride: v.boolean(),
  },
  handler: async (ctx, args) => {
    const rotation = await ctx.db
      .query("bookingRotation")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", args.userId)
      )
      .first();

    if (!rotation) {
      throw new Error("User not found in booking rotation");
    }

    await ctx.db.patch(rotation._id, {
      canOverride: args.canOverride,
    });

    const user = await ctx.db.get(args.userId);
    const userName = user ? ((user as any).nickname || (user as any).name || "User") : "User";
    console.log(
      `✅ Set canOverride=${args.canOverride} for ${userName}`
    );

    return { success: true };
  },
});
