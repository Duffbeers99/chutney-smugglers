"use client";

import * as React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { Loader2, Star, Trophy, TrendingUp, Award, Flame } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LeaderboardsPage() {
  const router = useRouter();

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
  const mostActive = useQuery(api.ratings.getMostActiveRaters, { limit: 10 });

  // Fetch user stats for the stats cards
  const userStats = useQuery(api.users.getUserStats);

  // Loading state
  const isLoadingStats = userStats === undefined;

  // Calculate participation percentage
  const participationPercentage = userStats
    ? Math.min(
        100,
        Math.round(
          (userStats.totalRatings / Math.max(userStats.totalRatings, 20)) * 100
        )
      )
    : 0;

  const handleStatCardClick = (
    cardType: "ratings" | "average" | "participation"
  ) => {
    // Navigate to detailed view based on card type
    switch (cardType) {
      case "ratings":
        router.push("/profile?tab=ratings");
        break;
      case "average":
        router.push("/profile?tab=stats");
        break;
      case "participation":
        // Already on leaderboards, maybe scroll to top
        window.scrollTo({ top: 0, behavior: "smooth" });
        break;
    }
  };

  return (
    <div className="h-screen overflow-y-auto overflow-x-hidden bg-background paper-texture">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Leaderboards</h1>
            <p className="text-sm text-muted-foreground">Hall of Fame</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-28 space-y-6">
        {/* Your Stats Section */}
        <section aria-labelledby="your-stats-heading">
          <h2 id="your-stats-heading" className="text-lg font-semibold text-foreground mb-3">
            Your Stats
          </h2>
          {isLoadingStats ? (
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="card-parchment">
                  <CardContent className="flex flex-col items-center justify-center gap-3 p-4">
                    <Skeleton className="size-28 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <StatsCards
              ratingsThisMonth={userStats?.ratingsThisMonth || 0}
              totalRatings={userStats?.totalRatings || 0}
              averageRating={userStats?.averageRating || 0}
              participationPercentage={participationPercentage}
              onCardClick={handleStatCardClick}
            />
          )}
        </section>

        <Tabs defaultValue="restaurants" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted">
            <TabsTrigger
              value="restaurants"
              className="data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              <Star className="h-4 w-4 mr-2" />
              Restaurants
            </TabsTrigger>
            <TabsTrigger
              value="raters"
              className="data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Raters
            </TabsTrigger>
          </TabsList>

          <TabsContent value="restaurants" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="raters" className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Flame className="h-5 w-5 text-primary" />
              Most Active Raters
            </h2>
            {mostActive === undefined ? (
              <LoadingCard />
            ) : mostActive.length === 0 ? (
              <EmptyCard message="No raters yet. Start rating!" />
            ) : (
              <div className="space-y-2">
                {mostActive.map((user, index) => (
                  <RaterCard key={user._id} user={user} rank={index + 1} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
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
      <div className="flex items-center gap-4">
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
          {restaurant.cuisine && (
            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-saffron/20 text-foreground">
              {restaurant.cuisine}
            </span>
          )}
        </div>

        {/* Rating */}
        <div className="flex-shrink-0 text-right">
          <div className="flex items-center gap-1">
            <Star className="h-5 w-5 fill-primary text-primary" />
            <span className="text-xl font-bold text-primary">
              {restaurant.overallAverage?.toFixed(1) || "0.0"}
            </span>
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

function RaterCard({ user, rank }: { user: any; rank: number }) {
  const getMedalColor = (rank: number) => {
    if (rank === 1) return "text-yellow-500";
    if (rank === 2) return "text-gray-400";
    if (rank === 3) return "text-amber-600";
    return "text-spice/50";
  };

  return (
    <div className="card-parchment p-4 card-hover">
      <div className="flex items-center gap-4">
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

        {/* User Avatar & Info */}
        <Avatar className="h-12 w-12 border-2 border-border">
          {user.profileImageUrl && (
            <AvatarImage src={user.profileImageUrl} alt={user.nickname} />
          )}
          <AvatarFallback className="bg-saffron text-foreground">
            {user.nickname?.slice(0, 2).toUpperCase() || "CS"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            {user.nickname || "Anonymous"}
          </h3>
          <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
            <span>🍛 {user.curriesRated} rated</span>
            <span>➕ {user.curriesAdded} added</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-shrink-0 text-right">
          <div className="text-2xl font-bold text-primary">
            {user.curriesRated}
          </div>
          <p className="text-xs text-muted-foreground">ratings</p>
        </div>
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
