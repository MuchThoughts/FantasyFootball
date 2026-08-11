"use client";

import { useRef, useState } from "react";
import { Interest } from "@/lib/draftLogic";

const LONG_PRESS_MS = 500;
const CLICK_DELAY_MS = 260; // window to distinguish a single click from a double

// Shared pointer-interaction logic for rating a player by clicking their name:
//   click        -> Like  (click again while Liked -> back to Neutral)
//   double-click -> Love  (again while Loved       -> back to Neutral)
//   press & hold -> onHold() (opens the assign/dislike menu); if no onHold is
//                   given it falls back to toggling Dislike.
// Each click gesture toggles, so the same action undoes itself.
export function usePlayerRating(interest: Interest, onRate: (value: Interest) => void, onHold?: () => void) {
  const [pressing, setPressing] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  const clearPressTimer = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const onPointerDown = () => {
    longPressFired.current = false;
    setPressing(true);
    pressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      setPressing(false);
      if (onHold) onHold();
      else onRate(interest === "dislike" ? "neutral" : "dislike");
    }, LONG_PRESS_MS);
  };

  const endPress = () => {
    setPressing(false);
    clearPressTimer();
  };

  const onClick = () => {
    if (longPressFired.current) {
      longPressFired.current = false;
      return; // the hold already fired; don't also treat it as a click
    }
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      onRate(interest === "love" ? "neutral" : "love");
    } else {
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null;
        onRate(interest === "like" ? "neutral" : "like");
      }, CLICK_DELAY_MS);
    }
  };

  return {
    pressing,
    handlers: {
      onPointerDown,
      onPointerUp: endPress,
      onPointerLeave: endPress,
      onPointerCancel: endPress,
      onClick,
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    },
  };
}
