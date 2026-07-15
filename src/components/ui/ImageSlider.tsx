'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ImageSliderItem = {
  src: string
  alt: string
}

export type ImageSliderProps = {
  images: ImageSliderItem[]
  /** Controlled active index */
  activeIndex?: number
  onIndexChange?: (index: number) => void
  /** Click on the main image */
  onImageClick?: (index: number) => void
  /** Pause autoplay (e.g. when a lightbox is open) */
  paused?: boolean
  /** Autoplay interval in ms. Set to 0 to disable. Default 3000. */
  autoplayMs?: number
  /** How many thumbnails visible at once. Default 4. */
  thumbVisible?: number
  /** Slide animation duration in ms. Default 450. */
  slideMs?: number
  /** Main image aspect / height classes */
  className?: string
  mainClassName?: string
  thumbClassName?: string
  /** Optional overlay rendered on top of the main image (e.g. sale badge) */
  overlay?: ReactNode
  /** Main image sizes attribute for next/image */
  sizes?: string
  showArrows?: boolean
  showThumbs?: boolean
}

export function ImageSlider({
  images,
  activeIndex = 0,
  onIndexChange,
  onImageClick,
  paused: pausedExternal = false,
  autoplayMs = 5000,
  thumbVisible = 4,
  slideMs = 450,
  className,
  mainClassName,
  thumbClassName,
  overlay,
  sizes = '(max-width: 1023px) 100vw, 660px',
  showArrows = true,
  showThumbs = true,
}: ImageSliderProps) {
  const count = images.length
  const [index, setIndexState] = useState(activeIndex)
  const [hoverPaused, setHoverPaused] = useState(false)
  const [animating, setAnimating] = useState(true)
  const trackRef = useRef<HTMLDivElement>(null)
  const skipExternalSync = useRef(false)

  const slides = count > 1 ? [images[count - 1], ...images, images[0]] : images
  const [trackPos, setTrackPos] = useState(count > 1 ? activeIndex + 1 : 0)

  const setIndex = useCallback((next: number) => {
    skipExternalSync.current = true
    setIndexState(next)
    onIndexChange?.(next)
  }, [onIndexChange])

  useEffect(() => {
    if (skipExternalSync.current) {
      skipExternalSync.current = false
      return
    }
    if (activeIndex === index || count <= 1) return
    const id = window.setTimeout(() => {
      setAnimating(true)
      setTrackPos(activeIndex + 1)
      setIndexState(activeIndex)
    }, 0)
    return () => window.clearTimeout(id)
  }, [activeIndex, count, index])

  const goTo = useCallback((next: number, dir?: 'next' | 'prev') => {
    if (count <= 1) return
    const normalized = ((next % count) + count) % count

    if (dir === 'next' && index === count - 1 && normalized === 0) {
      setAnimating(true)
      setTrackPos(count + 1)
      setIndex(0)
      return
    }
    if (dir === 'prev' && index === 0 && normalized === count - 1) {
      setAnimating(true)
      setTrackPos(0)
      setIndex(count - 1)
      return
    }

    setAnimating(true)
    setTrackPos(normalized + 1)
    setIndex(normalized)
  }, [count, index, setIndex])

  const next = () => goTo(index + 1, 'next')
  const prev = () => goTo(index - 1, 'prev')
  const paused = hoverPaused || pausedExternal || autoplayMs <= 0

  useEffect(() => {
    if (paused || count <= 1) return
    const timer = window.setInterval(() => goTo(index + 1, 'next'), autoplayMs)
    return () => window.clearInterval(timer)
  }, [paused, count, index, autoplayMs, goTo])

  useEffect(() => {
    const node = trackRef.current
    if (!node || count <= 1) return

    const onEnd = (event: TransitionEvent) => {
      if (event.propertyName !== 'transform') return
      if (trackPos === count + 1) {
        setAnimating(false)
        setTrackPos(1)
      } else if (trackPos === 0) {
        setAnimating(false)
        setTrackPos(count)
      }
    }

    node.addEventListener('transitionend', onEnd)
    return () => node.removeEventListener('transitionend', onEnd)
  }, [trackPos, count])

  useEffect(() => {
    if (animating) return
    const id = requestAnimationFrame(() => setAnimating(true))
    return () => cancelAnimationFrame(id)
  }, [animating])

  const thumbStart = Math.min(index, Math.max(0, count - thumbVisible))

  if (count === 0) return null

  return (
    <div
      className={cn('relative', className)}
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
    >
      <div
        className={cn(
          'relative aspect-video min-h-[230px] overflow-hidden rounded-sm bg-[#e5e5e5] lg:aspect-auto lg:h-[438px]',
          mainClassName,
        )}
      >
        <div
          ref={trackRef}
          className="flex h-full w-full will-change-transform"
          style={{
            transform: `translateX(-${trackPos * 100}%)`,
            transition: animating ? `transform ${slideMs}ms ease-out` : 'none',
          }}
        >
          {slides.map((image, i) => (
            <button
              key={`${image.src}-slide-${i}`}
              type="button"
              onClick={() => onImageClick?.(index)}
              className="relative h-full w-full shrink-0 grow-0 basis-full overflow-hidden text-left"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes={sizes}
                className="object-cover"
                priority={i <= 2}
              />
            </button>
          ))}
        </div>

        {overlay ? <div className="pointer-events-none absolute inset-0 z-10">{overlay}</div> : null}

        {showArrows && count > 1 ? (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white drop-shadow"
            >
              <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white drop-shadow"
            >
              <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
            </button>
          </>
        ) : null}
      </div>

      {showThumbs && count > 1 ? (
        <div className={cn('mt-3 overflow-hidden', thumbClassName)}>
          <div
            className="flex will-change-transform"
            style={{
              width: `${(count / thumbVisible) * 100}%`,
              transform: `translateX(-${thumbStart * (100 / count)}%)`,
              transition: `transform ${slideMs}ms ease-out`,
            }}
          >
            {images.map((image, i) => (
              <button
                key={`${image.src}-thumb-${i}`}
                type="button"
                onClick={() => goTo(i)}
                className={cn(
                  'relative aspect-4/3 box-border overflow-hidden border-2',
                  i === index ? 'border-[#1683e9]' : 'border-transparent',
                )}
                style={{ width: `${100 / count}%` }}
              >
                <div className="absolute inset-1">
                  <Image src={image.src} alt={image.alt} fill sizes="160px" className="object-cover" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
