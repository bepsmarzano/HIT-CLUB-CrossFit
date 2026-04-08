import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "./firebase.js";

const LEVELS = [
  { level: 1, color: "#6B8F71", skills: [
    { id: "1A", name: "20 Knee Raise Unbroken" },
    { id: "1B", name: "500m Row < 2:10 / 2:30" },
    { id: "1C", name: "20 Rope Jump Unbroken" },
  ]},
  { level: 2, color: "#3D7EAA", skills: [
    { id: "2A", name: "8 Toes to Ring Unbroken" },
    { id: "2B", name: "1 Box Jump" },
    { id: "2C", name: "10 American Swing UB 24/16" },
  ]},
  { level: 3, color: "#D4A03C", skills: [
    { id: "3A", name: "1 Pull Up" },
    { id: "3B", name: "1 Short Rope Climb" },
    { id: "3C", name: "3 Double Under Unbroken" },
  ]},
  { level: 4, color: "#C75B39", skills: [
    { id: "4A", name: "5 Toes to Bar Unbroken" },
    { id: "4B", name: "1 Wall Walk" },
    { id: "4C", name: "5 Power Clean TnG 50/35" },
  ]},
  { level: 5, color: "#8B3A62", skills: [
    { id: "5A", name: "10 Pull Up Unbroken" },
    { id: "5B", name: "5 Chest to Bar UB" },
    { id: "5C", name: "1 Bar Complex BW (Clean/FS/STOH)" },
  ]},
  { level: 6, color: "#2C2C2C", skills: [
    { id: "6A", name: "1 Strict Ring MU" },
    { id: "6B", name: "3 Bar MU" },
    { id: "6C", name: "Miglio < 7:30" },
  ]},
  { level: 7, color: "#1A1A6B", skills: [
    { id: "7A", name: "5 Strict HSPU" },
    { id: "7B", name: "6m HS Walk UB" },
    { id: "7C", name: "Snatch Complex @80/55 (1 PS + 1 Hang SqSn + 1 OHS)" },
  ]},
];

const ALL_SKILLS = LEVELS.flatMap((l) => l.skills.map((s) => ({ ...s, level: l.level, color: l.color })));

