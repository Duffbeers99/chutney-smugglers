import { v } from "convex/values";
import { action, internalQuery, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getUserActiveGroup } from "./groups";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Helper query to get user's active group (for use in actions)
 */
export const getUserGroup = internalQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await getUserActiveGroup(ctx, userId);
  },
});

/**
 * Internal query to fetch all data needed for article generation
 */
export const getEventDataForArticle = internalQuery({
  args: {
    eventId: v.id("curryEvents"),
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    // Fetch the event
    const event = await ctx.db.get(args.eventId);
    if (!event || event.status !== "completed" || !event.ratingsRevealed) {
      throw new Error("Event not found or not ready for article generation");
    }

    // Fetch restaurant details
    const restaurant = await ctx.db.get(event.restaurantId);
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    // Fetch all ratings for this event
    const ratings = await ctx.db
      .query("ratings")
      .filter((q) => q.eq(q.field("eventId"), args.eventId))
      .collect();

    // Enrich ratings with user information
    const enrichedRatings = await Promise.all(
      ratings.map(async (rating) => {
        const user = await ctx.db.get(rating.userId);
        if (!user) return null;

        let profileImageUrl: string | null = null;
        if (user.profileImageId) {
          profileImageUrl = await ctx.storage.getUrl(user.profileImageId);
        }

        return {
          _id: rating._id,
          userId: user._id,
          userName: user.nickname || user.name,
          profileImageUrl,
          food: rating.food,
          service: rating.service,
          extras: rating.extras,
          atmosphere: rating.atmosphere,
          price: rating.price,
          overallScore: rating.food + rating.service + rating.extras + rating.atmosphere,
          notes: rating.notes,
        };
      })
    );

    const validRatings = enrichedRatings.filter((r) => r !== null);

    // Calculate averages
    const avgFood = validRatings.reduce((sum, r) => sum + r.food, 0) / validRatings.length;
    const avgService = validRatings.reduce((sum, r) => sum + r.service, 0) / validRatings.length;
    const avgExtras = validRatings.reduce((sum, r) => sum + r.extras, 0) / validRatings.length;
    const avgAtmosphere = validRatings.reduce((sum, r) => sum + r.atmosphere, 0) / validRatings.length;
    const avgTotal = avgFood + avgService + avgExtras + avgAtmosphere;

    // Calculate average price from ratings that have price
    const priceRatings = validRatings.filter((r) => r.price !== undefined && r.price !== null);
    let avgPrice: number | undefined = undefined;
    if (priceRatings.length > 0) {
      const totalPrice = priceRatings.reduce((sum, r) => sum + r.price!, 0);
      avgPrice = Math.round(totalPrice / priceRatings.length);
    }

    // Fetch the booker (event creator) information
    const booker = await ctx.db.get(event.createdBy);
    const bookerName = booker ? (booker.nickname || booker.name) : "Unknown";

    // Get historical data for this restaurant (past visits)
    const pastEvents = await ctx.db
      .query("curryEvents")
      .filter((q) => q.and(
        q.eq(q.field("restaurantId"), event.restaurantId),
        q.eq(q.field("status"), "completed"),
        q.eq(q.field("ratingsRevealed"), true),
        q.neq(q.field("_id"), args.eventId) // Exclude current event
      ))
      .collect();

    // Calculate historical averages for this restaurant
    const historicalContext = pastEvents.length > 0 ? {
      visitCount: pastEvents.length,
      previousVisits: await Promise.all(
        pastEvents
          .sort((a, b) => b.scheduledDate - a.scheduledDate)
          .slice(0, 3) // Last 3 visits
          .map(async (pastEvent) => {
            const pastRatings = await ctx.db
              .query("ratings")
              .filter((q) => q.eq(q.field("eventId"), pastEvent._id))
              .collect();

            const avgFoodPast = pastRatings.reduce((sum, r) => sum + r.food, 0) / pastRatings.length;
            const avgServicePast = pastRatings.reduce((sum, r) => sum + r.service, 0) / pastRatings.length;
            const avgExtrasPast = pastRatings.reduce((sum, r) => sum + r.extras, 0) / pastRatings.length;
            const avgAtmospherePast = pastRatings.reduce((sum, r) => sum + r.atmosphere, 0) / pastRatings.length;

            return {
              date: pastEvent.scheduledDate,
              avgFood: avgFoodPast,
              avgService: avgServicePast,
              avgExtras: avgExtrasPast,
              avgAtmosphere: avgAtmospherePast,
              avgTotal: avgFoodPast + avgServicePast + avgExtrasPast + avgAtmospherePast,
            };
          })
      ),
    } : null;

    // Get group statistics for context
    const allCompletedEvents = await ctx.db
      .query("curryEvents")
      .withIndex("by_group_and_status", (q) =>
        q.eq("groupId", args.groupId).eq("status", "completed")
      )
      .filter((q) => q.eq(q.field("ratingsRevealed"), true))
      .collect();

    // Calculate rankings for this event
    const eventScores = await Promise.all(
      allCompletedEvents.map(async (e) => {
        const eRatings = await ctx.db
          .query("ratings")
          .filter((q) => q.eq(q.field("eventId"), e._id))
          .collect();

        if (eRatings.length === 0) return null;

        const avgFoodE = eRatings.reduce((sum, r) => sum + r.food, 0) / eRatings.length;
        const avgServiceE = eRatings.reduce((sum, r) => sum + r.service, 0) / eRatings.length;
        const avgExtrasE = eRatings.reduce((sum, r) => sum + r.extras, 0) / eRatings.length;
        const avgAtmosphereE = eRatings.reduce((sum, r) => sum + r.atmosphere, 0) / eRatings.length;
        const avgTotalE = avgFoodE + avgServiceE + avgExtrasE + avgAtmosphereE;

        return {
          eventId: e._id,
          restaurantName: e.restaurantName,
          avgTotal: avgTotalE,
          avgFood: avgFoodE,
        };
      })
    );

    const validEventScores = eventScores.filter((e) => e !== null);
    validEventScores.sort((a, b) => b.avgTotal - a.avgTotal);

    const totalRankIndex = validEventScores.findIndex((e) => e.eventId === args.eventId);
    const totalRank = totalRankIndex === -1 ? 0 : totalRankIndex + 1;

    const foodRankIndex = [...validEventScores].sort((a, b) => b.avgFood - a.avgFood)
      .findIndex((e) => e.eventId === args.eventId);
    const foodRank = foodRankIndex === -1 ? 0 : foodRankIndex + 1;

    // For backdated events with few attendees, default to 7 as per historical data
    // This handles cases where backdated events have incomplete attendance records
    const actualAttendeeCount = event.attendees?.length || event.hasVoted?.length || 0;
    const attendeeCount = actualAttendeeCount > 0 && actualAttendeeCount < 7 ? 7 : actualAttendeeCount;

    return {
      event: {
        _id: event._id,
        restaurantId: event.restaurantId,
        restaurantName: event.restaurantName,
        address: event.address,
        googlePlaceId: event.googlePlaceId,
        location: event.location,
        scheduledDate: event.scheduledDate,
        scheduledTime: event.scheduledTime,
        bookerName,
        attendeeCount,
      },
      restaurant: {
        _id: restaurant._id,
        name: restaurant.name,
        address: restaurant.address,
        cuisine: restaurant.cuisine,
        googlePlaceId: restaurant.googlePlaceId,
        location: restaurant.location,
        overallAverage: restaurant.overallAverage,
        totalRatings: restaurant.totalRatings,
      },
      ratings: validRatings,
      averages: {
        food: avgFood,
        service: avgService,
        extras: avgExtras,
        atmosphere: avgAtmosphere,
        total: avgTotal,
        price: avgPrice,
      },
      historicalContext,
      rankings: {
        totalRank,
        foodRank,
        totalEvents: validEventScores.length,
      },
    };
  },
});

