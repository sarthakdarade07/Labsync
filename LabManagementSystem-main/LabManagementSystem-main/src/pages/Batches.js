import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { X, Plus, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Batches() {
  const { isAdmin } = useAuth();
  const [batches, setBatches] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [labs, setLabs] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ batchName: '', division: '', semester: 'SEM-3', studentCount: '', osRequirement: 'Any', labsPerWeek: 1, totalHours: '', startTime: '', endTime: '', subjectIds: [] });

  const fetchBatches = () => api.get('/batches').then(res => { if (res.data?.success) setBatches(res.data.data); });
  useEffect(() => { 
    fetchBatches(); 
    api.get('/labs').then(res => { if (res.data?.success) setLabs(res.data.data); });
    api.get('/subjects').then(res => { if (res.data?.success) setSubjects(res.data.data); });
  }, []);

  const uniqueOs = Array.from(new Set(labs.map(l => l.osType).filter(Boolean)));

  const startEdit = (b) => {
    setEditing(b.id);
    setShowAdd(true);
    setForm({
      batchName: b.batchName || '',
      division: b.division || '',
      semester: b.semester || 'SEM-3',
      studentCount: b.studentCount || '',
      osRequirement: b.osRequirement || 'Any',
      labsPerWeek: b.labsPerWeek || 1,
      totalHours: b.totalHours || '',
      startTime: b.startTime || '',
      endTime: b.endTime || '',
      subjectIds: b.subjects ? b.subjects.map(s => s.id) : []
    });
  };

  const cancelForm = () => {
    setShowAdd(false);
    setEditing(null);
    setForm({ batchName: '', division: '', semester: 'SEM-3', studentCount: '', osRequirement: 'Any', labsPerWeek: 1, totalHours: '', startTime: '', endTime: '', subjectIds: [] });
  };

  const saveBatch = async () => {
    if (!form.batchName) return;
    try {
      const payload = { ...form, programId: 1, academicYearId: 1 };
      if (!payload.startTime) payload.startTime = null;
      if (!payload.endTime) payload.endTime = null;
      if (!payload.studentCount) payload.studentCount = 30; // fallback default
      if (!payload.totalHours) payload.totalHours = null;
      if (!payload.labsPerWeek) payload.labsPerWeek = 1;

      if (editing) {
        const res = await api.put(`/batches/${editing}`, payload);
        if (res.data?.success) {
          cancelForm();
          fetchBatches();
        }
      } else {
        const res = await api.post('/batches', payload);
        if (res.data?.success) {
          cancelForm();
          fetchBatches();
        }
      }
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || e.message || "Error saving batch");
    }
  };

  const remove = async id => {
    try {
      if(window.confirm("Are you sure? This will fail if there are linked schedules or students.")) {
        await api.delete(`/batches/${id}`);
        fetchBatches();
      }
    } catch(e) {
      console.error("Delete Error:", e);
      alert(e.response?.data?.message || e.message || "Error deleting batch. It may have linked students or schedules.");
    }
  };

  return (
    <div style={styles.page} className="animate-in">
      <div style={styles.header}>
        <div>
          <div className="section-title">Academic Groups</div>
          <h1 className="page-title">Batches</h1>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => !showAdd ? setShowAdd(true) : cancelForm()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {showAdd ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add Batch</>}
          </button>
        )}
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 24, borderLeft: editing ? '3px solid var(--accent)' : '3px solid var(--success)' }}>
          <div className="section-title">{editing ? `Edit Batch #${editing}` : 'New Batch'}</div>
          <div className="grid-3" style={{ gap: 12, marginBottom: 14 }}>
            <div><label style={styles.label}>Batch Name</label><input placeholder="e.g. Batch A1" value={form.batchName} onChange={e => setForm(p => ({ ...p, batchName: e.target.value }))} /></div>
            <div><label style={styles.label}>Division</label><input placeholder="e.g. CSE-A" value={form.division} onChange={e => setForm(p => ({ ...p, division: e.target.value }))} /></div>
            <div><label style={styles.label}>Semester</label>
              <select value={form.semester} onChange={e => setForm(p => ({ ...p, semester: e.target.value }))}>
                <option value="SEM-1">SEM-1</option><option value="SEM-3">SEM-3</option><option value="SEM-5">SEM-5</option><option value="SEM-7">SEM-7</option>
              </select>
            </div>
            <div><label style={styles.label}>Strength</label><input type="number" placeholder="e.g. 30" value={form.studentCount} onChange={e => setForm(p => ({ ...p, studentCount: parseInt(e.target.value)||'' }))} /></div>
            <div><label style={styles.label}>OS Req</label>
              <select value={form.osRequirement} onChange={e => setForm(p => ({ ...p, osRequirement: e.target.value }))}>
                <option value="Any">Any</option>
                {uniqueOs.map(os => <option key={os} value={os}>{os}</option>)}
              </select>
            </div>
            <div><label style={styles.label}>Labs/Wk</label><input type="number" placeholder="e.g. 1" min="1" value={form.labsPerWeek} onChange={e => setForm(p => ({ ...p, labsPerWeek: parseInt(e.target.value)||1 }))} /></div>
            <div><label style={styles.label}>Total Hrs</label><input type="number" placeholder="e.g. 50" value={form.totalHours} onChange={e => setForm(p => ({ ...p, totalHours: parseInt(e.target.value) || '' }))} /></div>
            <div><label style={styles.label}>Start Time</label><input type="time" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} /></div>
            <div><label style={styles.label}>End Time</label><input type="time" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} /></div>
            
            <div style={{ gridColumn: '1 / -1' }}><label style={styles.label}>Mapped Subjects (Select multiple)</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', border: '1px solid var(--border)', padding: 12, borderRadius: 8, maxHeight: 150, overflowY: 'auto' }}>
                {subjects.map(s => (
                  <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, background: 'var(--bg2)', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.subjectIds.includes(s.id)} onChange={e => {
                      const checked = e.target.checked;
                      setForm(p => ({ ...p, subjectIds: checked ? [...p.subjectIds, s.id] : p.subjectIds.filter(id => id !== s.id) }));
                    }} />
                    {s.subjectCode}
                  </label>
                ))}
                {subjects.length === 0 && <div style={{ fontSize: 13, color: 'var(--text3)' }}>No subjects available.</div>}
              </div>
            </div>
    
          </div>
          <button className="btn btn-primary" onClick={saveBatch}>{editing ? 'Save Changes' : 'Add Batch'}</button>
        </div>
      )}

      <div className="card">
        <div className="section-title">All Batches — {batches.length} groups</div>
        <table>
          <thead><tr><th>Batch ID</th><th>Name</th><th>Division</th><th>Year</th><th>Strength</th><th>OS</th><th>Subjects</th><th>Labs/Wk</th><th>Time (Start-End) / Hrs</th>{isAdmin && <th>Actions</th>}</tr></thead>
          <tbody>
            {batches.map(b => (
              <tr key={b.id}>
                <td style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>{b.id}</td>
                <td style={{ color: 'var(--text)', fontWeight: 600 }}>{b.batchName}</td>
                <td>{b.division}</td>
                <td><span className="badge badge-info">{b.semester}</span></td>
                <td style={{ fontFamily: 'var(--mono)' }}>{b.studentCount}</td>
                <td><span className="badge">{b.osRequirement || 'Any'}</span></td>
                <td style={{ fontSize: 12, color: 'var(--text2)', maxWidth: 150 }}>{b.subjects && b.subjects.length > 0 ? b.subjects.map(s => s.subjectCode).join(', ') : 'None'}</td>
                <td style={{ textAlign: 'center' }}>{b.labsPerWeek || 1}</td>
                <td style={{ fontSize: 13 }}>
                  {(!b.startTime || b.startTime === '00:00:00' || b.startTime === '00:00') ? 'Any' : b.startTime.substring(0,5)} - 
                  {(!b.endTime || b.endTime === '00:00:00' || b.endTime === '00:00') ? 'Any' : b.endTime.substring(0,5)} 
                  ({b.totalHours ? b.totalHours + 'h' : 'N/A'})
                </td>
    
                {isAdmin && (
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => startEdit(b)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit"><Edit2 size={14} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(b.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Remove"><X size={14} /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
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
};

