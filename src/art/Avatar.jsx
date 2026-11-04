// Player avatars: a small set of illustrated animal friends.

export const AVATARS = [
  { id: 'cat', name: 'Cat', bg: '#ffd6e0' },
  { id: 'bear', name: 'Bear', bg: '#ffe2b8' },
  { id: 'bunny', name: 'Bunny', bg: '#e6dcff' },
  { id: 'frog', name: 'Frog', bg: '#d4f5d9' },
  { id: 'panda', name: 'Panda', bg: '#dff1ff' },
  { id: 'fox', name: 'Fox', bg: '#ffe0cc' },
  { id: 'penguin', name: 'Penguin', bg: '#d9ecff' },
  { id: 'unicorn', name: 'Unicorn', bg: '#fbe0ff' },
];

const Eyes = ({ y = 52, dx = 12, color = '#2b1d14' }) => (
  <g fill={color}>
    <circle cx={50 - dx} cy={y} r="4.2" />
    <circle cx={50 + dx} cy={y} r="4.2" />
    <circle cx={50 - dx + 1.4} cy={y - 1.4} r="1.3" fill="#fff" />
    <circle cx={50 + dx + 1.4} cy={y - 1.4} r="1.3" fill="#fff" />
  </g>
);
const Smile = ({ y = 64 }) => (
  <path d={`M43 ${y} Q50 ${y + 7} 57 ${y}`} stroke="#5a2a2a" strokeWidth="2.6" fill="none" strokeLinecap="round" />
);
const Cheeks = ({ y = 62 }) => (
  <g fill="#ff8fa3" opacity="0.55">
    <circle cx="31" cy={y} r="5" />
    <circle cx="69" cy={y} r="5" />
  </g>
);

