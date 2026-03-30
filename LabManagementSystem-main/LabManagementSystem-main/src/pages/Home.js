import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import logoImage from "../assests/Logo/labsyn.png";

export default function Home() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const res = await api.get('/schedules/public');
        if (res.data?.success) {
          setSchedules(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load public schedules", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedules();
  }, []);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Group by day Name -> Lab -> array of sessions
  const grouped = {};
  daysOfWeek.forEach(d => { grouped[d] = {}; });
  
  schedules.forEach(s => {
      const day = s.dayName;
      const lab = s.labName;
      if (!grouped[day]) grouped[day] = {};
      if (!grouped[day][lab]) grouped[day][lab] = [];
      grouped[day][lab].push(s);
  });

  return (
    <div style={styles.container} className="animate-in">
      <header style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.icon}></div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, color: "var(--text)" }}>
              LabSync
            </h1>
            <div style={{ fontSize: 12, color: "var(--text3)" }}>
              Public Schedule Portal
            </div>
          </div>
        </div>
        <Link
          to="/login"
          className="btn btn-primary"
          style={{ display: "inline-flex", alignItems: "center", height: 40 }}>
          Admin / Staff Login
        </Link>
      </header>

      <main style={styles.main}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2
            style={{
              fontSize: 32,
              fontWeight: 700,
              margin: "0 0 12px 0",
              color: "var(--text)",
            }}>
            Weekly Lab Timetable
          </h2>
          <p style={{ color: "var(--text2)", fontSize: 16 }}>
            Check upcoming lab sessions and availability.
          </p>
        </div>

        {loading ?
          <div
            style={{ textAlign: "center", padding: 40, color: "var(--text3)" }}>
            Loading schedule...
          </div>
        : schedules.length === 0 ?
          <div
            className="card"
            style={{ textAlign: "center", padding: 40, color: "var(--text3)" }}>
            No sessions scheduled yet.
          </div>
        : <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {daysOfWeek.map((day) => {
              const labs = Object.keys(grouped[day]);
              if (labs.length === 0) return null;

              return (
                <div key={day} className="card">
                  <h3
                    style={{
                      margin: "0 0 20px",
                      fontSize: 20,
                      color: "var(--accent)",
                      borderBottom: "1px solid var(--border)",
                      paddingBottom: 10,
                    }}>
                    {day}
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gap: 20,
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(300px, 1fr))",
                    }}>
                    {labs.map((lab) => {
                      const sessions = grouped[day][lab].sort((a, b) =>
                        (a.startTime || "").localeCompare(b.startTime || ""),
                      );

                      return (
                        <div
                          key={lab}
                          style={{
                            background: "var(--bg)",
                            borderRadius: 12,
                            padding: 16,
                            border: "1px solid var(--border)",
                          }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 16,
                              marginBottom: 16,
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}>
                            <span
                              style={{
                                background: "var(--accent2)",
                                color: "var(--accent)",
                                width: 24,
                                height: 24,
                                borderRadius: 6,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                              }}>
                              💻
                            </span>
                            {lab}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 12,
                            }}>
                            {sessions.map((s) => (
                              <div
                                key={s.scheduleId}
                                style={{
                                  background: "var(--bg2)",
                                  padding: 12,
                                  borderRadius: 8,
                                  borderLeft: "3px solid var(--accent)",
                                }}>
                                <div
                                  style={{
                                    fontWeight: 600,
                                    color: "var(--text)",
                                    marginBottom: 4,
                                    fontSize: 14,
                                  }}>
                                  {s.subjectCode} - {s.batchName}
                                </div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "var(--text2)",
                                    marginBottom: 4,
                                  }}>
                                  {s.staffName}
                                </div>
                                <div
                                  style={{
                                    fontFamily: "var(--mono)",
                                    fontSize: 12,
                                    color: "var(--accent)",
                                    display: "flex",
                                    justifyContent: "space-between",
                                  }}>
                                  <span>
                                    {s.startTime?.substring(0, 5)} -{" "}
                                    {s.endTime?.substring(0, 5)}
                                  </span>
                                  {s.slotLabel && (
                                    <span style={{ color: "var(--text3)" }}>
                                      {s.slotLabel}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        }
      </main>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: 'var(--bg)' },
  header: { background: 'var(--bg2)', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' },
  logo: { display: 'flex', alignItems: 'center', gap: 12 },
  icon: { width: 36, height: 36, background: 'linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%)', borderRadius: 10 },
  main: { padding: '40px 20px', maxWidth: 1200, margin: '0 auto' }
};
