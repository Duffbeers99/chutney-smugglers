"use client";

import * as React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, Star, MapPin, Users } from "lucide-react";
import { format } from "date-fns";

export default function HistoryPage() {
  const router = useRouter();
  const allEvents = useQuery(api.curryEvents.getAllEvents);

  // Filter for completed events with revealed ratings
  const completedEvents = React.useMemo(() => {
    if (!allEvents) return [];
    return allEvents
      .filter((event) => event.status === "completed" && event.ratingsRevealed)
      .sort((a, b) => b.scheduledDate - a.scheduledDate); // Most recent first
  }, [allEvents]);

  if (allEvents === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold">Curry History</h1>
          <p className="text-sm text-muted-foreground">
            {completedEvents.length} completed {completedEvents.length === 1 ? "curry" : "curries"}
          </p>
        </div>
      </div>

      {/* Events List */}
      <div className="px-4 py-6 space-y-4">
        {completedEvents.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No completed curries yet</p>
            </CardContent>
          </Card>
        ) : (
          completedEvents.map((event, index) => (
            <EventCard
              key={event._id}
              event={event}
              weekNumber={completedEvents.length - index}
              onGenerateArticle={() => router.push(`/events/${event._id}/article`)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function EventCard({
  event,
  weekNumber,
  onGenerateArticle,
}: {
  event: any;
  weekNumber: number;
  onGenerateArticle: () => void;
}) {
  const eventDate = new Date(event.scheduledDate);
  const formattedDate = format(eventDate, "MMM d, yyyy");

  return (
    <Card className="card-parchment">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                Week {weekNumber}
              </Badge>
              {event.hasVoted && event.hasVoted.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  {event.hasVoted.length} {event.hasVoted.length === 1 ? "rating" : "ratings"}
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg">{event.restaurantName}</CardTitle>
            <div className="flex flex-col gap-1 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{event.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 shrink-0" />
                <span>{formattedDate}</span>
              </div>
              {event.attendees && event.attendees.length > 0 && (
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3 shrink-0" />
                  <span>{event.attendees.length} attendees</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button
          onClick={onGenerateArticle}
          className="w-full"
          variant="outline"
        >
          <FileText className="mr-2 h-4 w-4" />
          Generate Substack Article
        </Button>
      </CardContent>
    </Card>
  );
}
