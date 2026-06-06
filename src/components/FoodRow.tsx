import React, { useState, useEffect, useRef } from 'react';

interface Food {
  kcal: number;
  p: number;
  l: number;
  g: number;
  unit?: string;
  uw?: number;
  ul?: string;
}

interface FoodRowProps {
  slot: any;
  row: any;
  idx: number;
  afw: Record<string, Food>;
  sel: string;
  updRow: (ds: string, mid: string, idx: number, fld: string, val: any) => void;
  delRow: (ds: string, mid: string, idx: number) => void;
}

export const FoodRow: React.FC<FoodRowProps> = ({ slot, row, idx, afw, sel, updRow, delRow }) => {
  const f = afw[row.food];
  const ul = f ? (f.ul || (f.unit === 'unit' ? 'u' : f.unit === 'ml' ? 'ml' : 'g')) : 'g';
  const [localQty, setLocalQty] = useState(row.qty || '');
  const [fsearch, setFsearch] = useState(row.food || '');
  const [fdrop, setFdrop] = useState(false);
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) setLocalQty(row.qty || '');
  }, [row.qty]);

  useEffect(() => {
    setFsearch(row.food || '');
  }, [row.food]);

  const foodKeys = Object.keys(afw);
  const q = fsearch.toLowerCase().replace('[r] ', '');
  const filtered = q ? foodKeys.filter(x => x.toLowerCase().replace('[r] ', '').includes(q)) : foodKeys;
  const sorted = [
    ...filtered.filter(x => x.startsWith('[R]')).sort(),
    ...filtered.filter(x => !x.startsWith('[R]')).sort()
  ].slice(0, 25);

  const rk = f && +localQty > 0 ? Math.round(f.kcal * (gew(f, +localQty) / 100)) : 0;

  return (
    <div className="meal-row" style={{ position: 'relative', zIndex: fdrop ? 100 : 1 }}>
      <div className="meal-row-top">
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            value={fsearch}
            inputMode="text"
            placeholder="Rechercher un aliment..."
            onFocus={() => setFdrop(true)}
            onBlur={() => setTimeout(() => setFdrop(false), 150)}
            onChange={e => { setFsearch(e.target.value); setFdrop(true); }}
            style={{ width: '100%', fontSize: 15, padding: '5px 6px', borderRadius: 6 }}
          />
          {fdrop && sorted.length > 0 && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 2px)',
              left: 0,
              right: 0,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              zIndex: 999,
              maxHeight: 180,
              overflowY: 'auto',
              boxShadow: '0 6px 16px rgba(0,0,0,.6)'
            }}>
              {sorted.map(x => (
                <div
                  key={x}
                  onPointerDown={e => {
                    e.preventDefault();
                    const disp = x.startsWith('[R]') ? x.replace('[R] ', '') : x;
                    setFsearch(disp);
                    updRow(sel, slot.id, idx, 'food', x);
                    setFdrop(false);
                  }}
                  style={{
                    padding: '8px 10px',
                    fontSize: 13,
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border)',
                    color: x.startsWith('[R]') ? 'var(--accent)' : 'var(--text)'
                  }}
                >
                  {x.startsWith('[R]') ? '⭐ ' + x.replace('[R] ', '') : x}
                </div>
              ))}
            </div>
          )}
        </div>
        <button className="meal-del" onClick={() => delRow(sel, slot.id, idx)}>✕</button>
      </div>
      <div className="meal-row-bottom">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={f?.unit === 'unit' ? 1 : 5}
          value={localQty}
          placeholder="Quantite"
          onFocus={() => { isFocused.current = true; }}
          onBlur={e => {
            isFocused.current = false;
            updRow(sel, slot.id, idx, 'qty', e.target.value);
          }}
          onChange={e => {
            setLocalQty(e.target.value);
            updRow(sel, slot.id, idx, 'qty', e.target.value);
          }}
          style={{ width: 80, fontSize: 15, padding: '5px 8px', textAlign: 'center', borderRadius: 6, fontFamily: "'JetBrains Mono', monospace" }}
        />
        <span className="meal-unit">{ul}</span>
        <span className="meal-kcal">{rk > 0 ? rk + ' kcal' : '—'}</span>
      </div>
    </div>
  );
};

function gew(f: Food, q: number) {
  if (!f || !q || q <= 0) return 0;
  return f.unit === 'unit' ? q * (f.uw || 100) : q;
}
