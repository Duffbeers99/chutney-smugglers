import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  // Auth tables from @convex-dev/auth
  ...authTables,

  // Users table with enhanced profile fields
  users: defineTable({
    // Core auth fields
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    image: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),

    // Profile fields
    nickname: v.optional(v.string()),
    profileImageId: v.optional(v.id("_storage")),

    // User statistics
    curriesRated: v.optional(v.number()),
    curriesAdded: v.optional(v.number()),
    averageRating: v.optional(v.number()),

    // Onboarding completion
    onboardingComplete: v.optional(v.boolean()),

    createdAt: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("by_created_at", ["createdAt"]),

  // Restaurants/curry houses
  restaurants: defineTable({
    name: v.string(),
    address: v.string(),
    cuisine: v.optional(v.string()),

    // Google Places integration
    googlePlaceId: v.optional(v.string()),

    // Location data for future maps integration
    location: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
      })
    ),

    // Who added this restaurant
    addedBy: v.id("users"),
    addedAt: v.number(),

    // Aggregate rating statistics
    averageFood: v.optional(v.number()),
    averageService: v.optional(v.number()),
    averageExtras: v.optional(v.number()),
    averageAtmosphere: v.optional(v.number()),
    overallAverage: v.optional(v.number()),
    totalRatings: v.number(),

    // Incomplete status for backdated restaurants
    isIncomplete: v.optional(v.boolean()),
  })
    .index("by_name", ["name"])
    .index("by_added_by", ["addedBy"])
    .index("by_overall_average", ["overallAverage"])
    .index("by_added_at", ["addedAt"]),

  // Individual curry visit ratings
  ratings: defineTable({
    userId: v.id("users"),
    restaurantId: v.id("restaurants"),
    visitDate: v.number(),

    // Multi-category ratings (out of 5)
    food: v.number(),
    service: v.number(),
    extras: v.number(),
    atmosphere: v.number(),

    // Optional notes about the visit
    notes: v.optional(v.string()),

    // Booking claim tracking for backdated ratings
    bookerName: v.optional(v.string()), // Original booker name (e.g., "Goose", "Duff")
    claimedBy: v.optional(v.id("users")), // User who claimed this rating

    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_restaurant", ["restaurantId"])
    .index("by_user_and_restaurant", ["userId", "restaurantId"])
    .index("by_created_at", ["createdAt"])
    .index("by_visit_date", ["visitDate"]),

  // Upcoming curry events/bookings
  curryEvents: defineTable({
    restaurantId: v.id("restaurants"),
    restaurantName: v.string(), // Denormalized for quick access
    address: v.string(), // Denormalized

    // Google Places integration (denormalized)
    googlePlaceId: v.optional(v.string()),
    location: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
      })
    ),

    scheduledDate: v.number(), // Timestamp for the date
    scheduledTime: v.string(), // Time in HH:mm format (e.g., "19:30")
    createdBy: v.id("users"),
    createdAt: v.number(),
    status: v.string(), // "upcoming", "completed", "cancelled"
    notes: v.optional(v.string()),
  })
    .index("by_scheduled_date", ["scheduledDate"])
    .index("by_status", ["status"])
    .index("by_created_by", ["createdBy"]),

  // Booking rotation tracking - who's turn it is to book the next curry
  bookingRotation: defineTable({
    userId: v.id("users"),
    rotationOrder: v.number(), // Position in the rotation (0, 1, 2, etc.)
    isCurrentBooker: v.boolean(), // True for the person whose turn it is
    canOverride: v.boolean(), // True if user has admin/override permissions
    addedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_rotation_order", ["rotationOrder"])
    .index("by_current_booker", ["isCurrentBooker"]),
});

export default schema;