function Face({ id }) {
  switch (id) {
    case 'cat':
      return (
        <g>
          <path d="M22 40 L26 14 L44 30Z M78 40 L74 14 L56 30Z" fill="#f4a261" />
          <path d="M27 34 L28 21 L38 30Z M73 34 L72 21 L62 30Z" fill="#ffc8dd" />
          <circle cx="50" cy="55" r="30" fill="#f4a261" />
          <Eyes />
          <path d="M47 60 L53 60 L50 63Z" fill="#e5677d" />
          <Smile y={65} />
          <g stroke="#7a4a2a" strokeWidth="1.5">
            <path d="M24 58 L36 60 M24 64 L36 63 M76 58 L64 60 M76 64 L64 63" />
          </g>
        </g>
      );
    case 'bear':
      return (
        <g>
          <circle cx="27" cy="30" r="11" fill="#9c6644" />
          <circle cx="73" cy="30" r="11" fill="#9c6644" />
          <circle cx="27" cy="30" r="5.5" fill="#e6b89c" />
          <circle cx="73" cy="30" r="5.5" fill="#e6b89c" />
          <circle cx="50" cy="55" r="30" fill="#9c6644" />
          <ellipse cx="50" cy="65" rx="13" ry="10" fill="#e6b89c" />
          <Eyes y={50} />
          <ellipse cx="50" cy="61" rx="4.5" ry="3.2" fill="#3a2418" />
          <Smile y={66} />
        </g>
      );
    case 'bunny':
      return (
        <g>
          <ellipse cx="38" cy="18" rx="7" ry="20" fill="#f1f1f6" />
          <ellipse cx="62" cy="18" rx="7" ry="20" fill="#f1f1f6" />
          <ellipse cx="38" cy="18" rx="3.5" ry="14" fill="#ffc8dd" />
          <ellipse cx="62" cy="18" rx="3.5" ry="14" fill="#ffc8dd" />
          <circle cx="50" cy="57" r="28" fill="#f1f1f6" />
          <Eyes y={54} />
          <path d="M47 61 L53 61 L50 64Z" fill="#e5677d" />
          <Smile y={66} />
          <Cheeks y={63} />
        </g>
      );
    case 'frog':
      return (
        <g>
          <circle cx="33" cy="32" r="12" fill="#6cc070" />
          <circle cx="67" cy="32" r="12" fill="#6cc070" />
          <ellipse cx="50" cy="58" rx="33" ry="26" fill="#6cc070" />
          <circle cx="33" cy="31" r="7" fill="#fff" />
          <circle cx="67" cy="31" r="7" fill="#fff" />
          <circle cx="34" cy="32" r="3.8" fill="#2b1d14" />
          <circle cx="68" cy="32" r="3.8" fill="#2b1d14" />
          <path d="M34 62 Q50 76 66 62" stroke="#2f6b33" strokeWidth="3" fill="none" strokeLinecap="round" />
          <Cheeks y={60} />
        </g>
      );
    case 'panda':
      return (
        <g>
          <circle cx="27" cy="30" r="11" fill="#2b2b2b" />
          <circle cx="73" cy="30" r="11" fill="#2b2b2b" />
          <circle cx="50" cy="55" r="30" fill="#fafafa" />
          <ellipse cx="38" cy="52" rx="8" ry="10" fill="#2b2b2b" transform="rotate(-20 38 52)" />
          <ellipse cx="62" cy="52" rx="8" ry="10" fill="#2b2b2b" transform="rotate(20 62 52)" />
          <circle cx="39" cy="52" r="3" fill="#fff" />
          <circle cx="61" cy="52" r="3" fill="#fff" />
          <ellipse cx="50" cy="63" rx="4.5" ry="3" fill="#2b2b2b" />
          <Smile y={67} />
        </g>
      );
    case 'fox':
      return (
        <g>
          <path d="M20 42 L24 12 L44 32Z M80 42 L76 12 L56 32Z" fill="#f77f3a" />
          <path d="M26 34 L27 20 L37 30Z M74 34 L73 20 L63 30Z" fill="#fff1e6" />
          <path d="M20 44 Q20 26 50 26 Q80 26 80 44 Q80 70 50 84 Q20 70 20 44Z" fill="#f77f3a" />
          <path d="M28 56 Q50 60 72 56 Q66 76 50 84 Q34 76 28 56Z" fill="#fff1e6" />
          <Eyes y={50} />
          <ellipse cx="50" cy="66" rx="4.5" ry="3.2" fill="#2b1d14" />
          <Smile y={70} />
        </g>
      );
    case 'penguin':
      return (
        <g>
          <ellipse cx="50" cy="55" rx="32" ry="32" fill="#2f3e57" />
          <path d="M30 56 Q30 34 44 36 Q50 42 56 36 Q70 34 70 56 Q70 80 50 82 Q30 80 30 56Z" fill="#fff" />
          <Eyes y={52} dx={10} />
          <path d="M44 60 L56 60 L50 68Z" fill="#ffb03b" />
          <Cheeks y={64} />
        </g>
      );
    case 'unicorn':
      return (
        <g>
          <path d="M44 28 L50 2 L56 28Z" fill="#ffd166" stroke="#e0a800" strokeWidth="1.2" />
          <path d="M46 20 L54 17 M45 25 L55 22 M47 13 L53 11" stroke="#e0a800" strokeWidth="1.2" />
          <path d="M26 36 L28 20 L40 30Z M74 36 L72 20 L60 30Z" fill="#fff" />
          <circle cx="50" cy="56" r="29" fill="#fff" />
          <path d="M22 50 Q20 30 40 28 Q34 40 34 52Z" fill="#c084fc" />
          <path d="M26 46 Q24 34 36 32 Q32 42 33 50Z" fill="#f472b6" />
          <Eyes y={54} />
          <Smile y={66} />
          <Cheeks y={63} />
        </g>
      );
    default:
      return <circle cx="50" cy="55" r="30" fill="#ddd" />;
  }
}

export default function Avatar({ id = 'cat', size = 56, ring = true }) {
  const a = AVATARS.find((x) => x.id === id) || AVATARS[0];
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="avatar-svg" role="img" aria-label={a.name}>
      {ring && <circle cx="50" cy="50" r="49" fill={a.bg} />}
      <g transform={ring ? 'translate(5,4) scale(0.9)' : undefined}>
        <Face id={a.id} />
      </g>
    </svg>
  );
}
