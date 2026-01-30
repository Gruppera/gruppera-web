"use client";

import { useEffect } from "react";

const measureScrollbar = (): number => {
  const probe = document.createElement("div");
  probe.style.width = "100px";
  probe.style.height = "100px";
  probe.style.overflow = "scroll";
  probe.style.position = "absolute";
  probe.style.top = "-9999px";
  document.body.appendChild(probe);
  const width = probe.offsetWidth - probe.clientWidth;
  probe.remove();
  return Math.max(0, width);
};

export const ScrollbarCompensation = () => {
  useEffect(() => {
    const update = () => {
      const width = measureScrollbar();
      document.documentElement.style.setProperty(
        "--scrollbar-width",
        `${width}px`
      );
    };

    update();
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("resize", update);
    };
  }, []);

  return null;
};
