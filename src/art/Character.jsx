// Procedurally assembled customers. A single integer `look` decides skin,
// hair style and color, shirt, and accessories, so every customer in the
// day's log has a stable face. Drawn in a 60×100 box, feet at the bottom.

const SKIN = ['#ffdbc4', '#f3c29b', '#e0a979', '#c68857', '#9a6340', '#6e4429'];
const HAIR = ['#2b1d14', '#5a3a22', '#8b5a2b', '#d9a441', '#e8d27a', '#b33a2a', '#3d3d3d', '#7e57c2', '#ec6fa3'];
const SHIRT = ['#ff6f91', '#3cc8a7', '#5aa9f0', '#ffb547', '#9b6bd1', '#f25f5c', '#70c1b3', '#ffd166', '#4f6d7a', '#ef8354'];
const PANTS = ['#3b4a6b', '#4a3b2f', '#2f5d50', '#5b5b77', '#7a4f3a'];

function bits(look) {
  let x = look >>> 0;
  const next = (n) => {
    x = (Math.imul(x ^ (x >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
    return x % n;
  };
  return {
    skin: SKIN[next(SKIN.length)],
    hair: HAIR[next(HAIR.length)],
    shirt: SHIRT[next(SHIRT.length)],
    pants: PANTS[next(PANTS.length)],
    style: next(6),
    acc: next(7), // 0 glasses, 1 cap, 2 bow, others none
    cheeks: next(2) === 0,
  };
}

function Mouth({ mood }) {
  switch (mood) {
    case 'wow':
      return <ellipse cx="30" cy="35" rx="3.2" ry="4" fill="#5a2a2a" />;
    case 'happy':
      return <path d="M24 33 Q30 40 36 33" stroke="#5a2a2a" strokeWidth="2.2" fill="#fff" strokeLinecap="round" />;
    case 'meh':
      return <path d="M25 35 L35 35" stroke="#5a2a2a" strokeWidth="2.2" strokeLinecap="round" />;
    case 'sad':
      return <path d="M25 37 Q30 32 35 37" stroke="#5a2a2a" strokeWidth="2.2" fill="none" strokeLinecap="round" />;
    default:
      return <path d="M25 34 Q30 37 35 34" stroke="#5a2a2a" strokeWidth="2.2" fill="none" strokeLinecap="round" />;
  }
}

function Hair({ style, color }) {
  switch (style) {
    case 0: // short
      return <path d="M14 24 Q14 8 30 8 Q46 8 46 24 Q40 15 30 15 Q20 15 14 24Z" fill={color} />;
    case 1: // long
      return (
        <g fill={color}>
          <path d="M12 26 Q12 6 30 6 Q48 6 48 26 L48 46 Q44 40 44 26 Q38 14 30 14 Q22 14 16 26 Q16 40 12 46Z" />
        </g>
      );
    case 2: // puffs
      return (
        <g fill={color}>
          <circle cx="15" cy="13" r="7" />
          <circle cx="45" cy="13" r="7" />
          <path d="M15 22 Q15 8 30 8 Q45 8 45 22 Q38 14 30 14 Q22 14 15 22Z" />
        </g>
      );
    case 3: // curly
      return (
        <g fill={color}>
          {[14, 20, 26, 32, 38, 44].map((x, i) => (
            <circle key={i} cx={x} cy={i % 2 ? 11 : 13} r="6" />
          ))}
        </g>
      );
    case 4: // ponytail
      return (
        <g fill={color}>
          <path d="M14 24 Q14 8 30 8 Q46 8 46 24 Q40 15 30 15 Q20 15 14 24Z" />
          <path d="M44 14 Q56 18 52 34 Q48 26 44 22Z" />
        </g>
      );
    default: // buzz / bald-ish
      return <path d="M15 20 Q16 10 30 10 Q44 10 45 20 Q38 15 30 15 Q22 15 15 20Z" fill={color} opacity="0.85" />;
  }
}

export default function Character({ look = 1, kid = false, mood = 'neutral', holding = null, flip = false, walking = false }) {
  const b = bits(look);
  const scale = kid ? 0.78 : 1;
  return (
    <svg viewBox="0 0 60 100" width={60 * scale} height={100 * scale} className={walking ? 'char walking' : 'char'} aria-hidden="true" style={{ overflow: 'visible' }}>
      <g transform={flip ? 'translate(60,0) scale(-1,1)' : undefined}>
        {/* legs */}
        <g className="legs">
          <rect className="leg-l" x="21" y="74" width="7" height="22" rx="3" fill={b.pants} />
          <rect className="leg-r" x="32" y="74" width="7" height="22" rx="3" fill={b.pants} />
          <ellipse cx="24.5" cy="97" rx="5" ry="2.6" fill="#3a2a22" />
          <ellipse cx="35.5" cy="97" rx="5" ry="2.6" fill="#3a2a22" />
        </g>
        {/* body */}
        <path d="M16 52 Q16 46 24 46 L36 46 Q44 46 44 52 L46 78 L14 78Z" fill={b.shirt} />
        <rect x="9" y="52" width="7" height="20" rx="3.5" fill={b.shirt} />
        <circle cx="12.5" cy="73" r="3.5" fill={b.skin} />
        <rect x="44" y="52" width="7" height="20" rx="3.5" fill={b.shirt} transform={holding ? 'rotate(-35 47 54)' : undefined} />
        <circle cx={holding ? 56 : 47.5} cy={holding ? 64 : 73} r="3.5" fill={b.skin} />
        {holding && (
          <g transform="translate(51,40)">
            <path d="M3 14 L7 26 L11 14Z" fill="#e2a65a" stroke="#b97a35" strokeWidth="0.8" />
            <circle cx="7" cy="11" r="5.5" fill={holding} stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />
          </g>
        )}
        {/* neck + head */}
        <rect x="26" y="40" width="8" height="8" fill={b.skin} />
        <circle cx="30" cy="27" r="16" fill={b.skin} />
        <Hair style={b.style} color={b.hair} />
        {/* face */}
        <circle cx="24" cy="26" r="2" fill="#2b1d14" />
        <circle cx="36" cy="26" r="2" fill="#2b1d14" />
        {b.cheeks && (
          <g fill="#ff8fa3" opacity="0.45">
            <circle cx="20" cy="32" r="3" />
            <circle cx="40" cy="32" r="3" />
          </g>
        )}
        <Mouth mood={mood} />
        {b.acc === 0 && (
          <g stroke="#333" strokeWidth="1.6" fill="none">
            <circle cx="24" cy="26" r="4.5" />
            <circle cx="36" cy="26" r="4.5" />
            <path d="M28.5 26 L31.5 26" />
          </g>
        )}
        {b.acc === 1 && (
          <g>
            <path d="M13 18 Q14 6 30 6 Q46 6 47 18Z" fill={SHIRT[(look >> 3) % SHIRT.length]} />
            <path d="M44 17 Q54 17 56 20 L44 20Z" fill={SHIRT[(look >> 3) % SHIRT.length]} />
          </g>
        )}
        {b.acc === 2 && (
          <g fill="#ff4d8d">
            <path d="M38 9 L45 5 L45 13Z" />
            <path d="M38 9 L31 5 L31 13Z" />
            <circle cx="38" cy="9" r="2" />
          </g>
        )}
      </g>
    </svg>
  );
}

export function moodFor(entry) {
  if (!entry) return 'neutral';
  if (entry.outcome === 'walked' || entry.outcome === 'nothing') return 'sad';
  if (entry.tone === 'loved') return entry.quoteKind === 'lovedExotic' ? 'wow' : 'happy';
  if (entry.tone === 'mixed') return 'neutral';
  return 'meh';
}
