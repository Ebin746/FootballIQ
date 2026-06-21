import { useEffect, useRef, useState } from "react";
import { isoCode } from "../utils/flags.js";

/* Inline flag image using flagcdn.com */
function FlagImg({ team, size = 18 }) {
  const iso = isoCode(team);
  if (!iso) return <span style={{ opacity: 0.4, fontSize: size }}>🏳</span>;
  return (
    <img
      src={`https://flagcdn.com/w40/${iso.toLowerCase()}.png`}
      alt={team || ""}
      width={size * 1.4}
      height={size}
      style={{ objectFit: "cover", borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.5)", flexShrink: 0 }}
      onError={(e) => { e.currentTarget.style.display = "none"; }}
    />
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Layout constants (all in px — matches absolute positioning below)
   ────────────────────────────────────────────────────────────────────────── */
const CARD_W  = 188;   // match card width
const CARD_H  = 90;    // match card height
const COL_GAP = 50;    // horizontal gap between columns
const ROW_SLT = 142;   // vertical slot height per QF match
const CHAMP_W = 190;   // champion display width

// Column left-edge x positions
const QF_X    = 0;
const SF_X    = CARD_W + COL_GAP;                 // 238
const FIN_X   = SF_X  + CARD_W + COL_GAP;         // 476
const CHAMP_X = FIN_X + CARD_W + COL_GAP;         // 714

// QF match vertical centers (4 matches × ROW_SLT)
const QF_CY  = [0, 1, 2, 3].map((i) => ROW_SLT * i + ROW_SLT / 2);
// → [71, 213, 355, 497]

// SF centers = average of corresponding QF pair
const SF_CY  = [
  (QF_CY[0] + QF_CY[1]) / 2,   // 142
  (QF_CY[2] + QF_CY[3]) / 2,   // 426
];

// Final center = average of SF pair
const FIN_CY = (SF_CY[0] + SF_CY[1]) / 2;  // 284

// Champion center = same as Final center
const CHAMP_CY = FIN_CY;

const BRACKET_H = ROW_SLT * 4;   // 568 px
const BRACKET_W = CHAMP_X + CHAMP_W + 8; // total svg width

/* ──────────────────────────────────────────────────────────────────────────
   Helper: probability split for a match (A vs B)
   ────────────────────────────────────────────────────────────────────────── */
function matchProb(a, b) {
  if (!a || !b) return { aWin: 50, bWin: 50 };
  const sum = (a.win_pct || 0) + (b.win_pct || 0);
  if (!sum) return { aWin: 50, bWin: 50 };
  return {
    aWin: +((a.win_pct / sum) * 100).toFixed(1),
    bWin: +((b.win_pct / sum) * 100).toFixed(1),
  };
}

function winner(a, b) {
  if (!a) return b;
  if (!b) return a;
  return a.win_pct >= b.win_pct ? a : b;
}

/* ──────────────────────────────────────────────────────────────────────────
   MatchCard
   ────────────────────────────────────────────────────────────────────────── */
function MatchCard({ teamA, teamB, round, delay = 0, isChampMatch = false }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const { aWin, bWin } = matchProb(teamA, teamB);
  const w = winner(teamA, teamB);

  const rowStyle = (team, isWinner) => ({
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "7px 10px",
    borderRadius: 6,
    background: isWinner
      ? "rgba(0,200,150,0.1)"
      : "transparent",
    borderLeft: isWinner ? "2px solid #00c896" : "2px solid transparent",
    transition: "all 0.3s",
  });

  const prob = (pct, isWinner) => (
    <span
      style={{
        fontFamily: '"Space Mono", monospace',
        fontSize: 11,
        color: isWinner ? "#00c896" : "#8ba3c2",
        marginLeft: "auto",
        fontWeight: isWinner ? 700 : 400,
      }}
    >
      {pct}%
    </span>
  );

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        width: CARD_W,
        height: CARD_H,
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.9)",
        transition: "opacity 0.45s ease, transform 0.45s ease",
        background: isChampMatch
          ? "linear-gradient(135deg,rgba(245,197,24,0.14),rgba(200,154,18,0.06))"
          : "rgba(13,27,46,0.75)",
        border: isChampMatch
          ? "1px solid rgba(245,197,24,0.5)"
          : "1px solid rgba(245,197,24,0.12)",
        borderRadius: 12,
        backdropFilter: "blur(12px)",
        overflow: "hidden",
        boxShadow: isChampMatch ? "0 0 24px rgba(245,197,24,0.15)" : "none",
      }}
    >
      {/* Round label */}
      <div
        style={{
          fontFamily: '"Space Mono", monospace',
          fontSize: 9,
          color: "#8ba3c2",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          padding: "5px 10px 0",
          opacity: 0.7,
        }}
      >
        {round}
      </div>

      {/* Team rows */}
      <div style={{ padding: "2px 6px 6px" }}>
        <div style={rowStyle(teamA, w === teamA)}>
          <FlagImg team={teamA?.team} size={16} />
          <span
            style={{
              fontFamily: '"Oswald", sans-serif',
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: w === teamA ? "#f5c518" : "#e8edf5",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {teamA?.team ?? "TBD"}
          </span>
          {teamA && teamB && prob(aWin, w === teamA)}
        </div>
        <div style={rowStyle(teamB, w === teamB)}>
          <FlagImg team={teamB?.team} size={16} />
          <span
            style={{
              fontFamily: '"Oswald", sans-serif',
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: w === teamB ? "#f5c518" : "#e8edf5",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {teamB?.team ?? "TBD"}
          </span>
          {teamA && teamB && prob(bWin, w === teamB)}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Champion display
   ────────────────────────────────────────────────────────────────────────── */
function ChampionDisplay({ team, delay }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  if (!team) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: CHAMP_CY - 80,
        width: CHAMP_W,
        height: 160,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.8)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
        background: "linear-gradient(135deg,rgba(245,197,24,0.18),rgba(200,154,18,0.08))",
        border: "1px solid rgba(245,197,24,0.5)",
        borderRadius: 16,
        backdropFilter: "blur(14px)",
        boxShadow: "0 0 50px rgba(245,197,24,0.25), inset 0 0 30px rgba(245,197,24,0.05)",
      }}
    >
      <div style={{ fontSize: "2.4rem" }}>🏆</div>
      <FlagImg team={team.team} size={40} />
      <div
        style={{
          fontFamily: '"Oswald", sans-serif',
          fontWeight: 700,
          fontSize: 14,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          textAlign: "center",
          padding: "0 8px",
          animation: "champion-glow 2s ease-in-out infinite",
          color: "#f5c518",
        }}
      >
        {team.team}
      </div>
      <div
        style={{
          fontFamily: '"Space Mono", monospace',
          fontSize: 11,
          color: "#8ba3c2",
          letterSpacing: "0.08em",
        }}
      >
        {team.win_pct.toFixed(1)}% sim wins
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   SVG connector lines
   ────────────────────────────────────────────────────────────────────────── */
function path(x1, y1, x2, y2) {
  const mx = (x1 + x2) / 2;
  return `M ${x1},${y1} C ${mx},${y1} ${mx},${y2} ${x2},${y2}`;
}

const CONNECTOR_DELAY_BASE = 120; // ms per line stagger

function BracketLines({ drawAll }) {
  const lines = [
    // QF → SF (8 lines, 2 per SF match)
    { d: path(QF_X + CARD_W, QF_CY[0], SF_X, SF_CY[0]),   delay: 0 },
    { d: path(QF_X + CARD_W, QF_CY[1], SF_X, SF_CY[0]),   delay: 1 },
    { d: path(QF_X + CARD_W, QF_CY[2], SF_X, SF_CY[1]),   delay: 2 },
    { d: path(QF_X + CARD_W, QF_CY[3], SF_X, SF_CY[1]),   delay: 3 },
    // SF → Final
    { d: path(SF_X + CARD_W, SF_CY[0], FIN_X, FIN_CY),    delay: 4 },
    { d: path(SF_X + CARD_W, SF_CY[1], FIN_X, FIN_CY),    delay: 5 },
    // Final → Champion
    { d: path(FIN_X + CARD_W, FIN_CY, CHAMP_X, CHAMP_CY), delay: 6 },
  ];

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: BRACKET_W,
        height: BRACKET_H,
        pointerEvents: "none",
        zIndex: 1,
        overflow: "visible",
      }}
    >
      {lines.map((l, i) => (
        <path
          key={i}
          d={l.d}
          fill="none"
          stroke="#f5c518"
          strokeWidth={1.5}
          strokeOpacity={0.4}
          className="bracket-line"
          style={
            drawAll
              ? {
                  animationDelay: `${l.delay * CONNECTOR_DELAY_BASE}ms`,
                  animationFillMode: "both",
                  animationName: "bracket-draw",
                  animationDuration: "0.5s",
                  animationTimingFunction: "ease-out",
                }
              : {}
          }
        />
      ))}
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   TournamentBracket (exported)
   ────────────────────────────────────────────────────────────────────────── */
export default function TournamentBracket({ results }) {
  // ── Seed top-8 ───────────────────────────────────────────────────────────
  const top8 = results.slice(0, 8);
  while (top8.length < 8) top8.push(null);

  // Standard seeding: QF pairs (1v8, 4v5, 3v6, 2v7)
  const seeds = [0, 7, 3, 4, 2, 5, 1, 6];
  const seeded = seeds.map((i) => top8[i]);

  const qf = [
    [seeded[0], seeded[1]],
    [seeded[2], seeded[3]],
    [seeded[4], seeded[5]],
    [seeded[6], seeded[7]],
  ];

  const sf = [
    [winner(qf[0][0], qf[0][1]), winner(qf[1][0], qf[1][1])],
    [winner(qf[2][0], qf[2][1]), winner(qf[3][0], qf[3][1])],
  ];

  const fin = [winner(sf[0][0], sf[0][1]), winner(sf[1][0], sf[1][1])];

  const champion = winner(fin[0], fin[1]);

  // ── Staggered reveal ────────────────────────────────────────────────────
  const BASE_DELAY = 100; // ms

  return (
    <div>
      {/* Heading */}
      <div className="mb-5">
        <h3 className="font-display uppercase text-[16px] tracking-widest text-muted m-0">
          Predicted Knockout Bracket
        </h3>
        <p className="font-mono text-[11px] text-muted opacity-60 mt-1 m-0">
          Seeded by tournament win probability · top 8 teams
        </p>
      </div>

      {/* Column labels */}
      <div
        className="mb-2"
        style={{
          display: "grid",
          gridTemplateColumns: `${CARD_W}px ${COL_GAP}px ${CARD_W}px ${COL_GAP}px ${CARD_W}px ${COL_GAP}px ${CHAMP_W}px`,
          fontFamily: '"Space Mono", monospace',
          fontSize: 9,
          color: "#8ba3c2",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
        }}
      >
        <div>Quarter-Final</div>
        <div />
        <div>Semi-Final</div>
        <div />
        <div>Final</div>
        <div />
        <div>Champion 🏆</div>
      </div>

      {/* ── Bracket canvas ─────────────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          width: BRACKET_W,
          height: BRACKET_H,
          maxWidth: "100%",
          overflowX: "auto",
        }}
      >
        {/* SVG connector lines */}
        <BracketLines drawAll />

        {/* ── QF cards ──────────────────────────────────────────────── */}
        {qf.map(([a, b], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: QF_X,
              top: QF_CY[i] - CARD_H / 2,
              width: CARD_W,
            }}
          >
            <MatchCard
              teamA={a}
              teamB={b}
              round="QF"
              delay={BASE_DELAY + i * 80}
            />
          </div>
        ))}

        {/* ── SF cards ──────────────────────────────────────────────── */}
        {sf.map(([a, b], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: SF_X,
              top: SF_CY[i] - CARD_H / 2,
              width: CARD_W,
            }}
          >
            <MatchCard
              teamA={a}
              teamB={b}
              round="Semi-Final"
              delay={500 + i * 100}
            />
          </div>
        ))}

        {/* ── Final card ────────────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            left: FIN_X,
            top: FIN_CY - CARD_H / 2,
            width: CARD_W,
          }}
        >
          <MatchCard
            teamA={fin[0]}
            teamB={fin[1]}
            round="Final"
            delay={900}
            isChampMatch
          />
        </div>

        {/* ── Champion ──────────────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            left: CHAMP_X,
            top: 0,
            width: CHAMP_W,
            height: BRACKET_H,
          }}
        >
          <ChampionDisplay team={champion} delay={1300} />
        </div>
      </div>
    </div>
  );
}