/**
 * Internal query to fetch data for a solo mission article
 */
export const getSoloMissionDataForArticle = internalQuery({
  args: {
    ratingId: v.id("ratings"),
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    // Fetch the rating
    const rating = await ctx.db.get(args.ratingId);
    if (!rating || !rating.isSoloMission) {
      throw new Error("Rating not found or is not a solo mission");
    }

    // Fetch restaurant details
    const restaurant = await ctx.db.get(rating.restaurantId);
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    // Fetch user information
    const user = await ctx.db.get(rating.userId);
    if (!user) {
      throw new Error("User not found");
    }

    let profileImageUrl: string | null = null;
    if (user.profileImageId) {
      profileImageUrl = await ctx.storage.getUrl(user.profileImageId);
    }

    const enrichedRating = {
      _id: rating._id,
      userId: user._id,
      userName: user.nickname || user.name,
      profileImageUrl,
      food: rating.food,
      service: rating.service,
      extras: rating.extras,
      atmosphere: rating.atmosphere,
      price: rating.price,
      overallScore: rating.food + rating.service + rating.extras + rating.atmosphere,
      notes: rating.notes,
      isSoloMission: true,
    };

    // Get historical data for this restaurant (past solo missions only)
    const pastSoloRatings = await ctx.db
      .query("ratings")
      .filter((q) => q.and(
        q.eq(q.field("restaurantId"), rating.restaurantId),
        q.eq(q.field("isSoloMission"), true),
        q.neq(q.field("_id"), args.ratingId) // Exclude current rating
      ))
      .collect();

    const historicalContext = pastSoloRatings.length > 0 ? {
      visitCount: pastSoloRatings.length,
      previousVisits: pastSoloRatings
        .sort((a, b) => b.visitDate - a.visitDate)
        .slice(0, 3) // Last 3 visits
        .map((pastRating) => ({
          date: pastRating.visitDate,
          avgFood: pastRating.food,
          avgService: pastRating.service,
          avgExtras: pastRating.extras,
          avgAtmosphere: pastRating.atmosphere,
          avgTotal: pastRating.food + pastRating.service + pastRating.extras + pastRating.atmosphere,
        })),
    } : null;

    // Create a pseudo-event structure for solo missions
    const pseudoEvent = {
      _id: rating._id as any, // Use rating ID as pseudo-event ID
      restaurantId: rating.restaurantId,
      restaurantName: restaurant.name,
      address: restaurant.address,
      googlePlaceId: restaurant.googlePlaceId,
      location: restaurant.location,
      scheduledDate: rating.visitDate,
      scheduledTime: "N/A", // Solo missions don't have a specific time
      bookerName: enrichedRating.userName, // The user themselves
      attendeeCount: 1, // Solo mission - just one person
    };

    return {
      event: pseudoEvent,
      restaurant: {
        _id: restaurant._id,
        name: restaurant.name,
        address: restaurant.address,
        cuisine: restaurant.cuisine,
        googlePlaceId: restaurant.googlePlaceId,
        location: restaurant.location,
        overallAverage: restaurant.overallAverage,
        totalRatings: restaurant.totalRatings,
      },
      ratings: [enrichedRating],
      averages: {
        food: rating.food,
        service: rating.service,
        extras: rating.extras,
        atmosphere: rating.atmosphere,
        total: rating.food + rating.service + rating.extras + rating.atmosphere,
        price: rating.price,
      },
      historicalContext,
      rankings: {
        totalRank: 0, // Solo missions don't have rankings
        foodRank: 0,
        totalEvents: 0,
      },
    };
  },
});

