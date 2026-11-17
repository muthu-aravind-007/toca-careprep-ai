import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Activity, AlertCircle, ArrowUpRight, Bell, CalendarDays, CheckCircle2, ChevronDown, ClipboardList, Clock3, FileText, HeartPulse, LayoutDashboard, Menu, MessageCircle, Pill, Search, ShieldCheck, Sparkles, UserRound, Users, X, Zap } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import "./styles.css";

const patients = [
  {
    id: "pt-1042", name: "Sarah Johnson", initials: "SJ", age: 62, gender: "Female", status: "Needs review",
    program: "Remote patient monitoring", clinician: "Care Team North", lastContact: "Nov 14, 2026",
    conditions: ["Hypertension", "Type 2 diabetes"],
    vitals: [
      { label: "Blood pressure", value: "148/92 mmHg", previous: "132/84 mmHg", date: "Nov 17, 2026", numeric: 148 },
      { label: "Heart rate", value: "78 bpm", previous: "76 bpm", date: "Nov 17, 2026", numeric: 78 },
      { label: "Blood glucose", value: "142 mg/dL", previous: "136 mg/dL", date: "Nov 17, 2026", numeric: 142 }
    ],
    missedReadings: 2,
    medications: [{ name: "Lisinopril", detail: "Medication list updated 5 days ago; confirm current dose and schedule with patient." }, { name: "Metformin", detail: "Listed in the sample medication record; confirm current use." }],
    notes: [
      { date: "Nov 14, 2026", title: "Care manager check-in", text: "Patient mentioned difficulty maintaining a consistent medication schedule." },
      { date: "Nov 10, 2026", title: "Monitoring follow-up", text: "Reviewed home monitoring routine. Patient had questions about submitting readings." },
      { date: "Nov 05, 2026", title: "Routine outreach", text: "Patient reports continuing home monitoring." }
    ],
    trend: [{ day: "Nov 11", bp: 132 }, { day: "Nov 12", bp: 134 }, { day: "Nov 13", bp: 136 }, { day: "Nov 14", bp: 139 }, { day: "Nov 15", bp: 141 }, { day: "Nov 16", bp: 145 }, { day: "Nov 17", bp: 148 }]
  },
  {
    id: "pt-1088", name: "Michael Chen", initials: "MC", age: 57, gender: "Male", status: "On track",
    program: "Chronic care management", clinician: "Care Team West", lastContact: "Nov 16, 2026",
    conditions: ["Type 2 diabetes"], vitals: [
      { label: "Blood pressure", value: "126/80 mmHg", previous: "128/82 mmHg", date: "Nov 17, 2026" },
      { label: "Heart rate", value: "72 bpm", previous: "74 bpm", date: "Nov 17, 2026" },
      { label: "Blood glucose", value: "118 mg/dL", previous: "121 mg/dL", date: "Nov 17, 2026" }
    ], missedReadings: 0,
    medications: [{ name: "Metformin", detail: "No medication changes recorded in the supplied sample." }],
    notes: [{ date: "Nov 16, 2026", title: "Weekly check-in", text: "Patient reports no issues with monitoring routine." }, { date: "Nov 09, 2026", title: "Care note", text: "Discussed keeping a consistent daily log." }],
    trend: [{ day: "Nov 11", bp: 130 }, { day: "Nov 12", bp: 129 }, { day: "Nov 13", bp: 128 }, { day: "Nov 14", bp: 127 }, { day: "Nov 15", bp: 127 }, { day: "Nov 16", bp: 128 }, { day: "Nov 17", bp: 126 }]
  },
  {
    id: "pt-1120", name: "Elena Rodriguez", initials: "ER", age: 71, gender: "Female", status: "Follow-up",
    program: "Remote patient monitoring", clinician: "Care Team South", lastContact: "Nov 12, 2026",
    conditions: ["Heart failure", "Hypertension"], vitals: [
      { label: "Blood pressure", value: "138/86 mmHg", previous: "136/84 mmHg", date: "Nov 17, 2026" },
      { label: "Heart rate", value: "82 bpm", previous: "80 bpm", date: "Nov 17, 2026" },
      { label: "Weight", value: "72.4 kg", previous: "71.8 kg", date: "Nov 17, 2026" }
    ], missedReadings: 1,
    medications: [{ name: "Medication reconciliation", detail: "Patient-reported list requires confirmation during next contact." }],
    notes: [{ date: "Nov 12, 2026", title: "Patient outreach", text: "Patient requested a follow-up call to review home monitoring." }, { date: "Nov 08, 2026", title: "Monitoring note", text: "One scheduled weight reading not received." }],
    trend: [{ day: "Nov 11", bp: 132 }, { day: "Nov 12", bp: 133 }, { day: "Nov 13", bp: 134 }, { day: "Nov 14", bp: 135 }, { day: "Nov 15", bp: 136 }, { day: "Nov 16", bp: 137 }, { day: "Nov 17", bp: 138 }]
  }
];

