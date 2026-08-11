"use client";

import React, { useState, useEffect, useRef } from "react";

export default function A4ScaleWrapper({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function updateScale() {
      if (!containerRef.current) return;
      const parentWidth = containerRef.current.clientWidth;
      if (parentWidth > 0 && parentWidth < 615) {
        const availableWidth = Math.max(280, parentWidth - 12);
        const newScale = Math.min(1, availableWidth / 595);
        setScale(newScale);
      } else {
        setScale(1);
      }
    }

    updateScale();
    const observer = new ResizeObserver(() => updateScale());
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    window.addEventListener("resize", updateScale);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="a4-scale-outer"
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        overflow: "hidden",
        padding: scale < 1 ? "0.25rem 0" : 0,
      }}
    >
      <div
        className="a4-scale-inner"
        style={{
          width: scale < 1 ? Math.round(595 * scale) : "auto",
          height: scale < 1 ? Math.round(842 * scale) : "auto",
          overflow: "hidden",
          transition: "width 0.15s ease, height 0.15s ease",
        }}
      >
        <div
          style={{
            transform: scale < 1 ? `scale(${scale})` : "none",
            transformOrigin: "top left",
            width: 595,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
