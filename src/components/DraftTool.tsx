"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PLAYERS_DATA } from "@/lib/data/players";
import { OFFENSE_DATA } from "@/lib/data/offense";
import { DEFAULT_STRATEGIES } from "@/lib/data/strategies";
import {
  BoardRow as BoardRowType,
  Interest,
  computeBoard,
  computeMarketRead,
  computeStrategySlots,
  computeStrategyTargets,
  computeStrategyZones,
  fmtMoney,
  POSITIONS,
  recommendStrategy,
  StrategyZone,
  suggestSlotAmount,
  tierColor,
  uid,
} from "@/lib/draftLogic";
import { BUILTIN_SOURCE_ID, BUILTIN_SOURCE_NAME, RankingConfig, RankingSource, applyRanking } from "@/lib/rankings";
import { dropEdgeStyle, dropRank, useRowDrag } from "@/hooks/useRowDrag";
import { useProfiles } from "@/hooks/useProfiles";
import { defaultDraftData, useDraftState } from "@/hooks/useDraftState";
import { styles, fontImport, chipActive } from "./styles";
import { ProfileBar } from "./ProfileBar";
import { BoardRow } from "./BoardRow";
import { TierDivider } from "./TierDivider";
import { StrategyTab } from "./StrategyTab";
import { RankingsTab } from "./RankingsTab";
import { MarketReadPanel } from "./MarketReadPanel";
import { InsightsTab } from "./InsightsTab";
import { OffensesTab } from "./OffensesTab";

const PROFILE_STORAGE_KEY = "ffauction2026:profileId";

export default function ProfileGate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profiles, loading, createProfile } = useProfiles();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // resolve initial profile: URL param -> localStorage -> first available -> create default
  useEffect(() => {
    if (loading || initialized) return;
    const fromUrl = searchParams.get("p");
    const fromStorage = typeof window !== "undefined" ? window.localStorage.getItem(PROFILE_STORAGE_KEY) : null;

    (async () => {
      let id = fromUrl || fromStorage || null;
      if (id && !profiles.some((p) => p.id === id)) id = null;
      if (!id) {
        if (profiles.length > 0) {
          id = profiles[0].id;
        } else {
          const created = await createProfile("Draft Room");
          id = created.id;
        }
      }
      setProfileId(id);
      setInitialized(true);
    })();
  }, [loading, initialized, profiles, searchParams, createProfile]);

  const selectProfile = useCallback(
    (id: string) => {
      setProfileId(id);
      window.localStorage.setItem(PROFILE_STORAGE_KEY, id);
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.set("p", id);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  useEffect(() => {
    if (profileId) window.localStorage.setItem(PROFILE_STORAGE_KEY, profileId);
  }, [profileId]);

  if (!initialized || !profileId) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingText}>Loading war room…</div>
      </div>
    );
  }

  return (
    <DraftTool
      profileId={profileId}
      profiles={profiles}
      onSelectProfile={selectProfile}
      onCreateProfile={createProfile}
    />
  );
}

interface DraftToolProps {
  profileId: string;
  profiles: { id: string; name: string; created_at: string }[];
  onSelectProfile: (id: string) => void;
  onCreateProfile: (name: string) => Promise<{ id: string; name: string; created_at: string }>;
}

