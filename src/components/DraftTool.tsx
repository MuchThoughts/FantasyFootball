"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PLAYERS_DATA } from "@/lib/data/players";
import { DRAFTERS_DATA } from "@/lib/data/drafters";
import { OFFENSE_DATA } from "@/lib/data/offense";
import { DEFAULT_STRATEGIES } from "@/lib/data/strategies";
import {
  BoardRow as BoardRowType,
  computeBoard,
  computeStrategySlots,
  computeStrategyTargets,
  fmtMoney,
  fmtPct,
  POSITIONS,
  suggestSlotAmount,
  tierColor,
} from "@/lib/draftLogic";
import { useProfiles } from "@/hooks/useProfiles";
import { defaultDraftData, useDraftState } from "@/hooks/useDraftState";
import { styles, fontImport, chipActive } from "./styles";
import { ProfileBar } from "./ProfileBar";
import { BoardRow } from "./BoardRow";
import { TierDivider } from "./TierDivider";
import { StrategyTab } from "./StrategyTab";
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

  const [tab, setTab] = useState<"board" | "strategy" | "drafters" | "offenses">("board");
  const [posFilter, setPosFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("adp");
  const [showSettings, setShowSettings] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", pos: "RB" });
  const [offSort, setOffSort] = useState("ppg25");
  const [endgameMode, setEndgameMode] = useState(false);

  const d = data ?? defaultDraftData();

  const allPlayers = useMemo(() => [...PLAYERS_DATA, ...d.customPlayers], [d.customPlayers]);

  const board = useMemo(
    () => computeBoard(d.settings, d.keepers, d.drafted, allPlayers, d.playerMeta, d.tierOverrides),
    [d.settings, d.keepers, d.drafted, allPlayers, d.playerMeta, d.tierOverrides]
  );

  const activeStrategy = useMemo(
    () => d.strategies.find((s) => s.id === d.activeStrategyId) || d.strategies[0],
    [d.strategies, d.activeStrategyId]
  );

  const strategySlots = useMemo(() => computeStrategySlots(activeStrategy), [activeStrategy]);
  const strategyTargets = useMemo(() => computeStrategyTargets(board, strategySlots), [board, strategySlots]);

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

  const drafterRows = useMemo(() => Object.entries(DRAFTERS_DATA).map(([team, dd]) => ({ team, ...dd })), []);

  const endgameMaxBid = Math.max(board.myBudgetRemaining - Math.max(board.mySlotsRemaining - 1, 0), 0);
  const endgameSuggested = board.mySlotsRemaining > 0 && board.myBudgetRemaining <= board.mySlotsRemaining && !endgameMode;

  const filteredRows = useMemo(() => {
    let r = board.rows;
    if (endgameMode) {
      r = r.filter(
        (x) => !x.isDrafted && !x.isKeeper && (x.interest === "love" || x.interest === "like") && (x.live ?? Infinity) <= endgameMaxBid
      );
    }
    if (posFilter !== "ALL") r = r.filter((x) => x.pos === posFilter);
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

  const setStatus = useCallback(
    (row: BoardRowType, value: string) => {
      const wantsKeeper = value === "keeper" || value === "keeper-mine";
      const wantsMine = value === "mine" || value === "keeper-mine";
      update((prev) => {
        if (wantsKeeper) {
          const nextKeepers = {
            ...prev.keepers,
            [row.id]: { name: row.name, pos: row.pos, cost: prev.keepers[row.id]?.cost ?? "", mine: wantsMine },
          };
          const nextDrafted = { ...prev.drafted };
          delete nextDrafted[row.id];
          return { ...prev, keepers: nextKeepers, drafted: nextDrafted };
        }
        const nextKeepers = { ...prev.keepers };
        delete nextKeepers[row.id];
        const nextDrafted = {
          ...prev.drafted,
          [row.id]: { price: prev.drafted[row.id] ? prev.drafted[row.id].price : "", mine: wantsMine },
        };
        return { ...prev, keepers: nextKeepers, drafted: nextDrafted };
      });
    },
    [update]
  );

  const setMeta = useCallback(
    (id: string, field: "max" | "interest", value: string) => {
      update((prev) => ({
        ...prev,
        playerMeta: { ...prev.playerMeta, [id]: { ...prev.playerMeta[id], [field]: value } },
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
        const base = prev.tierOverrides[pos] && prev.tierOverrides[pos].length ? prev.tierOverrides[pos] : currentBreaks;
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
      update((prev) => {
        const next = prev.strategies.filter((s) => s.id !== id);
        const strategies = next.length ? next : DEFAULT_STRATEGIES;
        return { ...prev, strategies, activeStrategyId: prev.activeStrategyId === id ? "preset-balanced" : prev.activeStrategyId };
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

  const inflationColor = board.inflation > 1.08 ? "#E1524B" : board.inflation < 0.92 ? "#4CAF6B" : "#E8A33D";
  const paceColor = board.paceDelta > 5 ? "#E1524B" : board.paceDelta < -5 ? "#4CAF6B" : "#EDEEF0";

  return (
    <div style={styles.app}>
      <style>{fontImport}</style>

      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>AUCTION WAR ROOM — 2026</div>
          <div style={styles.title}>Superflex Cheat Sheet</div>
        </div>
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

      <div style={styles.dashboard}>
        <div style={styles.statBlock}>
          <div style={styles.statLabel}>Pool left</div>
          <div style={styles.statValue}>{fmtMoney(board.remainingPool)}</div>
          <div style={styles.statSub}>of {fmtMoney(board.availablePool)}</div>
        </div>
        <div style={styles.statBlock}>
          <div style={styles.statLabel}>Inflation</div>
          <div style={{ ...styles.statValue, color: inflationColor }}>{fmtPct(board.inflation - 1)}</div>
          <div style={styles.statSub}>vs. target prices</div>
        </div>
        <div style={styles.statBlock}>
          <div style={styles.statLabel}>My budget</div>
          <div style={styles.statValue}>{fmtMoney(board.myBudgetRemaining)}</div>
          <div style={styles.statSub}>{board.mySlotsRemaining} slots left</div>
        </div>
        <div style={styles.statBlock}>
          <div style={styles.statLabel}>My pace</div>
          <div style={{ ...styles.statValue, color: paceColor }}>{board.myDrafted.length > 0 ? fmtMoney(board.paceDelta) : "—"}</div>
          <div style={styles.statSub}>{board.myDrafted.length > 0 ? "vs. target" : "no picks yet"}</div>
        </div>
      </div>

      <div style={styles.tabs}>
        <button style={tab === "board" ? styles.tabActive : styles.tab} onClick={() => setTab("board")}>
          Board
        </button>
        <button style={tab === "strategy" ? styles.tabActive : styles.tab} onClick={() => setTab("strategy")}>
          Strategy
        </button>
        <button style={tab === "drafters" ? styles.tabActive : styles.tab} onClick={() => setTab("drafters")}>
          Insights
        </button>
        <button style={tab === "offenses" ? styles.tabActive : styles.tab} onClick={() => setTab("offenses")}>
          Offenses
        </button>
      </div>

      {tab === "board" && (
        <>
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
            {["ALL", ...POSITIONS].map((p) => (
              <button
                key={p}
                style={posFilter === p ? { ...styles.chip, ...chipActive(p) } : styles.chip}
                onClick={() => setPosFilter(p)}
              >
                {p}
              </button>
            ))}
            {posFilter !== "ALL" && d.tierOverrides[posFilter] && d.tierOverrides[posFilter].length > 0 && (
              <button style={styles.smallBtn} onClick={() => resetTiers(posFilter)}>
                Reset {posFilter} tiers
              </button>
            )}
          </div>

          {posFilter !== "ALL" && (
            <div style={{ fontSize: 11, color: "#8B92A0", marginBottom: 10 }}>
              Drag a tier bar up or down to move players between tiers.
            </div>
          )}

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th
                    style={{ ...styles.th, ...styles.thSticky, cursor: "pointer", color: sortKey === "adp" ? "#EDEEF0" : "#8B92A0" }}
                    onClick={() => setSortKey("adp")}
                  >
                    Rank{sortKey === "adp" ? " ▾" : ""}
                  </th>
                  <th style={{ ...styles.th, ...styles.thSticky2 }}>Player</th>
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
                  <th style={styles.th}>Interest</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const breaks = posFilter !== "ALL" ? board.tierBreaks[posFilter] || [] : [];
                  const posCount = posFilter !== "ALL" ? board.positionCounts[posFilter] || 0 : 0;
                  return filteredRows.map((row, idx) => {
                    const prevRow = filteredRows[idx - 1];
                    const tierBreak = !!prevRow && prevRow.pos === row.pos && prevRow.tier !== row.tier && row.tier != null;
                    const breakIndex = posFilter !== "ALL" && !row.isKeeper ? breaks.indexOf(row.effRank as number) : -1;
                    return (
                      <Fragment key={row.id}>
                        <BoardRow
                          row={row}
                          tierBreak={tierBreak}
                          isTarget={strategyTargets.targetIds.has(row.id)}
                          onPaid={setPaid}
                          onMeta={setMeta}
                          onStatus={setStatus}
                          onKeeperCost={setKeeperCost}
                        />
                        {breakIndex !== -1 && (
                          <TierDivider
                            pos={posFilter}
                            index={breakIndex}
                            rank={breaks[breakIndex]}
                            lower={breakIndex > 0 ? breaks[breakIndex - 1] + 1 : 1}
                            upper={breakIndex < breaks.length - 1 ? breaks[breakIndex + 1] - 1 : posCount - 1}
                            breaks={breaks}
                            color={tierColor(row.tier)}
                            onChange={setTierBoundary}
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
          setActiveStrategyId={(id) => update((prev) => ({ ...prev, activeStrategyId: id }))}
          budget={d.settings.budget}
          boardRows={board.rows}
          onSlotPos={setSlotPos}
          onSlotAmount={setSlotAmount}
          onName={setStrategyName}
          onAdd={addStrategy}
          onDelete={deleteStrategy}
        />
      )}

      {tab === "drafters" && <InsightsTab rows={drafterRows} />}

      {tab === "offenses" && <OffensesTab rows={offenseRows} sort={offSort} setSort={setOffSort} />}

      <div style={styles.footer}>{saveState === "saving" ? "Saving…" : saveState === "error" ? "Save failed" : "Synced"}</div>
    </div>
  );
}
