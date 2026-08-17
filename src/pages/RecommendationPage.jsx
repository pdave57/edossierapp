import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * RecommendationsPage
 * ───────────────────
 * Calls GET /api/v1/recommendations (your Go handler),
 * which in turn calls the Python ML service and returns the
 * RecommendResponse shape.
 *
 * Uses the existing api/client.js getRecommendations() function.
 */

import { getRecommendations } from '../api/client';

// ── Constants ─────────────────────────────────────────────────────────────────

const TIER_CONFIG = {
  Critical: { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', dot: '#DC2626' },
  High:     { bg: '#FFF7ED', border: '#FED7AA', text: '#92400E', dot: '#F97316' },
  Medium:   { bg: '#FEFCE8', border: '#FEF08A', text: '#713F12', dot: '#EAB308' },
  Low:      { bg: '#F0FDF4', border: '#BBF7D0', text: '#14532D', dot: '#22C55E' },
};

const SEVERITY_COLOR = {
  critical: '#DC2626',
  high:     '#F97316',
  medium:   '#EAB308',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StatBadge({ label, value, color }) {
  return (
    <div style={{
      background: 'white',
      border: `1px solid #E8EDE7`,
      borderRadius: '10px',
      padding: '16px 20px',
      minWidth: '110px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '28px', fontWeight: '700', color, fontFamily: 'Georgia, serif', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: '#5C5C54', marginTop: '5px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '.05em' }}>
        {label}
      </div>
    </div>
  );
}

function TierPill({ tier }) {
  const c = TIER_CONFIG[tier] || TIER_CONFIG.Low;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
      fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.06em',
      background: c.bg, border: `1.5px solid ${c.border}`, color: c.text,
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      {tier}
    </span>
  );
}

function AnomalyBadge() {
  return (
    <span title="Statistically anomalous vs peer schools (Isolation Forest)" style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 8px', borderRadius: '20px', fontSize: '10px',
      fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.06em',
      background: '#F5F3FF', border: '1.5px solid #DDD6FE', color: '#5B21B6',
    }}>
      ⚠ Anomaly
    </span>
  );
}

function FactorRow({ factor }) {
  const color = SEVERITY_COLOR[factor.severity] || '#888';
  return (
    <div style={{
      borderLeft: `3px solid ${color}`,
      paddingLeft: '12px',
      marginBottom: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: '700', fontSize: '13px', color: '#1A1A1A' }}>{factor.factor}</span>
        <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color }}>{factor.severity}</span>
      </div>
      <div style={{ fontSize: '12.5px', color: '#5C5C54', marginBottom: '4px' }}>{factor.value}</div>
      <div style={{ fontSize: '12.5px', color: '#3F7A2F', fontStyle: 'italic' }}>→ {factor.recommendation}</div>
    </div>
  );
}

