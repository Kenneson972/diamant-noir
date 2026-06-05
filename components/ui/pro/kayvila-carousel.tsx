"use client";

import Image from "next/image";
import { Carousel } from "@heroui-pro/react";
import { cn } from "@/lib/utils";

export type KayvilaCarouselImage = {
  src: string;
  alt: string;
};

type KayvilaCarouselProps = {
  images: KayvilaCarouselImage[];
  onImageClick?: (index: number) => void;
  showThumbnails?: boolean;
  className?: string;
  imageClassName?: string;
};

export function KayvilaCarousel({
  images,
  onImageClick,
  showThumbnails = true,
  className,
  imageClassName,
}: KayvilaCarouselProps) {
  if (images.length === 0) return null;

  return (
    <Carousel
      opts={{ loop: images.length > 1 }}
      className={cn("w-full", className)}
    >
      <Carousel.Content>
        {images.map((image, i) => (
          <Carousel.Item key={`${image.src}-${i}`}>
            <button
              type="button"
              onClick={() => onImageClick?.(i)}
              className={cn(
                "relative block w-full overflow-hidden rounded-2xl",
                onImageClick && "cursor-zoom-in"
              )}
              aria-label={onImageClick ? `Ouvrir ${image.alt}` : undefined}
            >
              <div className={cn("relative aspect-[4/3] w-full md:aspect-[16/10]", imageClassName)}>
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover"
                  priority={i === 0}
                  sizes="(max-width: 768px) 100vw, 66vw"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/40 to-transparent" />
              </div>
            </button>
          </Carousel.Item>
        ))}
      </Carousel.Content>
      {images.length > 1 ? (
        <>
          <Carousel.Previous className="left-3 border-white/20 bg-white/80 text-navy hover:bg-white" />
          <Carousel.Next className="right-3 border-white/20 bg-white/80 text-navy hover:bg-white" />
          <Carousel.Dots className="bottom-4" />
          {showThumbnails ? (
            <Carousel.Thumbnails className="mt-3 gap-2">
              {images.map((image, i) => (
                <Carousel.Thumbnail
                  key={`thumb-${image.src}-${i}`}
                  alt={image.alt}
                  index={i}
                  src={image.src}
                  className="size-14 rounded-lg border-2 border-transparent data-[selected=true]:border-gold"
                />
              ))}
            </Carousel.Thumbnails>
          ) : null}
        </>
      ) : null}
    </Carousel>
  );
}
