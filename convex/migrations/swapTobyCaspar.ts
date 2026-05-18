import { internalMutation } from "../_generated/server";

/**
 * One-off: swap Toby and Caspar in the booking rotation so Caspar becomes the
 * current booker and Toby moves to next month.
 */
export const swapTobyAndCaspar = internalMutation({
  args: {},
  handler: async (ctx) => {
    const tobyUserId = "k57c28g0np34k0swjgqxgysn8n7wdapk" as any;
    const casparUserId = "k577s9dnmzm1xwtmhnnn4zp6817wd52b" as any;

    const toby = await ctx.db
      .query("bookingRotation")
      .withIndex("by_user", (q) => q.eq("userId", tobyUserId))
      .first();
    const caspar = await ctx.db
      .query("bookingRotation")
      .withIndex("by_user", (q) => q.eq("userId", casparUserId))
      .first();

    if (!toby || !caspar) {
      throw new Error(
        `Missing rotation entry: toby=${!!toby} caspar=${!!caspar}`,
      );
    }

    const tobyOrder = toby.rotationOrder;
    const tobyIsCurrent = toby.isCurrentBooker;

    await ctx.db.patch(toby._id, {
      rotationOrder: caspar.rotationOrder,
      isCurrentBooker: caspar.isCurrentBooker,
    });
    await ctx.db.patch(caspar._id, {
      rotationOrder: tobyOrder,
      isCurrentBooker: tobyIsCurrent,
    });

    return {
      success: true,
      toby: { order: caspar.rotationOrder, isCurrentBooker: caspar.isCurrentBooker },
      caspar: { order: tobyOrder, isCurrentBooker: tobyIsCurrent },
    };
  },
});
