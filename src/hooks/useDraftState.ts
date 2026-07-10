"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { DraftData, defaultSettings } from "@/lib/draftLogic";
import { DEFAULT_STRATEGIES } from "@/lib/data/strategies";

export function defaultDraftData(): DraftData {
  return {
    settings: defaultSettings(),
    keepers: {},
    drafted: {},
    playerMeta: {},
    tierOverrides: {},
    customPlayers: [],
    strategies: DEFAULT_STRATEGIES,
    activeStrategyId: "preset-balanced",
  };
}

export type SaveState = "idle" | "saving" | "saved" | "error";

// Persists DraftData for a given profile to Supabase, debounces writes, and
// subscribes to postgres_changes so other devices on the same profile see
// live updates during a draft.
export function useDraftState(profileId: string | null) {
  const [data, setData] = useState<DraftData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const lastSyncedJson = useRef<string>("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!profileId) {
      queueMicrotask(() => {
        setData(null);
        setLoaded(false);
      });
      return;
    }
    let cancelled = false;

    (async () => {
      setLoaded(false);
      const { data: row } = await supabase
        .from("draft_states")
        .select("state")
        .eq("profile_id", profileId)
        .maybeSingle();
      if (cancelled) return;

      if (row && row.state && Object.keys(row.state as object).length > 0) {
        const merged = { ...defaultDraftData(), ...(row.state as Partial<DraftData>) };
        lastSyncedJson.current = JSON.stringify(merged);
        setData(merged);
      } else {
        const fresh = defaultDraftData();
        lastSyncedJson.current = JSON.stringify(fresh);
        await supabase.from("draft_states").upsert({ profile_id: profileId, state: fresh });
        if (!cancelled) setData(fresh);
      }
      if (!cancelled) setLoaded(true);
    })();

    const channel = supabase
      .channel(`draft_states:${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "draft_states",
          filter: `profile_id=eq.${profileId}`,
        },
        (payload) => {
          const newState = (payload.new as { state?: Partial<DraftData> } | null)?.state;
          if (!newState) return;
          const json = JSON.stringify(newState);
          if (json === lastSyncedJson.current) return; // echo of our own write
          lastSyncedJson.current = json;
          setData({ ...defaultDraftData(), ...newState });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [profileId]);

  // debounced persist on local edits
  useEffect(() => {
    if (!loaded || !data || !profileId) return;
    const json = JSON.stringify(data);
    if (json === lastSyncedJson.current) return;

    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      lastSyncedJson.current = json;
      const { error } = await supabase
        .from("draft_states")
        .update({ state: data, updated_at: new Date().toISOString() })
        .eq("profile_id", profileId);
      setSaveState(error ? "error" : "saved");
    }, 400);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, loaded, profileId]);

  const update = useCallback((updater: (prev: DraftData) => DraftData) => {
    setData((prev) => (prev ? updater(prev) : prev));
  }, []);

  return { data, update, loaded, saveState };
}
