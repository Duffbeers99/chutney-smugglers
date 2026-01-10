"use client";


import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { ImageUpload } from "@/components/profile/image-upload";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  Loader2,
  User,
  Mail,
  Edit2,
  Check,
  X,
  LogOut,
  Award,
  TrendingUp,
  Star,
  Users,
  Copy,
  CheckCircle2,
  UtensilsCrossed,
  ChevronDown,
} from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Id } from "@/convex/_generated/dataModel";
import { validateNickname } from "@/lib/onboarding-flow";
import { PriceSelector } from "@/components/ui/price-selector";
import { format } from "date-fns";

export default function ProfilePage() {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.currentUser);
  const userStats = useQuery(api.users.getUserStats);
  const userRatings = useQuery(api.ratings.getUserRatings, {});
  const userGroup = useQuery(api.groups.getUserGroup);
  const myBookedEvents = useQuery(api.curryEvents.getMyBookedEvents);
  const updateProfile = useMutation(api.users.updateProfile);
  const removeProfileImage = useMutation(api.users.removeProfileImage);
  const setPriceForEvent = useMutation(api.curryEvents.setPriceForPastEvent);

  const [editingNickname, setEditingNickname] = useState(false);
  const [nickname, setNickname] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [editingEventId, setEditingEventId] = useState<Id<"curryEvents"> | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<number>(3);
  const [savingPrice, setSavingPrice] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<Id<"curryEvents"> | null>(null);

  const handleEditNickname = () => {
    setNickname(user?.nickname || "");
    setEditingNickname(true);
  };

  const handleSaveNickname = async () => {
    const validation = validateNickname(nickname);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setSavingNickname(true);
    try {
      await updateProfile({ nickname: nickname.trim() });
      toast.success("Nickname updated!");
      setEditingNickname(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update nickname");
    } finally {
      setSavingNickname(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingNickname(false);
    setNickname("");
  };

  const handleImageUpload = async (storageId: Id<"_storage">) => {
    try {
      await updateProfile({ profileImageId: storageId });
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile image");
    }
  };

  const handleRemoveImage = async () => {
    try {
      await removeProfileImage();
      toast.success("Profile image removed");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove image");
    }
  };

  const handleCopyCode = async () => {
    if (!userGroup?.accessCode) return;

    try {
      await navigator.clipboard.writeText(userGroup.accessCode);
      setCodeCopied(true);
      toast.success("Group code copied to clipboard!");
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy code");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    toast.success("Signed out successfully");
  };

  const handleEditPrice = (eventId: Id<"curryEvents">, currentPrice?: number) => {
    setEditingEventId(eventId);
    setSelectedPrice(currentPrice || 3);
  };

  const handleSavePrice = async (eventId: Id<"curryEvents">) => {
    setSavingPrice(true);
    try {
      await setPriceForEvent({ eventId, priceRanking: selectedPrice });
      toast.success("Price ranking saved!");
      setEditingEventId(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to save price");
    } finally {
      setSavingPrice(false);
    }
  };

  const handleCancelPriceEdit = () => {
    setEditingEventId(null);
    setSelectedPrice(3);
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto overflow-x-hidden bg-background paper-texture">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Profile</h1>
            <p className="text-sm text-muted-foreground">Your curry journey</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-6 pb-28">
        {/* Profile Image Section */}
        <section className="card-parchment p-6">
          <ImageUpload
            currentImageUrl={user.profileImageUrl}
            currentImageId={user.profileImageId}
            userNickname={user.nickname}
            onUploadComplete={handleImageUpload}
            onRemove={handleRemoveImage}
          />
        </section>

        {/* Profile Info Section */}
        <section className="card-parchment p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
            Profile Information
          </h2>

          {/* Nickname */}
          <div>
            <Label className="text-foreground text-sm">Nickname</Label>
            {editingNickname ? (
              <div className="flex gap-2 mt-2">
                <Input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter nickname"
                  className="bg-card border-border focus:border-primary"
                  autoFocus
                />
                <Button
                  onClick={handleSaveNickname}
                  disabled={savingNickname}
                  size="icon"
                  className="bg-primary hover:bg-primary/90"
                >
                  {savingNickname ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  disabled={savingNickname}
                  size="icon"
                  variant="outline"
                  className="border-border"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between mt-2 p-3 rounded-lg bg-card/50 border border-border">
                <span className="font-medium text-foreground">
                  {user.nickname || "Not set"}
                </span>
                <Button
                  onClick={handleEditNickname}
                  size="sm"
                  variant="ghost"
                  className="text-primary hover:text-primary/80"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Email (Read-only) */}
          <div>
            <Label className="text-foreground text-sm flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <div className="mt-2 p-3 rounded-lg bg-card/30 border border-border">
              <span className="text-muted-foreground">{user.email || "Not set"}</span>
            </div>
          </div>
        </section>

        {/* Group Code Section */}
        {userGroup && (
          <section className="card-parchment p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Group
            </h2>

            <div>
              <Label className="text-foreground text-sm">Group Name</Label>
              <div className="mt-2 p-3 rounded-lg bg-card/50 border border-border">
                <span className="font-medium text-foreground">
                  {userGroup.name}
                </span>
              </div>
            </div>

            <div>
              <Label className="text-foreground text-sm">Access Code</Label>
              <div className="mt-2 flex gap-2">
                <div className="flex-1 p-3 rounded-lg bg-card/50 border border-border font-mono text-sm">
                  {userGroup.accessCode}
                </div>
                <Button
                  onClick={handleCopyCode}
                  size="icon"
                  variant="outline"
                  className="border-border hover:bg-primary/10 hover:border-primary"
                >
                  {codeCopied ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Share this code with friends to invite them to your group
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{userGroup.memberCount} {userGroup.memberCount === 1 ? 'member' : 'members'}</span>
            </div>
          </section>
        )}

        {/* Stats Section */}
        <section className="card-parchment p-6">
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-4">
            Your Statistics
          </h2>

          {userStats === undefined || userStats === null ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                icon={<Award className="h-5 w-5" />}
                label="Total Ratings"
                value={userStats.totalRatings}
                color="curry"
              />
              <StatCard
                icon={<TrendingUp className="h-5 w-5" />}
                label="This Month"
                value={userStats.ratingsThisMonth}
                color="saffron"
              />
              <StatCard
                icon={<Star className="h-5 w-5" />}
                label="Avg Rating"
                value={userStats.averageRating.toFixed(1)}
                color="terracotta"
              />
              <StatCard
                icon={<span className="text-xl">🍛</span>}
                label="Added"
                value={userStats.curriesAdded}
                color="turmeric"
              />
              <StatCard
                icon={<span className="text-xl">⭐</span>}
                label="Solo Missions"
                value={userStats.soloMissionsCompleted}
                color="gold"
              />
            </div>
          )}
        </section>

        {/* Recent Ratings */}
        <section className="card-parchment p-6">
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-4">
            Your Recent Ratings
          </h2>

          {userRatings === undefined ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : userRatings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No ratings yet</p>
              <p className="text-sm mt-1">Start rating curries!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userRatings.slice(0, 5).map((rating) => (
                <div
                  key={rating._id}
                  className="p-3 rounded-lg bg-card/50 border border-border"
                >
                  <h3 className="font-semibold text-foreground">
                    {rating.restaurant?.name || "Unknown"}
                  </h3>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Food: {rating.food}/10</span>
                    <span>Service: {rating.service}/5</span>
                    <span>Extras: {rating.extras}/5</span>
                    <span>Atmosphere: {rating.atmosphere}/5</span>
                  </div>
                  {rating.notes && (
                    <p className="text-sm text-foreground/80 mt-2 italic">
                      "{rating.notes}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* My Bookings - Set Price for Past Events */}
        <section className="p-4 bg-card/50 rounded-lg border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-curry" />
            My Bookings
          </h2>

          {myBookedEvents === undefined ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : myBookedEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>You haven't booked any curries yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myBookedEvents.map((event) => {
                const eventDate = new Date(event.scheduledDate);
                const formattedDate = format(eventDate, "MMM d, yyyy");
                const isEditing = editingEventId === event._id;
                const isExpanded = expandedEventId === event._id;
                const hasRatings = event.totalRatings && event.totalRatings > 0;

                return (
                  <Collapsible
                    key={event._id}
                    open={isExpanded}
                    onOpenChange={(open) => setExpandedEventId(open ? event._id : null)}
                  >
                    <div className="p-3 rounded-lg bg-card border border-border">
                      {/* Main visible content */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">
                              {event.restaurantName}
                            </h3>
                            {hasRatings && (
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <ChevronDown
                                    className={`h-4 w-4 transition-transform duration-200 ${
                                      isExpanded ? "transform rotate-180" : ""
                                    }`}
                                  />
                                  <span className="sr-only">Toggle details</span>
                                </Button>
                              </CollapsibleTrigger>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{formattedDate}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {hasRatings && event.overallAverage !== undefined && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-primary text-primary" />
                              <span className="text-sm font-bold text-primary">
                                {event.overallAverage.toFixed(1)}
                              </span>
                              <span className="text-xs text-muted-foreground">/25</span>
                            </div>
                          )}
                          {event.averagePriceRanking && !isEditing && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <span>Price:</span>
                              <span className="font-bold text-curry">
                                {"£".repeat(event.averagePriceRanking)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expandable Content */}
                      {hasRatings && (
                        <CollapsibleContent className="space-y-3 pt-3">
                          {/* Category Ratings */}
                          <div className="border-t border-border pt-3">
                            <div className="grid grid-cols-2 gap-2">
                              <CategoryRating
                                label="Food"
                                value={event.averageFood}
                                emoji="🍛"
                              />
                              <CategoryRating
                                label="Service"
                                value={event.averageService}
                                emoji="👨‍🍳"
                              />
                              <CategoryRating
                                label="Extras"
                                value={event.averageExtras}
                                emoji="🥘"
                              />
                              <CategoryRating
                                label="Atmosphere"
                                value={event.averageAtmosphere}
                                emoji="🪔"
                              />
                            </div>

                            {/* Number of ratings */}
                            <div className="pt-2 border-t border-border mt-3">
                              <p className="text-sm text-muted-foreground text-center">
                                {event.totalRatings} {event.totalRatings === 1 ? "rating" : "ratings"}
                              </p>
                            </div>
                          </div>

                          {/* Individual Ratings with Notes */}
                          {event.ratings && event.ratings.length > 0 && (
                            <div className="pt-3 border-t border-border space-y-3">
                              <h4 className="text-sm font-semibold text-foreground mb-2">Individual Ratings</h4>
                              {[...event.ratings]
                                .sort((a: any, b: any) => b.createdAt - a.createdAt)
                                .map((rating: any) => (
                                <div
                                  key={rating._id}
                                  className="rounded-lg p-3 space-y-2 bg-muted/30"
                                >
                                  {/* User info */}
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-7 w-7 border border-border">
                                      {rating.profileImageUrl && (
                                        <AvatarImage
                                          src={rating.profileImageUrl}
                                          alt={rating.userName}
                                        />
                                      )}
                                      <AvatarFallback className="bg-curry/25 text-curry text-xs">
                                        {rating.userName?.charAt(0)?.toUpperCase() || "?"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-foreground">
                                        {rating.userName}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Star className="h-4 w-4 fill-primary text-primary" />
                                      <span className="text-sm font-bold text-primary">
                                        {rating.overallScore}
                                      </span>
                                      <span className="text-xs text-muted-foreground">/25</span>
                                    </div>
                                  </div>

                                  {/* Score breakdown */}
                                  <div className="grid grid-cols-4 gap-1 text-xs">
                                    <div className="flex items-center gap-1">
                                      <span>🍛</span>
                                      <span className="text-muted-foreground">{rating.food}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span>👨‍🍳</span>
                                      <span className="text-muted-foreground">{rating.service}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span>🥘</span>
                                      <span className="text-muted-foreground">{rating.extras}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span>🪔</span>
                                      <span className="text-muted-foreground">{rating.atmosphere}</span>
                                    </div>
                                  </div>

                                  {/* Notes */}
                                  {rating.notes && (
                                    <div className="pt-2 border-t border-border/50">
                                      <p className="text-xs text-muted-foreground italic">
                                        "{rating.notes}"
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </CollapsibleContent>
                      )}

                      {/* Only allow setting price if not already set */}
                      {!event.averagePriceRanking && (
                        <>
                          {isEditing ? (
                            <div className="space-y-3 mt-3">
                              <PriceSelector
                                value={selectedPrice}
                                onChange={setSelectedPrice}
                              />
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleSavePrice(event._id)}
                                  disabled={savingPrice}
                                  size="sm"
                                  className="flex-1"
                                >
                                  {savingPrice ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Saving...
                                    </>
                                  ) : (
                                    <>
                                      <Check className="mr-2 h-4 w-4" />
                                      Save Price
                                    </>
                                  )}
                                </Button>
                                <Button
                                  onClick={handleCancelPriceEdit}
                                  disabled={savingPrice}
                                  size="sm"
                                  variant="outline"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleEditPrice(event._id, event.averagePriceRanking)}
                              size="sm"
                              variant="outline"
                              className="w-full mt-2"
                            >
                              Set Price
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </section>

        {/* Sign Out Button */}
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full border-red-500 text-red-600 hover:bg-red-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </main>

      <BottomNav />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    curry: "bg-primary/10 text-primary",
    saffron: "bg-saffron/10 text-saffron",
    terracotta: "bg-terracotta/10 text-terracotta",
    turmeric: "bg-turmeric/10 text-turmeric",
    gold: "bg-[oklch(0.75_0.15_85)]/10 text-[oklch(0.55_0.12_85)]",
  };

  return (
    <div className="p-4 rounded-lg bg-card/50 border border-border">
      <div className={`inline-flex p-2 rounded-lg ${colorClasses[color]} mb-2`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function CategoryRating({
  label,
  value,
  emoji,
}: {
  label: string;
  value?: number;
  emoji: string;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
      <span className="text-sm">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">
          {value?.toFixed(1) || "N/A"}
        </p>
      </div>
    </div>
  );
}
