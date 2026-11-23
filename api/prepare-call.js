import { patients } from "../src/patients.js";
import { analyzePatient } from "./_lib/analyze.js";
import { buildFallbackBrief, validateBrief } from "./_lib/brief.js";

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile"; // confirm in the Groq console
const DISCLAIMER = "AI-generated preparation is for human review only. It does not diagnose or recommend treatment. Follow your organisation's clinical protocols.";

const SYSTEM = `You prepare care managers for outpatient check-in calls. You receive numbered FACTS from a fictional patient record.
Rules:
1. Use only the facts. Never invent values, dates, drugs, symptoms or causes. Do not calculate new numbers; only use numbers that appear in the facts.
2. Every item must list evidence_ids that exist in the facts.
3. Do not diagnose. Do not recommend starting, stopping or changing any medication or dose. Describe items as "worth reviewing", not what they mean clinically.
4. Questions must be open, neutral, non-leading, phrased for a care manager to ask the patient.
5. If information is missing, say it is not recorded.
Return ONLY JSON:
{"summary": "2-3 sentences",
 "changes": [{"title","detail","priority":"high|medium|low","evidence_ids":["F1"]}],
 "questions": [{"question","reason","evidence_ids":["F1"]}],
 "verify": [{"text","evidence_ids":["F1"]}]}
Max 4 changes, 5 questions, 4 verify items.`;

async function callGroq(facts, patient) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Patient: ${patient.age}-year-old ${patient.gender}.\nFACTS:\n${facts.map((f) => `${f.id}: ${f.text}`).join("\n")}` },
        ],
      }),
    });
    if (!r.ok) throw new Error(`Groq returned ${r.status}`);
    const data = await r.json();
    return JSON.parse(data.choices[0].message.content);
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const patient = patients.find((p) => p.id === body?.patientId);
  if (!patient) return res.status(404).json({ error: "Unknown patient" });

  const t0 = Date.now();
  const pipeline = [];
  const step = (key, label, status, ms = 0) => pipeline.push({ key, label, status, ms });
  const { facts, urgent } = analyzePatient(patient);
  step("facts", "Compute facts", "done", Date.now() - t0);
  const evidence = Object.fromEntries(facts.map((f) => [f.id, { label: f.label, text: f.text }]));
  const send = (brief, mode, extra = {}) =>
    res.status(200).json({ ...brief, mode, facts, evidence, pipeline, disclaimer: DISCLAIMER,
      meta: { model: MODEL, latencyMs: Date.now() - t0, ...extra } });

  if (urgent) {
    step("llm", "Draft with LLM", "skipped"); step("validate", "Validate", "skipped"); step("review", "Your review", "pending");
    return send({
      summary: "Values in the record exceed the critical review threshold. Follow your clinical escalation protocol. AI call preparation was skipped.",
      changes: [{ title: "Critical threshold exceeded", detail: facts[0].text, priority: "high", evidence_ids: [facts[0].id] }],
      questions: [], verify: ["Follow the escalation protocol before any routine call."],
    }, "safety");
  }

  try {
    if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY is not set");
    const t1 = Date.now();
    const raw = await callGroq(facts, patient);
    step("llm", "Draft with LLM", "done", Date.now() - t1);
    const t2 = Date.now();
    const { brief, dropped } = validateBrief(raw, facts);
    step("validate", "Validate and ground", "done", Date.now() - t2);
    step("review", "Your review", "pending");
    return send(brief, "ai", { dropped });
  } catch (err) {
    pipeline.length = 1;
    step("llm", "Draft with LLM", "failed"); step("validate", "Validate and ground", "skipped"); step("review", "Your review", "pending");
    return send(buildFallbackBrief(facts, patient), "fallback", { error: String(err.message) });
  }
}