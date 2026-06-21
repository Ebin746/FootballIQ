import { useState, useEffect, useRef, useCallback } from "react";
import { isoCode } from "../utils/flags.js";

/* ── Flag image from flagcdn.com ─────────────────────────────────────── */
function FlagImg({ team, size = 24 }) {
  const iso = isoCode(team);
  if (!iso) return <span style={{ fontSize: size * 0.7, opacity: 0.4 }}>🏳</span>;
  return (
    <img
      src={`https://flagcdn.com/w40/${iso.toLowerCase()}.png`}
      alt={team || ""}
      width={Math.round(size * 1.4)}
      height={size}
      style={{ objectFit: "cover", borderRadius: 3, flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.45)" }}
      onError={(e) => { e.currentTarget.style.display = "none"; }}
    />
  );
}

/**
 * CountryWheel — searchable dropdown with flag images.
 *
 * Closing strategy: onBlur on the wrapper div.
 * The dropdown uses onMouseDown={e.preventDefault()} so clicking inside it
 * does NOT move focus away from the wrapper — blurring only happens when
 * the user clicks completely outside.
 *
 * This avoids all mousedown-vs-click race conditions.
 */
export default function CountryWheel({ teams, value, onChange, label }) {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef  = useRef(null);
  const searchRef = useRef(null);
  const listRef   = useRef(null);

  const filtered = search.trim()
    ? teams.filter((t) => t.toLowerCase().includes(search.trim().toLowerCase()))
    : teams;

  /* ── Open/close ─────────────────────────────────────────────── */
  const openDropdown = useCallback(() => {
    setOpen(true);
  }, []);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setSearch("");
  }, []);

  /* ── Focus search + scroll to selected when opening ──────────── */
  useEffect(() => {
    if (!open) return;
    // preventScroll prevents the browser from scrolling the page to a
    // fixed-position element when it receives focus
    const t1 = setTimeout(() => searchRef.current?.focus({ preventScroll: true }), 30);
    const t2 = setTimeout(() => {
      listRef.current?.querySelector("[aria-selected='true']")?.scrollIntoView({ block: "nearest" });
    }, 60);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [open]);

  /* ── Select a team ───────────────────────────────────────────── */
  const select = useCallback(
    (team) => {
      onChange(team);
      setOpen(false);
      setSearch("");
      // Return focus to the wrapper so keyboard users stay in context
      wrapRef.current?.focus();
    },
    [onChange]
  );

  /* ── Keyboard: Escape closes ─────────────────────────────────── */
  const onKeyDown = (e) => {
    if (e.key === "Escape") { closeDropdown(); wrapRef.current?.focus(); }
  };

  /* ── onBlur: close when focus leaves the entire wrapper ─────── */
  const onBlur = (e) => {
    // relatedTarget = the element receiving focus next.
    // If it's still inside our wrapper, don't close.
    if (wrapRef.current && wrapRef.current.contains(e.relatedTarget)) return;
    closeDropdown();
  };

  return (
    <div
      ref={wrapRef}
      tabIndex={-1}           /* makes div focusable so onBlur works */
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      style={{ position: "relative", outline: "none" }}
    >
      {/* ── Label ──────────────────────────────────────────────── */}
      {label && (
        <span
          style={{
            display: "block",
            fontFamily: '"Space Mono", monospace',
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#8ba3c2",
            marginBottom: 6,
          }}
        >
          {label}
        </span>
      )}

      {/* ── Trigger button ─────────────────────────────────────── */}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        tabIndex={0}
        onClick={() => (open ? closeDropdown() : openDropdown())}
        style={{
          display:      "flex",
          alignItems:   "center",
          gap:          10,
          padding:      "11px 14px",
          background:   open ? "rgba(245,197,24,0.10)" : "rgba(13,27,46,0.85)",
          border:       `1px solid ${open ? "rgba(245,197,24,0.55)" : "rgba(245,197,24,0.2)"}`,
          borderRadius: 10,
          cursor:       "pointer",
          width:        "100%",
          color:        "#e8edf5",
          fontFamily:   '"Inter", sans-serif',
          fontSize:     14,
          fontWeight:   500,
          transition:   "border-color 0.15s, background 0.15s, box-shadow 0.15s",
          boxShadow:    open ? "0 0 0 3px rgba(245,197,24,0.12)" : "none",
          outline:      "none",
          textAlign:    "left",
        }}
      >
        <FlagImg team={value} size={22} />
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value || "Select team…"}
        </span>
        <span
          style={{
            color:      "#f5c518",
            fontSize:   11,
            flexShrink: 0,
            transform:  open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
          }}
        >
          ▼
        </span>
      </button>

      {/* ── Dropdown panel ─────────────────────────────────────── */}
      {open && (
        <div
          role="listbox"
          aria-label={label}
          /* !! KEY: preventDefault on mousedown prevents the wrapper div from
             losing focus when the user clicks inside the dropdown. Without this,
             clicking a list item would blur the wrapper → onBlur fires →
             closeDropdown() → item disappears before onClick fires. !! */
          onMouseDown={(e) => e.preventDefault()}
          style={{
            position:     "absolute",
            top:          "calc(100% + 6px)",
            left:         0,
            right:        0,
            zIndex:       9999,
            background:   "rgba(8,18,34,0.98)",
            border:       "1px solid rgba(245,197,24,0.28)",
            borderRadius: 12,
            boxShadow:    "0 20px 60px rgba(0,0,0,0.7)",
            overflow:     "hidden",
            animation:    "reveal-up 0.15s ease-out",
          }}
        >
          {/* Search */}
          <div style={{ padding: "10px 10px 6px" }}>
            <input
              ref={searchRef}
              type="text"
              placeholder="🔍  Search team…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width:        "100%",
                padding:      "8px 12px",
                background:   "rgba(13,27,46,0.9)",
                border:       "1px solid rgba(245,197,24,0.2)",
                borderRadius: 8,
                color:        "#e8edf5",
                fontFamily:   '"Inter", sans-serif',
                fontSize:     13,
                outline:      "none",
                boxSizing:    "border-box",
              }}
            />
          </div>

          {/* List */}
          <ul
            ref={listRef}
            style={{
              listStyle:      "none",
              margin:         0,
              padding:        "4px 6px 8px",
              maxHeight:      220,
              overflowY:      "auto",
              scrollbarWidth: "thin",
              scrollbarColor: "#f5c518 #0d1b2e",
            }}
          >
            {filtered.length === 0 && (
              <li style={{ padding: "10px 12px", fontFamily: '"Space Mono", monospace', fontSize: 12, color: "#8ba3c2", textAlign: "center" }}>
                No teams found
              </li>
            )}

            {filtered.map((team) => {
              const isSel = team === value;
              return (
                <li
                  key={team}
                  role="option"
                  aria-selected={isSel}
                  onClick={() => select(team)}
                  style={{
                    display:      "flex",
                    alignItems:   "center",
                    gap:          10,
                    padding:      "7px 10px",
                    borderRadius: 7,
                    cursor:       "pointer",
                    background:   isSel ? "rgba(245,197,24,0.13)" : "transparent",
                    borderLeft:   isSel ? "2px solid #f5c518" : "2px solid transparent",
                    color:        isSel ? "#f5c518" : "#e8edf5",
                    fontFamily:   '"Inter", sans-serif',
                    fontSize:     13,
                    fontWeight:   isSel ? 600 : 400,
                    userSelect:   "none",
                    transition:   "background 0.1s",
                  }}
                  onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = "rgba(245,197,24,0.07)"; }}
                  onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                >
                  <FlagImg team={team} size={20} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {team}
                  </span>
                  {isSel && <span style={{ marginLeft: "auto", fontSize: 12, color: "#f5c518" }}>✓</span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
