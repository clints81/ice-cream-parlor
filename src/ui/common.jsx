import { useEffect } from 'react';
import { FAME_TIERS, nextTierProgress, tierName } from '../game/fame.js';
import { sfx } from '../audio/sound.js';

export function money(x, helper = false) {
  const neg = x < 0;
  const v = Math.abs(x);
  let s;
  if (helper) {
    const r = Math.round(v * 2) / 2;
    s = r % 1 === 0 ? `$${r.toFixed(0)}` : `$${r.toFixed(2)}`;
  } else {
    s = v >= 1000 ? `$${Math.round(v).toLocaleString()}` : `$${v.toFixed(2)}`;
  }
  return neg ? `−${s}` : s;
}

export function wholeMoney(x) {
  const neg = x < 0;
  return `${neg ? '−' : ''}$${Math.round(Math.abs(x)).toLocaleString()}`;
}

export function Modal({ children, onClose, wide = false, className = '', label = 'Dialog' }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className={`modal ${wide ? 'modal-wide' : ''} ${className}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        {onClose && (
          <button className="modal-x" onClick={onClose} aria-label="Close">
            ✕
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

export function FameMeter({ fame, helper = false, compact = false }) {
  const { idx, pct, next } = nextTierProgress(fame);
  return (
    <div className={`fame ${compact ? 'fame-compact' : ''}`} title={`Fame ${Math.round(fame)} / 100`}>
      <div className="fame-top">
        <span className="fame-star">★</span>
        <span className="fame-tier">{tierName(idx, helper)}</span>
      </div>
      <div className="fame-bar" aria-label={`Fame ${Math.round(fame)} out of 100`}>
        <div className="fame-fill" style={{ width: `${Math.max(3, fame)}%` }} />
        {FAME_TIERS.slice(1).map((t) => (
          <span key={t.at} className={`fame-tick ${fame >= t.at ? 'hit' : ''}`} style={{ left: `${t.at}%` }} />
        ))}
      </div>
      {!compact && next && (
        <div className="fame-next">
          {helper ? 'Next:' : 'Next up:'} {tierName(idx + 1, helper)} {pct > 0.75 ? '(so close!)' : ''}
        </div>
      )}
    </div>
  );
}

export function Pips({ day, total = 30 }) {
  return (
    <div className="pips" aria-label={`Day ${day} of ${total}`}>
      {Array.from({ length: total }, (_, i) => {
        const d = i + 1;
        return <span key={d} className={d < day ? 'pip past' : d === day ? 'pip today' : 'pip'} />;
      })}
    </div>
  );
}

export function ProgressBar({ pct, label, tone = 'pink' }) {
  const w = Math.max(0, Math.min(1, pct)) * 100;
  return (
    <div className={`pbar pbar-${tone}`} aria-label={label}>
      <div className="pbar-fill" style={{ width: `${w}%` }} />
    </div>
  );
}

export function Btn({ children, kind = '', onClick, disabled, big = false, className = '', title, type = 'button', sound = true }) {
  return (
    <button
      type={type}
      className={`btn ${kind ? 'btn-' + kind : ''} ${big ? 'btn-big' : ''} ${className}`}
      onClick={(e) => {
        if (sound) sfx.tap();
        onClick?.(e);
      }}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}

export function Stepper({ value, onChange, step = 0.25, min = 1, max = 8, format = (v) => v.toFixed(2), disabled, label }) {
  const set = (v) => onChange(Math.max(min, Math.min(max, Math.round(v / step) * step)));
  return (
    <span className={`stepper ${disabled ? 'stepper-locked' : ''}`} aria-label={label}>
      {!disabled && (
        <button type="button" className="step-btn" onClick={() => { sfx.tap(); set(value - step); }} aria-label={`Lower ${label}`} disabled={value <= min}>
          −
        </button>
      )}
      <span className="step-val">{disabled && '🔒 '}{format(value)}</span>
      {!disabled && (
        <button type="button" className="step-btn" onClick={() => { sfx.tap(); set(value + step); }} aria-label={`Raise ${label}`} disabled={value >= max}>
          +
        </button>
      )}
    </span>
  );
}

export function useReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
