import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Plus, X, Search, AlertTriangle } from 'lucide-react';

export default function Schedule() {
  const { isAdmin } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [form, setForm] = useState({ batchId: '', subjectId: '', labId: '', staffId: '', dayId: '', startTime: '', endTime: '' });
  const [labs, setLabs] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [batches, setBatches] = useState([]);
  const [days, setDays] = useState([]);
  const [availableLabs, setAvailableLabs] = useState(null);

  useEffect(() => {
    api.get('/labs').then(res => { if (res.data?.success) setLabs(res.data.data); });
    api.get('/staff').then(res => { if (res.data?.success) setFaculty(res.data.data); });
    api.get('/subjects').then(res => { if (res.data?.success) setSubjects(res.data.data); });
    api.get('/batches').then(res => { if (res.data?.success) setBatches(res.data.data); });
    api.get('/days').then(res => { if (res.data?.success) setDays(res.data.data); });

    api.get('/schedules').then(res => { if (res.data?.success) setSessions(res.data.data); });
  }, []);

  const batchMap = Object.fromEntries(batches.map(b => [b.id, b]));
  const subjectMap = Object.fromEntries(subjects.map(s => [s.id, s]));
  const labMap = Object.fromEntries(labs.map(l => [l.id, l]));
  const facMap = Object.fromEntries(faculty.map(f => [f.id, f]));

  const detectClash = (f, excludeId = null) => {
    return sessions.filter(s => {
      if (s.scheduleId === excludeId) return false;
      const overlaps = s.dayId.toString() === f.dayId.toString() &&
         (s.startTime < f.endTime && s.endTime > f.startTime);
      if (!overlaps) return false;
      if (s.labId.toString() === f.labId.toString()) return true;
      if (f.staffId && s.staffId && s.staffId.toString() === f.staffId.toString()) return true;
      if (s.batchId.toString() === f.batchId.toString() && s.subjectId.toString() !== f.subjectId.toString()) return true;
      return false;
    });
  };

  const checkAvailability = async (e) => {
    e.preventDefault();
    if (!form.dayId || !form.startTime || !form.endTime) {
        alert("Please select Day, Start Time, and End Time first.");
        return;
    }
    const batch = batchMap[form.batchId];
    const capacity = batch ? (batch.studentCount || 1) : 1;
    const osType = batch ? (batch.osRequirement || '') : '';
    
    try {
        const res = await api.get('/labs/search-available', {
            params: {
                dayId: form.dayId,
                startTime: form.startTime,
                endTime: form.endTime,
                capacity: capacity,
                osType: osType
            }
        });
        if(res.data?.success) setAvailableLabs(res.data.data);
    } catch(err) {
        console.error("Availability Check Error:", err.response || err);
        alert(err.response?.data?.message || "Error checking availability");
    }
  };

  const addSession = async () => {
    const missing = [];
    if (!form.batchId) missing.push('Batch');
    if (!form.subjectId) missing.push('Subject');
    if (!form.dayId) missing.push('Day');
    if (!form.startTime) missing.push('Start Time');
    if (!form.endTime) missing.push('End Time');
    if (!form.labId) missing.push('Lab (from Find Available Labs)');
    
    if (missing.length > 0) return alert(`Fill all fields. Missing: ${missing.join(', ')}`);
    const clashes = detectClash(form);
    if (clashes.length > 0) {
      alert('Clash detected! This time slot or lab is already occupied.');
      return;
    }
    const batch = batchMap[form.batchId];
    const lab = labMap[form.labId];
    if (batch && lab && batch.studentCount > lab.workingComputers) {
      if (!window.confirm(`Batch strength (${batch.studentCount}) exceeds functional PCs (${lab.workingComputers}). Proceed anyway?`)) return;
    }
    try {
      const res = await api.post('/schedules', form);
      if (res.data?.success) {
        setShowAdd(false);
        setForm({ batchId: '', subjectId: '', labId: '', staffId: '', dayId: '', startTime: '', endTime: '' });
        setAvailableLabs(null);
        api.get('/schedules').then(r => { if(r.data?.success) setSessions(r.data.data); });
      }
    } catch(e) {
      alert(e.response?.data?.message || 'Error occurred while saving schedule');
    }
  };

  const remove = async id => {
    if(window.confirm('Are you sure you want to delete this session?')) {
      try {
        await api.delete(`/schedules/${id}`);
        api.get('/schedules').then(r => { if(r.data?.success) setSessions(r.data.data); });
      } catch(e) {
        console.error("Delete Error:", e);
        alert(e.response?.data?.message || e.message || "Error deleting session");
      }
    }
  };

  const handleAutoGenerate = async () => {
    if(!window.confirm('This will delete the current schedule and use the Genetic Algorithm to automatically generate an optimal timetable. Proceed?')) return;
    setIsGenerating(true);
    try {
      const res = await api.post('/admin/regenerate-timetable');
      if(res.data?.success) {
        alert(res.data.message);
        const r = await api.get('/schedules');
        if(r.data?.success) setSessions(r.data.data);
      }
    } catch(e) {
      alert(e.response?.data?.message || 'Error occurred during generation');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={styles.page} className="animate-in">
      <div style={styles.header}>
        <div>
          <div className="section-title">Session Planning</div>
          <h1 className="page-title">Schedule</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {isAdmin && (
            <button className="btn btn-secondary" onClick={handleAutoGenerate} disabled={isGenerating} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {isGenerating ? <><Sparkles size={16}/> Generating...</> : <><Sparkles size={16}/> Auto-Generate</>}
            </button>
          )}
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowAdd(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {showAdd ? <><X size={16}/> Cancel</> : <><Plus size={16}/> New Session</>}
            </button>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="section-title">New Lab Session</div>
          <div className="grid-3" style={{ gap: 14, marginBottom: 14 }}>
            <div>
              <label style={styles.label}>Batch</label>
              <select value={form.batchId} onChange={e => setForm(p => ({ ...p, batchId: e.target.value }))}>
                <option value="">Select batch</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.batchName} ({b.division})</option>)}
              </select>
            </div>
            <div>
              <label style={styles.label}>Subject</label>
              <select value={form.subjectId} onChange={e => setForm(p => ({ ...p, subjectId: e.target.value }))}>
                <option value="">Select subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.subjectCode} — {s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={styles.label}>Start Time</label>
              <input type="time" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)' }} />
            </div>
            <div>
              <label style={styles.label}>End Time</label>
              <input type="time" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)' }} />
            </div>
            <div>
              <label style={styles.label}>Faculty</label>
              <select value={form.staffId} onChange={e => setForm(p => ({ ...p, staffId: e.target.value }))}>
                <option value="">Select faculty</option>
                {faculty.map(f => <option key={f.id} value={f.id}>{f.fullName}</option>)}
              </select>
            </div>
            <div>
              <label style={styles.label}>Day</label>
              <select value={form.dayId} onChange={e => setForm(p => ({ ...p, dayId: e.target.value }))}>
                <option value="">Select day</option>
                {days.map(d => <option key={d.id} value={d.id}>{d.dayName}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={styles.label}>Lab {form.labId && labMap[form.labId] ? `(Selected: ${labMap[form.labId].labName})` : '(None Selected)'}</label>
                <button className="btn btn-secondary btn-sm" onClick={checkAvailability} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Search size={14}/> Find Available Labs</button>
              </div>
              {availableLabs && (
                <div style={{ marginTop: 10, background: 'var(--bg2)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }} className="animate-in">
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Available Labs <span style={{fontWeight:'normal',color:'var(--text3)'}}>(matching capacity & OS):</span></div>
                  {availableLabs.length === 0 ? <div style={{ fontSize: 13, color: 'var(--danger)' }}>No labs available for this time/batch criteria.</div> : null}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {availableLabs.map(l => (
                      <button key={l.id} className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', fontSize: 13, border: form.labId === l.id.toString() ? '1px solid var(--accent)' : undefined }} onClick={(e) => { e.preventDefault(); setForm(p => ({ ...p, labId: l.id.toString() })); }}>
                        {l.labName} ({l.workingComputers} PCs)
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          {form.batchId && form.labId && (() => {
            const b = batchMap[form.batchId]; const l = labMap[form.labId];
            if (b && l && b.studentCount > l.workingComputers)
              return <div style={styles.warn}><AlertTriangle size={16} style={{marginBottom: -3, marginRight: 6}}/> Batch strength ({b.studentCount}) exceeds available PCs ({l.workingComputers}) in this lab.</div>;
            return null;
          })()}
          <button className="btn btn-primary" onClick={addSession}>Schedule Session</button>
        </div>
      )}

      <div className="card">
        <div className="section-title">All Scheduled Sessions — {sessions.length} total</div>
        <table>
          <thead><tr><th>Batch</th><th>Subject</th><th>Faculty</th><th>Day</th><th>Time</th><th>Lab</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {sessions.map(s => {
              const hasClash = detectClash(s, s.scheduleId).length > 0;
              return (
                <tr key={s.scheduleId}>
                  <td style={{ color: 'var(--text)', fontWeight: 600 }}>{s.batchName}</td>
                  <td>{s.subjectCode}</td>
                  <td>{s.staffName}</td>
                  <td>{s.dayName}</td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{s.startTime?.substring(0,5)} - {s.endTime?.substring(0,5)}</td>
                  <td>{s.labName?.split(' —')[0]}</td>
                  <td>
                    {hasClash
                      ? <span className="badge badge-danger">CLASH</span>
                      : <span className="badge badge-success">Confirmed</span>}
                  </td>
                  <td>
                    {isAdmin && (
                      <button className="btn btn-danger btn-sm" onClick={() => remove(s.scheduleId)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: 32, maxWidth: 1200 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 },
  label: { display: 'block', fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text3)', marginBottom: 6 },
  warn: { background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: 'var(--warning)', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 12 },
};
