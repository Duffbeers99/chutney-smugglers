"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, MapPin, Plus, Search, Star } from "lucide-react";

export function RestaurantSearch({
  onSelect,
}: {
  onSelect: (restaurantId: Id<"restaurants">) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const restaurants = useQuery(api.restaurants.list);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const filteredRestaurants =
    restaurants?.filter(
      (r) =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.address.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div>
        <Label htmlFor="restaurant-search" className="text-spice">
          Search Restaurants
        </Label>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-3 h-5 w-5 text-spice/50" />
          <Input
            id="restaurant-search"
            type="text"
            placeholder="Search by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/80 border-terracotta focus:border-curry h-12"
          />
        </div>
      </div>

      {/* Add New Restaurant Button */}
      <AddRestaurantDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={(restaurantId) => {
          setShowAddDialog(false);
          onSelect(restaurantId);
        }}
      >
        <Button
          type="button"
          variant="outline"
          className="w-full border-curry text-curry hover:bg-curry/10 h-12"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add New Restaurant
        </Button>
      </AddRestaurantDialog>

      {/* Restaurant List */}
      <div className="space-y-2 max-h-[50vh] overflow-y-auto">
        {restaurants === undefined ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-curry" />
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="text-center py-8 text-spice/60">
            <p>No restaurants found</p>
            <p className="text-sm mt-1">Try adding a new one!</p>
          </div>
        ) : (
          filteredRestaurants.map((restaurant) => (
            <button
              key={restaurant._id}
              type="button"
              onClick={() => onSelect(restaurant._id)}
              className="w-full text-left card-parchment p-4 hover:shadow-lg transition-all active:scale-[0.98]"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-spice">
                    {restaurant.name}
                  </h3>
                  <p className="text-sm text-spice/70 flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {restaurant.address}
                  </p>
                  {restaurant.cuisine && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs rounded-full bg-saffron/20 text-spice">
                      {restaurant.cuisine}
                    </span>
                  )}
                </div>
                {restaurant.overallAverage && restaurant.overallAverage > 0 && (
                  <div className="flex items-center gap-1 ml-2">
                    <Star className="h-4 w-4 fill-curry text-curry" />
                    <span className="font-semibold text-curry">
                      {restaurant.overallAverage.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function AddRestaurantDialog({
  children,
  open,
  onOpenChange,
  onSuccess,
}: {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (restaurantId: Id<"restaurants">) => void;
}) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [loading, setLoading] = useState(false);

  const addRestaurant = useMutation(api.restaurants.add);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const restaurantId = await addRestaurant({
        name: name.trim(),
        address: address.trim(),
        cuisine: cuisine.trim() || undefined,
      });

      toast.success("Restaurant added! 🍛");
      onSuccess(restaurantId);

      // Reset form
      setName("");
      setAddress("");
      setCuisine("");
    } catch (error: any) {
      console.error("Error adding restaurant:", error);
      toast.error(error.message || "Failed to add restaurant. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-old-paper paper-texture">
        <DialogHeader>
          <DialogTitle className="text-curry text-xl">
            Add New Restaurant
          </DialogTitle>
          <DialogDescription className="text-spice">
            Add a curry house to the database
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name" className="text-spice">
              Restaurant Name *
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="The Curry Palace"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-2 bg-white/80 border-terracotta focus:border-curry"
            />
          </div>

          <div>
            <Label htmlFor="address" className="text-spice">
              Address *
            </Label>
            <Input
              id="address"
              type="text"
              placeholder="123 Curry Lane, Spice District"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="mt-2 bg-white/80 border-terracotta focus:border-curry"
            />
          </div>

          <div>
            <Label htmlFor="cuisine" className="text-spice">
              Cuisine Type (Optional)
            </Label>
            <Input
              id="cuisine"
              type="text"
              placeholder="Indian, Bangladeshi, Pakistani..."
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              className="mt-2 bg-white/80 border-terracotta focus:border-curry"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1 border-terracotta text-spice"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="btn-curry flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Restaurant"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
