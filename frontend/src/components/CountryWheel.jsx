import { useState, useEffect, useRef, useCallback } from "react";
import { flagEmoji } from "../utils/flags.js";

/**
 * CountryWheel — now a clean flat dropdown with flag emojis.
 * Supports keyboard navigation, search filtering, and click-outside close.
 *
 * Props:
 *   teams    string[]   — full sorted list of team names
 *   value    string     — currently selected team
 *   onChange (team) => void
 *   label    string     — optional label above the picker
 */
export default function CountryWheel({ teams, value, onChange, label }) {
  const [open, setOpen]         = useState(false);
  const [search, setSearch]     = useState("");
  const containerRef            = useRef(null);
  const searchRef               = useRef(null);
  const listRef                 = useRef(null);

  const filtered = search.trim()
    ? teams.filter((t) =>
        t.toLowerCase().includes(search.trim().toLowerCase())
      )
    : teams;

  /* ── Close on outside click ─────────────────────────────────── */
  useEffect(() => {
    function handler(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Auto-focus search when opening ────────────────────────── */
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 40);
      /* Scroll selected item into view */
      setTimeout(() => {
        const el = listRef.current?.querySelector("[aria-selected='true']");
        el?.scrollIntoView({ block: "center" });
      }, 60);
    } else {
      setSearch("");
    }
  }, [open]);

  /* ── Keyboard: close on Escape ─────────────────────────────── */
  const onKeyDown = (e) => {
    if (e.key === "Escape") { setOpen(false); setSearch(""); }
  };

  const select = useCallback(
    (team) => {
      onChange(team);
      setOpen(false);
      setSearch("");
    },
    [onChange]
  );

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-1.5 relative"
      onKeyDown={onKeyDown}
    >
      {/* ── Label ──────────────────────────────────────────────── */}
      {label && (
        <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-muted">
          {label}
        </span>
      )}

      {/* ── Trigger button ─────────────────────────────────────── */}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "11px 14px",
          background: open
            ? "rgba(245,197,24,0.08)"
            : "rgba(13,27,46,0.75)",
          border: `1px solid ${open ? "rgba(245,197,24,0.5)" : "rgba(245,197,24,0.18)"}`,
          borderRadius: 10,
          cursor: "pointer",
          width: "100%",
          color: "#e8edf5",
          fontFamily: '"Inter", sans-serif',
          fontSize: 14,
          fontWeight: 500,
          transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
          boxShadow: open ? "0 0 0 3px rgba(245,197,24,0.12)" : "none",
          outline: "none",
          textAlign: "left",
        }}
      >
        {/* Flag */}
        <span style={{ fontSize: "1.35rem", lineHeight: 1, flexShrink: 0 }}>
          {flagEmoji(value)}
        </span>
        {/* Name */}
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value || "Select team…"}
        </span>
        {/* Chevron */}
        <span
          style={{
            color: "#f5c518",
            fontSize: 11,
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
          }}
        >
          ▼
        </span>
      </button>

      {/* ── Dropdown panel ─────────────────────────────────────── */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 50,
            background: "rgba(11,22,40,0.97)",
            border: "1px solid rgba(245,197,24,0.25)",
            borderRadius: 12,
            boxShadow: "0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,197,24,0.06)",
            backdropFilter: "blur(16px)",
            animation: "reveal-up 0.15s ease-out",
            overflow: "hidden",
          }}
        >
          {/* Search input */}
          <div style={{ padding: "10px 10px 6px" }}>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search team…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "rgba(13,27,46,0.8)",
                border: "1px solid rgba(245,197,24,0.2)",
                borderRadius: 8,
                color: "#e8edf5",
                fontFamily: '"Inter", sans-serif',
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Scrollable list */}
          <ul
            ref={listRef}
            role="listbox"
            aria-label={label}
            style={{
              listStyle: "none",
              margin: 0,
              padding: "4px 6px 8px",
              maxHeight: 240,
              overflowY: "auto",
              scrollbarWidth: "thin",
              scrollbarColor: "#f5c518 #0d1b2e",
            }}
          >
            {filtered.length === 0 && (
              <li
                style={{
                  padding: "10px 12px",
                  fontFamily: '"Space Mono", monospace',
                  fontSize: 12,
                  color: "#8ba3c2",
                  textAlign: "center",
                }}
              >
                No teams found
              </li>
            )}
            {filtered.map((team) => {
              const isSelected = team === value;
              return (
                <li
                  key={team}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => select(team)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 7,
                    cursor: "pointer",
                    background: isSelected
                      ? "rgba(245,197,24,0.12)"
                      : "transparent",
                    borderLeft: isSelected
                      ? "2px solid #f5c518"
                      : "2px solid transparent",
                    color: isSelected ? "#f5c518" : "#e8edf5",
                    fontFamily: '"Inter", sans-serif',
                    fontSize: 13,
                    fontWeight: isSelected ? 600 : 400,
                    transition: "background 0.1s",
                    userSelect: "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "rgba(245,197,24,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span style={{ fontSize: "1.2rem", lineHeight: 1, flexShrink: 0 }}>
                    {flagEmoji(team)}
                  </span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {team}
                  </span>
                  {isSelected && (
                    <span style={{ marginLeft: "auto", fontSize: 12, color: "#f5c518" }}>✓</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
