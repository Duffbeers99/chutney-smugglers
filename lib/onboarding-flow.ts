import { Doc } from "@/convex/_generated/dataModel";

export type OnboardingStep = "nickname" | "group" | "avatar" | "complete";

export function isOnboardingComplete(user: Doc<"users"> | null): boolean {
  if (!user) return false;
  return user.onboardingComplete === true && !!user.nickname && !!user.activeGroupId;
}

export function getCurrentOnboardingStep(
  user: Doc<"users"> | null
): OnboardingStep | null {
  if (!user) return null;

  if (user.onboardingComplete) {
    return "complete";
  }

  // If no nickname, go to nickname step
  if (!user.nickname) {
    return "nickname";
  }

  // If nickname is set but no group, go to group step
  if (!user.activeGroupId) {
    return "group";
  }

  // If nickname and group are set but not completed, consider it done
  return "complete";
}

export function getNextOnboardingPath(user: Doc<"users"> | null): string {
  if (!user) return "/";

  const step = getCurrentOnboardingStep(user);

  switch (step) {
    case "nickname":
      return "/onboarding/nickname";
    case "group":
      return "/onboarding/group";
    case "avatar":
      return "/onboarding/avatar";
    case "complete":
      return "/dashboard";
    default:
      return "/onboarding/nickname";
  }
}

export function validateNickname(nickname: string): {
  valid: boolean;
  error?: string;
} {
  if (!nickname || nickname.trim().length === 0) {
    return { valid: false, error: "Nickname is required" };
  }

  if (nickname.length < 2) {
    return { valid: false, error: "Nickname must be at least 2 characters" };
  }

  if (nickname.length > 30) {
    return { valid: false, error: "Nickname must be less than 30 characters" };
  }

  // Check for inappropriate characters (allow letters, numbers, spaces, underscores, hyphens)
  if (!/^[a-zA-Z0-9\s_-]+$/.test(nickname)) {
    return {
      valid: false,
      error: "Nickname can only contain letters, numbers, spaces, underscores, and hyphens",
    };
  }

  return { valid: true };
}

export function getOnboardingProgress(user: Doc<"users"> | null): number {
  if (!user) return 0;

  let progress = 0;

  // Nickname is required (40%)
  if (user.nickname) progress += 40;

  // Group is required (40%)
  if (user.activeGroupId) progress += 40;

  // Profile image is optional but adds to progress (20%)
  if (user.profileImageId) progress += 20;

  // If onboarding is marked complete, return 100
  if (user.onboardingComplete) return 100;

  return progress;
}
