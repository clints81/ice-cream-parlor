// The parlor, drawn in SVG. It changes with the time of day, the weather,
// and fame: flower boxes, a PokéTuber poster, a fancier sign, marquee
// lights, a giant cone on the roof, and a red carpet as fame tiers rise.

import Character from './Character.jsx';

const SKY = {
  morning: ['#a9dcff', '#ffe7cf'],
  afternoon: ['#6cc4ff', '#d6f1ff'],
  evening: ['#ff9a76', '#6a4c93'],
};
const WET_SKY = {
  morning: ['#9fb3c4', '#d9e0e6'],
  afternoon: ['#8ea3b5', '#cfd8e0'],
  evening: ['#6b6f8a', '#3b3f5c'],
};
const STORM_SKY = ['#4b5568', '#7b8496'];

const AWNING = [
  ['#e85d75', '#fff7f0'],
  ['#e85d75', '#fff7f0'],
  ['#ff6f91', '#fff7f0'],
  ['#3cc8a7', '#fff7f0'],
  ['#9b6bd1', '#fff4c9'],
  ['#ff6f91', '#ffd166'],
  ['#ffb000', '#ff4f8b'],
];
const WALL = ['#ffe4c7', '#ffe4c7', '#ffd9e2', '#d7f3ea', '#e7dcff', '#fff0c2', '#ffe0ef'];

function Cloud({ x, y, s = 1, fill = '#fff', opacity = 0.95, cls = '' }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={opacity} className={cls}>
      <ellipse cx="0" cy="10" rx="34" ry="16" fill={fill} />
      <ellipse cx="-22" cy="14" rx="20" ry="12" fill={fill} />
      <ellipse cx="24" cy="14" rx="22" ry="12" fill={fill} />
      <ellipse cx="4" cy="0" rx="20" ry="16" fill={fill} />
    </g>
  );
}

function Tub({ x, color }) {
  return (
    <g transform={`translate(${x},236)`}>
      <path d="M0 0 Q12 -14 24 0Z" fill={color} />
      <rect x="-2" y="0" width="28" height="14" rx="3" fill="#e9eef3" stroke="#b8c4ce" />
    </g>
  );
}

function Bulbs({ x, y, w, h, on }) {
  const dots = [];
  const step = 16;
  for (let i = 0; i <= w; i += step) {
    dots.push([x + i, y], [x + i, y + h]);
  }
  for (let j = step; j < h; j += step) dots.push([x, y + j], [x + w, y + j]);
  return (
    <g className={on ? 'bulbs on' : 'bulbs'}>
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="3.4" fill={i % 2 ? '#fff3b0' : '#ffd166'} className={i % 2 ? 'bulb b' : 'bulb a'} />
      ))}
    </g>
  );
}

