import React, { useState, useEffect } from 'react';
import { Printer, Star, Building2 } from 'lucide-react';
import api from '../api/axios';

export default function Timetable() {
  const [filterBatch, setFilterBatch] = useState('all');
  const [filterLab, setFilterLab] = useState('all');
  const [labs, setLabs] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [batches, setBatches] = useState([]);
  const [days, setDays] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    api.get('/labs').then(res => { if (res.data?.success) setLabs(res.data.data); });
    api.get('/subjects').then(res => { if (res.data?.success) setSubjects(res.data.data); });
    api.get('/batches').then(res => { if (res.data?.success) setBatches(res.data.data); });
    api.get('/days').then(res => { if (res.data?.success) setDays(res.data.data); });
    api.get('/schedules').then(res => { if (res.data?.success) setSessions(res.data.data); });
  }, []);

  const filtered = sessions.filter(s =>
    (filterBatch === 'all' || s.batchId.toString() === filterBatch.toString()) &&
    (filterLab   === 'all' || s.labId.toString()   === filterLab.toString())
  );

  const dynamicTimeSlots = React.useMemo(() => {
    const slots = new Set();
    filtered.forEach(s => {
      if (s.slotLabel) slots.add(s.slotLabel);
    });
    return Array.from(slots).sort().map((label, idx) => ({ id: 'dyn_' + idx, slotLabel: label }));
  }, [filtered]);

  const cellKey = (day, slot) => `${day}|${slot}`;
  const sessionMap = {};
  filtered.forEach(s => {
    const k = cellKey(s.dayName, s.slotLabel);
    if (!sessionMap[k]) sessionMap[k] = [];
    sessionMap[k].push(s);
  });

  const batchMap = Object.fromEntries(batches.map(b => [b.id, b]));
  const subjectMap = Object.fromEntries(subjects.map(s => [s.id, s]));

  const colours = ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444'];
  const batchColour = {};
  batches.forEach((b, i) => { batchColour[b.id] = colours[i % colours.length]; });

  const printTimetable = () => window.print();

  return (
    <div style={styles.page} className="animate-in">
      <div style={styles.header} className="no-print">
        <div>
          <div className="section-title">Visual Grid</div>
          <h1 className="page-title">Timetable</h1>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)} style={{ width: 'auto' }}>
            <option value="all">All Batches</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.batchName}</option>)}
          </select>
          <select className="no-print border-rounded" value={filterLab} onChange={e => setFilterLab(e.target.value)} style={{ width: 'auto', background: 'var(--bg2)' }}>
            <option value="all">All Labs</option>
            {labs.map(l => <option key={l.id} value={l.id}>{l.labName}</option>)}
          </select>
          <button className="btn btn-secondary no-print" onClick={printTimetable} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Printer size={16} /> Print</button>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto', padding: 0, border: 'none' }}>
        <table style={{ minWidth: 800, borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              <th style={{ width: 100, position: 'sticky', left: 0, background: 'var(--bg)', zIndex: 1, borderBottom: '2px solid var(--border)' }}>Day / Slot</th>
              {dynamicTimeSlots.map(slot => <th key={slot.id} style={{ fontSize: 11, color: 'var(--text)', background: 'var(--bg)', borderBottom: '2px solid var(--border)' }}>{slot.slotLabel}</th>)}
            </tr>
          </thead>
          <tbody>
            {days.map((day, idx) => {
              const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day.dayName;
              return (
              <tr key={day.id} style={{ background: isToday ? 'rgba(195,18,18,0.03)' : (idx % 2 === 0 ? 'var(--card)' : 'var(--bg)') }}>
                <td style={{ fontWeight: 700, color: isToday ? 'var(--accent)' : 'var(--text2)', fontFamily: 'var(--mono)', fontSize: 13, position: 'sticky', left: 0, background: isToday ? 'rgba(195,18,18,0.1)' : 'inherit', zIndex: 1, padding: '16px', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {day.dayName.slice(0, 3).toUpperCase()} {isToday && <Star size={14} fill="var(--accent)" color="var(--accent)" />}
                </td>
                {dynamicTimeSlots.map(slot => {
                  const entries = sessionMap[cellKey(day.dayName, slot.slotLabel)] || [];
                  return (
                    <td key={slot.id} style={{ padding: '8px', verticalAlign: 'top', minWidth: 140, borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                      {entries.map(s => {
                        const batch = batchMap[s.batchId];
                        const subject = subjectMap[s.subjectId];
                        const col = batchColour[s.batchId] ?? 'var(--accent)';
                        return (
                          <div key={s.scheduleId} style={{ ...styles.cell, borderLeft: `4px solid ${col}`, background: `${col}18` }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: col, fontFamily: 'var(--sans)', letterSpacing: -0.3 }}>{s.batchName}</div>
                            <div style={{ fontSize: 12, color: 'var(--text)', marginTop: 4, fontWeight: 500 }}>{s.subjectCode}</div>
                            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}><span><Building2 size={12} /></span>{s.labName?.split(' —')[0]}</div>
                          </div>
                        );
                      })}
                    </td>
                  );
                })}
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="card no-print" style={{ marginTop: 24, boxShadow: 'none', background: 'var(--bg2)' }}>
        <div className="section-title">Batch Legend</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {batches.map(b => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: batchColour[b.id] }} />
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>{b.batchName} ({b.division})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '32px 40px', maxWidth: 1400, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  cell: { padding: '8px 10px', borderRadius: 6, marginBottom: 6, cursor: 'default', transition: 'transform 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
};
