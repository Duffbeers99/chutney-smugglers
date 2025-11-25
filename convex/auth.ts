import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      id: "password",
      // Temporarily disable reset for testing - add back after Resend is configured
      // reset: ResendPasswordReset,
    }),
  ],
});
