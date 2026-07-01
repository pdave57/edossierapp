import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  School,
  Users,
  GraduationCap,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

/**
 * e-Dossier — State Education Register
 * Admin overview dashboard.
 *
 * Replace MOCK_DATA below with data fetched from your Go backend
 * (e.g. GET /api/v1/admin/dashboard/stats).
 */

const MOCK_DATA = {
  asOf: "26 Jun 2026",
  totals: {
    schools: { value: 1248, delta: 3.2, period: "this term" },
    staff: { value: 18420, delta: 1.4, period: "this term" },
    students: { value: 612340, delta: -0.6, period: "this term" },
    zones: { value: 6, delta: 0, period: "active zones" },
  },
  schoolTypeSplit: [
    { name: "Primary", value: 742 },
    { name: "Junior Secondary", value: 318 },
    { name: "Senior Secondary", value: 188 },
  ],
  zonalStats: [
    { zone: "Central-Zone", schools: 224, staff: 3120, students: 98_400, ratio: 31.5 },
    { zone: "North-Zone", schools: 211, staff: 2890, students: 104_600, ratio: 36.2 },
    { zone: "Southern-Zone", schools: 256, staff: 3980, students: 132_800, ratio: 33.4 },
  ],
};

const COLORS = {
  primary: "#82C46C",
  primaryText: "#3F7A2F",
  primaryLight: "#9ED389",
  gold: "#B8860B",
  paper: "#FAF7F0",
  sage: "#E8EDE7",
  ink: "#1A1A1A",
  inkSoft: "#5C5C54",
  alert: "#B33A3A",
  line: "#D8D2C2",
};

const PIE_COLORS = [COLORS.primary, COLORS.gold, COLORS.primaryLight];

function formatNumber(n) {
  return new Intl.NumberFormat("en-NG").format(n);
}

function StatEntry({ icon: Icon, label, value, delta, period, accent }) {
  const isUp = delta > 0;
  const isFlat = delta === 0;
  return (
    <div className="stat-entry">
      <div className="stat-entry__top">
        <span className="stat-entry__icon" style={{ background: accent }}>
          <Icon size={18} strokeWidth={2} color={COLORS.paper} />
        </span>
        <span className="stat-entry__label">{label}</span>
      </div>
      <div className="stat-entry__value">{formatNumber(value)}</div>
      <div className="stat-entry__rule" />
      <div className="stat-entry__foot">
        {!isFlat && (
          <span
            className={`stat-entry__delta ${isUp ? "is-up" : "is-down"}`}
          >
            {isUp ? (
              <ArrowUpRight size={13} strokeWidth={2.5} />
            ) : (
              <ArrowDownRight size={13} strokeWidth={2.5} />
            )}
            {Math.abs(delta)}%
          </span>
        )}
        <span className="stat-entry__period">{period}</span>
      </div>
    </div>
  );
}

