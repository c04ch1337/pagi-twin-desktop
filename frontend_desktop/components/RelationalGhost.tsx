import React, { useEffect, useMemo, useRef, useState } from 'react';
import { fmtCountdown, useRegulatoryBrake } from '../hooks/useRegulatoryBrake';
import { detectNvcBreaches, NvcBreach } from '../utils/nvcBreach';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type PersonaType = 'secure' | 'dismissive-avoidant' | 'anxious-preoccupied' | 'fearful-avoidant';

type GhostSimRequest = {
  script: string;
  persona_type: string;
  intensity_level: number;
  system_load?: number;
};

type GhostSimResponse = {
  success: boolean;
  persona: string;
  intensity_level: number;
  resonance_score: number;
  ghost_reply: string;
  flags: string[];
  suggestions: string[];
  breaches: NvcBreach[];
  risk_score: number;

  // Phase 16b: drift + mirror
  session_id: string;
  system_load_start: number;
  system_load_end: number;
  drift_delta: number;
  drift_alert: boolean;
  override_deescalate: boolean;
};

type ChatItem =
  | { id: string; role: 'user'; text: string }
  | {
      id: string;
      role: 'ghost';
      text: string;
      meta?: {
        resonance?: number;
        risk?: number;
        driftAlert?: boolean;
        driftDelta?: number;
        overrideDeescalate?: boolean;
      };
    };

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function uniqBreaches(items: NvcBreach[]) {
  const seen = new Set<string>();
  const out: NvcBreach[] = [];
  for (const it of items) {
    const k = `${it.kind}::${it.needle}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

export default function RelationalGhost() {
  const PHOENIX_API_BASE = useMemo(
    () => import.meta.env.VITE_PHOENIX_API_URL || 'http://localhost:8888',
    []
  );

  const brake = useRegulatoryBrake();

  const [systemLoad, setSystemLoad] = useState<number>(0);
  const [temperatureC, setTemperatureC] = useState<number | null>(null);
  const [heartbeat, setHeartbeat] = useState<Array<{ t: number; load: number }>>([]);
  const lastStressPollAtRef = useRef<number>(0);

  const [persona, setPersona] = useState<PersonaType>('secure');
  const [intensity, setIntensity] = useState(35);
  const [draft, setDraft] = useState(
    "When I notice our conversations getting tense after work, I feel overwhelmed because I need calm and connection. Would you be willing to do a 10-minute check-in tonight?"
  );
  const [chat, setChat] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localBreaches = useMemo(() => detectNvcBreaches(draft), [draft]);

  const aggressiveMode = intensity >= 70;

  // Biometric Mirror: poll system stress every 5 seconds.
  useEffect(() => {
    let alive = true;

    const poll = async () => {
      try {
        const res = await fetch(`${PHOENIX_API_BASE}/api/counselor/system-stress`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as {
          success: boolean;
          cpu_usage_percent: number;
          temperature_c?: number | null;
        };
        if (!alive) return;

        const load = Math.max(0, Math.min(100, Number(json.cpu_usage_percent ?? 0)));
        setSystemLoad(load);
        setTemperatureC(typeof json.temperature_c === 'number' ? json.temperature_c : null);

        const now = Date.now();
        lastStressPollAtRef.current = now;
        setHeartbeat((prev) => {
          const next = [...prev, { t: now, load }];
          // Keep ~2 minutes of points at 5s intervals.
          const cutoff = now - 2 * 60 * 1000;
          return next.filter((p) => p.t >= cutoff).slice(-48);
        });
      } catch {
        // no-op; keep last known values
      }
    };

    poll();
    const id = window.setInterval(poll, 5000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [PHOENIX_API_BASE]);

  const highLoad = systemLoad >= 85;
  const mediumLoad = systemLoad >= 70;

  const sendToGhost = async () => {
    const script = String(draft || '').trim();
    if (!script) return;

    setError(null);
    setLoading(true);

    const userId = uid();
    setChat((prev) => [...prev, { id: userId, role: 'user', text: script }]);

    const payload: GhostSimRequest = {
      script,
      persona_type: persona,
      intensity_level: Math.max(0, Math.min(100, Math.floor(intensity))),
      system_load: systemLoad,
    };

    try {
      const res = await fetch(`${PHOENIX_API_BASE}/api/counselor/ghost/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as GhostSimResponse;

      const ghostId = uid();
      setChat((prev) => [
        ...prev,
        {
          id: ghostId,
          role: 'ghost',
          text: data.ghost_reply,
          meta: {
            resonance: data.resonance_score,
            risk: data.risk_score,
            driftAlert: data.drift_alert,
            driftDelta: data.drift_delta,
            overrideDeescalate: data.override_deescalate,
          },
        },
      ]);

      // Stress-testing: if user cranks aggression and risk is high, trigger the regulatory brake.
      if (aggressiveMode && data.risk_score >= 85 && !brake.blocked) {
        // Deterministic mapping: 60–150 seconds.
        const seconds = Math.max(60, Math.min(150, 60 + (data.risk_score - 85) * 3));
        brake.startBrake(seconds);
      }
    } catch (e: any) {
      setError(e?.message || 'Ghost simulation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border-dark bg-panel-dark/70 p-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Relational Ghost</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">
            Practice your script • simulate recipient response • flag NVC breaches
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Ghost avatar / machine heartbeat indicator */}
          <div
            className={`size-7 rounded-full border flex items-center justify-center transition-all ${
              highLoad
                ? 'border-rose-500/50 bg-rose-500/15 shadow-[0_0_24px_rgba(244,63,94,0.35)] animate-pulse'
                : mediumLoad
                  ? 'border-amber-500/40 bg-amber-500/10 shadow-[0_0_18px_rgba(245,158,11,0.25)]'
                  : 'border-border-dark bg-black/20'
            }`}
            title={`Machine Heartbeat: ${systemLoad}% CPU${temperatureC != null ? ` • ${temperatureC.toFixed(1)}°C` : ''}`}
          >
            <span
              className={`material-symbols-outlined text-[16px] ${
                highLoad ? 'text-rose-300' : mediumLoad ? 'text-amber-200' : 'text-slate-300'
              }`}
            >
              psychology
            </span>
          </div>

          <div
            className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${
              aggressiveMode
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
            }`}
            title="Intensity setting (aggressive mode stress-tests brake)"
          >
            {aggressiveMode ? 'Aggressive' : 'Calm'}
          </div>
          {brake.blocked ? (
            <div
              className="px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest bg-rose-500/10 border-rose-500/30 text-rose-200 animate-pulse"
              title="Regulatory brake active"
            >
              Brake {fmtCountdown(brake.secondsLeft)}
            </div>
          ) : null}
        </div>
      </div>

      {/* Biometric Mirror */}
      <div className="mb-3 rounded-xl border border-border-dark bg-black/20 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Machine Heartbeat
            </div>
            <div className="text-xs text-slate-300 mt-1">
              system_load: <span className="font-mono text-slate-100">{systemLoad}%</span>
              {temperatureC != null ? (
                <>
                  {' '}
                  • temp: <span className="font-mono text-slate-100">{temperatureC.toFixed(1)}°C</span>
                </>
              ) : null}
            </div>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            poll=5s
          </div>
        </div>

        <div className="mt-2 h-[90px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={heartbeat} margin={{ top: 6, right: 10, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="ghostLoad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={highLoad ? '#fb7185' : mediumLoad ? '#f59e0b' : '#22c55e'} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={highLoad ? '#fb7185' : mediumLoad ? '#f59e0b' : '#22c55e'} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="t"
                hide
                domain={['auto', 'auto']}
                tickFormatter={(v) => new Date(v).toLocaleTimeString()}
              />
              <YAxis hide domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(0,0,0,0.85)',
                  border: '1px solid rgba(148,163,184,0.15)',
                  borderRadius: 12,
                  fontSize: 12,
                  color: '#e2e8f0',
                }}
                labelFormatter={(v) => new Date(Number(v)).toLocaleTimeString()}
                formatter={(v: any) => [`${v}%`, 'load']}
              />
              <Area
                type="monotone"
                dataKey="load"
                stroke={highLoad ? '#fb7185' : mediumLoad ? '#f59e0b' : '#22c55e'}
                fill="url(#ghostLoad)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-3">
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            className="w-full rounded-xl bg-black/30 border border-border-dark px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Paste your NVC script (or write one here)…"
          />

          <div className="flex items-center justify-between gap-3">
            <div className="text-[10px] text-slate-500 uppercase tracking-widest">
              Breaches detected: <span className="text-slate-200 font-mono">{localBreaches.length}</span>
            </div>
            <button
              onClick={sendToGhost}
              disabled={loading || !String(draft || '').trim()}
              className={`px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-colors ${
                loading
                  ? 'bg-black/30 border-border-dark text-slate-500'
                  : 'bg-primary/15 border-primary/30 text-primary hover:bg-primary/20'
              }`}
              title="Send to Ghost"
            >
              {loading ? 'Simulating…' : 'Send'}
            </button>
          </div>

          {error ? <div className="text-xs text-rose-300">{error}</div> : null}
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Persona
          </label>
          <select
            value={persona}
            onChange={(e) => setPersona(e.target.value as PersonaType)}
            className="w-full px-3 py-2 rounded-xl border text-xs font-bold uppercase tracking-widest bg-black/30 border-border-dark text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="secure">Secure</option>
            <option value="dismissive-avoidant">Dismissive-Avoidant</option>
            <option value="anxious-preoccupied">Anxious-Preoccupied</option>
            <option value="fearful-avoidant">Fearful-Avoidant</option>
          </select>

          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-3">
            Intensity ({intensity})
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="w-full"
          />

          <div className="text-[10px] text-slate-500">
            Tip: set ≥70 to stress-test. If risk ≥85, the brake auto-triggers.
          </div>
        </div>
      </div>

      {/* Breach list */}
      {localBreaches.length ? (
        <div className="mt-3 rounded-xl border border-border-dark bg-black/20 p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Structural Weaknesses</div>
          <div className="mt-2 space-y-2">
            {localBreaches.map((b) => (
              <div key={`${b.kind}-${b.needle}`} className="text-xs text-slate-200">
                <span className="font-mono text-[11px] text-rose-300">[{b.needle}]</span>{' '}
                <span className="text-slate-300">{b.message}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Chat transcript */}
      {chat.length ? (
        <div className="mt-3 rounded-xl border border-border-dark bg-black/20 p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Practice Transcript</div>
          <div className="mt-2 space-y-2">
            {chat.map((m) => (
              <div
                key={m.id}
                className={`rounded-xl border px-3 py-2 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'border-primary/30 bg-primary/10 text-slate-100'
                    : 'border-border-dark bg-panel-dark/40 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {m.role === 'user' ? 'You' : 'Ghost'}
                  </div>
                  {m.role === 'ghost' && m.meta ? (
                    <div className="text-[10px] text-slate-500 font-mono">
                      r={m.meta.resonance ?? '-'} • risk={m.meta.risk ?? '-'}
                      {typeof m.meta.driftDelta === 'number' ? ` • Δload=${m.meta.driftDelta}` : ''}
                      {m.meta.driftAlert ? ' • DRIFT!' : ''}
                      {m.meta.overrideDeescalate ? ' • DE-ESCALATED' : ''}
                    </div>
                  ) : null}
                </div>
                <div>{m.text}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

