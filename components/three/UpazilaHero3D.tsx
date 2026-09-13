"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

const UpazilaScene = dynamic(() => import("@/components/three/UpazilaScene").then((m) => m.UpazilaScene), {
  ssr: false,
});

function subscribe(callback: () => void) {
  const desktopQuery = window.matchMedia("(min-width: 768px)");
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  desktopQuery.addEventListener("change", callback);
  motionQuery.addEventListener("change", callback);
  return () => {
    desktopQuery.removeEventListener("change", callback);
    motionQuery.removeEventListener("change", callback);
  };
}

function getShouldRender3D() {
  return (
    window.matchMedia("(min-width: 768px)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function getShouldRender3DServer() {
  return false;
}

/**
 * DESIGN.md 3D Language: "must degrade gracefully to a static hero image on
 * low-end devices/slow connections — never block core content behind a 3D
 * load." The gradient below is both the loading state and the permanent
 * mobile/reduced-motion fallback.
 */
export function UpazilaHero3D() {
  const shouldRender3D = useSyncExternalStore(subscribe, getShouldRender3D, getShouldRender3DServer);

  return (
    <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_30%_20%,#1a685e_0%,#00503a_45%,#0b1c30_100%)]">
      {shouldRender3D && (
        <div className="h-full w-full opacity-90">
          <UpazilaScene />
        </div>
      )}
    </div>
  );
}
