import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { AlertTriangle, CheckCircle, Landmark, Users, Monitor } from 'lucide-react';

export default function Clashes() {
  const [batches, setBatches] = useState([]);
  const [labs, setLabs] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    api.get('/batches').then(res => { if (res.data?.success) setBatches(res.data.data); });
    api.get('/labs').then(res => { if (res.data?.success) setLabs(res.data.data); });
    api.get('/schedules').then(res => { if (res.data?.success) setSessions(res.data.data); });
  }, []);

  const batchMap = Object.fromEntries(batches.map(b => [b.id, b]));
  const labMap = Object.fromEntries(labs.map(l => [l.id, l]));

  // Detect lab clashes (same lab, overlapping time)
  const labClashes = [];
  for (let i = 0; i < sessions.length; i++) {
    for (let j = i + 1; j < sessions.length; j++) {
      const a = sessions[i], b = sessions[j];
      const overlaps = a.dayId === b.dayId && (a.startTime < b.endTime && a.endTime > b.startTime);
      if (overlaps && a.labId === b.labId) {
        labClashes.push({ type: 'Lab Conflict', sessionA: a, sessionB: b, detail: `${a.labName} is double-booked on ${a.dayName} at ${a.startTime.substring(0,5)}` });
      }
    }
  }

  // Detect batch clashes (same batch, overlapping time, DIFFERENT subject)
  const batchClashes = [];
  for (let i = 0; i < sessions.length; i++) {
    for (let j = i + 1; j < sessions.length; j++) {
      const a = sessions[i], b = sessions[j];
      const overlaps = a.dayId === b.dayId && (a.startTime < b.endTime && a.endTime > b.startTime);
      if (overlaps && a.batchId === b.batchId && a.subjectId !== b.subjectId) {
        batchClashes.push({ type: 'Batch Conflict', sessionA: a, sessionB: b, detail: `${a.batchName} has two conflicting sessions on ${a.dayName} at ${a.startTime.substring(0,5)}` });
      }
    }
  }

  // Detect capacity issues
  const capacityIssues = sessions.filter(s => {
    const batch = batchMap[s.batchId];
    const lab = labMap[s.labId];
    return batch && lab && batch.studentCount > lab.workingComputers;
  });

  const totalIssues = labClashes.length + batchClashes.length + capacityIssues.length;

  return (
    <div style={styles.page} className="animate-in">
      <div style={styles.header}>
        <div>
          <div className="section-title">Validation</div>
          <h1 className="page-title">Clash Detection</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {totalIssues === 0
            ? <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={14}/> No Issues Found</span>
            : <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={14}/> {totalIssues} Issue{totalIssues > 1 ? 's' : ''} Found</span>}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        {[
          { label: 'Lab Conflicts', count: labClashes.length, icon: <Landmark size={24} />, col: labClashes.length > 0 ? 'var(--danger)' : 'var(--success)' },
          { label: 'Batch Conflicts', count: batchClashes.length, icon: <Users size={24} />, col: batchClashes.length > 0 ? 'var(--danger)' : 'var(--success)' },
          { label: 'Capacity Issues', count: capacityIssues.length, icon: <Monitor size={24} />, col: capacityIssues.length > 0 ? 'var(--warning)' : 'var(--success)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ borderLeft: `3px solid ${s.col}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div className="section-title" style={{ margin: 0 }}>{s.label}</div>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
            </div>
            <div className="stat-number" style={{ color: s.col }}>{s.count}</div>
          </div>
        ))}
      </div>

      {/* Lab Clashes */}
      {labClashes.length > 0 && (
        <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--danger)' }}>
          <div className="section-title">Lab Conflicts</div>
          {labClashes.map((c, i) => <ClashRow key={i} c={c} />)}
        </div>
      )}

      {/* Batch Clashes */}
      {batchClashes.length > 0 && (
        <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--danger)' }}>
          <div className="section-title">Batch Conflicts</div>
          {batchClashes.map((c, i) => <ClashRow key={i} c={c} />)}
        </div>
      )}

      {/* Capacity Issues */}
      {capacityIssues.length > 0 && (
        <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--warning)' }}>
          <div className="section-title">Capacity Issues</div>
          {capacityIssues.map(s => {
            const batch = batchMap[s.batchId];
            const lab = labMap[s.labId];
            return (
              <div key={s.scheduleId} style={styles.clashRow}>
                <span style={{ display: 'flex', alignItems: 'center' }}><AlertTriangle size={20} color="var(--warning)" /></span>
                <div>
                  <div style={{ color: 'var(--warning)', fontWeight: 600, fontSize: 14 }}>
                    {batch?.batchName} → {lab?.labName}
                  </div>
                  <div style={{ color: 'var(--text3)', fontSize: 12, marginTop: 2 }}>
                    Batch strength ({batch?.studentCount}) exceeds functional PCs ({lab?.workingComputers}) — {s.dayName} at {s.startTime?.substring(0,5)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalIssues === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><CheckCircle size={48} color="var(--success)" /></div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--success)' }}>All Clear!</div>
          <div style={{ color: 'var(--text3)', marginTop: 8, fontSize: 14 }}>No conflicts or capacity issues detected in the current schedule.</div>
        </div>
      )}
    </div>
  );
}

function ClashRow({ c }) {
  return (
    <div style={styles.clashRow}>
      <span style={{ display: 'flex', alignItems: 'center' }}><AlertTriangle size={20} color="var(--danger)" /></span>
      <div>
        <div style={{ color: 'var(--danger)', fontWeight: 600, fontSize: 14 }}>{c.detail}</div>
        <div style={{ color: 'var(--text3)', fontSize: 12, marginTop: 2 }}>
          Session 1: {c.sessionA.batchName} · {c.sessionA.subjectCode} · {c.sessionA.labName}
          {' — '}
          Session 2: {c.sessionB.batchName} · {c.sessionB.subjectCode} · {c.sessionB.labName}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: 32, maxWidth: 1200 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 },
  clashRow: { display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid var(--border)' },
};
