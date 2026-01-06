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
    venuesRated: v.optional(v.number()), // Generic venue stats
    venuesAdded: v.optional(v.number()),

    // Onboarding completion
    onboardingComplete: v.optional(v.boolean()),

    // Group context
    activeGroupId: v.optional(v.id("groups")),

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
    averagePriceRanking: v.optional(v.number()), // Average price (1-5, displayed as £-£££££)
    totalRatings: v.number(),

    // Incomplete status for backdated restaurants
    isIncomplete: v.optional(v.boolean()),

    // Group scoping
    groupId: v.optional(v.id("groups")),
  })
    .index("by_name", ["name"])
    .index("by_added_by", ["addedBy"])
    .index("by_overall_average", ["overallAverage"])
    .index("by_added_at", ["addedAt"])
    .index("by_group", ["groupId"]),

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

    // Price ranking (1-5, displayed as £ to £££££)
    price: v.optional(v.number()),

    // Optional notes about the visit
    notes: v.optional(v.string()),

    // Booking claim tracking for backdated ratings
    bookerName: v.optional(v.string()), // Original booker name (e.g., "Goose", "Duff")
    claimedBy: v.optional(v.id("users")), // User who claimed this rating

    // Link to curry event (new event-based rating system)
    eventId: v.optional(v.id("curryEvents")),

    // Group scoping
    groupId: v.optional(v.id("groups")),

    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_restaurant", ["restaurantId"])
    .index("by_user_and_restaurant", ["userId", "restaurantId"])
    .index("by_created_at", ["createdAt"])
    .index("by_visit_date", ["visitDate"])
    .index("by_event", ["eventId"])
    .index("by_group", ["groupId"]),

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
    status: v.string(), // "upcoming", "active", "completed", "cancelled"
    notes: v.optional(v.string()),

    // Attendance tracking
    attendees: v.optional(v.array(v.id("users"))), // Users who confirmed attendance
    hasVoted: v.optional(v.array(v.id("users"))), // Users who submitted ratings
    ratingsRevealed: v.optional(v.boolean()), // Whether ratings are visible (all voted or override)

    // Price ranking (averaged from attendee ratings, 1-5)
    averagePriceRanking: v.optional(v.number()),

    // Group scoping
    groupId: v.optional(v.id("groups")),
  })
    .index("by_scheduled_date", ["scheduledDate"])
    .index("by_status", ["status"])
    .index("by_created_by", ["createdBy"])
    .index("by_group", ["groupId"])
    .index("by_group_and_status", ["groupId", "status"]),

  // Booking rotation tracking - who's turn it is to book the next curry
  bookingRotation: defineTable({
    userId: v.id("users"),
    rotationOrder: v.number(), // Position in the rotation (0, 1, 2, etc.)
    isCurrentBooker: v.boolean(), // True for the person whose turn it is
    canOverride: v.boolean(), // True if user has admin/override permissions
    addedAt: v.number(),

    // Group scoping - separate rotation per group
    groupId: v.optional(v.id("groups")),
  })
    .index("by_user", ["userId"])
    .index("by_rotation_order", ["rotationOrder"])
    .index("by_current_booker", ["isCurrentBooker"])
    .index("by_group", ["groupId"])
    .index("by_group_and_user", ["groupId", "userId"])
    .index("by_group_and_current_booker", ["groupId", "isCurrentBooker"]),

  // Groups - curry groups that users can join
  groups: defineTable({
    name: v.string(),
    accessCode: v.string(), // Unique access code for joining (e.g., "curry-club-2024-xk7p")
    createdBy: v.id("users"),
    createdAt: v.number(),

    // Optional metadata
    description: v.optional(v.string()),
    tier: v.optional(v.string()), // Subscription tier (e.g., "pro", "free")
    venueType: v.optional(v.string()), // Type of venue (e.g., "curry_restaurant")
    venueTypeConfig: v.optional(
      v.object({
        eventName: v.string(), // e.g., "curry night"
        plural: v.string(), // e.g., "curry houses"
        singular: v.string(), // e.g., "curry house"
      })
    ),
  })
    .index("by_access_code", ["accessCode"])
    .index("by_created_by", ["createdBy"]),

  // Group memberships - tracks which users belong to which groups
  groupMemberships: defineTable({
    userId: v.id("users"),
    groupId: v.id("groups"),

    // Role & permissions
    role: v.string(), // "owner", "admin", "member"

    // Metadata
    joinedAt: v.number(),
    isActive: v.boolean(), // For soft deletes
  })
    .index("by_user", ["userId"])
    .index("by_group", ["groupId"])
    .index("by_user_and_group", ["userId", "groupId"]),

  // Date voting for collaborative scheduling
  dateVotes: defineTable({
    userId: v.id("users"),
    date: v.number(), // Timestamp of the date (midnight UTC)
    groupId: v.id("groups"),
    votedAt: v.number(), // When the vote was cast
  })
    .index("by_group", ["groupId"])
    .index("by_group_and_date", ["groupId", "date"])
    .index("by_user_and_group", ["userId", "groupId"]),
});

export default schema;
