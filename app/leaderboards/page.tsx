"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { Loader2, Star, Trophy, TrendingUp, Award, Flame } from "lucide-react";

export default function LeaderboardsPage() {
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

  return (
    <div className="min-h-screen bg-old-paper paper-texture pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-old-paper/95 backdrop-blur-sm border-b-2 border-terracotta/20 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-curry/10">
            <Trophy className="h-6 w-6 text-curry" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-curry">Leaderboards</h1>
            <p className="text-sm text-spice/70">Hall of Fame</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        <Tabs defaultValue="restaurants" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-old-paper-dark/50">
            <TabsTrigger
              value="restaurants"
              className="data-[state=active]:bg-curry data-[state=active]:text-white"
            >
              <Star className="h-4 w-4 mr-2" />
              Restaurants
            </TabsTrigger>
            <TabsTrigger
              value="raters"
              className="data-[state=active]:bg-curry data-[state=active]:text-white"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Raters
            </TabsTrigger>
          </TabsList>

          <TabsContent value="restaurants" className="space-y-6">
            {/* Top Overall */}
            <section>
              <h2 className="text-lg font-semibold text-spice mb-3 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-curry" />
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
            <h2 className="text-lg font-semibold text-spice mb-3 flex items-center gap-2">
              <Flame className="h-5 w-5 text-curry" />
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
            <div className="h-8 w-8 rounded-full bg-terracotta/20 flex items-center justify-center">
              <span className="text-sm font-bold text-spice">{rank}</span>
            </div>
          )}
        </div>

        {/* Restaurant Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-spice truncate">
            {restaurant.name}
          </h3>
          <p className="text-xs text-spice/60 truncate">{restaurant.address}</p>
          {restaurant.cuisine && (
            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-saffron/20 text-spice">
              {restaurant.cuisine}
            </span>
          )}
        </div>

        {/* Rating */}
        <div className="flex-shrink-0 text-right">
          <div className="flex items-center gap-1">
            <Star className="h-5 w-5 fill-curry text-curry" />
            <span className="text-xl font-bold text-curry">
              {restaurant.overallAverage?.toFixed(1) || "0.0"}
            </span>
          </div>
          <p className="text-xs text-spice/60">{restaurant.totalRatings} ratings</p>
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
          <h3 className="text-sm font-semibold text-spice">{title}</h3>
        </div>

        {restaurants === undefined ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-curry" />
          </div>
        ) : !topRestaurant ? (
          <p className="text-xs text-spice/50 text-center flex-1 flex items-center">
            No ratings yet
          </p>
        ) : (
          <div className="flex-1 flex flex-col justify-center">
            <p className="font-semibold text-spice text-sm truncate">
              {topRestaurant.name}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-3 w-3 fill-curry text-curry" />
              <span className="text-sm font-bold text-curry">
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
            <div className="h-8 w-8 rounded-full bg-terracotta/20 flex items-center justify-center">
              <span className="text-sm font-bold text-spice">{rank}</span>
            </div>
          )}
        </div>

        {/* User Avatar & Info */}
        <Avatar className="h-12 w-12 border-2 border-terracotta">
          {user.profileImageUrl && (
            <AvatarImage src={user.profileImageUrl} alt={user.nickname} />
          )}
          <AvatarFallback className="bg-saffron text-spice">
            {user.nickname?.slice(0, 2).toUpperCase() || "CS"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-spice truncate">
            {user.nickname || "Anonymous"}
          </h3>
          <div className="flex gap-3 mt-1 text-xs text-spice/60">
            <span>🍛 {user.curriesRated} rated</span>
            <span>➕ {user.curriesAdded} added</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-shrink-0 text-right">
          <div className="text-2xl font-bold text-curry">
            {user.curriesRated}
          </div>
          <p className="text-xs text-spice/60">ratings</p>
        </div>
      </div>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="card-parchment p-8 flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-curry" />
    </div>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="card-parchment p-8 text-center">
      <p className="text-spice/60">{message}</p>
    </div>
  );
}
