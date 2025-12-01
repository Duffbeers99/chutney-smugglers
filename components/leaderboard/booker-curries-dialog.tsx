"use client";

import * as React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Star } from "lucide-react";

interface BookerCurriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booker: {
    nickname: string;
    curries: Array<{
      restaurantName: string;
      score: number;
    }>;
  };
}

export function BookerCurriesDialog({
  open,
  onOpenChange,
  booker,
}: BookerCurriesDialogProps) {
  // Sort curries by score descending
  const sortedCurries = [...booker.curries].sort((a, b) => b.score - a.score);

  console.log("BookerCurriesDialog render:", { open, nickname: booker.nickname, curriesCount: booker.curries.length });

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-old-paper paper-texture">
        <DrawerHeader>
          <DrawerTitle className="text-curry text-xl font-bold">
            {booker.nickname}'s Curries
          </DrawerTitle>
          <DrawerDescription>
            View all curries booked by {booker.nickname}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-8 space-y-2 max-h-[60vh] overflow-y-auto">
          {sortedCurries.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No curries yet</p>
          ) : (
            sortedCurries.map((curry, index) => (
              <div
                key={index}
                className="card-parchment p-3 flex items-center justify-between gap-3"
              >
                <span className="text-foreground font-medium flex-1 min-w-0 truncate">
                  {curry.restaurantName}
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="text-lg font-bold text-primary">
                    {curry.score}
                  </span>
                  <span className="text-xs text-muted-foreground">/20</span>
                </div>
              </div>
            ))
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
