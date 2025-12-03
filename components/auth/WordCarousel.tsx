"use client";

import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

const carouselItems = [
  {
    word: "Rate",
    gradient: "from-curry to-saffron",
  },
  {
    word: "Eat",
    gradient: "from-saffron to-turmeric",
  },
  {
    word: "Enjoy",
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
          const isActive = index === selectedIndex;

          return (
            <div
              key={item.word}
              className="flex-[0_0_100%] min-w-0"
              style={{ transform: "translateZ(0)" }}
            >
              <div className="flex items-center justify-center">
                <span
                  className={`
                    text-2xl sm:text-3xl font-bold italic font-serif
                    bg-gradient-to-r ${item.gradient}
                    bg-clip-text text-transparent
                    transition-all duration-700 ease-out
                    ${isActive ? "opacity-100 scale-100" : "opacity-0 scale-90"}
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
