import React from 'react';
import { FoodRow } from './FoodRow';

interface NutritionProps {
  sel: string;
  sT: any;
  sTgt: number;
  sSes: any;
  sB: number;
  sRem: number;
  sAdj: number;
  afw: any;
  gm: (ds: string) => any;
  MEALS: any[];
  addRow: (ds: string, mid: string) => void;
  updRow: any;
  delRow: any;
  setCalB: any;
  sess: any;
  setSess: any;
  days: any;
  MP: any;
}

export const Nutrition: React.FC<NutritionProps> = ({
  sel, sT, sTgt, sSes, sB, sRem, sAdj, afw, gm, MEALS,
  addRow, updRow, delRow, setCalB, sess, setSess, days, MP
}) => {
  const dtC = sSes ? { bg: 'var(--si)', tc: 'var(--blue)', b: 'var(--sb)' } : { bg: 'var(--surface2)', tc: 'var(--muted)', b: 'var(--border)' };

  const Bar = ({ v, max, c = 'var(--accent)' }: { v: number; max: number; c?: string }) => (
    <div style={{ height: 4, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        width: Math.min((v / max) * 100, 100) + '%',
        background: v > max ? 'var(--red)' : c,
        borderRadius: 99,
        transition: 'width .3s'
      }} />
    </div>
  );

  return (
    <div>
      {/* Summary Card */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 600, flex: 1, textTransform: 'capitalize' }}>
            {new Date(sel + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: dtC.bg, color: dtC.tc, border: '1px solid ' + dtC.b, fontFamily: "'JetBrains Mono', monospace" }}>
            {sSes ? 'SEANCE' : 'REPOS'}
          </span>
        </div>
        {/* ... rest of Nutrition UI from original ... */}
        {/* Macros and calories summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 8 }}>
          {[
            { v: sT.kcal, l: 'Consomme', c: sT.kcal > sAdj ? 'var(--red)' : 'var(--accent)' },
            { v: sAdj, l: sB > 0 ? 'Obj.ajuste' : 'Objectif', c: 'var(--orange)' },
            { v: Math.abs(sRem), l: sRem >= 0 ? 'Restantes' : 'Surplus', c: sRem < 0 ? 'var(--red)' : 'var(--text)' }
          ].map((k, i) => (
            <div key={i} style={{ textAlign: 'center', background: 'var(--surface2)', borderRadius: 8, padding: '7px 4px' }}>
              <div style={{ fontSize: 17, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: k.c }}>{k.v}</div>
              <div style={{ fontSize: 9, color: 'var(--muted)' }}>{k.l}</div>
            </div>
          ))}
        </div>
        <Bar v={sT.kcal} max={sAdj} />
        {/* Macros bars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5, marginTop: 8 }}>
          {[
            { l: 'PROT', v: sT.p, t: MP.p, c: 'var(--blue)' },
            { l: 'LIP', v: sT.l, t: MP.l, c: 'var(--orange)' },
            { l: 'GLUC', v: sT.g, t: Math.round(sAdj * 0.4 / 4), c: 'var(--accent)' }
          ].map(m => (
            <div key={m.l} style={{ background: 'var(--surface2)', borderRadius: 7, padding: '5px 6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginBottom: 2 }}>
                <span style={{ color: m.c, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{m.l}</span>
                <span style={{ color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace" }}>{m.v}g</span>
              </div>
              <Bar v={m.v} max={m.t} c={m.c} />
              <div style={{ fontSize: 8, color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace", textAlign: 'right', marginTop: 1 }}>/ {m.t}g</div>
            </div>
          ))}
        </div>
      </div>

      {/* Session & Burned Calories */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
        {sSes && (
          <div style={{ background: 'var(--si)', border: '1px solid var(--sb)', borderRadius: 7, padding: '7px 10px', marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 16 }}>🏋️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{sSes.title}</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {[sSes.type, sSes.duree + 'min', sSes.calories > 0 ? '🔥' + sSes.calories + 'kcal' : null].filter(Boolean).map((t, i) => (
                  <span key={i} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)', fontFamily: "'JetBrains Mono', monospace" }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface2)', borderRadius: 7, padding: '7px 10px' }}>
          <span style={{ fontSize: 16 }}>🔥</span>
          <span style={{ fontSize: 12, color: 'var(--muted)', flex: 1 }}>Calories brulees</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={10}
            value={sSes ? (sSes.calories > 0 ? sSes.calories : '') : (days[sel]?.cal || '')}
            placeholder="0"
            onChange={e => {
              const v = +e.target.value || 0;
              // setCalB logic handled in parent
              if (sSes) {
                const s = { ...sess, [sel]: { ...sSes, calories: v } };
                setSess(s);
                // localSet handled in parent
              }
            }}
            style={{ width: 90, padding: '5px 8px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace" }}
          />
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace" }}>kcal</span>
        </div>
      </div>

      {/* Meals Grid */}
      <div className="mg">
        {MEALS.map(slot => {
          const rows = gm(sel)[slot.id] || [];
          const mk = Math.round(rows.reduce((s: number, r: any) => {
            const f = afw[r.food];
            if (!f || !r.qty) return s;
            const g = gew(f, r.qty);
            return s + (g > 0 ? f.kcal * g / 100 : 0);
          }, 0));
          return (
            <div key={slot.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'visible' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', borderRadius: '10px 10px 0 0' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{slot.ic} {slot.l}</span>
                <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{mk > 0 ? mk + ' kcal' : '—'}</span>
              </div>
              {rows.map((row: any, idx: number) => (
                <FoodRow
                  key={slot.id + '-' + idx}
                  slot={slot}
                  row={row}
                  idx={idx}
                  afw={afw}
                  sel={sel}
                  updRow={updRow}
                  delRow={delRow}
                />
              ))}
              <div style={{ padding: '6px 8px' }}>
                <button
                  onClick={() => addRow(sel, slot.id)}
                  style={{ width: '100%', padding: '6px', fontSize: 12, border: '1px dashed var(--border)', borderRadius: 6, background: 'none', color: 'var(--muted)', cursor: 'pointer' }}
                >
                  + Ajouter un aliment
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Food */}
      {/* AddFood form can be moved here or kept in parent for now */}
    </div>
  );
};

function gew(f: any, q: number) {
  if (!f || !q || q <= 0) return 0;
  return f.unit === 'unit' ? q * (f.uw || 100) : q;
}