function formatDate(d) {
  return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Atleta() {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase.from("clients").select("*");
      const { data: a } = await supabase.from("achievements").select("*");
      if (c) setClients(c);
      if (a) setAchievements(a.map(r => ({ id: r.id, clientId: r.client_id, skillId: r.skill_id, trainer: r.trainer, date: r.date })));
      setLoaded(true);
    })();
  }, []);

  const getClientLevel = useCallback((clientId) => {
    const clientAch = achievements.filter((a) => a.clientId === clientId);
    let level = 0;
    for (const lvl of LEVELS) {
      const completed = lvl.skills.filter((s) => clientAch.some((a) => a.skillId === s.id));
      if (completed.length === 3) level = lvl.level;
      else break;
    }
    return level;
  }, [achievements]);

  const getSkillAchievement = useCallback((clientId, skillId) => {
    return achievements.find((a) => a.clientId === clientId && a.skillId === skillId);
  }, [achievements]);

  const filteredClients = useMemo(() => {
    if (search.length < 2) return [];
    const q = search.toLowerCase();
    return clients.filter((c) => c.name.toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, search]);

  const client = selectedClient ? clients.find(c => c.id === selectedClient) : null;
  const clientLevel = client ? getClientLevel(client.id) : 0;

  if (!loaded) return (
    <div style={s.page}><style>{css}</style><div style={s.spinner} /></div>
  );

  return (
    <div style={s.page}>
      <style>{css}</style>
      <div style={s.container}>
        <div style={s.header}>
          <div style={s.logo}>HC</div>
          <div>
            <h1 style={s.title}>HIT CLUB CrossFit</h1>
            <p style={s.subtitle}>Controlla il tuo progresso</p>
          </div>
        </div>

        {!selectedClient && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={s.searchBox}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--muted)" }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input placeholder="Cerca il tuo nome..." value={search} onChange={(e) => setSearch(e.target.value)} style={s.searchInput} autoFocus />
            </div>
            {search.length >= 2 && (
              <div style={s.results}>
                {filteredClients.map((c) => {
                  const lvl = getClientLevel(c.id);
                  return (
                    <div key={c.id} style={s.resultCard} onClick={() => setSelectedClient(c.id)}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</span>
                      <span style={{ ...s.badge, background: LEVELS[lvl - 1]?.color || "#555" }}>Lv {lvl}</span>
                    </div>
                  );
                })}
                {filteredClients.length === 0 && (
                  <p style={{ textAlign: "center", color: "var(--muted)", padding: 20, fontSize: 14 }}>Nessun risultato per "{search}"</p>
                )}
              </div>
            )}
            {search.length < 2 && (
              <p style={{ textAlign: "center", color: "var(--muted)", marginTop: 40, fontSize: 14 }}>Inserisci almeno 2 lettere per cercare</p>
            )}
          </div>
        )}

        {client && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <button onClick={() => { setSelectedClient(null); setSearch(""); }} style={s.back}>← Torna alla ricerca</button>
            <div style={s.profileHeader}>
              <h2 style={s.profileName}>{client.name}</h2>
              <span style={{ ...s.badge, background: LEVELS[clientLevel - 1]?.color || "#555", fontSize: 16, padding: "6px 16px" }}>Lv {clientLevel}</span>
            </div>
            <div style={s.totalProgress}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>Progresso totale</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{achievements.filter(a => a.clientId === client.id).length} / {ALL_SKILLS.length}</span>
              </div>
              <div style={s.progressTrack}>
                <div style={{ ...s.progressFill, width: `${(achievements.filter(a => a.clientId === client.id).length / ALL_SKILLS.length) * 100}%`, background: LEVELS[Math.min(clientLevel, 6)]?.color || "#555" }} />
              </div>
            </div>
            <div style={s.levels}>
              {LEVELS.map((l) => {
                const completedSkills = l.skills.filter(sk => getSkillAchievement(client.id, sk.id));
                const isComplete = completedSkills.length === 3;
                const isLocked = l.level > clientLevel + 1;
                return (
                  <div key={l.level} style={{ ...s.levelCard, borderLeftColor: l.color, opacity: isLocked ? 0.4 : 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontWeight: 700, color: l.color, fontSize: 15 }}>Livello {l.level}</span>
                      {isComplete && <span style={{ fontSize: 12, fontWeight: 700, color: l.color }}>✓ COMPLETATO</span>}
                      {!isComplete && !isLocked && <span style={{ fontSize: 12, color: "var(--muted)" }}>{completedSkills.length} / 3</span>}
                    </div>
                    {l.skills.map((sk) => {
                      const ach = getSkillAchievement(client.id, sk.id);
                      return (
                        <div key={sk.id} style={{ ...s.skillRow, background: ach ? l.color + "15" : "transparent", borderColor: ach ? l.color + "40" : "var(--border)" }}>
                          <div style={{ width: 22, height: 22, borderRadius: "50%", background: ach ? l.color : "var(--bg3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {ach && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{sk.name}</div>
                            {ach && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{ach.trainer} · {formatDate(ach.date)}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const css = `
  :root { --bg: #FAFAF8; --bg2: #F0EFEB; --bg3: #E5E3DD; --text: #1A1A18; --text2: #4A4A45; --muted: #8A8A82; --border: #D8D6CF; --accent: #2D5A27; --font: 'DM Sans', 'Segoe UI', system-ui, sans-serif; }
  @media (prefers-color-scheme: dark) { :root { --bg: #141413; --bg2: #1E1E1C; --bg3: #2A2A27; --text: #EDEDEB; --text2: #B0B0A8; --muted: #6E6E66; --border: #333330; --accent: #6B8F71; } }
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: var(--font); background: var(--bg); color: var(--text); }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const s = {
  page: { minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font)", display: "flex", justifyContent: "center", padding: "20px" },
  container: { width: "100%", maxWidth: 500 },
  spinner: { width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "40vh auto" },
  header: { display: "flex", alignItems: "center", gap: 12, marginBottom: 30, paddingBottom: 20, borderBottom: "1px solid var(--border)" },
  logo: { width: 40, height: 40, borderRadius: 10, background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15 },
  title: { fontSize: 20, fontWeight: 800, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: "var(--muted)", fontWeight: 500 },
  searchBox: { display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg2)" },
  searchInput: { border: "none", background: "transparent", outline: "none", fontSize: 15, color: "var(--text)", width: "100%", fontFamily: "var(--font)" },
  results: { marginTop: 12, display: "flex", flexDirection: "column", gap: 6 },
  resultCard: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg2)", cursor: "pointer" },
  badge: { display: "inline-block", padding: "3px 10px", borderRadius: 20, color: "#fff", fontSize: 12, fontWeight: 700 },
  back: { background: "transparent", border: "none", color: "var(--muted)", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 16, padding: 0, fontFamily: "var(--font)" },
  profileHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  profileName: { fontSize: 24, fontWeight: 800, letterSpacing: -0.5 },
  totalProgress: { marginBottom: 24 },
  progressTrack: { height: 6, borderRadius: 3, background: "var(--bg3)", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3, transition: "width 0.4s ease" },
  levels: { display: "flex", flexDirection: "column", gap: 12 },
  levelCard: { padding: "16px", borderRadius: 10, background: "var(--bg2)", borderLeft: "4px solid" },
  skillRow: { display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, border: "1px solid", marginTop: 6 },
};
