import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getStudents,
  getSchools,
  getSchoolSubLevels,
  recordStudentAttendance,
  updateStudentAttendance,
  deleteStudentAttendance,
  listStudentAttendanceByStudentRange,
  getErrorMessage,
} from '../api/client';

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'Present', short: 'P', color: '#3e7430', bg: '#f0f9eb' },
  { value: 'ABSENT',  label: 'Absent',  short: 'A', color: '#c0392b', bg: '#fff0f0' },
  { value: 'LATE',    label: 'Late',    short: 'L', color: '#e07b00', bg: '#fff8e6' },
  { value: 'EXCUSED', label: 'Excused', short: 'E', color: '#7f8c8d', bg: '#f7f9fc' },
];

const getWorkdays = (monthStr) => {
  const [year, mon] = monthStr.split('-').map(Number);
  const days = [];
  const d = new Date(year, mon - 1, 1);
  while (d.getMonth() === mon - 1) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) {
      days.push({
        dateStr: d.toISOString().slice(0, 10),
        label: d.getDate(),
        dayName: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      });
    }
    d.setDate(d.getDate() + 1);
  }
  return days;
};

const StudentAttendance = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const [schoolId, setSchoolId]       = useState(searchParams.get('school_id') || '');
  const [sublevelId, setSublevelId]   = useState(searchParams.get('sublevel_id') || '');
  const [schools, setSchools]         = useState([]);
  const [sublevels, setSublevels]     = useState([]);
  const [month, setMonth]             = useState(currentMonth);
  const [studentList, setStudentList] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading]         = useState({ students: false, attendance: false });
  const [error, setError]             = useState('');
  const [modal, setModal]             = useState({ open: false, studentId: null, dateStr: null });
  const [submitting, setSubmitting]   = useState(false);

  const workdays = getWorkdays(month);

  /* ── Load Schools ── */
  const loadSchools = useCallback(async () => {
    try {
      const res = await getSchools();
      const list = Array.isArray(res.data) ? res.data : (res.data?.schools ?? res.data?.data ?? []);
      setSchools(list);
    } catch { /* non-fatal */ }
  }, []);

  useEffect(() => { loadSchools(); }, [loadSchools]);

  /* ── Load Sublevels when school changes ── */
  useEffect(() => {
    if (!schoolId) { setSublevels([]); setSublevelId(''); return; }
    getSchoolSubLevels(schoolId)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.sub_levels ?? res.data?.data ?? []);
        setSublevels(list);
      })
      .catch(() => setSublevels([]));
  }, [schoolId]);

  /* ── Load Students + Attendance when filters change ── */
  useEffect(() => {
    if (!schoolId) return;
    let active = true;
    const fetchAll = async () => {
      setLoading((p) => ({ ...p, students: true, attendance: true }));
      setError('');
      try {
        const params = { school_id: schoolId };
        if (sublevelId) params.sub_level_id = sublevelId;
        const res = await getStudents(1, 300, params);
        const list = Array.isArray(res.data) ? res.data : (res.data?.students ?? res.data?.data ?? []);
        if (!active) return;
        setStudentList(list);

        if (!list.length) {
          setAttendanceMap({});
          setLoading((p) => ({ ...p, students: false, attendance: false }));
          return;
        }

        const [year, mon] = month.split('-').map(Number);
        const lastDay = new Date(year, mon, 0).getDate();
        const from = `${year}-${String(mon).padStart(2, '0')}-01`;
        const to   = `${year}-${String(mon).padStart(2, '0')}-${lastDay}`;

        const map = {};
        const ranges = list.map((s) => listStudentAttendanceByStudentRange(s.id, from, to));
        const results = await Promise.all(ranges);

        results.forEach((r, idx) => {
          const sId = list[idx].id;
          const records = r.data?.data || r.data || [];
          map[sId] = {};
          records.forEach((rec) => {
            const d = rec.attendance_date
              ? new Date(rec.attendance_date).toISOString().slice(0, 10)
              : '';
            if (d) map[sId][d] = { id: rec.id, status: rec.status };
          });
        });

        if (active) {
          setAttendanceMap(map);
          setLoading((p) => ({ ...p, students: false, attendance: false }));
        }
      } catch (e) {
        if (active) {
          setError(getErrorMessage(e, 'Failed to load attendance data'));
          setLoading((p) => ({ ...p, students: false, attendance: false }));
        }
      }
    };
    fetchAll();
    return () => { active = false; };
  }, [schoolId, sublevelId, month]);

  const recordedBy = user?.first_name && user?.last_name
    ? `${user.first_name} ${user.last_name}`
    : user?.email || 'Admin';

  const openModal  = (studentId, dateStr) => setModal({ open: true, studentId, dateStr });
  const closeModal = () => { if (!submitting) setModal({ open: false, studentId: null, dateStr: null }); };

  const handleSave = async (status) => {
    if (!schoolId || !modal.studentId || !modal.dateStr) return;
    const { studentId, dateStr } = modal;
    setSubmitting(true);
    setError('');
    const current = attendanceMap[studentId]?.[dateStr];
    try {
      if (status === '') {
        if (current?.id) await deleteStudentAttendance(current.id);
        setAttendanceMap((prev) => {
          const next = { ...prev };
          if (next[studentId]) {
            const pNext = { ...next[studentId] };
            delete pNext[dateStr];
            next[studentId] = pNext;
          }
          return next;
        });
      } else if (current?.id) {
        const res = await updateStudentAttendance(current.id, { status, remarks: '' });
        const updatedId = res.data?.data?.id || current.id;
        setAttendanceMap((prev) => ({
          ...prev,
          [studentId]: { ...prev[studentId], [dateStr]: { id: updatedId, status } },
        }));
      } else {
        const res = await recordStudentAttendance({
          student_id: studentId,
          school_id: schoolId,
          date: `${dateStr}T00:00:00.000Z`,
          status,
          recorded_by: recordedBy,
        });
        const newId = res.data?.data?.id || '';
        setAttendanceMap((prev) => ({
          ...prev,
          [studentId]: { ...prev[studentId], [dateStr]: { id: newId, status } },
        }));
      }
      closeModal();
    } catch (e) {
      setError(getErrorMessage(e, 'Failed to save attendance'));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatus    = (sId, dateStr) => attendanceMap[sId]?.[dateStr]?.status || '';
  const statusStyle  = (status) => {
    const opt = STATUS_OPTIONS.find((o) => o.value === status);
    if (!opt) return { background: '#f4f4f5', color: '#71717a', text: '–' };
    return { background: opt.bg, color: opt.color, text: opt.short };
  };

  /* ── School selector screen ── */
  if (!schoolId) {
    return (
      <div style={{ padding: '32px 16px', maxWidth: 520, margin: '0 auto' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#0e1f38' }}>
          Student Attendance
        </h1>
        <p style={{ margin: '0 0 20px', color: '#666', fontSize: 14 }}>
          Select a school to register daily attendance for students.
        </p>
        <label style={labelStyle}>School</label>
        <select
          value={schoolId}
          onChange={(e) => { setSchoolId(e.target.value); setSublevelId(''); }}
          style={{ ...selectStyle, marginBottom: 16 }}
        >
          <option value="">— Select a school —</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        {!schools.length && (
          <p style={{ color: '#888', fontSize: 13 }}>No schools available yet.</p>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 16px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#0e1f38' }}>
          Student Attendance
        </h1>
        <p style={{ margin: 0, color: '#666', fontSize: 13 }}>
          Register daily attendance for workdays (Mon–Fri).
        </p>
      </div>

      {error && (
        <div style={{ background: '#fff0f0', border: '1.5px solid #f5b8b8', borderRadius: 10, padding: '12px 16px', color: '#c0392b', marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Filters bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', background: 'white', padding: '14px 16px', borderRadius: 12, border: '1.5px solid #e8edf3', marginBottom: 18, alignItems: 'center' }}>
        <div style={{ flex: '1 1 180px' }}>
          <label style={labelStyle}>School</label>
          <select
            value={schoolId}
            onChange={(e) => { setSchoolId(e.target.value); setSublevelId(''); }}
            style={selectStyle}
          >
            {schools.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: '1 1 180px' }}>
          <label style={labelStyle}>Class / Sublevel</label>
          <select
            value={sublevelId}
            onChange={(e) => setSublevelId(e.target.value)}
            style={selectStyle}
          >
            <option value="">— All classes —</option>
            {sublevels.map((sl) => (
              <option key={sl.id} value={sl.id}>{sl.name}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: '1 1 160px' }}>
          <label style={labelStyle}>Month</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{ ...selectStyle, colorScheme: 'light' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', paddingBottom: 2 }}>
          <button
            onClick={() => {
              const [y, m] = month.split('-').map(Number);
              const prev = new Date(y, m - 2, 1);
              setMonth(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`);
            }}
            style={iconBtnStyle}
          >‹</button>
          <button
            onClick={() => {
              const [y, m] = month.split('-').map(Number);
              const next = new Date(y, m, 1);
              setMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
            }}
            style={iconBtnStyle}
          >›</button>
        </div>
      </div>

      {/* Attendance grid */}
      <div style={{ background: 'white', border: '1.5px solid #e8edf3', borderRadius: 12, overflow: 'auto', marginBottom: 18 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `160px repeat(${workdays.length}, minmax(38px, 1fr))`,
            minWidth: workdays.length * 42 + 160,
          }}
        >
          {/* Header row */}
          <div style={{ position: 'sticky', left: 0, top: 0, zIndex: 3, background: '#f7f9fc', padding: '10px 12px', fontWeight: 700, fontSize: 12, color: '#0e1f38', borderBottom: '1.5px solid #e8edf3', borderRight: '1.5px solid #e8edf3' }}>
            Student
          </div>
          {workdays.map((d) => (
            <div
              key={d.dateStr}
              style={{ background: '#f7f9fc', padding: '6px 4px', textAlign: 'center', borderBottom: '1.5px solid #e8edf3', borderRight: '1.5px solid #e8edf3', color: '#0e1f38' }}
            >
              <div style={{ fontSize: 10, color: '#888', lineHeight: 1.2 }}>{d.dayName}</div>
              <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>{d.label}</div>
            </div>
          ))}

          {/* Loading state */}
          {loading.students && (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#666', fontSize: 14 }}>
              Loading students…
            </div>
          )}

          {/* Empty state */}
          {!loading.students && studentList.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#999', fontSize: 13 }}>
              No students found for this selection.
            </div>
          )}

          {/* Student rows */}
          {studentList.map((s) => (
            <>
              <div
                key={`name-${s.id}`}
                style={{ position: 'sticky', left: 0, zIndex: 1, background: 'white', padding: '10px 12px', borderBottom: '1px solid #e8edf3', borderRight: '1.5px solid #e8edf3', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 160 }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0e1f38', lineHeight: 1.3 }}>
                  {s.last_name}, {s.first_name}
                </div>
                <div style={{ fontSize: 11, color: '#888' }}>{s.enrollment_no || s.admission_no || ''}</div>
              </div>
              {workdays.map((d) => {
                const st = getStatus(s.id, d.dateStr);
                const styled = statusStyle(st);
                return (
                  <div
                    key={`${s.id}-${d.dateStr}`}
                    onClick={() => openModal(s.id, d.dateStr)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 4px', borderBottom: '1px solid #e8edf3', borderRight: '1px solid #f4f4f5', background: 'white', cursor: 'pointer', minHeight: 44 }}
                  >
                    <div
                      style={{ width: 34, height: 34, borderRadius: '50%', background: styled.background, color: styled.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, touchAction: 'manipulation', userSelect: 'none' }}
                    >
                      {styled.text}
                    </div>
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', fontSize: 12, color: '#555' }}>
        {STATUS_OPTIONS.map((opt) => (
          <span key={opt.value} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 14, height: 14, borderRadius: '50%', background: opt.bg, color: opt.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800 }}>
              {opt.short}
            </span>
            {opt.label}
          </span>
        ))}
      </div>

      {/* Bottom-sheet modal */}
      {modal.open && (
        <div
          onClick={closeModal}
          style={{ position: 'fixed', inset: 0, background: 'rgba(14,31,56,0.35)', zIndex: 900, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'white', width: '100%', maxWidth: 420, maxHeight: '85vh', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: '18px 16px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', zIndex: 901, overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Mark Attendance
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0e1f38', marginTop: 2 }}>
                  {modal.dateStr}
                </div>
              </div>
              <button
                onClick={closeModal}
                disabled={submitting}
                style={{ background: 'none', border: 'none', fontSize: 20, color: '#888', cursor: 'pointer', padding: 4 }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSave(opt.value)}
                  disabled={submitting}
                  style={{ padding: '18px 12px', borderRadius: 12, border: 'none', background: opt.bg, color: opt.color, fontWeight: 800, fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.6)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}>
                    {opt.short}
                  </span>
                  {opt.label}
                </button>
              ))}
              <button
                onClick={() => handleSave('')}
                disabled={submitting}
                style={{ padding: '18px 12px', borderRadius: 12, border: '1.5px solid #e8edf3', background: 'white', color: '#666', fontWeight: 700, fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}
              >
                Clear
              </button>
            </div>

            {submitting && (
              <div style={{ marginTop: 12, textAlign: 'center', fontSize: 12, color: '#666' }}>Saving…</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const labelStyle = {
  display: 'block', marginBottom: 4, fontSize: 11, fontWeight: 700, color: '#555',
  textTransform: 'uppercase', letterSpacing: '0.07em',
};

const selectStyle = {
  width: '100%', padding: '10px 12px', border: '1.5px solid #d8e0eb', borderRadius: 9,
  fontSize: 14, color: '#0e1f38', background: 'white', outline: 'none', fontFamily: 'inherit',
};

const iconBtnStyle = {
  width: 36, height: 36, borderRadius: 8, border: '1.5px solid #d8e0eb', background: 'white',
  color: '#0e1f38', fontSize: 18, fontWeight: 700, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

export default StudentAttendance;
