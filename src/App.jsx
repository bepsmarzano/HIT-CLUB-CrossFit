import { useState, useEffect, useCallback, useMemo } from "react";
import { useFirestoreCollection, useFirestoreDoc } from "./useFirestore";

// ═══════ LEVELS CONFIG ═══════
const LEVELS = [
  {
    level: 1,
    color: "#6B8F71",
    skills: [
      { id: "1A", name: "20 Knee Raise Unbroken" },
      { id: "1B", name: "500m Row < 2:10 / 2:30" },
      { id: "1C", name: "20 Rope Jump Unbroken" },
    ],
  },
  {
    level: 2,
    color: "#3D7EAA",
    skills: [
      { id: "2A", name: "8 Toes to Ring Unbroken" },
      { id: "2B", name: "1 Box Jump" },
      { id: "2C", name: "10 American Swing UB 24/16" },
    ],
  },
  {
    level: 3,
    color: "#D4A03C",
    skills: [
      { id: "3A", name: "1 Pull Up" },
      { id: "3B", name: "1 Short Rope Climb" },
      { id: "3C", name: "3 Double Under Unbroken" },
    ],
  },
  {
    level: 4,
    color: "#C75B39",
    skills: [
      { id: "4A", name: "5 Toes to Bar Unbroken" },
      { id: "4B", name: "1 Wall Walk" },
      { id: "4C", name: "5 Power Clean TnG 50/35" },
    ],
  },
  {
    level: 5,
    color: "#8B3A62",
    skills: [
      { id: "5A", name: "10 Pull Up Unbroken" },
      { id: "5B", name: "5 Chest to Bar UB" },
      { id: "5C", name: "1 Bar Complex BW (Clean/FS/STOH)" },
    ],
  },
  {
    level: 6,
    color: "#2C2C2C",
    skills: [
      { id: "6A", name: "1 Strict Ring MU" },
      { id: "6B", name: "3 Bar MU" },
      { id: "6C", name: "Miglio < 7:30" },
    ],
  },
  {
    level: 7,
    color: "#1A1A6B",
    skills: [
      { id: "7A", name: "5 Strict HSPU" },
      { id: "7B", name: "6m HS Walk UB" },
      { id: "7C", name: "Snatch Complex @80/55 (1 PS + 1 Hang SqSn + 1 OHS)" },
    ],
  },
];

const ALL_SKILLS = LEVELS.flatMap((l) =>
  l.skills.map((s) => ({ ...s, level: l.level, color: l.color }))
);

const INITIAL_TRAINERS = ["Coach Marco", "Coach Elena", "Coach Luca"];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ═══════ ICONS ═══════
const Icons = {
  Users: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Class: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Award: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  ),
  Report: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Upload: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  ),
  X: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Trash: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};

// ═══════ LEVEL BADGE ═══════
function LevelBadge({ level, size = "md" }) {
  const lvl = LEVELS.find((l) => l.level === level);
  if (!lvl)
    return (
      <span style={{ ...styles.badge, background: "#555", fontSize: size === "sm" ? 11 : 13 }}>
        Lv 0
      </span>
    );
  const s =
    size === "sm"
      ? { fontSize: 11, padding: "2px 8px" }
      : size === "lg"
      ? { fontSize: 16, padding: "6px 14px" }
      : {};
  return (
    <span style={{ ...styles.badge, background: lvl.color, ...s }}>Lv {level}</span>
  );
}