/**
 * Build the prompt for Claude to generate article content
 */
function buildArticlePrompt(data: any, isRetrospective: boolean = false, restaurantInfo: string = ""): string {
  const eventDate = new Date(data.event.scheduledDate);
  const formattedDate = eventDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Detect if this is a solo mission
  const isSoloMission = data.event.attendeeCount === 1 || data.ratings.some((r: any) => r.isSoloMission);

  const historicalContext = data.historicalContext
    ? `This is visit #${data.historicalContext.visitCount + 1} to ${data.event.restaurantName}. Previous visit scores: ${JSON.stringify(data.historicalContext.previousVisits)}`
    : `This is the first visit to ${data.event.restaurantName}.`;

  const memberNotes = data.ratings
    .filter((r: any) => r.notes && r.notes.trim().length > 0)
    .map((r: any) => isSoloMission ? `"${r.notes}"` : `${r.userName}: "${r.notes}"`)
    .join('\n');

  const hasNotes = memberNotes.length > 0;

  if (isSoloMission) {
    return `You are writing an engaging curry review article for "The Chutney Smugglers" - a group of friends who visit curry restaurants together and rate them. This is a SOLO MISSION - a lone smuggler ventured out to explore this restaurant independently.
${isRetrospective ? '\n**IMPORTANT:** This is a retrospective review. You did not record detailed notes at the time. You must base your narrative on the ratings data and restaurant research provided below. Use first-person observations (e.g., "I found...", "The food was...") rather than direct quotes.' : ''}

**Solo Mission Details:**
- Restaurant: ${data.event.restaurantName}
- Location: ${data.event.address}
- Date: ${formattedDate}

**Scores (out of 25 total):**
- Food: ${data.averages.food.toFixed(1)}/10
- Service: ${data.averages.service.toFixed(1)}/5
- Extras: ${data.averages.extras.toFixed(1)}/5
- Atmosphere: ${data.averages.atmosphere.toFixed(1)}/5
- **Overall: ${data.averages.total.toFixed(1)}/25**
${data.averages.price ? `- Price Level: £${'£'.repeat(data.averages.price - 1)} (${data.averages.price}/5)` : ''}

**Note:** This is a solo mission rating and does NOT count toward the official Chutney Smugglers leaderboard.

**Historical Context:**
${historicalContext}

${isRetrospective && restaurantInfo ? `**Restaurant Research:**
${restaurantInfo}
` : ''}

${hasNotes ? `**Notes from the mission:**
${memberNotes}` : `**Mission Notes:**
No detailed notes were recorded for this solo visit. Base your narrative on the ratings and ${isRetrospective ? 'restaurant research' : 'general curry dining experience'}.`}

---

Write an engaging, humorous, and personable article about this solo curry mission. The article should:

1. **Opening**: Write a catchy, entertaining opening paragraph (2-3 sentences) that sets the scene for a SOLO MISSION. Make it clear this was a lone adventure, not a group outing.

2. **The Experience**: Write 2-3 paragraphs describing the curry experience in FIRST PERSON. ${hasNotes ? 'Draw from the notes to create a narrative.' : 'Use the ratings to infer the experience - high food scores suggest standout dishes worth celebrating, moderate scores suggest solid execution, lower scores suggest room for improvement but frame these diplomatically.'} ${isRetrospective && restaurantInfo ? 'Use the restaurant research to add authentic details about the venue, popular dishes, and general vibe.' : ''} Be specific and vivid, describe the atmosphere, talk about service quality. Lead with positives before mentioning areas that could be improved. Use "I" throughout - NO group references.

3. ${hasNotes ? '**Personal Observations**: Pull out 2-3 memorable observations from the notes and weave them naturally into the narrative. Make it feel like a personal diary entry or story about a solo dining experience.' : '**Personal Reflections**: Based on the scores, describe the experience using first-person observations. For example: "I was impressed by the food" or "While the atmosphere could be enhanced, the quality of the dishes made up for it." Frame lower scores constructively. DO NOT create fake quotes.'}

4. **Solo Mission Context**: ${data.historicalContext ? `Compare this visit to previous visits. Has it improved? Gotten worse?` : `Note this is the first solo visit to this restaurant.`} Reflect on the experience of dining alone vs. with the group.

5. **The Verdict**: Write a concluding paragraph (2-3 sentences) that sums up the experience and provides a clear personal recommendation. Reference the overall score. Make it clear this is a solo mission rating.

**Tone Guidelines:**
- Conversational and fun, like you're telling a mate about a solo adventure
- British humor and slang welcome
- First-person throughout - use "I", not "we" or "the team"
- Balanced and constructive - celebrate what works well and gently note areas for improvement
- For lower scores, be diplomatic and fair rather than harsh or overly critical
- Focus on what the restaurant does right before mentioning shortcomings
- Frame criticisms constructively (e.g., "could be improved" rather than "was terrible")
- Reflect on the solo dining experience with an open mind
- No corporate-speak or overly formal language
- Remember: we want to build relationships with restaurants, not burn bridges

**Target Audience:**
- Young people in London interested in curry
- Friends and mates who enjoy good food
- People looking for honest, entertaining restaurant reviews

**Format Requirements:**
Return your response in this EXACT format:

TITLE: [Create a catchy, entertaining title that includes "SOLO MISSION" and captures attention. Make it fun, punchy, and click-worthy. Reference the restaurant name. Keep it under 60 characters.]

SUBTITLE: [Write a compelling subtitle that clarifies this is an individual adventure, not a group review. Keep it under 100 characters.]

ARTICLE:
[The article text in paragraph form using FIRST PERSON. Do not include headers, titles, or section labels - just flowing prose. The article should be 400-600 words.]`;
  }

  return `You are writing an engaging curry review article for "The Chutney Smugglers" - a group of friends who visit curry restaurants together and rate them.
${isRetrospective ? '\n**IMPORTANT:** This is a retrospective review. The team visited this restaurant but did not record detailed notes. You must base your narrative on the ratings data and restaurant research provided below. Use general observations (e.g., "The team found...", "Smugglers felt...") rather than direct quotes.' : ''}

**Event Details:**
- Restaurant: ${data.event.restaurantName}
- Location: ${data.event.address}
- Date: ${formattedDate} at ${data.event.scheduledTime}
- Booked by: ${data.event.bookerName}
- Attendees: ${data.event.attendeeCount} people

**Scores (out of 25 total):**
- Food: ${data.averages.food.toFixed(1)}/10
- Service: ${data.averages.service.toFixed(1)}/5
- Extras: ${data.averages.extras.toFixed(1)}/5
- Atmosphere: ${data.averages.atmosphere.toFixed(1)}/5
- **Overall: ${data.averages.total.toFixed(1)}/25**
${data.averages.price ? `- Price Level: £${'£'.repeat(data.averages.price - 1)} (${data.averages.price}/5)` : ''}

**Rankings:**
- This curry ranks #${data.rankings.totalRank} out of ${data.rankings.totalEvents} total curries
- Food score ranks #${data.rankings.foodRank}

**Historical Context:**
${historicalContext}

${isRetrospective && restaurantInfo ? `**Restaurant Research:**
${restaurantInfo}
` : ''}

${hasNotes ? `**What the team said:**
${memberNotes}` : `**Team Notes:**
No detailed notes were recorded for this visit. Base your narrative on the ratings and ${isRetrospective ? 'restaurant research' : 'general curry dining experience'}.`}

---

Write an engaging, humorous, and personable article about this curry night. The article should:

1. **Opening**: Write a catchy, entertaining opening paragraph (2-3 sentences) that sets the scene. Reference who booked it and create anticipation.

2. **The Experience**: Write 2-3 paragraphs describing the curry experience. ${hasNotes ? 'Draw from the team\'s notes to create a narrative.' : 'Use the ratings to infer the experience - high food scores suggest standout dishes worth celebrating, moderate scores suggest solid execution, lower scores suggest room for improvement but frame these diplomatically.'} ${isRetrospective && restaurantInfo ? 'Use the restaurant research to add authentic details about the venue, popular dishes, and general vibe.' : ''} Be specific and vivid, describe the atmosphere, talk about service quality. Lead with positives before mentioning areas that could be improved. Use the scores to inform your writing but don't just list them.

3. ${hasNotes ? '**Highlights & Quotes**: Pull out 2-3 memorable quotes or observations from the team notes and weave them naturally into the narrative. Make it feel like you\'re telling a story about friends having dinner together.' : '**General Observations**: Based on the scores, describe the team\'s experience using general observations. For example: "The Smugglers were impressed by the food, with scores averaging 7.2/10" or "While the atmosphere has room to grow, the solid food and friendly service made for an enjoyable evening." Frame lower scores constructively. DO NOT create fake direct quotes.'}

4. **Historical Perspective**: ${data.historicalContext ? `Compare this visit to the previous visit(s). Has it improved? Gotten worse? Make this comparison interesting and specific.` : `Note this is the first visit. Build anticipation for whether the team will return.`}

5. **The Verdict**: Write a concluding paragraph (2-3 sentences) that sums up the experience and provides a clear recommendation. Reference the overall score and ranking.

**Tone Guidelines:**
- Conversational and fun, like you're telling a mate about a good night out
- British humor and slang welcome
- Balanced and constructive - celebrate what works well and gently note areas for improvement
- For lower scores, be diplomatic and fair rather than harsh or overly critical
- Focus on what the restaurant does right before mentioning shortcomings
- Frame criticisms constructively (e.g., "could be improved" rather than "was terrible")
- Celebrate the camaraderie of the group and the overall experience
- No corporate-speak or overly formal language
- Remember: we want to build relationships with restaurants, not burn bridges

**Target Audience:**
- Young people in London interested in curry
- Friends and mates who enjoy good food and good times
- People looking for honest, entertaining restaurant reviews

**Format Requirements:**
Return your response in this EXACT format:

TITLE: [Create a catchy, entertaining title that captures attention. Make it fun, punchy, and click-worthy. Reference the restaurant name and hint at the verdict. Keep it under 60 characters.]

SUBTITLE: [Write a compelling subtitle that adds context or intrigue. This could reference the score, location, a standout moment, or create anticipation. Keep it under 100 characters.]

ARTICLE:
[The article text in paragraph form. Do not include headers, titles, or section labels - just flowing prose. The article should be 400-600 words.]`;
}

