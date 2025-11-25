"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Calendar, Loader2, MapPin, PlusCircle, Search, Star } from "lucide-react";
import { RestaurantSearch } from "./restaurant-search";

export function AddVisitDrawer({
  children,
  onSuccess,
}: {
  children: React.ReactNode;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"search" | "rate">("search");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<
    Id<"restaurants"> | null
  >(null);
  const [visitDate, setVisitDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [food, setFood] = useState(0);
  const [service, setService] = useState(0);
  const [extras, setExtras] = useState(0);
  const [atmosphere, setAtmosphere] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const addRating = useMutation(api.ratings.add);
  const selectedRestaurant = useQuery(
    api.restaurants.get,
    selectedRestaurantId ? { id: selectedRestaurantId } : "skip"
  );

  const handleRestaurantSelect = (restaurantId: Id<"restaurants">) => {
    setSelectedRestaurantId(restaurantId);
    setStep("rate");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRestaurantId) {
      toast.error("Please select a restaurant");
      return;
    }

    if (food === 0 || service === 0 || extras === 0 || atmosphere === 0) {
      toast.error("Please rate all categories");
      return;
    }

    setLoading(true);

    try {
      await addRating({
        restaurantId: selectedRestaurantId,
        visitDate: new Date(visitDate).getTime(),
        food,
        service,
        extras,
        atmosphere,
        notes: notes.trim() || undefined,
      });

      toast.success("Curry rating added! 🍛");

      // Reset form
      setStep("search");
      setSelectedRestaurantId(null);
      setFood(0);
      setService(0);
      setExtras(0);
      setAtmosphere(0);
      setNotes("");
      setOpen(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error adding rating:", error);
      toast.error(error.message || "Failed to add rating. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep("search");
    setSelectedRestaurantId(null);
    setFood(0);
    setService(0);
    setExtras(0);
    setAtmosphere(0);
    setNotes("");
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        resetForm();
      }
    }}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[90vh] bg-old-paper paper-texture overflow-y-auto"
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="text-curry text-2xl flex items-center gap-2">
            <PlusCircle className="h-6 w-6" />
            Add Curry Visit
          </SheetTitle>
          <SheetDescription className="text-spice">
            Rate your latest curry adventure
          </SheetDescription>
        </SheetHeader>

        {step === "search" ? (
          <RestaurantSearch onSelect={handleRestaurantSelect} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selected Restaurant */}
            {selectedRestaurant && (
              <div className="card-parchment p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-spice text-lg">
                      {selectedRestaurant.name}
                    </h3>
                    <p className="text-sm text-spice/70 flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {selectedRestaurant.address}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep("search")}
                    className="text-terracotta hover:text-curry"
                  >
                    Change
                  </Button>
                </div>
              </div>
            )}

            {/* Visit Date */}
            <div>
              <Label htmlFor="visit-date" className="text-spice flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Visit Date
              </Label>
              <Input
                id="visit-date"
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                required
                className="mt-2 bg-white/80 border-terracotta focus:border-curry"
              />
            </div>

            {/* Rating Categories */}
            <div className="space-y-4">
              <RatingInput
                label="Food Quality"
                value={food}
                onChange={setFood}
                icon="🍛"
              />
              <RatingInput
                label="Service"
                value={service}
                onChange={setService}
                icon="👨‍🍳"
              />
              <RatingInput
                label="Extras & Sides"
                value={extras}
                onChange={setExtras}
                icon="🥘"
              />
              <RatingInput
                label="Atmosphere"
                value={atmosphere}
                onChange={setAtmosphere}
                icon="🪔"
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes" className="text-spice">
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special highlights or thoughts about your visit..."
                rows={3}
                className="mt-2 bg-white/80 border-terracotta focus:border-curry resize-none"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("search")}
                disabled={loading}
                className="flex-1 border-terracotta text-spice"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={loading || food === 0 || service === 0 || extras === 0 || atmosphere === 0}
                className="btn-curry flex-1 h-12"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Add Rating"
                )}
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}

function RatingInput({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon: string;
}) {
  return (
    <div className="card-parchment p-4">
      <Label className="text-spice font-semibold flex items-center gap-2 mb-3">
        <span className="text-xl">{icon}</span>
        {label}
      </Label>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={`touch-target flex-1 rounded-lg border-2 transition-all ${
              value >= rating
                ? "border-curry bg-curry/10 scale-105"
                : "border-terracotta/30 hover:border-terracotta"
            }`}
          >
            <Star
              className={`h-8 w-8 mx-auto ${
                value >= rating ? "fill-curry text-curry" : "text-spice/30"
              }`}
            />
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-spice/60">
        <span>Poor</span>
        <span className="font-semibold text-curry">
          {value > 0 ? `${value}/5` : "Tap to rate"}
        </span>
        <span>Excellent</span>
      </div>
    </div>
  );
}