// ═══════ SKILL CHIP ═══════
function SkillChip({ skill, achieved, onClick, trainerName, date }) {
  const meta = ALL_SKILLS.find((s) => s.id === skill.id) || skill;
  return (
    <div
      onClick={onClick}
      style={{
        ...styles.skillChip,
        background: achieved ? meta.color + "18" : "var(--bg-secondary)",
        borderColor: achieved ? meta.color : "var(--border)",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 22, height: 22, borderRadius: "50%",
            background: achieved ? meta.color : "var(--bg-tertiary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}
        >
          {achieved && (
            <span style={{ color: "#fff", fontSize: 12 }}>
              <Icons.Check />
            </span>
          )}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
            {skill.name}
          </div>
          {achieved && trainerName && (
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
              {trainerName} · {date ? formatDate(date) : ""}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════ MAIN APP ═══════
export default function App() {
  const clientsStore = useFirestoreCollection("clients");
  const achievementsStore = useFirestoreCollection("achievements");
  const classesStore = useFirestoreCollection("classes");
  const [trainers, setTrainers, trainersLoaded] = useFirestoreDoc("config", "trainers", INITIAL_TRAINERS);

  const clients = clientsStore.data;
  const achievements = achievementsStore.data;
  const classes = classesStore.data;
  const loaded = clientsStore.loaded && achievementsStore.loaded && classesStore.loaded && trainersLoaded;

  const [view, setView] = useState("clients");
  const [selectedClient, setSelectedClient] = useState(null);
  const [activeClass, setActiveClass] = useState(null);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [currentTrainer, setCurrentTrainer] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newTrainerName, setNewTrainerName] = useState("");
  const [importText, setImportText] = useState("");
  const [classSearch, setClassSearch] = useState("");
  const [classParticipants, setClassParticipants] = useState([]);
  const [className, setClassName] = useState("");
  const [collapsedParticipants, setCollapsedParticipants] = useState([]);

  useEffect(() => {
    if (loaded && trainers.length > 0 && !currentTrainer) setCurrentTrainer(trainers[0]);
  }, [loaded, trainers]);

  // Auto-svuota classi del giorno prima
  useEffect(() => {
    if (!loaded || classes.length === 0) return;
    const today = new Date().toDateString();
    classes.forEach(async (cl) => {
      const classDate = new Date(cl.date).toDateString();
      if (classDate !== today) {
        await classesStore.remove(cl.id);
      }
    });
  }, [loaded]);

  // ── Computed ──
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
    const q = search.toLowerCase();
    return clients.filter((c) => c.name.toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, search]);

  // ── Actions ──
  const addClient = async () => {
    if (!newClientName.trim()) return;
    const id = generateId();
    await clientsStore.upsert(id, { id, name: newClientName.trim(), createdAt: new Date().toISOString() });
    setNewClientName("");
  };

  const deleteClient = async (id) => {
    const client = clients.find((c) => c.id === id);
    if (!confirm(`Eliminare ${client?.name || "questo cliente"}? Tutti i suoi dati verranno cancellati.`)) return;
    await clientsStore.remove(id);
    const related = achievements.filter((a) => a.clientId === id);
    for (const a of related) {
      await achievementsStore.remove(a.id);
    }
    if (selectedClient === id) setSelectedClient(null);
  };

  const importClients = async () => {
    const names = importText.split(/[\n,;]+/).map((n) => n.trim()).filter(Boolean);
    const existing = new Set(clients.map((c) => c.name.toLowerCase()));
    const newClients = names.filter((n) => !existing.has(n.toLowerCase())).map((n) => ({ id: generateId(), name: n, createdAt: new Date().toISOString() }));
    if (newClients.length) await clientsStore.batchSet(newClients);
    setImportText("");
    setModal(null);
  };

  const toggleSkill = async (clientId, skillId) => {
    if (!currentTrainer) return;
    const existing = getSkillAchievement(clientId, skillId);
    if (existing) {
      await achievementsStore.remove(existing.id || existing._docId);
    } else {
      const id = generateId();
      await achievementsStore.upsert(id, { id, clientId, skillId, trainer: currentTrainer, date: new Date().toISOString() });
    }
  };

  const createClass = async () => {
    if (classParticipants.length === 0) return;
    for (const cl of classes) await classesStore.remove(cl.id || cl._docId);
    const id = generateId();
    const today = new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
    const newClass = {
      id,
      name: today.charAt(0).toUpperCase() + today.slice(1),
      trainer: currentTrainer,
      participants: classParticipants,
      date: new Date().toISOString(),
    };
    await classesStore.upsert(id, newClass);
    setActiveClass(newClass);
    setClassParticipants([]);
    setClassSearch("");
    setModal(null);
  };

  const addTrainer = async () => {
    if (!newTrainerName.trim() || trainers.includes(newTrainerName.trim())) return;
    await setTrainers((prev) => [...prev, newTrainerName.trim()]);
    setNewTrainerName("");
  };

  const removeTrainer = async (name) => {
    await setTrainers((prev) => prev.filter((t) => t !== name));
    if (currentTrainer === name) setCurrentTrainer(trainers.filter((t) => t !== name)[0] || "");
  };

  // ── Report Data ──
  const reportData = useMemo(() => {
    const clientProgress = clients.map((c) => {
      const level = getClientLevel(c.id);
      const totalSkills = achievements.filter((a) => a.clientId === c.id).length;
      return { ...c, level, totalSkills };
    }).sort((a, b) => b.level - a.level || b.totalSkills - a.totalSkills);

    const trainerStats = {};
    achievements.forEach((a) => {
      if (!trainerStats[a.trainer]) trainerStats[a.trainer] = { total: 0, byLevel: {} };
      trainerStats[a.trainer].total++;
      const skill = ALL_SKILLS.find((s) => s.id === a.skillId);
      if (skill) {
        trainerStats[a.trainer].byLevel[skill.level] = (trainerStats[a.trainer].byLevel[skill.level] || 0) + 1;
      }
    });

    const levelDistribution = {};
    clients.forEach((c) => {
      const lvl = getClientLevel(c.id);
      levelDistribution[lvl] = (levelDistribution[lvl] || 0) + 1;
    });

    return { clientProgress, trainerStats, levelDistribution };
  }, [clients, achievements, getClientLevel]);

  if (!loaded) return (
    <div style={styles.loading}><div style={styles.spinner} /></div>
  );

  // ═══════ RENDER ═══════
  return (
    <div style={styles.app}>
      <style>{cssReset}</style>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={styles.logo}>HC</div>
            <div>
              <h1 style={styles.headerTitle}>HIT CLUB CrossFit</h1>
              <p style={styles.headerSub}>Sistema di valutazione</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <select value={currentTrainer} onChange={(e) => setCurrentTrainer(e.target.value)} style={styles.trainerSelect}>
              {trainers.map((t) => (<option key={t} value={t}>{t}</option>))}
            </select>
            <button onClick={() => setModal("settings")} style={styles.iconBtn}><Icons.Settings /></button>
          </div>
        </div>
      </header>

      {/* Nav */}
      <nav style={styles.nav}>
        {[
          { id: "clients", label: "Clienti", icon: Icons.Users },
          { id: "class", label: "Classe", icon: Icons.Class },
          { id: "levels", label: "Livelli", icon: Icons.Award },
          { id: "reports", label: "Report", icon: Icons.Report },
        ].map((tab) => (
          <button key={tab.id} onClick={() => { setView(tab.id); setSelectedClient(null); }}
            style={{ ...styles.navBtn, ...(view === tab.id ? styles.navBtnActive : {}) }}>
            <tab.icon /> {tab.label}
          </button>
        ))}
      </nav>

      <main style={styles.main}>

        {/* ═══════ CLIENTS VIEW ═══════ */}
        {view === "clients" && !selectedClient && (
          <div style={styles.fadeIn}>
            <div style={styles.topBar}>
              <div style={styles.searchBox}>
                <Icons.Search />
                <input placeholder="Cerca cliente..." value={search} onChange={(e) => setSearch(e.target.value)} style={styles.searchInput} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setModal("import")} style={styles.btnSecondary}><Icons.Upload /> Importa</button>
                <button onClick={() => setModal("addClient")} style={styles.btnPrimary}><Icons.Plus /> Aggiungi</button>
              </div>
            </div>
            <div style={styles.clientGrid}>
              {filteredClients.map((c) => {
                const lvl = getClientLevel(c.id);
                const totalSkills = achievements.filter((a) => a.clientId === c.id).length;
                return (
                  <div key={c.id} style={styles.clientCard} onClick={() => setSelectedClient(c.id)}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={styles.clientName}>{c.name}</div>
                        <LevelBadge level={lvl} size="sm" />
                      </div>
                      <div style={styles.clientMeta}>{totalSkills} / {ALL_SKILLS.length} abilità</div>
                    </div>
                    <div style={styles.progressBarTrack}>
                      <div style={{ ...styles.progressBarFill, width: `${(totalSkills / ALL_SKILLS.length) * 100}%`, background: LEVELS[Math.min(lvl, 6)]?.color || "#555" }} />
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteClient(c.id); }} style={styles.deleteBtn}><Icons.Trash /></button>
                  </div>
                );
              })}
              {filteredClients.length === 0 && (
                <div style={styles.emptyState}>
                  <Icons.Users />
                  <p>Nessun cliente trovato</p>
                  <button onClick={() => setModal("addClient")} style={styles.btnPrimary}><Icons.Plus /> Aggiungi cliente</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════ CLIENT DETAIL ═══════ */}
        {view === "clients" && selectedClient && (() => {
          const client = clients.find((c) => c.id === selectedClient);
          if (!client) return null;
          const lvl = getClientLevel(client.id);
          return (
            <div style={styles.fadeIn}>
              <button onClick={() => setSelectedClient(null)} style={styles.backBtn}>← Torna ai clienti</button>
              <div style={styles.detailHeader}>
                <div>
                  <h2 style={styles.detailName}>{client.name}</h2>
                  <p style={styles.detailSub}>Iscritto dal {formatDate(client.createdAt)}</p>
                </div>
                <LevelBadge level={lvl} size="lg" />
              </div>
              <div style={styles.levelsGrid}>
                {LEVELS.map((l) => {
                  const completed = l.skills.filter((s) => getSkillAchievement(client.id, s.id));
                  const isComplete = completed.length === 3;
                  const isNext = l.level === lvl + 1;
                  return (
                    <div key={l.level} style={{ ...styles.levelSection, borderLeftColor: l.color, opacity: l.level > lvl + 1 ? 0.45 : 1 }}>
                      <div style={styles.levelSectionHeader}>
                        <span style={{ fontWeight: 700, color: l.color, fontSize: 14 }}>Livello {l.level}</span>
                        {isComplete && <span style={{ color: l.color, fontSize: 12, fontWeight: 600 }}>✓ COMPLETATO</span>}
                        {isNext && <span style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>Prossimo obiettivo</span>}
                      </div>
                      <div style={styles.skillsList}>
                        {l.skills.map((s) => {
                          const ach = getSkillAchievement(client.id, s.id);
                          return (
                            <SkillChip key={s.id} skill={s} achieved={!!ach} onClick={() => toggleSkill(client.id, s.id)} trainerName={ach?.trainer} date={ach?.date} />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ═══════ CLASS VIEW ═══════ */}
        {view === "class" && (
          <div style={styles.fadeIn}>
            {!activeClass ? (
              <>
                <div style={styles.topBar}>
                  <h2 style={styles.sectionTitle}>Classe</h2>
                  <button onClick={() => setModal("createClass")} style={styles.btnPrimary}>
                    <Icons.Plus /> Nuova Classe
                  </button>
                </div>
                <div style={styles.classHistory}>
                  {[...classes].sort((a, b) => new Date(b.date) - new Date(a.date)).map((cl) => (
                    <div key={cl.id} style={styles.classCard} onClick={() => { setActiveClass(cl); setCollapsedParticipants([]); }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{cl.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatDate(cl.date)}</div>
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                        {cl.trainer} · {cl.participants.length} partecipanti
                      </div>
                    </div>
                  ))}
                  {classes.length === 0 && (
                    <div style={styles.emptyState}>
                      <Icons.Class />
                      <p>Nessuna classe creata</p>
                      <button onClick={() => setModal("createClass")} style={styles.btnPrimary}><Icons.Plus /> Crea classe</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button onClick={() => setActiveClass(null)} style={styles.backBtn}>← Torna alle classi</button>
                <div style={styles.detailHeader}>
                  <div>
                    <h2 style={styles.detailName}>{activeClass.name}</h2>
                    <p style={styles.detailSub}>{activeClass.trainer} · {formatDate(activeClass.date)} · {activeClass.participants.length} partecipanti</p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setModal("editClassParticipants")} style={styles.btnSecondary}>
                      <Icons.Users /> Modifica
                    </button>
                    <button onClick={async () => {
                      if (confirm("Svuotare questa classe?")) {
                        await classesStore.remove(activeClass.id);
                        setActiveClass(null);
                      }
                    }} style={{ ...styles.btnSecondary, color: "#c53030", borderColor: "#c5303044" }}>
                      <Icons.Trash /> Svuota
                    </button>
                  </div>
                </div>
                <div style={styles.classParticipantGrid}>
                  {activeClass.participants.map((pid) => {
                    const client = clients.find((c) => c.id === pid);
                    if (!client) return null;
                    const lvl = getClientLevel(client.id);
                    const nextLevel = LEVELS.find((l) => l.level === lvl + 1);
                    const isCollapsed = collapsedParticipants.includes(pid);
                    return (
                      <div key={pid} style={styles.classParticipantCard}>
                        <div onClick={() => setCollapsedParticipants(prev => isCollapsed ? prev.filter(p => p !== pid) : [...prev, pid])}
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                          <span style={{ fontWeight: 700, fontSize: 14 }}>{client.name}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <LevelBadge level={lvl} size="sm" />
                            <span style={{ color: "var(--text-muted)", fontSize: 12, transform: isCollapsed ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.2s" }}>▼</span>
                          </div>
                        </div>
                        {!isCollapsed && nextLevel && (
                          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>Prossimo: Lv {nextLevel.level}</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {nextLevel.skills.map((s) => {
                                const ach = getSkillAchievement(client.id, s.id);
                                return (
                                  <SkillChip key={s.id} skill={s} achieved={!!ach} onClick={() => toggleSkill(client.id, s.id)} trainerName={ach?.trainer} date={ach?.date} />
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {!isCollapsed && !nextLevel && (
                          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)", fontSize: 13, color: "var(--text-muted)" }}>
                            Livello massimo raggiunto!
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══════ LEVELS VIEW ═══════ */}
        {view === "levels" && (
          <div style={styles.fadeIn}>
            <h2 style={styles.sectionTitle}>Mappa dei Livelli</h2>
            <div style={styles.levelsOverview}>
              {LEVELS.map((l) => (
                <div key={l.level} style={{ ...styles.levelOverviewCard, borderTopColor: l.color }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontWeight: 800, fontSize: 20, color: l.color }}>Lv {l.level}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: l.color }}>Livello {l.level}</span>
                  </div>
                  {l.skills.map((s) => (
                    <div key={s.id} style={styles.levelSkillRow}>
                      <span style={{ fontWeight: 600, color: l.color, fontSize: 12, width: 24 }}>{s.id}</span>
                      <span style={{ fontSize: 13 }}>{s.name}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted)" }}>
                    {clients.filter((c) => getClientLevel(c.id) >= l.level).length} / {clients.length} clienti
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════ REPORTS VIEW ═══════ */}
        {view === "reports" && (
          <div style={styles.fadeIn}>
            <h2 style={styles.sectionTitle}>Report</h2>

            <div style={styles.reportSection}>
              <h3 style={styles.reportSubtitle}>Distribuzione Livelli</h3>
              <div style={styles.barChart}>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((lvl) => {
                  const count = reportData.levelDistribution[lvl] || 0;
                  const max = Math.max(...Object.values(reportData.levelDistribution), 1);
                  return (
                    <div key={lvl} style={styles.barItem}>
                      <div style={styles.barTrack}>
                        <div style={{ ...styles.barFill, height: `${(count / max) * 100}%`, background: LEVELS[lvl - 1]?.color || "#777" }} />
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>Lv{lvl}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={styles.reportSection}>
              <h3 style={styles.reportSubtitle}>Abilità per Trainer</h3>
              {Object.entries(reportData.trainerStats).map(([trainer, stats]) => (
                <div key={trainer} style={styles.trainerStatRow}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{trainer}</span>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{stats.total} abilità assegnate</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                    {Object.entries(stats.byLevel).sort(([a], [b]) => a - b).map(([lvl, count]) => (
                      <span key={lvl} style={{
                        fontSize: 11, padding: "2px 8px", borderRadius: 20,
                        background: LEVELS[parseInt(lvl) - 1]?.color + "22",
                        color: LEVELS[parseInt(lvl) - 1]?.color, fontWeight: 600,
                      }}>Lv{lvl}: {count}</span>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(reportData.trainerStats).length === 0 && (
                <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Nessuna abilità ancora assegnata</p>
              )}
            </div>

            <div style={styles.reportSection}>
              <h3 style={styles.reportSubtitle}>Classifica Clienti</h3>
              <div style={styles.rankTable}>
                <div style={styles.rankHeader}>
                  <span style={{ flex: 0.5 }}>#</span>
                  <span style={{ flex: 2 }}>Nome</span>
                  <span style={{ flex: 1, textAlign: "center" }}>Livello</span>
                  <span style={{ flex: 1, textAlign: "center" }}>Abilità</span>
                </div>
                {reportData.clientProgress.map((c, i) => (
                  <div key={c.id} style={{ ...styles.rankRow, cursor: "pointer" }} onClick={() => { setSelectedClient(c.id); setView("clients"); }}>
                    <span style={{ flex: 0.5, fontWeight: 700, color: "var(--text-muted)" }}>{i + 1}</span>
                    <span style={{ flex: 2, fontWeight: 600 }}>{c.name}</span>
                    <span style={{ flex: 1, textAlign: "center" }}><LevelBadge level={c.level} size="sm" /></span>
                    <span style={{ flex: 1, textAlign: "center", fontSize: 13 }}>{c.totalSkills} / {ALL_SKILLS.length}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ═══════ MODALS ═══════ */}
      {modal && (
        <div style={styles.overlay} onClick={() => setModal(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setModal(null)} style={styles.modalClose}><Icons.X /></button>

            {modal === "addClient" && (
              <>
                <h3 style={styles.modalTitle}>Aggiungi Cliente</h3>
                <input value={newClientName} onChange={(e) => setNewClientName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addClient()} placeholder="Nome e cognome" style={styles.input} autoFocus />
                <button onClick={addClient} style={{ ...styles.btnPrimary, width: "100%", marginTop: 12 }}>Aggiungi</button>
              </>
            )}

            {modal === "import" && (
              <>
                <h3 style={styles.modalTitle}>Importa Clienti</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>Un nome per riga, oppure separati da virgola o punto e virgola.</p>
                <textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder={"Mario Rossi\nLucia Bianchi\nAndrea Verdi"} style={styles.textarea} rows={8} />
                <button onClick={importClients} style={{ ...styles.btnPrimary, width: "100%", marginTop: 12 }}>
                  Importa {importText.split(/[\n,;]+/).filter((n) => n.trim()).length} clienti
                </button>
              </>
            )}

            {modal === "createClass" && (
              <>
                <h3 style={styles.modalTitle}>Classe di oggi</h3>
                <div style={styles.searchBox}>
                  <Icons.Search />
                  <input placeholder="Cerca partecipanti..." value={classSearch} onChange={(e) => setClassSearch(e.target.value)} style={styles.searchInput} />
                </div>
                <div style={styles.participantList}>
                  {clients.filter((c) => c.name.toLowerCase().includes(classSearch.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name)).map((c) => {
                    const selected = classParticipants.includes(c.id);
                    return (
                      <div key={c.id} onClick={() => setClassParticipants((prev) => selected ? prev.filter((p) => p !== c.id) : [...prev, c.id])}
                        style={{ ...styles.participantItem, background: selected ? "var(--accent-bg)" : "transparent", borderColor: selected ? "var(--accent)" : "var(--border)" }}>
                        <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${selected ? "var(--accent)" : "var(--border)"}`, background: selected ? "var(--accent)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {selected && <span style={{ color: "#fff", fontSize: 10 }}><Icons.Check /></span>}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: selected ? 600 : 400 }}>{c.name}</span>
                        <LevelBadge level={getClientLevel(c.id)} size="sm" />
                      </div>
                    );
                  })}
                </div>
                <button onClick={createClass} disabled={classParticipants.length === 0}
                  style={{ ...styles.btnPrimary, width: "100%", marginTop: 12, opacity: classParticipants.length === 0 ? 0.5 : 1 }}>
                  Crea Classe ({classParticipants.length} partecipanti)
                </button>
              </>
            )}

            {modal === "editClassParticipants" && (
              <>
                <h3 style={styles.modalTitle}>Modifica Partecipanti</h3>
                <div style={styles.searchBox}>
                  <Icons.Search />
                  <input placeholder="Cerca..." value={classSearch} onChange={(e) => setClassSearch(e.target.value)} style={styles.searchInput} />
                </div>
                <div style={styles.participantList}>
                  {clients.filter((c) => c.name.toLowerCase().includes(classSearch.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name)).map((c) => {
                    const selected = activeClass.participants.includes(c.id);
                    return (
                      <div key={c.id} onClick={async () => {
                        const newParticipants = selected ? activeClass.participants.filter((p) => p !== c.id) : [...activeClass.participants, c.id];
                        const updated = { ...activeClass, participants: newParticipants };
                        await classesStore.upsert(activeClass.id, updated);
                        setActiveClass(updated);
                      }} style={{ ...styles.participantItem, background: selected ? "var(--accent-bg)" : "transparent", borderColor: selected ? "var(--accent)" : "var(--border)" }}>
                        <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${selected ? "var(--accent)" : "var(--border)"}`, background: selected ? "var(--accent)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {selected && <span style={{ color: "#fff", fontSize: 10 }}><Icons.Check /></span>}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: selected ? 600 : 400 }}>{c.name}</span>
                        <LevelBadge level={getClientLevel(c.id)} size="sm" />
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => { setModal(null); setClassSearch(""); }}
                  style={{ ...styles.btnPrimary, width: "100%", marginTop: 12 }}>
                  Fatto ({activeClass.participants.length} partecipanti)
                </button>
              </>
            )}

            {modal === "settings" && (
              <>
                <h3 style={styles.modalTitle}>Impostazioni</h3>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "var(--text-secondary)" }}>Trainer</h4>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input value={newTrainerName} onChange={(e) => setNewTrainerName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTrainer()} placeholder="Nome trainer" style={{ ...styles.input, flex: 1 }} />
                  <button onClick={addTrainer} style={styles.btnPrimary}><Icons.Plus /></button>
                </div>
                {trainers.map((t) => (
                  <div key={t} style={styles.trainerRow}>
                    <span style={{ fontSize: 14 }}>{t}</span>
                    <button onClick={() => removeTrainer(t)} style={styles.deleteBtn}><Icons.Trash /></button>
                  </div>
                ))}
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "var(--text-secondary)" }}>Dati</h4>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>Attenzione: il reset cancellerà tutti i dati dal database.</p>
                  <button onClick={async () => {
                    if (confirm("Sei sicuro? Tutti i dati verranno cancellati.")) {
                      for (const c of clients) await clientsStore.remove(c.id);
                      for (const a of achievements) await achievementsStore.remove(a.id || a._docId);
                      for (const cl of classes) await classesStore.remove(cl.id || cl._docId);
                      setModal(null);
                    }
                  }} style={{ ...styles.btnSecondary, color: "#c53030", borderColor: "#c5303044" }}>
                    <Icons.Trash /> Reset completo
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════ CSS ═══════
const cssReset = `
  :root {
    --bg-primary: #FAFAF8; --bg-secondary: #F0EFEB; --bg-tertiary: #E5E3DD;
    --text-primary: #1A1A18; --text-secondary: #4A4A45; --text-muted: #8A8A82;
    --border: #D8D6CF; --accent: #2D5A27; --accent-bg: #2D5A2712;
    --shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    --shadow-lg: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
    --radius: 10px; --font: 'DM Sans', 'Segoe UI', system-ui, sans-serif;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg-primary: #141413; --bg-secondary: #1E1E1C; --bg-tertiary: #2A2A27;
      --text-primary: #EDEDEB; --text-secondary: #B0B0A8; --text-muted: #6E6E66;
      --border: #333330; --accent: #6B8F71; --accent-bg: #6B8F7118;
      --shadow: 0 1px 3px rgba(0,0,0,0.2); --shadow-lg: 0 4px 12px rgba(0,0,0,0.3);
    }
  }
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: var(--font); background: var(--bg-primary); color: var(--text-primary); }
  input, select, textarea, button { font-family: var(--font); }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const styles = {
  app: { minHeight: "100vh", background: "var(--bg-primary)", fontFamily: "var(--font)" },
  loading: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" },
  spinner: { width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  fadeIn: { animation: "fadeIn 0.3s ease" },
  header: { background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", padding: "12px 20px", position: "sticky", top: 0, zIndex: 50 },
  headerInner: { maxWidth: 1000, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" },
  logo: { width: 36, height: 36, borderRadius: 8, background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, letterSpacing: -0.5 },
  headerTitle: { fontSize: 17, fontWeight: 800, letterSpacing: -0.3 },
  headerSub: { fontSize: 11, color: "var(--text-muted)", fontWeight: 500 },
  trainerSelect: { padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: 13, fontWeight: 600, cursor: "pointer", outline: "none" },
  iconBtn: { width: 36, height: 36, borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  nav: { display: "flex", gap: 4, padding: "8px 20px", maxWidth: 1000, margin: "0 auto" },
  navBtn: { flex: 1, padding: "10px 8px", borderRadius: 8, border: "none", background: "transparent", color: "var(--text-muted)", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.15s" },
  navBtnActive: { background: "var(--bg-secondary)", color: "var(--text-primary)" },
  main: { maxWidth: 1000, margin: "0 auto", padding: "16px 20px 40px" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" },
  searchBox: { display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-secondary)", flex: 1, minWidth: 180, color: "var(--text-muted)" },
  searchInput: { border: "none", background: "transparent", outline: "none", fontSize: 13, color: "var(--text-primary)", width: "100%" },
  btnPrimary: { padding: "8px 16px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" },
  btnSecondary: { padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" },
  clientGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 },
  clientCard: { padding: "14px 16px", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--bg-secondary)", cursor: "pointer", transition: "all 0.15s", position: "relative" },
  clientName: { fontWeight: 700, fontSize: 15 },
  clientMeta: { fontSize: 12, color: "var(--text-muted)", marginTop: 2 },
  progressBarTrack: { height: 4, borderRadius: 2, background: "var(--bg-tertiary)", marginTop: 10, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 2, transition: "width 0.4s ease" },
  deleteBtn: { position: "absolute", top: 8, right: 8, background: "#c5303015", border: "1px solid #c5303030", color: "#c53030", cursor: "pointer", padding: 6, borderRadius: 6, opacity: 0.8, transition: "opacity 0.15s" },
  badge: { display: "inline-block", padding: "3px 10px", borderRadius: 20, color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: 0.3, whiteSpace: "nowrap" },
  backBtn: { background: "transparent", border: "none", color: "var(--text-muted)", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 12, padding: 0 },
  detailHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 },
  detailName: { fontSize: 24, fontWeight: 800, letterSpacing: -0.5 },
  detailSub: { fontSize: 13, color: "var(--text-muted)", marginTop: 2 },
  levelsGrid: { display: "flex", flexDirection: "column", gap: 12 },
  levelSection: { padding: "16px 18px", borderRadius: "var(--radius)", background: "var(--bg-secondary)", borderLeft: "4px solid" },
  levelSectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  skillsList: { display: "flex", flexDirection: "column", gap: 6 },
  skillChip: { padding: "10px 12px", borderRadius: 8, border: "1px solid", transition: "all 0.15s" },
  sectionTitle: { fontSize: 20, fontWeight: 800, letterSpacing: -0.3 },
  classHistory: { display: "flex", flexDirection: "column", gap: 8 },
  classCard: { padding: "14px 16px", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--bg-secondary)", cursor: "pointer", transition: "all 0.15s" },
  classParticipantGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 10, marginTop: 16 },
  classParticipantCard: { padding: "14px 16px", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--bg-secondary)" },
  levelsOverview: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginTop: 16 },
  levelOverviewCard: { padding: "18px", borderRadius: "var(--radius)", background: "var(--bg-secondary)", borderTop: "4px solid" },
  levelSkillRow: { display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border)" },
  reportSection: { marginTop: 24, padding: "20px", borderRadius: "var(--radius)", background: "var(--bg-secondary)", border: "1px solid var(--border)" },
  reportSubtitle: { fontSize: 15, fontWeight: 700, marginBottom: 16, letterSpacing: -0.2 },
  barChart: { display: "flex", gap: 12, alignItems: "flex-end", height: 140, justifyContent: "center" },
  barItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 },
  barTrack: { width: "100%", height: 100, background: "var(--bg-tertiary)", borderRadius: 4, position: "relative", overflow: "hidden", display: "flex", alignItems: "flex-end" },
  barFill: { width: "100%", borderRadius: 4, transition: "height 0.5s ease", minHeight: 2 },
  trainerStatRow: { padding: "12px 0", borderBottom: "1px solid var(--border)" },
  rankTable: {},
  rankHeader: { display: "flex", padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 },
  rankRow: { display: "flex", padding: "10px 12px", alignItems: "center", borderBottom: "1px solid var(--border)", fontSize: 14 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100, padding: 20, backdropFilter: "blur(4px)" },
  modal: { background: "var(--bg-primary)", borderRadius: 14, padding: "24px", maxWidth: 480, width: "100%", maxHeight: "85vh", overflowY: "auto", position: "relative", boxShadow: "var(--shadow-lg)" },
  modalClose: { position: "absolute", top: 12, right: 12, background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 },
  modalTitle: { fontSize: 18, fontWeight: 800, marginBottom: 16, letterSpacing: -0.3 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: 14, outline: "none" },
  textarea: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "var(--font)" },
  participantList: { maxHeight: 260, overflowY: "auto", marginTop: 8, display: "flex", flexDirection: "column", gap: 4 },
  participantItem: { display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, border: "1px solid", cursor: "pointer", transition: "all 0.15s" },
  trainerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" },
  emptyState: { gridColumn: "1 / -1", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "48px 20px", color: "var(--text-muted)" },
};
