"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { DraftData, Interest, defaultSettings } from "@/lib/draftLogic";
import { DEFAULT_STRATEGIES, LEGACY_STRATEGIES } from "@/lib/data/strategies";
import { defaultRankingConfig } from "@/lib/rankings";

export function defaultDraftData(): DraftData {
  return {
    settings: defaultSettings(),
    keepers: {},
    drafted: {},
    playerMeta: {},
    interestByStrategy: {},
    tierOverrides: {},
    customPlayers: [],
    strategies: DEFAULT_STRATEGIES,
    activeStrategyId: "preset-balanced",
    keeperPicks: {},
    rankingSources: [],
    ranking: defaultRankingConfig(),
  };
}

// Interest ratings moved from global playerMeta to per-strategy. For states saved
// before that change, fold any legacy global interest into the active strategy so
// the user doesn't lose their ratings on first load.
function migrateInterest(state: DraftData): DraftData {
  if (state.interestByStrategy && Object.keys(state.interestByStrategy).length > 0) return state;
  const legacy: Record<string, Interest> = {};
  for (const [id, meta] of Object.entries(state.playerMeta || {})) {
    const iv = meta?.interest;
    if (iv && iv !== "neutral") legacy[id] = iv;
  }
  if (Object.keys(legacy).length === 0) return state;
  return { ...state, interestByStrategy: { [state.activeStrategyId]: legacy } };
}

// Roll saved states forward onto the current preset list: presets the user never
// touched (they still exactly match some shipped generation in LEGACY_STRATEGIES)
// are swapped for their refreshed versions, new presets are added, and anything
// customized — including edited copies of retired presets — is preserved untouched.
function migrateStrategies(state: DraftData): DraftData {
  const legacyJson = new Set(LEGACY_STRATEGIES.map((s) => canonicalJson(s)));
  const kept = (state.strategies || []).filter((s) => !legacyJson.has(canonicalJson(s)));
  const keptIds = new Set(kept.map((s) => s.id));
  const missingDefaults = DEFAULT_STRATEGIES.filter((d) => !keptIds.has(d.id));

  if (missingDefaults.length === 0 && kept.length === (state.strategies || []).length) return state;

  const strategies = [...missingDefaults, ...kept];
  const activeStrategyId = strategies.some((s) => s.id === state.activeStrategyId)
    ? state.activeStrategyId
    : "preset-balanced";
  return { ...state, strategies, activeStrategyId };
}

export type SaveState = "idle" | "saving" | "saved" | "error";

// JSON.stringify with recursively sorted object keys. Postgres jsonb does not
// preserve key order, so realtime echoes of our own writes come back with keys
// re-sorted — naive stringify comparison would treat every echo as a foreign
// update and re-save, looping forever.
function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = sortKeys((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

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
        const merged = migrateStrategies(migrateInterest({ ...defaultDraftData(), ...(row.state as Partial<DraftData>) }));
        lastSyncedJson.current = canonicalJson(merged);
        setData(merged);
      } else {
        const fresh = defaultDraftData();
        lastSyncedJson.current = canonicalJson(fresh);
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
          const merged = migrateStrategies(migrateInterest({ ...defaultDraftData(), ...newState }));
          const json = canonicalJson(merged);
          if (json === lastSyncedJson.current) return; // echo of our own write
          lastSyncedJson.current = json;
          setData(merged);
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
    const json = canonicalJson(data);
    if (json === lastSyncedJson.current) return;

    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      // set before awaiting so the realtime echo of this write is suppressed
      lastSyncedJson.current = json;
      const { error } = await supabase
        .from("draft_states")
        .update({ state: data, updated_at: new Date().toISOString() })
        .eq("profile_id", profileId);
      if (error) {
        // un-mark as synced so the next edit (or remount) retries this state
        lastSyncedJson.current = "";
      }
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
