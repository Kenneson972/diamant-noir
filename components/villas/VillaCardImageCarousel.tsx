"use client";

import Image from "next/image";
import { Carousel } from "@heroui-pro/react";
import { cn } from "@/lib/utils";

type VillaCardImageCarouselProps = {
  images: { src: string; alt: string }[];
  className?: string;
  sizes?: string;
  priority?: boolean;
};

function stopNav(e: React.MouseEvent | React.PointerEvent) {
  e.preventDefault();
  e.stopPropagation();
}

/** Carousel compact 3/4 pour cartes listing — flèches au hover, sans miniatures. */
export function VillaCardImageCarousel({
  images,
  className,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  priority = false,
}: VillaCardImageCarouselProps) {
  if (images.length <= 1) {
    const image = images[0];
    if (!image) return null;
    return (
      <div className={cn("relative aspect-[3/4] overflow-hidden rounded-none", className)}>
        <Image
          src={image.src}
          alt={image.alt}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
      </div>
    );
  }

  return (
    <Carousel
      opts={{ loop: true }}
      className={cn("group/carousel w-full", className)}
    >
      <Carousel.Content className="ml-0">
        {images.map((image, i) => (
          <Carousel.Item key={`${image.src}-${i}`} className="pl-0">
            <div className="relative aspect-[3/4] overflow-hidden rounded-none">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                priority={priority && i === 0}
                sizes={sizes}
                className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              />
            </div>
          </Carousel.Item>
        ))}
      </Carousel.Content>
      <Carousel.Previous
        onPointerDown={stopNav}
        onClick={stopNav}
        className="left-2 z-20 size-8 border-white/30 bg-white/90 text-navy opacity-100 shadow-sm transition-opacity hover:bg-white md:opacity-0 md:group-hover/carousel:opacity-100"
      />
      <Carousel.Next
        onPointerDown={stopNav}
        onClick={stopNav}
        className="right-2 z-20 size-8 border-white/30 bg-white/90 text-navy opacity-100 shadow-sm transition-opacity hover:bg-white md:opacity-0 md:group-hover/carousel:opacity-100"
      />
      <Carousel.Dots className="bottom-3 z-20 gap-1.5" />
    </Carousel>
  );
}
