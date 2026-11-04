import Cone from '../art/Cone.jsx';
import { wholeMoney } from './common.jsx';
import { tierName } from '../game/fame.js';

export default function Shelf({ shelf, onOpen }) {
  if (!shelf.length) return <p className="muted">Finished seasons will show up here.</p>;
  return (
    <div className="shelf">
      {[...shelf].reverse().map((card) => (
        <button key={card.number} className={`shelf-card grade-${card.grade.id}`} onClick={() => onOpen(card)}>
          <span className="shelf-num">Season {card.number}</span>
          <span className="shelf-grade">
            {card.grade.emoji} {card.grade.label}
          </span>
          <span className="shelf-amb">{card.title}</span>
          <span className="shelf-cones">
            {card.topFlavors.slice(0, 3).map((t) => (
              <Cone key={t.flavor} colors={[t.color || '#f59ab5']} size={22} icon={t.icon} />
            ))}
          </span>
          <span className="shelf-stats">
            <span>{wholeMoney(card.finalCash)}</span>
            <span>★ {tierName(card.tierMax)}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