function DraftTool({ profileId, profiles, onSelectProfile, onCreateProfile }: DraftToolProps) {
  const { data, update, loaded, saveState } = useDraftState(profileId);

  const [tab, setTab] = useState<"board" | "strategy" | "rankings" | "drafters" | "offenses">("board");
  const [posFilter, setPosFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("adp");
  const [showSettings, setShowSettings] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", pos: "RB" });
  const [offSort, setOffSort] = useState("ppg25");
  const [endgameMode, setEndgameMode] = useState(false);

  const d = data ?? defaultDraftData();

  const basePlayers = useMemo(() => [...PLAYERS_DATA, ...d.customPlayers], [d.customPlayers]);

  // The active ranking (source, blend, and manual overrides) is materialized
  // as each player's adp, so board order, positional price targets, and tiers
  // all follow whichever ranking is selected on the Rankings tab.
  const allPlayers = useMemo(
    () => applyRanking(basePlayers, d.rankingSources, d.ranking),
    [basePlayers, d.rankingSources, d.ranking]
  );

  const rankingLabel = useMemo(() => {
    if (d.ranking.mode === "blend") return "Blend";
    if (d.ranking.activeSourceId === BUILTIN_SOURCE_ID) return BUILTIN_SOURCE_NAME;
    return d.rankingSources.find((s) => s.id === d.ranking.activeSourceId)?.name ?? BUILTIN_SOURCE_NAME;
  }, [d.ranking, d.rankingSources]);

  const activeStrategy = useMemo(
    () => d.strategies.find((s) => s.id === d.activeStrategyId) || d.strategies[0],
    [d.strategies, d.activeStrategyId]
  );

  const activeInterest = useMemo(
    () => d.interestByStrategy[d.activeStrategyId] ?? {},
    [d.interestByStrategy, d.activeStrategyId]
  );

  const board = useMemo(
    () => computeBoard(d.settings, d.keepers, d.drafted, allPlayers, d.playerMeta, d.tierOverrides, activeStrategy, activeInterest),
    [d.settings, d.keepers, d.drafted, allPlayers, d.playerMeta, d.tierOverrides, activeStrategy, activeInterest]
  );

  const strategySlots = useMemo(() => computeStrategySlots(activeStrategy), [activeStrategy]);
  const strategyTargets = useMemo(() => computeStrategyTargets(board, strategySlots), [board, strategySlots]);

  const marketRead = useMemo(() => computeMarketRead(board), [board]);
  const recommendation = useMemo(
    () => recommendStrategy(marketRead, d.strategies, d.activeStrategyId),
    [marketRead, d.strategies, d.activeStrategyId]
  );

  const offenseRows = useMemo(() => {
    const rows = Object.entries(OFFENSE_DATA).map(([team, od]) => ({
      team,
      ...od,
      diff25: od.ppg25 != null && od.opp25 != null ? od.ppg25 - od.opp25 : null,
      diff24: od.ppg24 != null && od.opp24 != null ? od.ppg24 - od.opp24 : null,
    }));
    return rows.sort((a, b) => {
      const av = (a as unknown as Record<string, number | null>)[offSort];
      const bv = (b as unknown as Record<string, number | null>)[offSort];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return bv - av;
    });
  }, [offSort]);

  const endgameMaxBid = Math.max(board.myBudgetRemaining - Math.max(board.mySlotsRemaining - 1, 0), 0);
  const endgameSuggested = board.mySlotsRemaining > 0 && board.myBudgetRemaining <= board.mySlotsRemaining && !endgameMode;

  const filteredRows = useMemo(() => {
    let r = board.rows;
    if (endgameMode) {
      r = r.filter(
        (x) => !x.isDrafted && !x.isKeeper && (x.interest === "love" || x.interest === "like") && (x.live ?? Infinity) <= endgameMaxBid
      );
    }
    if (posFilter === "LIKED") r = r.filter((x) => x.interest === "love" || x.interest === "like");
    else if (posFilter !== "ALL") r = r.filter((x) => x.pos === posFilter);
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      r = r.filter((x) => x.name.toLowerCase().includes(s));
    }
    return [...r].sort((a, b) => {
      if (endgameMode) {
        const rank: Record<string, number> = { love: 0, like: 1 };
        const rd = (rank[a.interest] ?? 2) - (rank[b.interest] ?? 2);
        if (rd !== 0) return rd;
        return (b.live ?? -1) - (a.live ?? -1);
      }
      if (sortKey === "adp") return a.adp - b.adp;
      if (sortKey === "target") return (b.target ?? 0) - (a.target ?? 0);
      if (sortKey === "live") return (b.live ?? -1) - (a.live ?? -1);
      if (sortKey === "pos") return a.pos.localeCompare(b.pos) || a.adp - b.adp;
      if (sortKey === "tier") return a.pos.localeCompare(b.pos) || (a.tier ?? 0) - (b.tier ?? 0) || a.adp - b.adp;
      return a.adp - b.adp;
    });
  }, [board.rows, posFilter, search, sortKey, endgameMode, endgameMaxBid]);

  // true only when a single real position is selected (not ALL or the Liked filter) —
  // tier bars are per-position, so their controls only apply in that case.
  const isPosFilter = (POSITIONS as string[]).includes(posFilter);

  // Target-zone brackets: with a single position filtered, mark where the active
  // strategy's slot targets (the ~5 players priced nearest each slot's planned $)
  // sit among the visible rows. Each zone becomes a bracket column to the right of
  // the table, spanning from its highest-ranked target to its lowest. Hidden on
  // ALL/Liked and in endgame mode.
  const zoneSpans = useMemo(() => {
    if (!isPosFilter || endgameMode) return [];
    const zones = computeStrategyZones(board.rows, activeStrategy, posFilter);
    const indexById = new Map(filteredRows.map((r, i) => [r.id, i] as const));
    const spans: (StrategyZone & { start: number; end: number })[] = [];
    for (const z of zones) {
      const idxs = z.ids.map((id) => indexById.get(id)).filter((i): i is number => i !== undefined);
      if (idxs.length > 0) spans.push({ ...z, start: Math.min(...idxs), end: Math.max(...idxs) });
    }
    return spans;
  }, [isPosFilter, endgameMode, board.rows, activeStrategy, posFilter, filteredRows]);

  const setPaid = useCallback(
    (row: BoardRowType, value: string) => {
      update((prev) => ({
        ...prev,
        drafted: {
          ...prev.drafted,
          [row.id]: { price: value === "" ? "" : Number(value), mine: prev.drafted[row.id] ? prev.drafted[row.id].mine : false },
        },
      }));
    },
    [update]
  );

  // Writes the active strategy's interest rating for one player. "neutral" clears it.
  // Ownership (keeper/drafted) is left untouched — it's global, not per-strategy.
  const setInterest = useCallback(
    (row: BoardRowType, value: Interest) => {
      update((prev) => {
        const map = { ...(prev.interestByStrategy[prev.activeStrategyId] ?? {}) };
        if (value === "neutral") delete map[row.id];
        else map[row.id] = value;
        return { ...prev, interestByStrategy: { ...prev.interestByStrategy, [prev.activeStrategyId]: map } };
      });
    },
    [update]
  );

  // The combined Status dropdown on the board: ownership and interest are mutually
  // exclusive here, so setting one clears the other. Interest is per active strategy;
  // ownership is global.
  const setStatus = useCallback(
    (row: BoardRowType, value: string) => {
      const isInterest = value === "" || value === "love" || value === "like" || value === "dislike";
      update((prev) => {
        const map = { ...(prev.interestByStrategy[prev.activeStrategyId] ?? {}) };
        if (isInterest) {
          if (value === "" ) delete map[row.id];
          else map[row.id] = value as Interest;
          const nextKeepers = { ...prev.keepers };
          delete nextKeepers[row.id];
          const nextDrafted = { ...prev.drafted };
          delete nextDrafted[row.id];
          return {
            ...prev,
            keepers: nextKeepers,
            drafted: nextDrafted,
            interestByStrategy: { ...prev.interestByStrategy, [prev.activeStrategyId]: map },
          };
        }
        // ownership: mine / keeper / keeper-mine — clear any interest for this strategy
        delete map[row.id];
        const wantsKeeper = value === "keeper" || value === "keeper-mine";
        const wantsMine = value === "mine" || value === "keeper-mine";
        const interestByStrategy = { ...prev.interestByStrategy, [prev.activeStrategyId]: map };
        if (wantsKeeper) {
          const nextKeepers = {
            ...prev.keepers,
            [row.id]: { name: row.name, pos: row.pos, cost: prev.keepers[row.id]?.cost ?? "", mine: wantsMine },
          };
          const nextDrafted = { ...prev.drafted };
          delete nextDrafted[row.id];
          return { ...prev, keepers: nextKeepers, drafted: nextDrafted, interestByStrategy };
        }
        const nextKeepers = { ...prev.keepers };
        delete nextKeepers[row.id];
        const nextDrafted = {
          ...prev.drafted,
          [row.id]: { price: prev.drafted[row.id] ? prev.drafted[row.id].price : "", mine: wantsMine },
        };
        return { ...prev, keepers: nextKeepers, drafted: nextDrafted, interestByStrategy };
      });
    },
    [update]
  );

  const setMeta = useCallback(
    (id: string, field: "max", value: string) => {
      const parsed: number | "" = value === "" ? "" : Number(value);
      update((prev) => ({
        ...prev,
        playerMeta: {
          ...prev.playerMeta,
          [id]: { ...prev.playerMeta[id], [field]: parsed },
        },
      }));
    },
    [update]
  );

  const setKeeperCost = useCallback(
    (row: BoardRowType, value: string) => {
      update((prev) => ({
        ...prev,
        keepers: {
          ...prev.keepers,
          [row.id]: { name: row.name, pos: row.pos, mine: prev.keepers[row.id]?.mine ?? false, cost: value === "" ? "" : Number(value) },
        },
      }));
    },
    [update]
  );

  const setTierBoundary = useCallback(
    (pos: string, index: number, currentBreaks: number[], newRank: number) => {
      update((prev) => {
        const hasOverride = Object.prototype.hasOwnProperty.call(prev.tierOverrides, pos);
        const base = hasOverride ? prev.tierOverrides[pos] : currentBreaks;
        const next = [...base];
        next[index] = newRank;
        next.sort((a, b) => a - b);
        return { ...prev, tierOverrides: { ...prev.tierOverrides, [pos]: next } };
      });
    },
    [update]
  );

  const resetTiers = useCallback(
    (pos: string) => {
      update((prev) => {
        const next = { ...prev.tierOverrides };
        delete next[pos];
        return { ...prev, tierOverrides: next };
      });
    },
    [update]
  );

  // Splits whichever gap between existing bars (or the position's ends) is currently
  // largest, so "add a bar" always lands somewhere useful without the user picking a rank.
  const addTierBar = useCallback(
    (pos: string) => {
      update((prev) => {
        const n = board.positionCounts[pos] || 0;
        if (n < 2) return prev;
        const hasOverride = Object.prototype.hasOwnProperty.call(prev.tierOverrides, pos);
        const current = hasOverride ? prev.tierOverrides[pos] : board.tierBreaks[pos] || [];
        const bounds = [0, ...current, n];
        let bestGapIdx = 0;
        let bestGapSize = -1;
        for (let i = 0; i < bounds.length - 1; i++) {
          const size = bounds[i + 1] - bounds[i];
          if (size > bestGapSize) {
            bestGapSize = size;
            bestGapIdx = i;
          }
        }
        if (bestGapSize < 2) return prev; // no room left to split further
        const newRank = Math.floor((bounds[bestGapIdx] + bounds[bestGapIdx + 1]) / 2);
        const next = Array.from(new Set([...current, newRank])).sort((a, b) => a - b);
        return { ...prev, tierOverrides: { ...prev.tierOverrides, [pos]: next } };
      });
    },
    [update, board.positionCounts, board.tierBreaks]
  );

  const removeTierBar = useCallback(
    (pos: string, rank: number) => {
      update((prev) => {
        const hasOverride = Object.prototype.hasOwnProperty.call(prev.tierOverrides, pos);
        const current = hasOverride ? prev.tierOverrides[pos] : board.tierBreaks[pos] || [];
        const next = current.filter((r) => r !== rank);
        return { ...prev, tierOverrides: { ...prev.tierOverrides, [pos]: next } };
      });
    },
    [update, board.tierBreaks]
  );

  // Switching strategy resets manually-dragged/added/removed tier bars back to
  // whatever the new strategy implies — tiers "follow" the active strategy. Re-selecting
  // the already-active strategy is a no-op so it doesn't wipe manual edits pointlessly.
  const selectStrategy = useCallback(
    (id: string) => {
      update((prev) => (prev.activeStrategyId === id ? prev : { ...prev, activeStrategyId: id, tierOverrides: {} }));
    },
    [update]
  );

  // Board drag-and-drop: dropping a row pins that player at the drop spot (a
  // ranking override). Only meaningful while the board is in rank order.
  const boardDragEnabled = sortKey === "adp" && !endgameMode;
  const effRankById = useMemo(() => {
    const m = new Map<string, number>();
    allPlayers.forEach((p) => m.set(uid(p.name), p.adp));
    return m;
  }, [allPlayers]);

  const { drag: boardDrag, startDrag: startBoardDrag } = useRowDrag(
    useCallback(
      (dragId: string, overId: string, after: boolean) => {
        const draggedRank = effRankById.get(dragId);
        const targetRank = effRankById.get(overId);
        if (draggedRank === undefined || targetRank === undefined) return;
        const rank = dropRank(draggedRank, targetRank, after);
        update((prev) => ({
          ...prev,
          ranking: { ...prev.ranking, overrides: { ...prev.ranking.overrides, [dragId]: rank } },
        }));
      },
      [effRankById, update]
    )
  );

  const setRankingConfig = useCallback(
    (updater: (prev: RankingConfig) => RankingConfig) => {
      update((prev) => ({ ...prev, ranking: updater(prev.ranking) }));
    },
    [update]
  );

  // A fresh upload becomes the active ranking immediately — that's why you uploaded it.
  const addRankingSource = useCallback(
    (source: RankingSource) => {
      update((prev) => ({
        ...prev,
        rankingSources: [...prev.rankingSources, source],
        ranking: { ...prev.ranking, mode: "source", activeSourceId: source.id },
      }));
    },
    [update]
  );

  const renameRankingSource = useCallback(
    (id: string, name: string) => {
      update((prev) => ({
        ...prev,
        rankingSources: prev.rankingSources.map((s) => (s.id === id ? { ...s, name } : s)),
      }));
    },
    [update]
  );

  const deleteRankingSource = useCallback(
    (id: string) => {
      if (!window.confirm("Delete this ranking source? This can't be undone.")) return;
      update((prev) => {
        const rankingSources = prev.rankingSources.filter((s) => s.id !== id);
        const weights = { ...prev.ranking.weights };
        delete weights[id];
        return {
          ...prev,
          rankingSources,
          ranking: {
            ...prev.ranking,
            weights,
            activeSourceId: prev.ranking.activeSourceId === id ? BUILTIN_SOURCE_ID : prev.ranking.activeSourceId,
            // a blend needs at least one upload to differ from the built-in list
            mode: prev.ranking.mode === "blend" && rankingSources.length === 0 ? "source" : prev.ranking.mode,
          },
        };
      });
    },
    [update]
  );

  const addCustomPlayer = useCallback(() => {
    const name = addForm.name.trim();
    if (!name) return;
    update((prev) => ({
      ...prev,
      customPlayers: [...prev.customPlayers, { adp: 999, name, pos: addForm.pos as never, team: "" }],
    }));
    setAddForm({ name: "", pos: "RB" });
    setShowAddPlayer(false);
  }, [addForm, update]);

  const resetAll = useCallback(() => {
    if (!window.confirm("Reset all keepers, draft picks, and settings for this profile? This can't be undone.")) return;
    update(() => defaultDraftData());
  }, [update]);

  const setSlotPos = useCallback(
    (strategyId: string, slotId: string, newPos: string) => {
      update((prev) => ({
        ...prev,
        strategies: prev.strategies.map((s) => {
          if (s.id !== strategyId) return s;
          const idx = s.slots.findIndex((sl) => sl.id === slotId);
          if (idx === -1) return s;
          const amount = suggestSlotAmount(s.slots, idx, newPos);
          return { ...s, slots: s.slots.map((sl, i) => (i === idx ? { ...sl, pos: newPos as never, amount } : sl)) };
        }),
      }));
    },
    [update]
  );

  const setSlotAmount = useCallback(
    (strategyId: string, slotId: string, value: string) => {
      update((prev) => ({
        ...prev,
        strategies: prev.strategies.map((s) =>
          s.id !== strategyId ? s : { ...s, slots: s.slots.map((sl) => (sl.id === slotId ? { ...sl, amount: Number(value) || 0 } : sl)) }
        ),
      }));
    },
    [update]
  );

  const setStrategyName = useCallback(
    (strategyId: string, name: string) => {
      update((prev) => ({ ...prev, strategies: prev.strategies.map((s) => (s.id === strategyId ? { ...s, name } : s)) }));
    },
    [update]
  );

  const addStrategy = useCallback(() => {
    const template = DEFAULT_STRATEGIES[0];
    const id = "custom-" + Date.now();
    update((prev) => ({
      ...prev,
      strategies: [...prev.strategies, { id, name: "New Strategy", slots: template.slots.map((s) => ({ ...s })) }],
      activeStrategyId: id,
    }));
  }, [update]);

  const deleteStrategy = useCallback(
    (id: string) => {
      if (!window.confirm("Delete this strategy? This can't be undone.")) return;
      update((prev) => {
        const next = prev.strategies.filter((s) => s.id !== id);
        const strategies = next.length ? next : DEFAULT_STRATEGIES;
        const interestByStrategy = { ...prev.interestByStrategy };
        delete interestByStrategy[id];
        return {
          ...prev,
          strategies,
          interestByStrategy,
          activeStrategyId: prev.activeStrategyId === id ? "preset-balanced" : prev.activeStrategyId,
        };
      });
    },
    [update]
  );

  if (!loaded) {
    return (
      <div style={styles.loadingScreen}>
        <style>{fontImport}</style>
        <div style={styles.loadingText}>Loading war room…</div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <style>{fontImport}</style>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <button style={styles.iconBtn} onClick={() => setShowSettings((s) => !s)}>
          ⚙
        </button>
      </div>

      <ProfileBar profiles={profiles} currentId={profileId} onSelect={onSelectProfile} onCreate={onCreateProfile} />

      {showSettings && (
        <div style={styles.panel}>
          <div style={styles.panelTitle}>League Settings</div>
          <div style={styles.settingsGrid}>
            <label style={styles.settingLabel}>
              Teams
              <input
                style={styles.input}
                type="number"
                value={d.settings.teams}
                onChange={(e) => update((prev) => ({ ...prev, settings: { ...prev.settings, teams: Number(e.target.value) || 0 } }))}
              />
            </label>
            <label style={styles.settingLabel}>
              Budget/team
              <input
                style={styles.input}
                type="number"
                value={d.settings.budget}
                onChange={(e) => update((prev) => ({ ...prev, settings: { ...prev.settings, budget: Number(e.target.value) || 0 } }))}
              />
            </label>
            <label style={styles.settingLabel}>
              Roster size
              <input
                style={styles.input}
                type="number"
                value={d.settings.rosterSize}
                onChange={(e) => update((prev) => ({ ...prev, settings: { ...prev.settings, rosterSize: Number(e.target.value) || 0 } }))}
              />
            </label>
          </div>
          <button style={styles.dangerBtn} onClick={resetAll}>
            Reset this profile
          </button>
        </div>
      )}

      <div style={styles.tabs}>
        <button style={tab === "board" ? styles.tabActive : styles.tab} onClick={() => setTab("board")}>
          Board
        </button>
        <button style={tab === "strategy" ? styles.tabActive : styles.tab} onClick={() => setTab("strategy")}>
          Strategy
        </button>
        <button style={tab === "rankings" ? styles.tabActive : styles.tab} onClick={() => setTab("rankings")}>
          Rankings
        </button>
        <button style={tab === "drafters" ? styles.tabActive : styles.tab} onClick={() => setTab("drafters")}>
          Insights
        </button>
        <button style={tab === "offenses" ? styles.tabActive : styles.tab} onClick={() => setTab("offenses")}>
          Team Stats
        </button>
      </div>

      {tab === "board" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: "#8B92A0", flexShrink: 0 }}>Strategy</span>
            <select
              style={{ ...styles.select, flex: 1 }}
              value={d.activeStrategyId}
              onChange={(e) => selectStrategy(e.target.value)}
            >
              {d.strategies.map((s) => (
                <option key={s.id} value={s.id} style={{ background: "#1C2128", color: "#EDEEF0" }}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              style={{ ...styles.smallBtn, flexShrink: 0 }}
              title="Active ranking — change on the Rankings tab"
              onClick={() => setTab("rankings")}
            >
              Rks: {rankingLabel}
            </button>
          </div>

          <MarketReadPanel
            read={marketRead}
            recommendation={recommendation}
            activeStrategyId={d.activeStrategyId}
            activeStrategyName={activeStrategy?.name ?? ""}
            onSwitch={selectStrategy}
          />

          {endgameSuggested && (
            <div style={styles.endgameBanner}>
              <span>
                Budget&apos;s tight — {fmtMoney(board.myBudgetRemaining)} left for {board.mySlotsRemaining} slot
                {board.mySlotsRemaining === 1 ? "" : "s"}. Endgame mode narrows the board to your Love/Like players
                you can still afford.
              </span>
              <button style={styles.primaryBtn} onClick={() => setEndgameMode(true)}>
                Enable
              </button>
            </div>
          )}

          {endgameMode && (
            <div style={styles.endgameBannerActive}>
              <span>
                Endgame mode: Love/Like players ≤ {fmtMoney(endgameMaxBid)} (your max single bid holding $1 for
                every other open slot).
              </span>
              <button style={styles.smallBtn} onClick={() => setEndgameMode(false)}>
                Exit
              </button>
            </div>
          )}

          <div style={styles.controlsRow}>
            <input
              style={styles.searchInput}
              placeholder="Search players…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button style={styles.smallBtn} onClick={() => setShowAddPlayer((s) => !s)}>
              + Player
            </button>
          </div>

          {showAddPlayer && (
            <div style={styles.panel}>
              <div style={styles.panelTitle}>Add player not on board</div>
              <div style={styles.row}>
                <input
                  style={{ ...styles.input, flex: 1 }}
                  placeholder="Name"
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                />
                <select style={styles.select} value={addForm.pos} onChange={(e) => setAddForm((f) => ({ ...f, pos: e.target.value }))}>
                  {POSITIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <button style={styles.primaryBtn} onClick={addCustomPlayer}>
                  Add
                </button>
              </div>
            </div>
          )}

          <div style={styles.chipRow}>
            {["ALL", ...POSITIONS, "LIKED"].map((p) => (
              <button
                key={p}
                style={posFilter === p ? { ...styles.chip, ...chipActive(p) } : styles.chip}
                onClick={() => setPosFilter(p)}
              >
                {p === "LIKED" ? "♥ Liked" : p}
              </button>
            ))}
            {isPosFilter && (
              <button style={styles.smallBtn} onClick={() => addTierBar(posFilter)}>
                + Add tier
              </button>
            )}
            {isPosFilter && Object.prototype.hasOwnProperty.call(d.tierOverrides, posFilter) && (
              <button style={styles.smallBtn} onClick={() => resetTiers(posFilter)}>
                Reset {posFilter} tiers
              </button>
            )}
          </div>

          {isPosFilter && (
            <div style={{ fontSize: 11, color: "#8B92A0", marginBottom: 10 }}>
              Drag a tier bar to move players between tiers, or use the ✕ on a bar to remove it.
              {zoneSpans.length > 0 &&
                ` Brackets on the right mark your strategy's target range for each ${posFilter} slot.`}
            </div>
          )}

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th
                    style={{
                      ...styles.th,
                      ...styles.thSticky,
                      ...(boardDragEnabled ? styles.stickyDragCol1 : {}),
                      cursor: "pointer",
                      color: sortKey === "adp" ? "#EDEEF0" : "#8B92A0",
                    }}
                    onClick={() => setSortKey("adp")}
                  >
                    Rk{sortKey === "adp" ? " ▾" : ""}
                  </th>
                  <th style={{ ...styles.th, ...styles.thSticky2, ...(boardDragEnabled ? styles.stickyDragCol2 : {}) }}>
                    Player
                  </th>
                  <th
                    style={{ ...styles.th, cursor: "pointer", color: sortKey === "pos" ? "#EDEEF0" : "#8B92A0" }}
                    onClick={() => setSortKey("pos")}
                  >
                    Pos{sortKey === "pos" ? " ▾" : ""}
                  </th>
                  <th
                    style={{ ...styles.th, cursor: "pointer", color: sortKey === "tier" ? "#EDEEF0" : "#8B92A0" }}
                    onClick={() => setSortKey("tier")}
                  >
                    Tier{sortKey === "tier" ? " ▾" : ""}
                  </th>
                  <th
                    style={{ ...styles.th, cursor: "pointer", color: sortKey === "target" ? "#EDEEF0" : "#8B92A0" }}
                    onClick={() => setSortKey("target")}
                  >
                    Tgt{sortKey === "target" ? " ▾" : ""}
                  </th>
                  <th
                    style={{ ...styles.th, cursor: "pointer", color: sortKey === "live" ? "#EDEEF0" : "#8B92A0" }}
                    onClick={() => setSortKey("live")}
                  >
                    Live{sortKey === "live" ? " ▾" : ""}
                  </th>
                  <th style={styles.th}>Max</th>
                  <th style={styles.th}>Paid</th>
                  <th style={styles.th}>Status</th>
                  {zoneSpans.length > 0 && (
                    <th
                      colSpan={zoneSpans.length}
                      style={{ ...styles.th, padding: "8px 3px" }}
                      title="Target zones from your active strategy — one bracket per slot at this position"
                    >
                      Plan
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const breaks = isPosFilter ? board.tierBreaks[posFilter] || [] : [];
                  const posCount = isPosFilter ? board.positionCounts[posFilter] || 0 : 0;
                  return filteredRows.map((row, idx) => {
                    const prevRow = filteredRows[idx - 1];
                    const tierBreak = !!prevRow && prevRow.pos === row.pos && prevRow.tier !== row.tier && row.tier != null;
                    const breakIndex = isPosFilter && !row.isKeeper ? breaks.indexOf(row.effRank as number) : -1;
                    const zoneCells =
                      zoneSpans.length > 0
                        ? zoneSpans.map((z, zi) => {
                            const color = tierColor(zi + 1);
                            const within = idx >= z.start && idx <= z.end;
                            const isMid = idx === Math.floor((z.start + z.end) / 2);
                            return (
                              <td
                                key={z.slotId}
                                style={{
                                  padding: 0,
                                  border: "none",
                                  background: "#171A20",
                                  width: 17,
                                  minWidth: 17,
                                  position: "relative",
                                }}
                              >
                                {within && (
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: idx === z.start ? 4 : 0,
                                      bottom: idx === z.end ? 4 : 0,
                                      left: 3,
                                      right: 8,
                                      borderRight: `2px solid ${color}`,
                                      borderTop: idx === z.start ? `2px solid ${color}` : "none",
                                      borderBottom: idx === z.end ? `2px solid ${color}` : "none",
                                      borderTopRightRadius: idx === z.start ? 5 : 0,
                                      borderBottomRightRadius: idx === z.end ? 5 : 0,
                                    }}
                                  />
                                )}
                                {within && isMid && (
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: "50%",
                                      left: "50%",
                                      transform: "translate(-50%, -50%)",
                                      writingMode: "vertical-rl",
                                      fontFamily: "'IBM Plex Mono', monospace",
                                      fontSize: 9,
                                      fontWeight: 700,
                                      letterSpacing: "0.06em",
                                      textTransform: "uppercase",
                                      whiteSpace: "nowrap",
                                      color,
                                      background: "#171A20",
                                      padding: "3px 0",
                                      zIndex: 1,
                                    }}
                                    title={`${z.label} target zone — 5 players nearest the planned $${z.amount}`}
                                  >
                                    {z.label} ${z.amount}
                                  </div>
                                )}
                              </td>
                            );
                          })
                        : undefined;
                    return (
                      <Fragment key={row.id}>
                        <BoardRow
                          row={row}
                          tierBreak={tierBreak}
                          zoneCells={zoneCells}
                          isTarget={strategyTargets.targetIds.has(row.id)}
                          dragEnabled={boardDragEnabled}
                          dragging={boardDrag?.id === row.id}
                          dropEdge={dropEdgeStyle(boardDrag, row.id)}
                          onDragStart={startBoardDrag(row.id)}
                          onPaid={setPaid}
                          onMeta={setMeta}
                          onStatus={setStatus}
                          onRate={setInterest}
                          onKeeperCost={setKeeperCost}
                        />
                        {breakIndex !== -1 && (
                          <TierDivider
                            pos={posFilter}
                            colSpan={9 + zoneSpans.length}
                            index={breakIndex}
                            rank={breaks[breakIndex]}
                            lower={breakIndex > 0 ? breaks[breakIndex - 1] + 1 : 1}
                            upper={breakIndex < breaks.length - 1 ? breaks[breakIndex + 1] - 1 : posCount - 1}
                            breaks={breaks}
                            color={tierColor(row.tier)}
                            onChange={setTierBoundary}
                            onRemove={removeTierBar}
                          />
                        )}
                      </Fragment>
                    );
                  });
                })()}
              </tbody>
            </table>
            {filteredRows.length === 0 && <div style={styles.emptyState}>No players match.</div>}
          </div>
        </>
      )}

      {tab === "strategy" && (
        <StrategyTab
          strategies={d.strategies}
          activeStrategyId={d.activeStrategyId}
          setActiveStrategyId={selectStrategy}
          budget={d.settings.budget}
          boardRows={board.rows}
          onSlotPos={setSlotPos}
          onSlotAmount={setSlotAmount}
          onName={setStrategyName}
          onAdd={addStrategy}
          onDelete={deleteStrategy}
          onRate={setInterest}
          onStatus={setStatus}
          onKeeperCost={setKeeperCost}
        />
      )}

      {tab === "rankings" && (
        <RankingsTab
          players={basePlayers}
          rankedPlayers={allPlayers}
          sources={d.rankingSources}
          config={d.ranking}
          onConfig={setRankingConfig}
          onAddSource={addRankingSource}
          onRenameSource={renameRankingSource}
          onDeleteSource={deleteRankingSource}
        />
      )}

      {tab === "drafters" && <InsightsTab />}

      {tab === "offenses" && <OffensesTab rows={offenseRows} sort={offSort} setSort={setOffSort} />}

      <div style={styles.footer}>{saveState === "saving" ? "Saving…" : saveState === "error" ? "Save failed" : "Synced"}</div>
    </div>
  );
}
