// A cone (or cup) with one or more scoops in the player's chosen colors.

function shade(hex, amt) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function Scoop({ color = '#f59ab5', cx = 20, cy = 16, r = 12, icon = '', chalk = false, star = false }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={color} stroke={chalk ? 'rgba(255,255,255,0.85)' : shade(color, -40)} strokeWidth={chalk ? 1.6 : 1.2} />
      <path
        d={`M${cx - r} ${cy + r * 0.25} q${r * 0.33} ${r * 0.45} ${r * 0.66} 0 q${r * 0.33} ${r * 0.45} ${r * 0.67} 0 q${r * 0.33} ${r * 0.45} ${r * 0.67} 0`}
        fill="none"
        stroke={chalk ? 'rgba(255,255,255,0.6)' : shade(color, -30)}
        strokeWidth="1.2"
      />
      <ellipse cx={cx - r * 0.35} cy={cy - r * 0.4} rx={r * 0.28} ry={r * 0.18} fill="rgba(255,255,255,0.55)" />
      {icon && (
        <text x={cx} y={cy + r * 0.32} textAnchor="middle" fontSize={r * 0.95}>
          {icon}
        </text>
      )}
      {star && (
        <path
          d={`M${cx + r * 0.7} ${cy - r * 1.05} l2.2 4.6 5 .7 -3.6 3.5 .9 5 -4.5 -2.4 -4.5 2.4 .9 -5 -3.6 -3.5 5 -.7z`}
          fill="#ffd166"
          stroke="#e0a800"
          strokeWidth="0.8"
        />
      )}
    </g>
  );
}

export default function Cone({ colors = ['#f59ab5'], size = 40, icon = '', chalk = false, star = false }) {
  const n = Math.min(3, colors.length);
  const h = 44 + (n - 1) * 14;
  return (
    <svg viewBox={`0 0 40 ${h}`} width={size} height={(size * h) / 40} aria-hidden="true" className="cone-svg">
      <path
        d={`M8 ${h - 30} L20 ${h - 1} L32 ${h - 30}Z`}
        fill={chalk ? 'none' : '#e2a65a'}
        stroke={chalk ? 'rgba(255,255,255,0.85)' : '#b97a35'}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {!chalk && (
        <g stroke="#c98c45" strokeWidth="0.9">
          <path d={`M11 ${h - 24} L27 ${h - 14} M14 ${h - 29} L30 ${h - 21} M12 ${h - 16} L25 ${h - 26}`} />
        </g>
      )}
      {colors.slice(0, n).map((c, i) => (
        <Scoop
          key={i}
          color={c}
          cx={20}
          cy={h - 32 - i * 14}
          r={12}
          chalk={chalk}
          icon={i === n - 1 ? icon : ''}
          star={star && i === n - 1}
        />
      ))}
    </svg>
  );
}