/**
 * Build the complete HTML article with charts and formatting
 */
function buildHTMLArticle(narrative: string, data: any, isRetrospective: boolean = false): string {
  const eventDate = new Date(data.event.scheduledDate);
  const weekNumber = getWeekNumber(eventDate);
  const formattedDate = eventDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Helper function to extract snappy quotes from notes
  const extractSnappyQuotes = (notes: string, maxQuotes: number = 3): string[] => {
    if (!notes || notes.trim().length === 0) return [];

    // Split by sentences (periods, exclamation marks, question marks)
    const sentences = notes.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    const quotes: string[] = [];

    // Find interesting/emotional sentences
    const interestingSentences = sentences.filter((s) => {
      const trimmed = s.trim();
      return (
        trimmed.length > 15 &&
        trimmed.length < 120 &&
        (/delicious|amazing|incredible|fantastic|excellent|great|good|wonderful|lovely|perfect|terrible|awful|poor|bad|disappointing|bland|mediocre|average|ok|decent/i.test(trimmed) ||
         /loved|enjoyed|recommend|impressed|surprised|disappointed|expected|worth/i.test(trimmed))
      );
    });

    // Add interesting sentences first
    for (const sentence of interestingSentences.slice(0, maxQuotes)) {
      quotes.push(sentence.trim());
    }

    // If we don't have enough, add regular sentences
    if (quotes.length < maxQuotes) {
      for (const sentence of sentences) {
        if (quotes.length >= maxQuotes) break;
        const trimmed = sentence.trim();
        if (trimmed.length > 15 && trimmed.length < 120 && !quotes.includes(trimmed)) {
          quotes.push(trimmed);
        }
      }
    }

    return quotes.slice(0, maxQuotes);
  };

  return `
<h1>${data.event.restaurantName}</h1>

<p style="color: #666; font-size: 16px; font-style: italic; margin: 10px 0 30px 0;">
  ${formattedDate} • Booked by ${data.event.bookerName} • ${data.event.attendeeCount} Smugglers in attendance
</p>

<hr style="border: none; border-top: 2px solid #f0f0f0; margin: 30px 0;" />

<h2 style="margin: 30px 0 15px 0;">Smugglers Thoughts…</h2>

<p style="font-size: 14px; color: #666; margin: 0 0 10px 0;">
  Ranked <strong>#${data.rankings.totalRank} of ${data.rankings.totalEvents}</strong> curries reviewed
</p>

<p style="font-size: 14px; color: #888; margin: 0 0 30px 0; font-style: italic;">
  Food ${data.averages.food.toFixed(1)}/10 • Service ${data.averages.service.toFixed(1)}/5 • Extras ${data.averages.extras.toFixed(1)}/5 • Atmosphere ${data.averages.atmosphere.toFixed(1)}/5 • <strong>Overall ${data.averages.total.toFixed(1)}/25</strong>${data.averages.price ? ` • Price ${'£'.repeat(Math.round(data.averages.price))}` : ''}
</p>

${narrative.split('\n\n').map(para => `<p style="font-size: 18px; line-height: 1.6; margin: 20px 0;">${para}</p>`).join('\n')}

<hr style="border: none; border-top: 2px solid #f0f0f0; margin: 40px 0;" />

${data.ratings.some((r: any) => r.notes && r.notes.trim().length > 0) ? `
<h2 style="margin: 30px 0 20px 0;">💭 What The Smugglers Said</h2>

${data.ratings
  .filter((r: any) => r.notes && r.notes.trim().length > 0)
  .map((r: any) => {
    const quotes = extractSnappyQuotes(r.notes, 3);
    if (quotes.length === 0) return '';
    return `
<p style="margin: 20px 0 5px 0; font-size: 18px; font-weight: bold; color: #333;">${r.userName}</p>

${quotes.map(quote => `<p style="margin: 5px 0; font-size: 16px; line-height: 1.6; color: #555; font-style: italic;">"${quote}."</p>`).join('\n')}
    `;
  })
  .join('\n\n')}

<hr style="border: none; border-top: 2px solid #f0f0f0; margin: 40px 0;" />
` : ''}

<p style="margin: 30px 0 5px 0; font-size: 16px; color: #333;"><strong>📍 Location:</strong> ${data.event.address}</p>

${data.event.googlePlaceId
  ? `<p style="margin: 5px 0 30px 0;"><a href="https://www.google.com/maps/search/?api=1&query=place_id:${data.event.googlePlaceId}" target="_blank" style="color: #0066cc; text-decoration: none;">View on Google Maps →</a></p>`
  : `<p style="margin: 5px 0 30px 0;"><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.event.address)}" target="_blank" style="color: #0066cc; text-decoration: none;">View on Google Maps →</a></p>`
}

