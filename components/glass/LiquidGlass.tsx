"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { paintDisplacementMap } from "./displacement";

type Props = {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Corner radius in px. */
  radius?: number;
  /** Width of the curved rim in px. Narrow on big panels, wider on small controls. */
  bezel?: number;
  /** How far the rim shoves the backdrop, in px. */
  strength?: number;
  as?: "div" | "nav" | "header" | "section" | "aside";
  /** "clear" for chrome like the nav; "frost" calms the middle of content cards so text stays legible. */
  tint?: "clear" | "frost";
};

// Chromium is the only engine that runs SVG filters inside backdrop-filter; elsewhere we fall back to frost.
const supportsRefraction = () =>
  typeof navigator !== "undefined" &&
  // @ts-expect-error userAgentData is Chromium-only
  Boolean(navigator.userAgentData?.brands?.some((b: { brand: string }) => /Chromium/.test(b.brand)));

const noChanges = () => () => {};

/**
 * A glass surface that bends whatever is behind it. The bend is computed from the pane's shape
 * (see displacement.ts) and applied through an SVG displacement filter on the live backdrop.
 */
export function LiquidGlass({ children, className = "", style, radius = 28, bezel = 24, strength = 42, as = "div", tint = "clear" }: Props) {
  const ref = useRef<HTMLElement>(null);
  const filterId = `glass-${useId().replace(/:/g, "")}`;
  const [map, setMap] = useState<{ url: string; width: number; height: number } | null>(null);
  // The browser can't change engines mid-visit, so there's nothing to subscribe to; the server always says no.
  const refract = useSyncExternalStore(noChanges, supportsRefraction, () => false);

  useEffect(() => {
    if (!refract || !ref.current) return;
    const element = ref.current;
    let url: string | null = null;
    let frame = 0;

    const build = () => {
      const { width, height } = element.getBoundingClientRect();
      const w = Math.max(2, Math.round(width));
      const h = Math.max(2, Math.round(height));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.putImageData(paintDisplacementMap(w, h, radius, bezel), 0, 0);
      // A blob: URL, not data:, so WebKit-based engines also load it inside feImage.
      canvas.toBlob((blob) => {
        if (!blob) return;
        if (url) URL.revokeObjectURL(url);
        url = URL.createObjectURL(blob);
        setMap({ url, width: w, height: h });
      });
    };

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(build);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      if (url) URL.revokeObjectURL(url);
    };
  }, [refract, radius, bezel]);

  const Tag = as;
  const blur = tint === "frost" ? 10 : 1.5;
  const backdrop = refract && map ? `url(#${filterId}) blur(${blur}px) saturate(1.5)` : "blur(18px) saturate(1.6)";

  return (
    <>
      {refract && map && (
        <svg aria-hidden width="0" height="0" style={{ position: "absolute" }}>
          <filter id={filterId} x="0" y="0" width={map.width} height={map.height} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feImage href={map.url} x="0" y="0" width={map.width} height={map.height} preserveAspectRatio="none" result="map" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={strength} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
      )}
      <Tag
        ref={ref as never}
        className={`glass ${tint === "frost" ? "glass-frost" : ""} ${className}`}
        style={{ borderRadius: radius, backdropFilter: backdrop, WebkitBackdropFilter: backdrop, ...style }}
      >
        {children}
      </Tag>
    </>
  );
}