export default function Storefront({
  parlorName = 'My Parlor',
  time = 'morning',
  weather = 'sunny',
  tier = 0,
  flavors = [],
  line = 0,
  lineLooks = [],
  open = true,
  className = '',
  children,
}) {
  const wet = weather === 'rain' || weather === 'storm';
  const [skyTop, skyBottom] = weather === 'storm' ? STORM_SKY : wet ? WET_SKY[time] : SKY[time];
  const [aw1, aw2] = AWNING[Math.min(tier, AWNING.length - 1)];
  const wall = WALL[Math.min(tier, WALL.length - 1)];
  const evening = time === 'evening';
  const name = parlorName.length > 26 ? parlorName.slice(0, 25) + '…' : parlorName;
  const longName = name.length > 15;
  const tubColors = flavors.slice(0, 5);
  const gid = 'sky-' + time + '-' + weather;

  return (
    <div className={`scene ${className} weather-${weather} time-${time}`}>
      <svg viewBox="0 0 800 400" className="scene-svg" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`${parlorName} storefront, ${time}, ${weather}`}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={skyTop} />
            <stop offset="1" stopColor={skyBottom} />
          </linearGradient>
          <pattern id="rain-pat" width="24" height="40" patternUnits="userSpaceOnUse">
            <path d="M6 0 L2 14 M18 18 L14 32" stroke="#dbe9f7" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          </pattern>
          <linearGradient id="win-glow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={evening ? '#ffe9a8' : '#cfeeff'} />
            <stop offset="1" stopColor={evening ? '#ffc96b' : '#a8dcff'} />
          </linearGradient>
        </defs>

        {/* sky */}
        <rect x="0" y="0" width="800" height="290" fill={`url(#${gid})`} />
        {weather === 'sunny' && !evening && (
          <g className="sun" transform={`translate(${time === 'morning' ? 110 : 680},${time === 'morning' ? 90 : 60})`}>
            {Array.from({ length: 10 }, (_, i) => (
              <rect key={i} x="-3" y="-58" width="6" height="16" rx="3" fill="#ffd166" transform={`rotate(${i * 36})`} />
            ))}
            <circle r="32" fill="#ffd166" />
            <circle r="24" fill="#ffe08a" />
          </g>
        )}
        {evening && !wet && <circle cx="660" cy="70" r="26" fill="#fff4d6" opacity="0.9" />}
        {evening && (
          <g fill="#fff" opacity="0.8">
            <circle cx="90" cy="40" r="1.6" /><circle cx="160" cy="80" r="1.2" /><circle cx="600" cy="30" r="1.4" />
            <circle cx="720" cy="120" r="1.2" /><circle cx="40" cy="120" r="1.2" />
          </g>
        )}
        <g className="clouds">
          {(weather !== 'sunny' || time === 'afternoon') && (
            <Cloud x={130} y={60} s={weather === 'sunny' ? 0.8 : 1.2} fill={wet ? '#c5ccd6' : '#fff'} cls="cloud c1" />
          )}
          {weather !== 'sunny' && <Cloud x={560} y={45} s={1.3} fill={wet ? '#b3bcc8' : '#fff'} cls="cloud c2" />}
          {(weather === 'cloudy' || wet || weather === 'windy') && (
            <Cloud x={360} y={30} s={0.9} fill={wet ? '#aab3bf' : '#f4f8fb'} cls="cloud c3" />
          )}
          {weather === 'storm' && <Cloud x={720} y={70} s={1.1} fill="#8b95a5" cls="cloud c1" />}
        </g>
        {weather === 'storm' && (
          <path className="lightning" d="M620 90 L600 140 L616 140 L596 190 L640 128 L622 128 L640 90Z" fill="#fff59d" />
        )}

        {/* far trees */}
        <g fill={evening ? '#4a6b5a' : '#8fd19e'}>
          <circle cx="40" cy="250" r="40" />
          <circle cx="95" cy="235" r="46" />
          <circle cx="700" cy="245" r="44" />
          <circle cx="760" cy="255" r="36" />
        </g>
        <rect x="88" y="240" width="12" height="50" fill="#8a5a3b" />
        <rect x="694" y="245" width="12" height="45" fill="#8a5a3b" />

        {/* building */}
        <rect x="190" y="70" width="420" height="220" fill={wall} />
        <rect x="182" y="58" width="436" height="20" rx="4" fill="#fff" stroke="#e8d5c4" />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
          <rect key={i} x={196 + i * 32} y="62" width="20" height="12" rx="3" fill="#f4e3d3" />
        ))}

        {/* giant roof cone at tier 5+ */}
        {tier >= 5 && (
          <g transform="translate(400,-6)" className="roof-cone">
            <path d="M-22 32 L0 72 L22 32Z" fill="#e2a65a" stroke="#b97a35" strokeWidth="2" />
            <circle cx="0" cy="24" r="20" fill={tubColors[0] || '#f59ab5'} stroke="rgba(0,0,0,0.15)" strokeWidth="2" />
            <circle cx="0" cy="4" r="16" fill={tubColors[1] || '#8be3b8'} stroke="rgba(0,0,0,0.15)" strokeWidth="2" />
            <circle cx="0" cy="-12" r="5" fill="#e63946" />
          </g>
        )}

        {/* sign */}
        <g>
          <rect
            x="250" y="88" width="300" height="52" rx="10"
            fill={tier >= 3 ? '#4a2c2a' : '#8a5a3b'}
            stroke={tier >= 3 ? '#ffd166' : '#6b4226'}
            strokeWidth={tier >= 3 ? 4 : 3}
          />
          {tier >= 4 && <Bulbs x={244} y={82} w={312} h={64} on={evening || weather !== 'sunny'} />}
          <text
            x="400" y="123" textAnchor="middle"
            className="sign-text"
            fontSize={longName ? 22 : 28}
            fill={tier >= 3 ? '#ffe9a8' : '#fff7e6'}
            {...(name.length > 20 ? { textLength: 276, lengthAdjust: 'spacingAndGlyphs' } : {})}
          >
            {name}
          </text>
        </g>

        {/* awning */}
        <g>
          <rect x="200" y="150" width="400" height="26" fill={aw2} />
          {Array.from({ length: 10 }, (_, i) => (
            <rect key={i} x={200 + i * 40} y="150" width="20" height="26" fill={aw1} />
          ))}
          {Array.from({ length: 20 }, (_, i) => (
            <path key={i} d={`M${200 + i * 20} 176 q10 14 20 0`} fill={i % 2 ? aw2 : aw1} />
          ))}
        </g>

        {/* left window with flavor tubs */}
        <rect x="214" y="196" width="170" height="80" rx="6" fill="url(#win-glow)" stroke="#fff" strokeWidth="5" />
        <rect x="214" y="250" width="170" height="26" fill="#ffffff" opacity="0.6" />
        {tubColors.map((c, i) => (
          <Tub key={i} x={226 + i * 31} color={c} />
        ))}
        <path d="M222 204 L250 204 M222 212 L238 212" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.7" />

        {/* door */}
        <rect x="408" y="186" width="74" height="104" rx="6" fill="#7b4a2e" />
        <rect x="416" y="196" width="58" height="50" rx="4" fill="url(#win-glow)" />
        <circle cx="470" cy="252" r="3.5" fill="#ffd166" />
        <g transform="translate(445,262)">
          <rect x="-24" y="-11" width="48" height="20" rx="4" fill={open ? '#3cc8a7' : '#e85d75'} />
          <text x="0" y="4" textAnchor="middle" fontSize="12" fill="#fff" className="sign-small">{open ? 'OPEN' : 'CLOSED'}</text>
        </g>

        {/* right window */}
        <rect x="506" y="196" width="86" height="80" rx="6" fill="url(#win-glow)" stroke="#fff" strokeWidth="5" />
        {tier >= 2 && (
          <g transform="translate(549,236)" className="poster">
            <rect x="-30" y="-30" width="60" height="58" rx="4" fill="#fff" stroke="#ff4f4f" strokeWidth="3" />
            <rect x="-14" y="-22" width="28" height="20" rx="5" fill="#ff4f4f" />
            <path d="M-4 -17 L6 -12 L-4 -7Z" fill="#fff" />
            <text x="0" y="12" textAnchor="middle" fontSize="9" fill="#333" className="sign-small">PokéTuber</text>
            <text x="0" y="23" textAnchor="middle" fontSize="9" fill="#333" className="sign-small">approved!</text>
          </g>
        )}

        {/* flower boxes */}
        {tier >= 1 && (
          <g>
            <rect x="210" y="276" width="178" height="12" rx="3" fill="#8a5a3b" />
            <rect x="502" y="276" width="94" height="12" rx="3" fill="#8a5a3b" />
            {[222, 246, 270, 294, 318, 342, 366, 514, 538, 562, 584].map((x, i) => (
              <g key={x}>
                <circle cx={x} cy="273" r="6" fill={['#ff6f91', '#ffd166', '#9b6bd1', '#ff9f43'][i % 4]} />
                <circle cx={x} cy="273" r="2" fill="#fff3b0" />
              </g>
            ))}
          </g>
        )}

        {/* ground */}
        <rect x="0" y="288" width="800" height="52" fill={wet ? '#b9c2cb' : '#e8dccd'} />
        {Array.from({ length: 16 }, (_, i) => (
          <path key={i} d={`M${i * 52} 288 L${i * 52 - 10} 340`} stroke={wet ? '#a6b0ba' : '#d8c9b6'} strokeWidth="2" />
        ))}
        <rect x="0" y="340" width="800" height="60" fill={evening ? '#3d3f4c' : '#5b5f6d'} />
        {Array.from({ length: 10 }, (_, i) => (
          <rect key={i} x={20 + i * 84} y="368" width="44" height="6" rx="3" fill="#f4e3a1" opacity="0.8" />
        ))}
        {wet && (
          <g fill="#9fb3c8" opacity="0.7">
            <ellipse cx="150" cy="320" rx="38" ry="5" />
            <ellipse cx="640" cy="326" rx="30" ry="4" />
          </g>
        )}

        {/* red carpet at the top tier */}
        {tier >= 6 && (
          <g>
            <path d="M412 290 L478 290 L500 340 L390 340Z" fill="#d62839" />
            <rect x="380" y="300" width="6" height="34" fill="#c9a227" />
            <rect x="504" y="300" width="6" height="34" fill="#c9a227" />
            <path d="M383 304 Q400 316 445 312" stroke="#c9a227" strokeWidth="3" fill="none" />
          </g>
        )}

        {/* lamp post + bench */}
        <g>
          <rect x="650" y="200" width="8" height="90" fill="#3d3d4a" />
          <circle cx="654" cy="196" r="12" fill={evening || wet ? '#ffe9a8' : '#f1f1f1'} stroke="#3d3d4a" strokeWidth="3" />
          {(evening || wet) && <circle cx="654" cy="196" r="28" fill="#ffe9a8" opacity="0.25" />}
          <rect x="600" y="262" width="44" height="6" rx="2" fill="#8a5a3b" />
          <rect x="600" y="252" width="44" height="5" rx="2" fill="#8a5a3b" />
          <rect x="604" y="268" width="4" height="18" fill="#3d3d4a" />
          <rect x="636" y="268" width="4" height="18" fill="#3d3d4a" />
        </g>

        {/* the line out the door */}
        {Array.from({ length: Math.min(line, 7) }, (_, i) => (
          <g key={i} transform={`translate(${350 - i * 40},${i % 2 ? 222 : 218})`}>
            <Character look={lineLooks[i] ?? i * 7919 + 13} kid={i % 3 === 1} mood="happy" />
          </g>
        ))}

        {/* weather overlays */}
        {wet && <rect className="rain" x="0" y="-40" width="800" height="440" fill="url(#rain-pat)" />}
        {weather === 'windy' && (
          <g className="leaves" fill="#e9a23b">
            <ellipse cx="100" cy="160" rx="6" ry="3" />
            <ellipse cx="300" cy="120" rx="6" ry="3" fill="#d9772b" />
            <ellipse cx="520" cy="180" rx="6" ry="3" />
            <ellipse cx="700" cy="140" rx="6" ry="3" fill="#c25b2a" />
          </g>
        )}
        {evening && <rect x="0" y="0" width="800" height="400" fill="#2a1b4a" opacity="0.12" pointerEvents="none" />}
      </svg>
      {children && <div className="scene-overlay">{children}</div>}
    </div>
  );
}
