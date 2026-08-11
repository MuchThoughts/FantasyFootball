"use client";

import { useMemo, useRef, useState } from "react";
import { Player } from "@/lib/data/players";
import {
  BUILTIN_SOURCE_ID,
  ParsedRanking,
  RankingConfig,
  RankingSource,
  allSources,
  blendWeight,
  parseRankingUpload,
} from "@/lib/rankings";
import { POS_COLOR, uid } from "@/lib/draftLogic";
import { dropEdgeStyle, dropRank, useRowDrag } from "@/hooks/useRowDrag";
import { DragHandle } from "./DragHandle";
import { styles, chipActive } from "./styles";

interface RankingsTabProps {
  players: Player[]; // base pool (built-in + custom), pre-ranking
  rankedPlayers: Player[]; // pool with the active ranking applied (adp = effective rank)
  sources: RankingSource[]; // uploaded sources only
  config: RankingConfig;
  onConfig: (updater: (prev: RankingConfig) => RankingConfig) => void;
  onAddSource: (source: RankingSource) => void;
  onRenameSource: (id: string, name: string) => void;
  onDeleteSource: (id: string) => void;
}

export function RankingsTab({
  players,
  rankedPlayers,
  sources,
  config,
  onConfig,
  onAddSource,
  onRenameSource,
  onDeleteSource,
}: RankingsTabProps) {
  const [uploadName, setUploadName] = useState("");
  const [uploadText, setUploadText] = useState("");
  const [uploadResult, setUploadResult] = useState<ParsedRanking | null>(null);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const selectable = useMemo(() => allSources(players, sources), [players, sources]);
  const activeSource = config.mode === "source" ? selectable.find((s) => s.id === config.activeSourceId) : undefined;
  const overrideCount = Object.keys(config.overrides).length;

  // Dropping a row pins that player at the drop position (an override on top
  // of the active source/blend). Ranks come from the effective order (adp).
  const effRank = useMemo(() => {
    const m = new Map<string, number>();
    rankedPlayers.forEach((p) => m.set(uid(p.name), p.adp));
    return m;
  }, [rankedPlayers]);

  const { drag, startDrag } = useRowDrag((dragId, overId, after) => {
    const draggedRank = effRank.get(dragId);
    const targetRank = effRank.get(overId);
    if (draggedRank === undefined || targetRank === undefined) return;
    const rank = dropRank(draggedRank, targetRank, after);
    onConfig((prev) => ({ ...prev, overrides: { ...prev.overrides, [dragId]: rank } }));
  });

  const doImport = () => {
    const parsed = parseRankingUpload(uploadText, players);
    setUploadResult(parsed);
    if (parsed.matched === 0) return;
    const name = uploadName.trim() || `Rankings ${sources.length + 1}`;
    const hasTiers = Object.keys(parsed.tiers).length > 0;
    onAddSource({
      id: "src-" + Date.now(),
      name,
      createdAt: new Date().toISOString(),
      ranks: parsed.ranks,
      ...(hasTiers ? { tiers: parsed.tiers } : {}),
    });
    setUploadName("");
    setUploadText("");
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    setUploadText(text);
    if (!uploadName.trim()) setUploadName(file.name.replace(/\.(csv|tsv|txt)$/i, ""));
  };

  const editorRows = useMemo(() => {
    const s = search.trim().toLowerCase();
    const rows = s ? rankedPlayers.filter((p) => p.name.toLowerCase().includes(s)) : rankedPlayers;
    return rows;
  }, [rankedPlayers, search]);

  return (
    <div>
      {/* ---- source picker ---- */}
      <div style={styles.panel}>
        <div style={styles.panelTitle}>Active ranking</div>
        <div style={styles.chipRow}>
          {selectable.map((s) => {
            const active = config.mode === "source" && config.activeSourceId === s.id;
            return (
              <button
                key={s.id}
                style={active ? { ...styles.chip, ...chipActive("ALL") } : styles.chip}
                onClick={() => onConfig((prev) => ({ ...prev, mode: "source", activeSourceId: s.id }))}
              >
                {s.name}
              </button>
            );
          })}
          <button
            style={config.mode === "blend" ? { ...styles.chip, ...chipActive("ALL") } : styles.chip}
            onClick={() => onConfig((prev) => ({ ...prev, mode: "blend" }))}
            disabled={sources.length === 0}
            title={sources.length === 0 ? "Upload at least one ranking to blend" : "Weighted average of the sources below"}
          >
            ⚖ Blend
          </button>
        </div>

        {activeSource && activeSource.id !== BUILTIN_SOURCE_ID && (
          <div style={{ ...styles.row, marginTop: 8 }}>
            <input
              style={{ ...styles.input, flex: 1 }}
              value={activeSource.name}
              onChange={(e) => onRenameSource(activeSource.id, e.target.value)}
            />
            <button
              style={{ ...styles.dangerBtn, width: "auto", flexShrink: 0 }}
              onClick={() => onDeleteSource(activeSource.id)}
            >
              Delete
            </button>
          </div>
        )}

        {config.mode === "blend" && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, color: "#8B92A0", marginBottom: 6 }}>
              Blend weights — each player&apos;s rank is the weighted average across sources (missing from a list counts
              as just past its bottom). Set 0 to leave a source out.
            </div>
            {(() => {
              const total = selectable.reduce((sum, s) => sum + blendWeight(config, s.id), 0);
              return selectable.map((s) => {
                const w = blendWeight(config, s.id);
                return (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <input
                      style={{ ...styles.cellInput, width: 52 }}
                      type="number"
                      min={0}
                      step={1}
                      value={w}
                      onChange={(e) =>
                        onConfig((prev) => ({
                          ...prev,
                          weights: { ...prev.weights, [s.id]: Math.max(Number(e.target.value) || 0, 0) },
                        }))
                      }
                    />
                    <span style={{ fontSize: 12, color: "#C9CCD2", flex: 1 }}>{s.name}</span>
                    <span style={{ fontSize: 11, color: "#8B92A0" }}>{total > 0 ? Math.round((100 * w) / total) : 0}%</span>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* ---- upload ---- */}
      <div style={styles.panel}>
        <div style={styles.panelTitle}>Upload rankings</div>
        <div style={{ fontSize: 11, color: "#8B92A0", marginBottom: 8 }}>
          Paste a list (one player per line, or CSV/TSV with a rank column — extra columns like team/position are fine)
          or choose a file. Names are matched to the board automatically.
        </div>
        <div style={styles.row}>
          <input
            style={{ ...styles.input, flex: 1 }}
            placeholder="Source name (e.g. FantasyPros, Underdog ADP)"
            value={uploadName}
            onChange={(e) => setUploadName(e.target.value)}
          />
          <button style={styles.smallBtn} onClick={() => fileRef.current?.click()}>
            Choose file…
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.tsv,.txt"
            style={{ display: "none" }}
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
        <textarea
          style={{ ...styles.input, width: "100%", minHeight: 110, resize: "vertical", fontFamily: "inherit", marginBottom: 8 }}
          placeholder={"1, Josh Allen\n2, Bijan Robinson\n3, Ja'Marr Chase\n…"}
          value={uploadText}
          onChange={(e) => setUploadText(e.target.value)}
        />
        <div style={styles.row}>
          <button style={styles.primaryBtn} onClick={doImport} disabled={!uploadText.trim()}>
            Import as new source
          </button>
        </div>
        {uploadResult && (
          <div style={{ fontSize: 12, marginTop: 8, color: uploadResult.matched > 0 ? "#4CAF6B" : "#E1524B" }}>
            {uploadResult.matched > 0
              ? `Imported — matched ${uploadResult.matched} player${uploadResult.matched === 1 ? "" : "s"}.`
              : "No players matched — check the format."}
            {uploadResult.unmatched.length > 0 && (
              <div style={{ color: "#E8A33D", marginTop: 4 }}>
                {uploadResult.unmatched.length} unmatched: {uploadResult.unmatched.slice(0, 10).join(", ")}
                {uploadResult.unmatched.length > 10 ? ` +${uploadResult.unmatched.length - 10} more` : ""}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---- manual edits / current order ---- */}
      <div style={styles.panel}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ ...styles.panelTitle, marginBottom: 0 }}>
            Current order{config.mode === "blend" ? " (blend)" : activeSource ? ` (${activeSource.name})` : ""}
          </div>
          {overrideCount > 0 && (
            <button style={styles.smallBtn} onClick={() => onConfig((prev) => ({ ...prev, overrides: {} }))}>
              Clear {overrideCount} manual edit{overrideCount === 1 ? "" : "s"}
            </button>
          )}
        </div>
        <div style={{ fontSize: 11, color: "#8B92A0", marginBottom: 8 }}>
          Drag the ⠿ handle to move a player up or down — dropping pins them to that spot. Pins stay on top of
          whichever source or blend is active; use the ✕ to unpin one.
        </div>
        <input
          style={{ ...styles.searchInput, marginBottom: 8 }}
          placeholder="Search players…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: 24 }}></th>
                <th style={styles.th}>Rk</th>
                <th style={{ ...styles.th, textAlign: "left" }}>Player</th>
                <th style={styles.th}>Pos</th>
                {selectable.map((s) => (
                  <th key={s.id} style={styles.th} title={s.name}>
                    {s.id === BUILTIN_SOURCE_ID ? "ADP" : s.name.length > 10 ? s.name.slice(0, 9) + "…" : s.name}
                  </th>
                ))}
                <th style={styles.th}>Pin</th>
              </tr>
            </thead>
            <tbody>
              {editorRows.map((p) => {
                const id = uid(p.name);
                const override = config.overrides[id] ?? null;
                const edge = dropEdgeStyle(drag, id);
                const rowStyle: React.CSSProperties = {
                  ...(override != null ? { background: "rgba(232, 163, 61, 0.07)" } : {}),
                  ...(drag?.id === id ? { opacity: 0.35 } : {}),
                };
                return (
                  <tr key={id} data-dragid={id} style={rowStyle}>
                    <td style={{ ...styles.td, ...edge, padding: 0 }}>
                      <DragHandle onPointerDown={startDrag(id)} dragging={drag?.id === id} />
                    </td>
                    <td style={{ ...styles.td, ...styles.tdMono, ...edge }}>{p.adp}</td>
                    <td style={{ ...styles.td, ...edge, textAlign: "left" }}>
                      <span style={{ fontSize: 12 }}>{p.name}</span>{" "}
                      <span style={{ fontSize: 10, color: "#8B92A0" }}>{p.team}</span>
                    </td>
                    <td style={{ ...styles.td, ...edge }}>
                      <span style={{ ...styles.posTagSm, background: POS_COLOR[p.pos] }}>{p.pos}</span>
                    </td>
                    {selectable.map((s) => (
                      <td key={s.id} style={{ ...styles.td, ...styles.tdMono, ...edge, color: "#8B92A0" }}>
                        {s.ranks[id] ?? "—"}
                      </td>
                    ))}
                    <td style={{ ...styles.td, ...edge }}>
                      {override != null && (
                        <button
                          title={`Pinned to #${override} — click to unpin`}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#E8A33D",
                            cursor: "pointer",
                            fontSize: 11,
                            padding: "2px 6px",
                          }}
                          onClick={() =>
                            onConfig((prev) => {
                              const overrides = { ...prev.overrides };
                              delete overrides[id];
                              return { ...prev, overrides };
                            })
                          }
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {editorRows.length === 0 && <div style={styles.emptyState}>No players match.</div>}
        </div>
      </div>
    </div>
  );
}
