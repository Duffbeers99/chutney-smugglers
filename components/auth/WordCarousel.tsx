"use client";

import { useEffect, useState } from "react";
import { Star, Utensils, Smile } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

const carouselItems = [
  {
    word: "Rate",
    icon: Star,
    gradient: "from-curry to-saffron",
  },
  {
    word: "Eat",
    icon: Utensils,
    gradient: "from-saffron to-turmeric",
  },
  {
    word: "Enjoy",
    icon: Smile,
    gradient: "from-terracotta to-curry",
  },
];

export function WordCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, duration: 30 },
    [Autoplay({ delay: 4500, stopOnInteraction: false })]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on("select", onSelect);
    onSelect();

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <div className="overflow-hidden w-full py-2 sm:py-4" ref={emblaRef}>
      <div className="flex">
        {carouselItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = index === selectedIndex;

          return (
            <div
              key={item.word}
              className="flex-[0_0_100%] min-w-0"
              style={{ transform: "translateZ(0)" }}
            >
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <div
                  className={`
                    transition-all duration-700 ease-out
                    ${isActive ? "opacity-100 scale-100" : "opacity-0 scale-90"}
                  `}
                >
                  <Icon
                    className={`
                      w-8 h-8 sm:w-10 sm:h-10
                      bg-gradient-to-r ${item.gradient}
                      bg-clip-text text-transparent
                      drop-shadow-sm
                    `}
                    strokeWidth={2.5}
                  />
                </div>
                <span
                  className={`
                    text-2xl sm:text-3xl font-bold
                    bg-gradient-to-r ${item.gradient}
                    bg-clip-text text-transparent
                    transition-all duration-700 ease-out
                    ${isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}
                  `}
                >
                  {item.word}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
