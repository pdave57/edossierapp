import { useEffect, useMemo, useState } from "react";
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
import { getDashboardStats, getZones, getZonalSummary } from "../api/client";
import { useAuth } from "../context/AuthContext";

/**
 * e-Dossier — State Education Register
 * Admin overview dashboard.
 *
 * Headline totals and zonal summary stats are fetched live from the backend.
 */

// Chart breakdown panels default/fallback data.
const MOCK_DATA = {
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

// UI-only period labels for the headline stat cards
const TOTAL_PERIODS = {
  schools: "this session",
  staff: "this session",
  students: "this session",
  zones: "active zones",
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

function safeDiv(num, den) {
  return den > 0 ? num / den : null;
}

function fmtRatio(numerator, denominator) {
  const ratio = safeDiv(numerator, denominator);
  return ratio == null ? "—" : `${formatNumber(ratio)}:1`;
}

function fmtPer(numerator, denominator, unit) {
  const value = safeDiv(numerator, denominator);
  return value == null ? "—" : `${formatNumber(value)} / ${unit}`;
}

// Report totals come back as `{ success: true, data: <int> }`.
function unwrapList(res, key) {
  const payload = res?.data;
  if (Array.isArray(payload)) return payload;
  const list = payload?.[key] ?? payload?.data;
  return Array.isArray(list) ? list : [];
}

function StatEntry({ icon: Icon, label, value, delta, period, secondary, accent }) {
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
        {secondary ? (
          <span className="stat-entry__secondary">{secondary}</span>
        ) : !isFlat ? (
          <span className={`stat-entry__delta ${isUp ? "is-up" : "is-down"}`}>
            {isUp ? (
              <ArrowUpRight size={13} strokeWidth={2.5} />
            ) : (
              <ArrowDownRight size={13} strokeWidth={2.5} />
            )}
            {Math.abs(delta)}%
          </span>
        ) : null}
        <span className="stat-entry__period">{period}</span>
      </div>
    </div>
  );
}

function ZonalTable({ rows }) {
  const [sortKey, setSortKey] = useState("schools");
  const validRows = Array.isArray(rows) ? rows : [];
  const sorted = useMemo(() => {
    return [...validRows].sort((a, b) => {
      const valA = parseFloat(a[sortKey]) || 0;
      const valB = parseFloat(b[sortKey]) || 0;
      return valB - valA;
    });
  }, [validRows, sortKey]);

  const max = Math.max(...validRows.map((r) => parseFloat(r.schools) || 0), 1);

  const columns = [
    { key: "schools", label: "Schools" },
    { key: "staff", label: "Teaching staff" },
    { key: "students", label: "Students" },
    { key: "ratio", label: "Pupil:teacher" },
  ];

  if (validRows.length === 0) {
    return (
      <div style={{ padding: "30px", textAlign: "center", color: COLORS.inkSoft, fontSize: "13px" }}>
        No zonal summary data available.
      </div>
    );
  }

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
          {sorted.map((r, idx) => (
            <tr key={r.zone || idx}>
              <td className="zonal-table__zone">
                <MapPin size={13} strokeWidth={2} color={COLORS.gold} />
                {r.zone}
              </td>
              <td>
                <div className="zonal-table__bar-cell">
                  <div className="zonal-table__bar-track">
                    <div
                      className="zonal-table__bar-fill"
                      style={{ width: `${Math.min(100, Math.max(0, ((parseFloat(r.schools) || 0) / max) * 100))}%` }}
                    />
                  </div>
                  <span>{formatNumber(r.schools || 0)}</span>
                </div>
              </td>
              <td>{formatNumber(r.staff || 0)}</td>
              <td>{formatNumber(r.students || 0)}</td>
              <td>
                <span className="zonal-table__ratio">{r.ratio ?? "—"}</span>
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
  const { schoolTypeSplit, zonalStats } = data;
  const [liveTotals, setLiveTotals] = useState(null);
  const [liveZonalStats, setLiveZonalStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [asOf, setAsOf] = useState(null);
  const { user } = useAuth();
  const authSchoolId = user?.school_id || user?.data?.school_id || null;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const [dashboardRes, zonesRes, zonalSummaryRes] = await Promise.allSettled([
          getDashboardStats(),
          getZones(user?.state_id),
          getZonalSummary(user?.state_id, authSchoolId),
        ]);

        if (cancelled) return;

        const count = (settled, label, unwrap) => {
          if (settled.status === "rejected") {
            console.error(`Failed to fetch total ${label}:`, settled.reason);
            return null;
          }
          return unwrap(settled.value);
        };

        const zonesList = count(zonesRes, "zones", unwrapList);
        const zonesCount = Array.isArray(zonesList) ? zonesList.length : null;

        const dashboardStats = count(dashboardRes, "dashboard", (res) => {
          const payload = res?.data?.data || res?.data || {};
          return {
            schools: typeof payload.total_schools === "number" ? payload.total_schools : null,
            students: typeof payload.total_students === "number" ? payload.total_students : null,
            staff: typeof payload.teaching_personnel === "number" ? payload.teaching_personnel : null,
          };
        });

        // Parse zonal summary data
        let zonalData = [];
        if (zonalSummaryRes.status === "fulfilled") {
          const raw = zonalSummaryRes.value?.data;
          const list = Array.isArray(raw)
            ? raw
            : (raw?.data ?? raw?.zones ?? raw?.summary ?? raw?.zonal_summary ?? raw?.result ?? []);
          if (Array.isArray(list) && list.length > 0) {
            zonalData = list.map((item) => {
              const zoneName = item.zone || item.zone_name || item.name || item.zonal_name || item.lga || item.lga_name || "—";
              const schools = Number(item.schools ?? item.total_schools ?? item.school_count ?? item.num_schools ?? 0);
              const staff = Number(item.staff ?? item.teaching_staff ?? item.total_personnel ?? item.personnel_count ?? item.staff_count ?? item.teachers ?? 0);
              const students = Number(item.students ?? item.total_students ?? item.student_count ?? item.num_students ?? item.pupils ?? 0);
              let ratio = item.ratio ?? item.pupil_teacher_ratio ?? item.ptr;
              if (ratio == null || ratio === "—" || ratio === "") {
                ratio = staff > 0 ? (students / staff).toFixed(1) : "—";
              }
              return { zone: zoneName, schools, staff, students, ratio };
            });
          }
        }

        // If zonal summary endpoint returned empty or failed, fallback to zonesList
        if (zonalData.length === 0 && Array.isArray(zonesList) && zonesList.length > 0) {
          zonalData = zonesList.map((z) => {
            const zoneName = z.name || z.zone_name || z.zone || "—";
            const schools = Number(z.total_schools ?? z.schools ?? 0);
            const staff = Number(z.teaching_staff ?? z.staff ?? z.total_personnel ?? 0);
            const students = Number(z.total_students ?? z.students ?? 0);
            const ratio = z.ratio ?? (staff > 0 ? (students / staff).toFixed(1) : "—");
            return { zone: zoneName, schools, staff, students, ratio };
          });
        }

        // Aggregate the per-zone zonal summary so the headline totals stay
        // consistent with the Zonal breakdown table. Used as a fallback when
        // the dedicated dashboard-stats endpoint returns an incomplete value.
        const aggregated = zonalData.reduce(
          (acc, z) => {
            acc.schools += Math.max(0, z.schools || 0);
            acc.staff += Math.max(0, z.staff || 0);
            acc.students += Math.max(0, z.students || 0);
            return acc;
          },
          { schools: 0, staff: 0, students: 0 }
        );

        const totalSchools = dashboardStats?.schools ?? aggregated.schools;
        const totalStaff = dashboardStats?.staff ?? aggregated.staff;
        const totalStudents = dashboardStats?.students ?? aggregated.students;
        const totalZones = zonesCount ?? (zonalData.length || null);

        setLiveTotals({
          schools: {
            value: totalSchools ?? 0,
            delta: 0,
            period: TOTAL_PERIODS.schools,
            secondary: fmtPer(totalStudents, totalSchools, "school"),
          },
          staff: {
            value: totalStaff ?? 0,
            delta: 0,
            period: TOTAL_PERIODS.staff,
            secondary: fmtRatio(totalStudents, totalStaff),
          },
          students: {
            value: totalStudents ?? 0,
            delta: 0,
            period: TOTAL_PERIODS.students,
            secondary: fmtPer(totalStudents, totalZones, "zone"),
          },
          zones: {
            value: totalZones ?? 0,
            delta: 0,
            period: TOTAL_PERIODS.zones,
            secondary: fmtPer(totalSchools, totalZones, "zone"),
          },
        });

        setAsOf(new Date());

        if (zonalData.length > 0) {
          setLiveZonalStats(zonalData);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load live dashboard stats.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Headline totals come straight from the backend (liveTotals). While loading,
  // show neutral zeroed placeholders so the stat cards render consistently.
  const totals = useMemo(() => {
    if (!liveTotals) {
      return {
        schools: { value: 0, delta: 0, period: TOTAL_PERIODS.schools, secondary: "—" },
        staff: { value: 0, delta: 0, period: TOTAL_PERIODS.staff, secondary: "—" },
        students: { value: 0, delta: 0, period: TOTAL_PERIODS.students, secondary: "—" },
        zones: { value: 0, delta: 0, period: TOTAL_PERIODS.zones, secondary: "—" },
      };
    }
    return liveTotals;
  }, [liveTotals]);

  const effectiveZonalStats = useMemo(() => {
    return liveZonalStats && liveZonalStats.length > 0 ? liveZonalStats : zonalStats;
  }, [liveZonalStats, zonalStats]);

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
        .stat-entry__secondary {
          font-variant-numeric: tabular-nums;
          font-weight: 600;
          color: ${COLORS.inkSoft};
        }
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

      {loading && (
        <div style={{ padding: "60px", textAlign: "center", color: COLORS.inkSoft }}>
          <div style={{ fontWeight: "600" }}>Loading dashboard...</div>
        </div>
      )}

      {!loading && error && (
        <div style={{ padding: "60px", textAlign: "center", color: COLORS.alert }}>
          <div style={{ fontWeight: "600", marginBottom: "8px" }}>Error loading dashboard</div>
          <div>{error}</div>
        </div>
      )}

      {!loading && !error && (
        <>
           <header className="register__header">
             <div className="register__title-block">
               <span className="register__eyebrow">e-Dossier ·Taraba State Ministry Of Education</span>
               <h1 className="register__title">Admin Overview</h1>
             </div>
             <span className="register__asof">
               Records as of{" "}
               {(asOf || new Date()).toLocaleDateString("en-GB", {
                 day: "numeric",
                 month: "short",
                 year: "numeric",
               })}
             </span>
           </header>

           <section className="stat-grid">
             <StatEntry
               icon={School}
               label="Registered Schools"
               value={totals.schools.value}
               delta={totals.schools.delta}
               period={totals.schools.period}
               secondary={totals.schools.secondary}
               accent={COLORS.primary}
             />
             <StatEntry
               icon={Users}
               label="Teaching staff"
               value={totals.staff.value}
               delta={totals.staff.delta}
               period={totals.staff.period}
               secondary={totals.staff.secondary}
               accent={COLORS.gold}
             />
             <StatEntry
               icon={GraduationCap}
               label="Enrolled students"
               value={totals.students.value}
               delta={totals.students.delta}
               period={totals.students.period}
               secondary={totals.students.secondary}
               accent={COLORS.primaryLight}
             />
             <StatEntry
               icon={MapPin}
               label="Zones covered"
               value={totals.zones.value}
               delta={totals.zones.delta}
               period={totals.zones.period}
               secondary={totals.zones.secondary}
               accent={COLORS.alert}
             />
           </section>

          <section className="panel-grid">
            <div className="panel">
              <div className="panel__heading">
                <h2 className="panel__title">Zonal breakdown</h2>
                <span className="panel__hint">Click a column to sort</span>
              </div>
              <ZonalTable rows={effectiveZonalStats} />
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
              <BarChart data={effectiveZonalStats} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
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
        </>
      )}
    </div>
  );
}