function SchoolCard({ rec, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const c = TIER_CONFIG[rec.risk_tier] || TIER_CONFIG.Low;

  return (
    <div style={{
      background: 'white',
      border: `1px solid ${c.border}`,
      borderRadius: '10px',
      overflow: 'hidden',
      marginBottom: '12px',
    }}>
      {/* Card header — always visible */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          gap: '12px', padding: '14px 18px',
          background: c.bg, border: 'none', cursor: 'pointer',
          textAlign: 'left', flexWrap: 'wrap',
        }}
      >
        {/* Risk score circle */}
        <div style={{
          width: '46px', height: '46px', borderRadius: '50%',
          background: c.dot, display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ color: 'white', fontWeight: '800', fontSize: '14px' }}>
            {Math.round(rec.risk_score)}
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
            <span style={{ fontWeight: '700', fontSize: '14.5px', color: '#1A1A1A' }}>{rec.school_name}</span>
            <TierPill tier={rec.risk_tier} />
            {rec.anomaly && <AnomalyBadge />}
          </div>
          <div style={{ fontSize: '12px', color: '#5C5C54' }}>
            {[rec.lga, rec.zone, rec.level_type].filter(Boolean).join(' · ')}
          </div>
        </div>

        {/* Factor count badge */}
        <div style={{
          fontSize: '12px', fontWeight: '600', color: c.text,
          background: 'white', border: `1px solid ${c.border}`,
          borderRadius: '6px', padding: '4px 10px', flexShrink: 0,
        }}>
           {(rec.factors?.length ?? 0)} issue{(rec.factors?.length ?? 0) !== 1 ? 's' : ''}
        </div>

        <span style={{ color: c.text, fontSize: '18px', flexShrink: 0 }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {/* Expanded detail */}
      {open && (
        <div style={{ padding: '16px 18px' }}>
          {/* Summary */}
          <p style={{ fontSize: '13.5px', color: '#1A1A1A', marginBottom: '18px', lineHeight: 1.6 }}>
            {rec.summary}
          </p>

          {/* Risk score bar */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#5C5C54', marginBottom: '5px' }}>
              <span style={{ fontWeight: '600' }}>Risk Score</span>
              <span style={{ fontWeight: '700', color: c.dot }}>{rec.risk_score}/100</span>
            </div>
            <div style={{ height: '8px', background: '#E8EDE7', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '4px',
                width: `${rec.risk_score}%`,
                background: c.dot,
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>

          {/* Factors */}
          {(rec.factors?.length ?? 0) > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.08em', color: '#5C5C54', marginBottom: '12px' }}>
                Identified Issues & Recommendations
              </div>
              {(rec.factors ?? []).map((f, i) => (
                <FactorRow key={i} factor={f} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Filters ───────────────────────────────────────────────────────────────────

const TIERS = ['All', 'Critical', 'High', 'Medium', 'Low'];

// ── Main page ─────────────────────────────────────────────────────────────────

const RecommendationsPage = () => {
  const { token } = useAuth();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [tierFilter, setTierFilter] = useState('All');
  const [search, setSearch]     = useState('');
  const [sortBy, setSortBy]     = useState('risk_score'); // risk_score | name

  const fetchData = useCallback(async () => {
    if (!token) { setError('Login required.'); setLoading(false); return; }
    try {
      setLoading(true); setError('');
      const res = await getRecommendations();
      const payload = res.data?.data || res.data || {};
      setData({
        ...payload,
        recommendations: Array.isArray(payload.recommendations) ? payload.recommendations : [],
      });
    } catch (err) {
      console.error('Recommendations error:', err?.response?.data);

      const status = err?.response?.status ?? 'network error';
      const data   = err?.response?.data;

      // Unwrap Go's standard error envelope:
      // { success: false, error: { code: "...", message: "..." } }
      // or flat: { error: "...", message: "..." }
      const msg =
        (typeof data?.error?.message === 'string' ? data.error.message : null) ||
        (typeof data?.error           === 'string' ? data.error          : null) ||
        (typeof data?.message         === 'string' ? data.message        : null) ||
        (typeof data                  === 'string' ? data                : null) ||
        (typeof err?.message          === 'string' ? err.message         : null) ||
        'Unknown error';

      setError(`(${status}): ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = (data?.recommendations ?? [])
    .filter(r => tierFilter === 'All' || r.risk_tier === tierFilter)
    .filter(r =>
      !search ||
      r.school_name.toLowerCase().includes(search.toLowerCase()) ||
      (r.lga || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.zone || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) =>
      sortBy === 'risk_score'
        ? b.risk_score - a.risk_score
        : a.school_name.localeCompare(b.school_name)
    );

  // ── Loading ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#5C5C54' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
        <div style={{ fontWeight: '600' }}>Running facility analysis…</div>
        <div style={{ fontSize: '13px', marginTop: '6px' }}>
          ML model is scoring all schools against facility baselines
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '.1em', textTransform: 'uppercase', color: '#82C46C', marginBottom: '4px' }}>
          ML-Powered Analysis
        </div>
        <h1 style={{ margin: '0 0 6px', fontFamily: 'Georgia, serif', fontSize: '26px', color: '#3F7A2F' }}>
          School Facility Recommendations
        </h1>
        <p style={{ margin: 0, fontSize: '13.5px', color: '#5C5C54', lineHeight: 1.6 }}>
          Schools ranked by facility shortage risk score (0–100). Algorithm combines
          Isolation Forest anomaly detection with weighted risk scoring across staffing,
          infrastructure, curriculum, facilities, and academic performance.
        </p>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', color: '#92400E', padding: '14px 18px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <div>
            <div style={{ fontWeight: '700', marginBottom: '3px' }}>Recommendations unavailable</div>
            <div style={{ color: '#78350F' }}>{error}</div>
            <div style={{ marginTop: '6px', fontSize: '12px', color: '#92400E' }}>
              Check that the ML service is running and your Go handler is registered at <code style={{ background: '#FEF3C7', padding: '1px 5px', borderRadius: '3px' }}>GET /api/v1/recommendations</code>
            </div>
          </div>
          <button
            onClick={fetchData}
            style={{ flexShrink: 0, padding: '6px 14px', background: '#F97316', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
          >
            ↻ Retry
          </button>
        </div>
      )}

      {/* ── Summary stats ── */}
      {data && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '28px' }}>
          <StatBadge label="Total Schools" value={data.total_schools}    color="#1A1A1A" />
          <StatBadge label="Flagged"       value={data.flagged_schools}  color="#F97316" />
          <StatBadge label="Critical"      value={data.critical_count}   color="#DC2626" />
          <StatBadge label="High Risk"     value={data.high_count}       color="#F97316" />
          <StatBadge label="Filtered"      value={filtered.length}       color="#82C46C" />
        </div>
      )}

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <input
          type="text"
          placeholder="Search school, LGA, zone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: '180px', padding: '9px 14px',
            border: '1px solid #D8D2C2', borderRadius: '8px',
            fontSize: '13.5px', fontFamily: 'inherit',
            background: 'white', color: '#1A1A1A',
          }}
        />

        {/* Tier filter pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {TIERS.map(t => {
            const active = tierFilter === t;
            const c = TIER_CONFIG[t];
            return (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                style={{
                  padding: '6px 14px', borderRadius: '20px', border: '1.5px solid',
                  borderColor: active ? (c?.dot ?? '#82C46C') : '#D8D2C2',
                  background: active ? (c?.bg ?? '#F0FDF4') : 'white',
                  color: active ? (c?.text ?? '#14532D') : '#5C5C54',
                  fontWeight: active ? '700' : '500',
                  fontSize: '12px', cursor: 'pointer',
                }}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{
            padding: '9px 12px', border: '1px solid #D8D2C2',
            borderRadius: '8px', fontSize: '13px',
            background: 'white', fontFamily: 'inherit', color: '#1A1A1A',
          }}
        >
          <option value="risk_score">Sort: Risk Score</option>
          <option value="name">Sort: School Name</option>
        </select>

        {/* Refresh */}
        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            padding: '9px 16px', background: '#82C46C', color: '#16241A',
            border: 'none', borderRadius: '8px', fontWeight: '700',
            fontSize: '13px', cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* ── School cards ── */}
      {filtered.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#5C5C54', background: 'white', borderRadius: '10px', border: '1px solid #E8EDE7' }}>
          {data ? 'No schools match the current filter.' : 'No data yet.'}
        </div>
      ) : (
        filtered.map((rec, i) => (
          <SchoolCard
            key={rec.school_id}
            rec={rec}
            defaultOpen={i < 2 && rec.risk_tier === 'Critical'}
          />
        ))
      )}

      {/* ── Footer note ── */}
      <div style={{ marginTop: '28px', padding: '14px 18px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', fontSize: '12px', color: '#14532D' }}>
        <strong>Algorithm:</strong> Risk score is a weighted composite of 5 dimensions —
        staffing (30%), infrastructure (25%), curriculum (20%), facilities (15%), performance (10%).
        Isolation Forest (scikit-learn) flags schools that deviate significantly from the
        peer distribution across all dimensions. KMeans (k=4) assigns risk tiers from natural
        cluster boundaries in the score distribution.
      </div>
    </div>
  );
};

export default RecommendationsPage;