function ZonalTable({ rows }) {
  const [sortKey, setSortKey] = useState("schools");
  const sorted = useMemo(
    () => [...rows].sort((a, b) => b[sortKey] - a[sortKey]),
    [rows, sortKey]
  );
  const max = Math.max(...rows.map((r) => r.schools));

  const columns = [
    { key: "schools", label: "Schools" },
    { key: "staff", label: "Teaching staff" },
    { key: "students", label: "Students" },
    { key: "ratio", label: "Pupil:teacher" },
  ];

  return (
    <div className="zonal-table-wrap">
      <table className="zonal-table">
        <thead>
          <tr>
            <th className="zonal-table__zone-head">Zone</th>
            {columns.map((c) => (
              <th
                key={c.key}
                onClick={() => setSortKey(c.key)}
                className={sortKey === c.key ? "is-active" : ""}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.zone}>
              <td className="zonal-table__zone">
                <MapPin size={13} strokeWidth={2} color={COLORS.gold} />
                {r.zone}
              </td>
              <td>
                <div className="zonal-table__bar-cell">
                  <div className="zonal-table__bar-track">
                    <div
                      className="zonal-table__bar-fill"
                      style={{ width: `${(r.schools / max) * 100}%` }}
                    />
                  </div>
                  <span>{formatNumber(r.schools)}</span>
                </div>
              </td>
              <td>{formatNumber(r.staff)}</td>
              <td>{formatNumber(r.students)}</td>
              <td>
                <span className="zonal-table__ratio">{r.ratio}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__label">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="chart-tooltip__row">
          <span>{p.name}</span>
          <strong>{formatNumber(p.value)}</strong>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard({ data = MOCK_DATA }) {
  const { totals, schoolTypeSplit, zonalStats } = data;

  return (
    <div className="register">
      <style>{`
        .register {
          --paper: ${COLORS.paper};
          --ink: ${COLORS.ink};
          background: var(--paper);
          color: var(--ink);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          padding: 32px;
          min-height: 100%;
          box-sizing: border-box;
        }
        .register * { box-sizing: border-box; }

        .register__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          border-bottom: 2px solid ${COLORS.primary};
          padding-bottom: 16px;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .register__title-block { display: flex; flex-direction: column; gap: 4px; }
        .register__eyebrow {
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${COLORS.gold};
          font-weight: 600;
        }
        .register__title {
          font-family: 'Source Serif Pro', Georgia, serif;
          font-size: 28px;
          font-weight: 600;
          margin: 0;
          color: ${COLORS.primaryText};
        }
        .register__asof {
          font-size: 12px;
          color: ${COLORS.inkSoft};
          font-variant-numeric: tabular-nums;
        }

        .stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        @media (max-width: 900px) {
          .stat-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 520px) {
          .stat-grid { grid-template-columns: 1fr; }
        }

        .stat-entry {
          background: white;
          border: 1px solid ${COLORS.line};
          border-radius: 4px;
          padding: 18px 18px 14px;
          position: relative;
        }
        .stat-entry__top {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
        }
        .stat-entry__icon {
          width: 30px;
          height: 30px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .stat-entry__label {
          font-size: 12.5px;
          font-weight: 600;
          color: ${COLORS.inkSoft};
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .stat-entry__value {
          font-family: 'Source Serif Pro', Georgia, serif;
          font-size: 34px;
          font-weight: 600;
          line-height: 1;
          color: ${COLORS.ink};
          font-variant-numeric: tabular-nums;
        }
        .stat-entry__rule {
          height: 1px;
          background: ${COLORS.line};
          margin: 12px 0 10px;
        }
        .stat-entry__foot {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }
        .stat-entry__delta {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 3px;
        }
        .stat-entry__delta.is-up { color: ${COLORS.primaryText}; background: ${COLORS.sage}; }
        .stat-entry__delta.is-down { color: ${COLORS.alert}; background: #F7E9E9; }
        .stat-entry__period { color: ${COLORS.inkSoft}; }

        .panel-grid {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }
        @media (max-width: 900px) {
          .panel-grid { grid-template-columns: 1fr; }
        }

        .panel {
          background: white;
          border: 1px solid ${COLORS.line};
          border-radius: 4px;
          padding: 20px 22px;
        }
        .panel__heading {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .panel__title {
          font-family: 'Source Serif Pro', Georgia, serif;
          font-size: 17px;
          font-weight: 600;
          margin: 0;
          color: ${COLORS.primaryText};
        }
        .panel__hint {
          font-size: 11.5px;
          color: ${COLORS.inkSoft};
        }

        .zonal-table-wrap { overflow-x: auto; }
        .zonal-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .zonal-table th {
          text-align: left;
          padding: 0 10px 10px 0;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: ${COLORS.inkSoft};
          border-bottom: 1px solid ${COLORS.line};
          cursor: pointer;
          font-weight: 600;
          white-space: nowrap;
        }
        .zonal-table th.is-active { color: ${COLORS.primaryText}; }
        .zonal-table__zone-head { width: 110px; }
        .zonal-table td {
          padding: 11px 10px 11px 0;
          border-bottom: 1px solid ${COLORS.sage};
          white-space: nowrap;
        }
        .zonal-table tr:last-child td { border-bottom: none; }
        .zonal-table__zone {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
        }
        .zonal-table__bar-cell {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 160px;
        }
        .zonal-table__bar-track {
          flex: 1;
          height: 6px;
          background: ${COLORS.sage};
          border-radius: 3px;
          overflow: hidden;
        }
        .zonal-table__bar-fill {
          height: 100%;
          background: ${COLORS.primary};
          border-radius: 3px;
        }
        .zonal-table__ratio {
          font-variant-numeric: tabular-nums;
          color: ${COLORS.inkSoft};
        }

        .chart-tooltip {
          background: ${COLORS.ink};
          color: ${COLORS.paper};
          padding: 8px 10px;
          border-radius: 4px;
          font-size: 12px;
        }
        .chart-tooltip__label { font-weight: 600; margin-bottom: 4px; }
        .chart-tooltip__row { display: flex; justify-content: space-between; gap: 10px; }

        .legend-row {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          margin-top: 14px;
          font-size: 12px;
        }
        .legend-row__item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: ${COLORS.inkSoft};
        }
        .legend-row__dot {
          width: 9px;
          height: 9px;
          border-radius: 2px;
        }
      `}</style>

      <header className="register__header">
        <div className="register__title-block">
          <span className="register__eyebrow">e-Dossier ·Taraba State Ministry Of Education</span>
          <h1 className="register__title">Admin Overview</h1>
        </div>
        <span className="register__asof">Records as of {data.asOf}</span>
      </header>

      <section className="stat-grid">
        <StatEntry
          icon={School}
          label="Registered schools"
          value={totals.schools.value}
          delta={totals.schools.delta}
          period={totals.schools.period}
          accent={COLORS.primary}
        />
        <StatEntry
          icon={Users}
          label="Teaching staff"
          value={totals.staff.value}
          delta={totals.staff.delta}
          period={totals.staff.period}
          accent={COLORS.gold}
        />
        <StatEntry
          icon={GraduationCap}
          label="Enrolled students"
          value={totals.students.value}
          delta={totals.students.delta}
          period={totals.students.period}
          accent={COLORS.primaryLight}
        />
        <StatEntry
          icon={MapPin}
          label="Zones covered"
          value={totals.zones.value}
          delta={totals.zones.delta}
          period={totals.zones.period}
          accent={COLORS.alert}
        />
      </section>

      <section className="panel-grid">
        <div className="panel">
          <div className="panel__heading">
            <h2 className="panel__title">Zonal breakdown</h2>
            <span className="panel__hint">Click a column to sort</span>
          </div>
          <ZonalTable rows={zonalStats} />
        </div>

        <div className="panel">
          <div className="panel__heading">
            <h2 className="panel__title">Schools by type</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={schoolTypeSplit}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                stroke="white"
                strokeWidth={2}
              >
                {schoolTypeSplit.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="legend-row">
            {schoolTypeSplit.map((s, i) => (
              <span className="legend-row__item" key={s.name}>
                <span
                  className="legend-row__dot"
                  style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                />
                {s.name} · {formatNumber(s.value)}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel__heading">
          <h2 className="panel__title">Students enrolled, by zone</h2>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={zonalStats} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={COLORS.line} />
            <XAxis
              dataKey="zone"
              tick={{ fontSize: 12, fill: COLORS.inkSoft }}
              axisLine={{ stroke: COLORS.line }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: COLORS.inkSoft }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v / 1000}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: COLORS.sage }} />
            <Bar dataKey="students" name="Students" fill={COLORS.primary} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}