<hr style="border: none; border-top: 2px solid #f0f0f0; margin: 40px 0;" />

<p style="text-align: center; color: #999; font-size: 14px; font-style: italic;">
  Article written by The Chutney Smugglers • Follow along for more curry adventures
</p>
  `.trim();
}

/**
 * Get ISO week number from date
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Generate a Substack article for a completed curry event
 */
export const generateSubstackArticle = action({
  args: {
    eventId: v.id("curryEvents"),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    html: string;
    narrative: string;
    title: string;
    subtitle: string;
    data: any;
  }> => {
    // Get the user's active group
    const groupId = await ctx.runQuery(internal.substackArticle.getUserGroup);
    if (!groupId) {
      throw new Error("Not authenticated or no active group");
    }

    // Fetch all the data we need
    const data: any = await ctx.runQuery(internal.substackArticle.getEventDataForArticle, {
      eventId: args.eventId,
      groupId,
    });

    // Check if this is a retrospective article (no notes from ratings)
    const hasNotes = data.ratings.some((r: any) => r.notes && r.notes.trim().length > 0);
    const isRetrospective = !hasNotes;

    // For retrospective articles, rely on Claude's training data about London restaurants
    let restaurantInfo = "";
    if (isRetrospective) {
      restaurantInfo = `${data.event.restaurantName} is located at ${data.event.address}. Use your knowledge of London curry restaurants and the team's ratings to create an authentic narrative. High scores suggest positive aspects, low scores suggest areas for improvement. Feel free to mention typical dishes, atmosphere elements, and service styles common to this type of establishment.`;
    }

    // Initialize Anthropic client
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const anthropic = new Anthropic({
      apiKey,
    });

    // Generate the article narrative using Claude
    const prompt = buildArticlePrompt(data, isRetrospective, restaurantInfo);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Extract the response text from Claude
    const fullResponse = message.content[0].type === "text"
      ? message.content[0].text
      : "";

    // Parse the structured response (TITLE, SUBTITLE, ARTICLE)
    const titleMatch = fullResponse.match(/TITLE:\s*(.+?)(?:\n|$)/);
    const subtitleMatch = fullResponse.match(/SUBTITLE:\s*(.+?)(?:\n|$)/);
    const articleMatch = fullResponse.match(/ARTICLE:\s*\n([\s\S]+)/);

    const title = titleMatch ? titleMatch[1].trim() : `Week Review: ${data.event.restaurantName}`;
    const subtitle = subtitleMatch ? subtitleMatch[1].trim() : `Our latest curry adventure in London`;
    const narrative = articleMatch ? articleMatch[1].trim() : fullResponse;

    // Build the complete HTML article
    const htmlArticle = buildHTMLArticle(narrative, data, isRetrospective);

    return {
      success: true,
      html: htmlArticle,
      narrative,
      title,
      subtitle,
      data,
    };
  },
});

