"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-old-paper paper-texture max-w-md">
        <DialogHeader>
          <DialogTitle className="text-curry text-xl font-bold">
            {booker.nickname}'s Curries
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
          {sortedCurries.map((curry, index) => (
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
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
