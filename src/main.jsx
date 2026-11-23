import React, { useMemo, useState } from "react";
import { patients } from "./patients.js";
import { createRoot } from "react-dom/client";
import { Activity, AlertCircle, ArrowUpRight, Bell, CalendarDays, CheckCircle2, ChevronDown, ClipboardList, Clock3, FileText, HeartPulse, LayoutDashboard, Menu, MessageCircle, Pill, Search, ShieldCheck, Sparkles, UserRound, Users, X, Zap } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import "./styles.css";

const MODE_LABEL = { ai: "AI-GENERATED · GROQ", fallback: "RULE-BASED FALLBACK", safety: "SAFETY GATE" };

const SUMMARY_LABEL = {
  ai: "AI-generated draft, validated against recorded facts",
  fallback: "Rule-based preparation, validated against recorded facts",
  safety: "Safety escalation — AI preparation skipped",
};

function Evidence({ ids = [], evidence = {} }) {
  if (!ids.length) return null;
  return <div className="evidence-row">{ids.map(id =>
    <span key={id} className="source-chip" title={evidence[id]?.text}>{id} · {evidence[id]?.label || "Record"}</span>)}</div>;
}

function Pipeline({ steps = [] }) {
  return <div className="pipeline">{steps.map((s, i) =>
    <div key={s.key} className={`pipe-step ${s.status}`}>
      <span className="pipe-dot">{i + 1}</span>
      <div><strong>{s.label}</strong>
        <small>{s.status === "failed" ? "Fallback used" : s.status === "skipped" ? "Skipped" : s.status === "pending" ? "Awaiting you" : `${s.ms} ms`}</small></div>
    </div>)}</div>;
}

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
      const response = await fetch("/api/prepare-call", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patientId: patient.id }) });
      const responseText = await response.text();

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `API returned an invalid response (${response.status}): ${
            responseText || "Empty response"
          }`
        );
      }

      if (!response.ok) {
        throw new Error(data.error || "Could not prepare call.");
      }

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
            <div className="result-meta"><span className="generated"><CheckCircle2 size={15}/> Brief generated</span><span className="mode-label">{MODE_LABEL[result.mode] || "DEMO MODE"}</span></div>
            <Pipeline steps={result.pipeline}/>

            <section className="result-card summary-card"><div className="result-heading"><span className="result-icon green-bg"><Sparkles size={17}/></span><div><h4>Patient summary</h4><small>{SUMMARY_LABEL[result.mode] || "Preparation based on recorded facts"}</small></div></div><p className="summary-text">{result.summary}</p></section>

            <section className="result-card"><div className="result-heading"><span className="result-icon amber-bg"><AlertCircle size={17}/></span><div><h4>Changes and items to review</h4><small>Each item cites the record facts it is based on</small></div></div>
              <div className="change-list">{(result.changes || []).map((c, i) => <div className="change-row" key={i}><div className="change-bullet"/><div className="change-body">
                <div className="change-title">{c.title}{c.priority === "high" && <span className="pill pill-amber">High priority</span>}</div>
                <p>{c.detail}</p>
                <Evidence ids={c.evidence_ids} evidence={result.evidence}/>
              </div></div>)}</div></section>

            <section className="result-card"><div className="result-heading"><span className="result-icon blue-bg"><MessageCircle size={17}/></span><div><h4>Suggested questions</h4><small>Conversation prompts for care manager review</small></div></div>
              <div className="question-list">{(result.questions || []).map((q, i) => <div className="question-row" key={i}>
                <div className="question-number">{String(i + 1).padStart(2, "0")}</div>
                <div className="question-body"><strong>{q.question}</strong><p>{q.reason}</p><Evidence ids={q.evidence_ids} evidence={result.evidence}/></div>
                <button className={`check-button ${done.includes(i) ? "checked" : ""}`} onClick={() => setDone(old => old.includes(i) ? old.filter(x => x !== i) : [...old, i])} title="Mark as reviewed"><CheckCircle2 size={18}/></button>
              </div>)}</div></section>

            <section className="result-card"><div className="result-heading"><span className="result-icon purple-bg"><ShieldCheck size={17}/></span><div><h4>Confirm before the call</h4><small>Human review checklist</small></div></div>
              <div className="verify-list">
                {(result.verify || []).map((v, i) => (
                  <div className="verify-item" key={i}>
                    <label>
                      <input type="checkbox" />
                      <span>{typeof v === "string" ? v : v.text}</span>
                    </label>
                    {typeof v === "object" && (
                      <Evidence ids={v.evidence_ids} evidence={result.evidence} />
                    )}
                  </div>
                ))}
              </div></section>

            <section className="result-card"><details>
              <summary className="facts-summary"><strong>Recorded facts used</strong> <small>Computed from the record, not generated by AI</small></summary>
              <div className="facts-list">{(result.facts || []).map(f => <div key={f.id} className="fact-row"><span className="fact-id">{f.id}</span><div><strong>{f.label}</strong><p>{f.text}</p></div></div>)}</div>
            </details></section>

            <div className="disclaimer">
              <ShieldCheck size={16}/>
              <span>
                {result.mode === "fallback"
                  ? "Rule-based preparation is for human review only. It does not diagnose or recommend treatment. Follow your organisation's clinical protocols."
                  : result.disclaimer}
              </span>
            </div>
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
