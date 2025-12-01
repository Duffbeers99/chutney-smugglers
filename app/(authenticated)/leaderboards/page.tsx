"use client";

import * as React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Star, Trophy, Award, Calendar, Crown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function LeaderboardsPage() {
  const [view, setView] = React.useState<"curries" | "smugglers">("curries");

  const topRated = useQuery(api.restaurants.getTopRated, { limit: 10 });
  const topFood = useQuery(api.restaurants.getCategoryLeaders, {
    category: "food",
    limit: 5,
  });
  const topService = useQuery(api.restaurants.getCategoryLeaders, {
    category: "service",
    limit: 5,
  });
  const topExtras = useQuery(api.restaurants.getCategoryLeaders, {
    category: "extras",
    limit: 5,
  });
  const topAtmosphere = useQuery(api.restaurants.getCategoryLeaders, {
    category: "atmosphere",
    limit: 5,
  });
  const topBookers = useQuery(api.ratings.getTopBookers, { limit: 10 });

  return (
    <div className="h-screen overflow-y-auto overflow-x-hidden bg-background paper-texture">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Leaderboards</h1>
            <p className="text-sm text-muted-foreground">
              {view === "curries" ? "Top Rated Restaurants" : "Top Bookers"}
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex justify-center">
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(value) => {
              if (value) setView(value as "curries" | "smugglers");
            }}
            className="bg-muted/50 p-1 rounded-lg"
          >
            <ToggleGroupItem
              value="curries"
              aria-label="Best Curries view"
              className="gap-2"
            >
              <Trophy className="h-4 w-4" />
              Best Curries
            </ToggleGroupItem>
            <ToggleGroupItem
              value="smugglers"
              aria-label="Smugglers view"
              className="gap-2"
            >
              <Crown className="h-4 w-4" />
              Smugglers
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-28 space-y-6">
        {view === "curries" ? (
          <>
            {/* Top Overall */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Top Rated Overall
              </h2>
              {topRated === undefined ? (
                <LoadingCard />
              ) : topRated.length === 0 ? (
                <EmptyCard message="No ratings yet. Be the first!" />
              ) : (
                <div className="space-y-2">
                  {topRated.map((restaurant, index) => (
                    <RestaurantCard
                      key={restaurant._id}
                      restaurant={restaurant}
                      rank={index + 1}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Category Leaders */}
            <section className="grid grid-cols-2 gap-4">
              <CategoryLeaderCard
                title="Best Food"
                icon="🍛"
                restaurants={topFood}
              />
              <CategoryLeaderCard
                title="Best Service"
                icon="👨‍🍳"
                restaurants={topService}
              />
              <CategoryLeaderCard
                title="Best Extras"
                icon="🥘"
                restaurants={topExtras}
              />
              <CategoryLeaderCard
                title="Best Atmosphere"
                icon="🪔"
                restaurants={topAtmosphere}
              />
            </section>
          </>
        ) : (
          <>
            {/* Smugglers Leaderboard */}
            {topBookers === undefined ? (
              <LoadingCard />
            ) : topBookers.length === 0 ? (
              <EmptyCard message="No bookers yet. Start booking curries!" />
            ) : (
              <>
                {/* Podium - Top 3 */}
                {topBookers.length >= 1 && (
                  <section>
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Crown className="h-5 w-5 text-primary" />
                      Top Smugglers
                    </h2>
                    <Podium bookers={topBookers.slice(0, 3)} />
                  </section>
                )}

                {/* List - 4th place and below */}
                {topBookers.length > 3 && (
                  <section>
                    <h3 className="text-md font-semibold text-foreground mb-3">
                      Other Smugglers
                    </h3>
                    <div className="space-y-2">
                      {topBookers.slice(3).map((booker, index) => (
                        <BookerCard
                          key={booker._id}
                          booker={booker}
                          rank={index + 4}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

// Podium Component for Top 3 Bookers
function Podium({ bookers }: { bookers: any[] }) {
  const [first, second, third] = bookers;

  return (
    <div className="relative">
      {/* Olympic-style podium layout */}
      <div className="flex items-end justify-center gap-2 mb-8">
        {/* 2nd Place - Left */}
        {second && (
          <PodiumPosition
            booker={second}
            rank={2}
            height="h-32"
            medalColor="from-gray-300 to-gray-400"
            textColor="text-gray-700"
          />
        )}

        {/* 1st Place - Center (Tallest) */}
        {first && (
          <PodiumPosition
            booker={first}
            rank={1}
            height="h-40"
            medalColor="from-yellow-400 to-yellow-600"
            textColor="text-yellow-700"
          />
        )}

        {/* 3rd Place - Right */}
        {third && (
          <PodiumPosition
            booker={third}
            rank={3}
            height="h-24"
            medalColor="from-amber-600 to-amber-700"
            textColor="text-amber-800"
          />
        )}
      </div>
    </div>
  );
}

function PodiumPosition({
  booker,
  rank,
  height,
  medalColor,
  textColor,
}: {
  booker: any;
  rank: number;
  height: string;
  medalColor: string;
  textColor: string;
}) {
  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "";
  };

  const initials = booker.nickname
    ? booker.nickname
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="flex-1 max-w-[120px]">
      {/* User Info Above Podium */}
      <div className="flex flex-col items-center mb-2">
        <Avatar className="size-16 border-4 border-background shadow-lg mb-2">
          {booker.profileImageUrl && (
            <AvatarImage src={booker.profileImageUrl} alt={booker.nickname} />
          )}
          <AvatarFallback className={cn("bg-gradient-to-br text-white font-bold", medalColor)}>
            {initials}
          </AvatarFallback>
        </Avatar>

        <p className="text-sm font-bold text-foreground text-center truncate w-full px-1">
          {booker.nickname}
        </p>

        {/* Average Score */}
        <div className="flex items-center gap-1 mt-1">
          <Star className={cn("h-4 w-4 fill-current", textColor)} />
          <span className={cn("text-lg font-bold", textColor)}>
            {booker.averageScore}
          </span>
          <span className="text-xs text-muted-foreground">/20</span>
        </div>

        {/* Curries Booked */}
        <p className="text-xs text-muted-foreground">
          {booker.curriesBooked} {booker.curriesBooked === 1 ? "curry" : "curries"}
        </p>
      </div>

      {/* Podium Block */}
      <div
        className={cn(
          "relative rounded-t-lg bg-gradient-to-br shadow-lg flex flex-col items-center justify-center",
          height,
          medalColor
        )}
      >
        <span className="text-4xl mb-1">{getMedalEmoji(rank)}</span>
        <span className="text-2xl font-bold text-white">{rank}</span>
      </div>
    </div>
  );
}

// Booker Card for 4th place and below
function BookerCard({ booker, rank }: { booker: any; rank: number }) {
  const initials = booker.nickname
    ? booker.nickname
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="card-parchment p-4 card-hover">
      <div className="flex items-center gap-4">
        {/* Rank */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <span className="text-sm font-bold text-foreground">{rank}</span>
        </div>

        {/* User Avatar */}
        <Avatar className="size-12 border-2 border-border">
          {booker.profileImageUrl && (
            <AvatarImage src={booker.profileImageUrl} alt={booker.nickname} />
          )}
          <AvatarFallback className="bg-curry/20 text-curry font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">
            {booker.nickname}
          </p>
          <p className="text-xs text-muted-foreground">
            {booker.curriesBooked} {booker.curriesBooked === 1 ? "curry" : "curries"} booked
          </p>
          {booker.bestCurry && (
            <Badge variant="secondary" className="text-xs mt-1 bg-saffron/20 text-foreground border-saffron/30">
              Best: {booker.bestCurry.name}
            </Badge>
          )}
        </div>

        {/* Average Score */}
        <div className="flex-shrink-0 text-right">
          <div className="flex items-center gap-1">
            <Star className="h-5 w-5 fill-primary text-primary" />
            <span className="text-lg font-bold text-primary">
              {booker.averageScore}
            </span>
            <span className="text-xs text-muted-foreground">/20</span>
          </div>
          {booker.bestCurry && (
            <p className="text-xs text-muted-foreground">
              Best: {booker.bestCurry.score}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function RestaurantCard({
  restaurant,
  rank,
}: {
  restaurant: any;
  rank: number;
}) {
  const getMedalColor = (rank: number) => {
    if (rank === 1) return "text-yellow-500";
    if (rank === 2) return "text-gray-400";
    if (rank === 3) return "text-amber-600";
    return "text-spice/50";
  };

  return (
    <div className="card-parchment p-4 card-hover">
      <div className="flex items-start gap-4">
        {/* Rank */}
        <div className="flex-shrink-0">
          {rank <= 3 ? (
            <Award className={`h-8 w-8 ${getMedalColor(rank)}`} />
          ) : (
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-sm font-bold text-foreground">{rank}</span>
            </div>
          )}
        </div>

        {/* Restaurant Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            {restaurant.name}
          </h3>
          <p className="text-xs text-muted-foreground truncate">{restaurant.address}</p>

          {/* Visit Date and Booker */}
          {restaurant.mostRecentVisit && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{format(restaurant.mostRecentVisit.visitDate, "MMM d, yyyy")}</span>
              </div>
              {restaurant.mostRecentVisit.claimedBy ? (
                <Badge variant="secondary" className="text-xs bg-curry/10 text-curry border-curry/20">
                  Booked by {restaurant.mostRecentVisit.claimedBy}
                </Badge>
              ) : restaurant.mostRecentVisit.bookerName ? (
                <Badge variant="outline" className="text-xs">
                  Booked by {restaurant.mostRecentVisit.bookerName}
                </Badge>
              ) : null}
            </div>
          )}

          {restaurant.cuisine && (
            <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-saffron/20 text-foreground">
              {restaurant.cuisine}
            </span>
          )}
        </div>

        {/* Rating */}
        <div className="flex-shrink-0 text-right">
          <div className="flex items-center gap-1">
            <Star className="h-5 w-5 fill-primary text-primary" />
            <span className="text-lg font-bold text-primary">
              {restaurant.overallAverage?.toFixed(1) || "0.0"}
            </span>
            <span className="text-xs text-muted-foreground">/20</span>
          </div>
          <p className="text-xs text-muted-foreground">{restaurant.totalRatings} ratings</p>
        </div>
      </div>
    </div>
  );
}

function CategoryLeaderCard({
  title,
  icon,
  restaurants,
}: {
  title: string;
  icon: string;
  restaurants: any[] | undefined;
}) {
  const topRestaurant = restaurants?.[0];

  return (
    <div className="card-parchment p-4 h-32">
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{icon}</span>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>

        {restaurants === undefined ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
        ) : !topRestaurant ? (
          <p className="text-xs text-muted-foreground text-center flex-1 flex items-center">
            No ratings yet
          </p>
        ) : (
          <div className="flex-1 flex flex-col justify-center">
            <p className="font-semibold text-foreground text-sm truncate">
              {topRestaurant.name}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-3 w-3 fill-primary text-primary" />
              <span className="text-sm font-bold text-primary">
                {(topRestaurant as any)[
                  title.includes("Food")
                    ? "averageFood"
                    : title.includes("Service")
                    ? "averageService"
                    : title.includes("Extras")
                    ? "averageExtras"
                    : "averageAtmosphere"
                ]?.toFixed(1) || "0.0"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


function LoadingCard() {
  return (
    <div className="card-parchment p-8 flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="card-parchment p-8 text-center">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