/**
 * Generate a Substack article for a solo mission rating
 */
export const generateSoloMissionArticle = action({
  args: {
    ratingId: v.id("ratings"),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    html: string;
    narrative: string;
    title: string;
    subtitle: string;
    data: any;
  }> => {
    // Get the user's active group
    const groupId = await ctx.runQuery(internal.substackArticle.getUserGroup);
    if (!groupId) {
      throw new Error("Not authenticated or no active group");
    }

    // Fetch all the data we need for the solo mission
    const data: any = await ctx.runQuery(internal.substackArticle.getSoloMissionDataForArticle, {
      ratingId: args.ratingId,
      groupId,
    });

    // Check if this is a retrospective article (no notes from rating)
    const hasNotes = data.ratings[0].notes && data.ratings[0].notes.trim().length > 0;
    const isRetrospective = !hasNotes;

    // For retrospective articles, rely on Claude's training data about London restaurants
    let restaurantInfo = "";
    if (isRetrospective) {
      restaurantInfo = `${data.event.restaurantName} is located at ${data.event.address}. Use your knowledge of London curry restaurants and the ratings to create an authentic narrative. High scores suggest positive aspects, low scores suggest areas for improvement. Feel free to mention typical dishes, atmosphere elements, and service styles common to this type of establishment.`;
    }

    // Initialize Anthropic client
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const anthropic = new Anthropic({
      apiKey,
    });

    // Generate the article narrative using Claude
    const prompt = buildArticlePrompt(data, isRetrospective, restaurantInfo);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Extract the response text from Claude
    const fullResponse = message.content[0].type === "text"
      ? message.content[0].text
      : "";

    // Parse the structured response (TITLE, SUBTITLE, ARTICLE)
    const titleMatch = fullResponse.match(/TITLE:\s*(.+?)(?:\n|$)/);
    const subtitleMatch = fullResponse.match(/SUBTITLE:\s*(.+?)(?:\n|$)/);
    const articleMatch = fullResponse.match(/ARTICLE:\s*\n([\s\S]+)/);

    const title = titleMatch ? titleMatch[1].trim() : `Solo Mission: ${data.event.restaurantName}`;
    const subtitle = subtitleMatch ? subtitleMatch[1].trim() : `A lone smuggler's adventure`;
    const narrative = articleMatch ? articleMatch[1].trim() : fullResponse;

    // Build the complete HTML article
    const htmlArticle = buildHTMLArticle(narrative, data, isRetrospective);

    return {
      success: true,
      html: htmlArticle,
      narrative,
      title,
      subtitle,
      data,
    };
  },
});
