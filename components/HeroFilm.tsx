"use client";

/**
 * The hero on phones and tablets: a silent, looping film of the desktop app (the same clickable app the desktop hero
 * shows, with its fictional data), captured screen by screen and zoomed so it reads at phone width. Made with
 * HyperFrames in landing/hero-film/ (kept local); the rendered file ships from public/.
 *
 * The film's source is in the HTML with a media condition (below 1024px, motion allowed), so a phone starts loading it
 * while the page itself loads and starts playing without waiting for the page's JavaScript: on a phone-speed CPU the
 * poster used to stand still for about 2 seconds, because the film was only requested after hydration (L30). Desktop
 * and reduced-motion visitors match no source, so they never download it and keep the still. Once the page runs, it
 * plays while on screen and pauses when scrolled away, and both conditions are watched: a tablet turned from landscape
 * (desktop hero) to portrait, or a desktop window narrowed, picks the source then and starts the film; widening it
 * again stops it (L19).
 *
 * The film is 1080 × 1350, but every scene sits between y 110 and 1325 (only two passing transition frames reach
 * further), so the frame shows just that band: 1080 × 1215, 8:9. object-position puts 110 of the 135 cropped rows on
 * top. It applies to the poster too. Less empty page above and below the film, nothing of a scene lost (L20).
 */

import { useEffect, useRef } from "react";

const SRC = "/hero-film.mp4";
const POSTER = "/hero-film-poster.jpg";
const PHONES = "(max-width: 1023.98px)";
const REDUCED = "(prefers-reduced-motion: reduce)";
/** When the browser may pick the film at all: the same two conditions, as one media query for <source media> */
const FILM_MEDIA = `${PHONES} and (prefers-reduced-motion: no-preference)`;

export default function HeroFilm() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const phones = window.matchMedia(PHONES);
    const reduced = window.matchMedia(REDUCED);
    let io: IntersectionObserver | null = null;

    const update = () => {
      const on = phones.matches && !reduced.matches;
      if (on && !io) {
        video.muted = true; // set on the element too: iOS checks the property before it allows autoplay
        // Opened wide or with reduced motion, the browser picked no source; the condition matches now, so pick again
        if (!video.currentSrc) video.load();
        io = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) video.play().catch(() => {});
            else video.pause();
          },
          { threshold: 0.25 },
        );
        io.observe(video);
      } else if (!on && io) {
        io.disconnect();
        io = null;
        video.pause();
      }
    };

    update();
    phones.addEventListener("change", update);
    reduced.addEventListener("change", update);
    return () => {
      phones.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
      io?.disconnect();
    };
  }, []);

  return (
    <video
      ref={ref}
      poster={POSTER}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      aria-label="A short silent film of the oneth desktop app with fictional data: oneth reads a supplier invoice and a person approves it, the next invoice arrives already proposed, a client answers a question from their phone, a payment is matched to its bill and the month's checklist clears."
      className="block aspect-[8/9] w-full object-cover object-[50%_81.5%]"
    >
      <source src={SRC} type="video/mp4" media={FILM_MEDIA} />
    </video>
  );
}