function App() {
  const [selectedId, setSelectedId] = useState("pt-1042");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [done, setDone] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const patient = patients.find(p => p.id === selectedId);
  const filtered = useMemo(() => patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase())), [search]);

  function selectPatient(id) { setSelectedId(id); setResult(null); setError(""); setDone([]); setTab("overview"); setMobileOpen(false); }

  async function prepareCall() {
    setLoading(true); setError(""); setResult(null); setTab("brief");
    try {
      const response = await fetch("/api/prepare-call", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patient }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not prepare call.");
      setResult(data);
    } catch (e) {
      setError("The preparation service is not reachable. If you're viewing this on Vercel, check the deployment logs and API configuration. " + e.message);
    } finally { setLoading(false); }
  }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="brand"><div className="brand-mark"><HeartPulse size={22}/></div><div><strong>TOCA <span>CarePrep</span></strong><small>CARE INTELLIGENCE</small></div><button className="mobile-close" onClick={() => setMobileOpen(false)}><X size={18}/></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav><button className="nav-item active"><LayoutDashboard size={18}/> Patient overview</button><button className="nav-item" onClick={() => setTab("brief")}><Sparkles size={18}/> AI call preparation</button><button className="nav-item" onClick={() => setTab("history")}><ClipboardList size={18}/> Care history</button></nav>
      <div className="side-divider"/>
      <div className="patient-heading"><span>MY PATIENTS</span><span className="count">{patients.length}</span></div>
      <div className="search-wrap"><Search size={15}/><input placeholder="Find a patient" value={search} onChange={e => setSearch(e.target.value)}/></div>
      <div className="patient-list">{filtered.map(p => <button key={p.id} className={`patient-option ${selectedId === p.id ? "selected" : ""}`} onClick={() => selectPatient(p.id)}><span className="avatar">{p.initials}</span><span className="patient-option-text"><strong>{p.name}</strong><small>{p.program}</small></span><span className={`status-dot ${p.status === "On track" ? "green" : "amber"}`}/></button>)}</div>
      <div className="sidebar-bottom"><div className="demo-note"><ShieldCheck size={17}/><span><strong>Demo environment</strong><small>Fictional patient records only</small></span></div><div className="profile"><div className="avatar profile-avatar">CM</div><div><strong>Care Manager</strong><small>Demo workspace</small></div><ChevronDown size={15}/></div></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMobileOpen(true)}><Menu/></button><div className="breadcrumbs">Workspace <span>/</span> Patients <span>/</span> <strong>{patient.name}</strong></div><div className="top-actions"><span className="environment"><i/> DEMO ENVIRONMENT</span><button className="icon-button" aria-label="Notifications"><Bell size={18}/></button><div className="top-avatar">CM</div></div></header>
      <div className="content">
        <div className="page-heading"><div><div className="eyebrow">PATIENT WORKSPACE <span>•</span> {patient.id.toUpperCase()}</div><h1>Patient overview</h1><p>Review patient information and prepare for your next conversation.</p></div><button className="primary-button" onClick={prepareCall} disabled={loading}><Sparkles size={17}/>{loading ? "Preparing brief..." : "Prepare for patient call"}<ArrowUpRight size={16}/></button></div>

        <section className="patient-banner"><div className="patient-identity"><div className="patient-avatar">{patient.initials}</div><div><div className="name-line"><h2>{patient.name}</h2><span className={`pill ${patient.status === "On track" ? "pill-green" : "pill-amber"}`}>{patient.status}</span></div><p>{patient.age} years · {patient.gender} <span>•</span> {patient.program}</p><div className="condition-list">{patient.conditions.map(c => <span key={c}>{c}</span>)}</div></div></div><div className="banner-meta"><div><small>LAST CONTACT</small><strong><CalendarDays size={14}/>{patient.lastContact}</strong></div><div><small>CARE TEAM</small><strong><Users size={14}/>{patient.clinician}</strong></div></div></section>

        <div className="tabs"><button className={tab === "overview" ? "tab active-tab" : "tab"} onClick={() => setTab("overview")}>Overview</button><button className={tab === "brief" ? "tab active-tab" : "tab"} onClick={() => setTab("brief")}>AI call brief {result && <span className="tab-dot"/>}</button><button className={tab === "history" ? "tab active-tab" : "tab"} onClick={() => setTab("history")}>Care history</button></div>

        {tab === "overview" && <>
          <div className="section-title"><div><h3>Recent health metrics</h3><p>Latest readings available in the demo record</p></div><span className="updated"><Clock3 size={14}/> Updated {patient.vitals[0].date}</span></div>
          <div className="metric-grid">{patient.vitals.map((v, i) => <div className="metric-card" key={v.label}><div className="metric-top"><span>{v.label}</span><span className="metric-icon">{i === 0 ? <Activity size={17}/> : i === 1 ? <HeartPulse size={17}/> : <Zap size={17}/>}</span></div><div className="metric-value">{v.value}</div><div className="metric-foot"><span>Previous: {v.previous}</span><span className={i === 0 && patient.id === "pt-1042" ? "trend-up" : "trend-neutral"}>{i === 0 && patient.id === "pt-1042" ? "↑ Review" : "Latest"}</span></div></div>)}</div>
          <div className="two-column">
            <section className="panel chart-panel"><div className="panel-heading"><div><h3>Blood pressure trend</h3><p>Recent systolic readings · mmHg</p></div><span className="mini-tag">7 DAYS</span></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={patient.trend} margin={{top:12,right:8,left:-20,bottom:0}}><defs><linearGradient id="bpFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1b8a72" stopOpacity={0.18}/><stop offset="95%" stopColor="#1b8a72" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0ee"/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize:11,fill:"#89938e"}}/><YAxis domain={["dataMin - 8","dataMax + 8"]} axisLine={false} tickLine={false} tick={{fontSize:11,fill:"#89938e"}}/><Tooltip contentStyle={{border:"1px solid #e7ece9",borderRadius:10,fontSize:12}}/><Area type="monotone" dataKey="bp" stroke="#16856e" strokeWidth={2.5} fill="url(#bpFill)" dot={{r:3,fill:"#16856e",strokeWidth:0}}/></AreaChart></ResponsiveContainer></div><div className="chart-caption"><span><i/> Systolic reading</span><span>Illustrative sample trend</span></div></section>
            <section className="panel"><div className="panel-heading"><div><h3>Items to review</h3><p>Based on available records</p></div><span className="attention-icon"><AlertCircle size={17}/></span></div><div className="review-list"><div className="review-item"><span className="review-symbol amber-symbol"><Activity size={16}/></span><div><strong>Reading history</strong><p>{patient.missedReadings} scheduled readings not present in sample record</p></div></div><div className="review-item"><span className="review-symbol purple-symbol"><Pill size={16}/></span><div><strong>Medication record</strong><p>{patient.medications[0].detail}</p></div></div><div className="review-item"><span className="review-symbol blue-symbol"><MessageCircle size={16}/></span><div><strong>Previous care note</strong><p>{patient.notes[0].text}</p></div></div></div></section>
          </div>
          <section className="panel notes-panel"><div className="panel-heading"><div><h3>Recent care notes</h3><p>Previous patient interactions</p></div><button className="text-button" onClick={() => setTab("history")}>View history <ArrowUpRight size={14}/></button></div><div className="notes-list">{patient.notes.slice(0,2).map(n => <div className="note-row" key={n.date}><div className="note-date">{n.date}</div><div className="note-content"><strong>{n.title}</strong><p>{n.text}</p></div><FileText size={17} className="note-icon"/></div>)}</div></section>
          <div className="bottom-cta"><div className="cta-icon"><Sparkles size={19}/></div><div><strong>Ready to prepare for your next patient call?</strong><p>Generate a structured brief using the information available in this demo record.</p></div><button className="secondary-button" onClick={prepareCall}>Prepare call brief <ArrowUpRight size={15}/></button></div>
        </>}

        {tab === "brief" && <section className="brief-area">
          <div className="brief-intro"><div className="ai-orb"><Sparkles size={22}/></div><div><h3>AI call preparation</h3><p>A structured briefing to help you review the record before speaking with {patient.name}.</p></div></div>
          {!result && !loading && !error && <div className="empty-state"><div className="empty-icon"><ClipboardList size={26}/></div><h3>Your call brief is ready to generate</h3><p>We'll review the available vitals, missed readings, medication information and previous care notes.</p><button className="primary-button" onClick={prepareCall}><Sparkles size={16}/> Generate call brief</button></div>}
          {loading && <div className="loading-state"><div className="spinner"/><h3>Preparing patient context...</h3><p>Organising the available records and generating a structured call brief.</p></div>}
          {error && <div className="error-box"><AlertCircle size={18}/><span>{error}</span></div>}
          {result && <div className="results">
            <div className="result-meta"><span className="generated"><CheckCircle2 size={15}/> Brief generated</span><span className="mode-label">{result.mode === "ai" ? "AI-GENERATED" : "DEMO MODE"}</span></div>
            <section className="result-card summary-card"><div className="result-heading"><span className="result-icon green-bg"><Sparkles size={17}/></span><div><h4>Patient summary</h4><small>Concise overview of supplied records</small></div></div><p className="summary-text">{result.summary}</p></section>
            <section className="result-card"><div className="result-heading"><span className="result-icon amber-bg"><AlertCircle size={17}/></span><div><h4>Changes and items to review</h4><small>Observations linked to the available record</small></div></div><div className="change-list">{(result.changes || []).map((c,i) => <div className="change-row" key={i}><div className="change-bullet"/><div className="change-body"><div className="change-title">{c.title}<span className="source-chip">{c.source}</span></div><p>{c.detail}</p></div></div>)}</div></section>
            <section className="result-card"><div className="result-heading"><span className="result-icon blue-bg"><MessageCircle size={17}/></span><div><h4>Suggested questions</h4><small>Conversation prompts for care manager review</small></div></div><div className="question-list">{(result.questions || []).map((q,i) => <div className="question-row" key={i}><div className="question-number">{String(i+1).padStart(2,"0")}</div><div className="question-body"><strong>{q.question}</strong><p>{q.reason}</p><small>Context: {q.source}</small></div><button className={`check-button ${done.includes(i) ? "checked" : ""}`} onClick={() => setDone(old => old.includes(i) ? old.filter(x=>x!==i) : [...old,i])} title="Mark as reviewed"><CheckCircle2 size={18}/></button></div>)}</div></section>
            <section className="result-card"><div className="result-heading"><span className="result-icon purple-bg"><ShieldCheck size={17}/></span><div><h4>Confirm before the call</h4><small>Human review checklist</small></div></div><div className="verify-list">{(result.verify || []).map((v,i) => <label key={i}><input type="checkbox"/><span>{v}</span></label>)}</div></section>
            <div className="disclaimer"><ShieldCheck size={16}/><span>{result.disclaimer || "AI-generated preparation is for human review only. Follow your organisation's clinical protocols."}</span></div>
            <button className="outline-button" onClick={prepareCall}><Sparkles size={15}/> Regenerate brief</button>
          </div>}
        </section>}

        {tab === "history" && <section className="panel history-panel"><div className="panel-heading"><div><h3>Care history</h3><p>Previous notes available in this fictional patient record</p></div><span className="mini-tag">RECENT FIRST</span></div><div className="timeline">{patient.notes.map((n,i) => <div className="timeline-row" key={n.date}><div className="timeline-marker">{i === 0 ? <MessageCircle size={14}/> : <FileText size={14}/>}</div><div className="timeline-content"><small>{n.date}</small><strong>{n.title}</strong><p>{n.text}</p></div></div>)}</div><div className="medication-history"><div className="panel-heading"><div><h3>Medication information</h3><p>Entries in the sample record; confirm against the authoritative record</p></div><Pill size={18}/></div>{patient.medications.map(m=><div className="med-row" key={m.name}><div className="med-icon"><Pill size={17}/></div><div><strong>{m.name}</strong><p>{m.detail}</p></div></div>)}</div></section>}
        <footer className="footer"><span>TOCA CarePrep AI <b>·</b> Demonstration prototype</span><span>Fictional data only <b>·</b> Not for clinical use</span></footer>
      </div>
    </main>
  </div>
}

createRoot(document.getElementById("root")).render(<App />);
