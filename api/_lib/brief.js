const NUM = /\d+(?:\.\d+)?/g;
const BANNED = /(diagnos|you should (increase|decrease|stop|start|take)|(increase|decrease|double|reduce|stop|skip|change|adjust) (the |your )?(dose|dosage|medication|medicine)|prescrib|hypertensive crisis|stroke|heart attack)/i;

export function buildFallbackBrief(facts, patient) {
  const by = (k) => facts.filter((f) => f.kind === k);
  const vit = by("vitals"), tr = by("trend"), ms = by("missed"), md = by("medication"), nt = by("note");
  const changes = [];
  if (vit[0]) changes.push({ title: "Blood pressure compared with previous reading", detail: vit[0].text, priority: "medium", evidence_ids: [vit[0].id] });
  if (tr[0]) changes.push({ title: "Seven-day blood pressure trend", detail: tr[0].text, priority: "medium", evidence_ids: [tr[0].id] });
  if (ms[0] && !ms[0].text.startsWith("No missed")) changes.push({ title: "Missing scheduled readings", detail: ms[0].text, priority: "medium", evidence_ids: [ms[0].id] });
  if (md[0]) changes.push({ title: "Medication record", detail: md[0].text, priority: "medium", evidence_ids: [md[0].id] });

  const questions = [
    { question: "How have you been getting on with your routine this week?", reason: "Open check-in on adherence and monitoring.", evidence_ids: [...md, ...nt].slice(0, 2).map((f) => f.id) },
    { question: "Is anything making it harder to take or submit your readings?", reason: "Look for barriers to monitoring.", evidence_ids: ms.map((f) => f.id) },
    { question: "Have you noticed anything different since we last spoke?", reason: "Open check for new concerns.", evidence_ids: vit.slice(0, 1).map((f) => f.id) },
  ].filter((q) => q.evidence_ids.length);

  return {
    summary: `Rule-based summary for ${patient.name}: ${vit[0]?.text || ""} ${ms[0]?.text || ""}`.trim(),
    changes, questions,
    verify: ["Confirm current medication details with the patient.", "Check the latest readings in the authoritative record."],
  };
}

export function validateBrief(raw, facts) {
  const valid = new Set(facts.map((f) => f.id));
  const nums = new Set(facts.flatMap((f) => f.text.match(NUM) || []));
  const dropped = [];
  const ok = (t) => !BANNED.test(t) && (t.match(NUM) || []).every((n) => nums.has(n));

  const clean = (arr, keys, max) =>
    (Array.isArray(arr) ? arr : []).slice(0, max).flatMap((item) => {
      const ev = (Array.isArray(item?.evidence_ids) ? item.evidence_ids : []).filter((id) => valid.has(id));
      const strs = keys.map((k) => item?.[k]);
      let reason = null;
      if (!strs.every((s) => typeof s === "string" && s.trim())) reason = "missing field";
      else if (!ev.length) reason = "no valid evidence";
      else if (!ok(strs.join(" "))) reason = "ungrounded number or advice-like wording";
      if (reason) { dropped.push({ reason, item }); return []; }
      return [{ ...item, evidence_ids: ev }];
    });

  const summary = typeof raw?.summary === "string" && ok(raw.summary) ? raw.summary.trim() : null;
  const changes = clean(raw?.changes, ["title", "detail"], 4).map((c) => ({
    title: c.title, detail: c.detail, evidence_ids: c.evidence_ids,
    priority: ["high", "medium", "low"].includes(c.priority) ? c.priority : "medium",
  }));
  const questions = clean(raw?.questions, ["question", "reason"], 5).map((q) => ({
    question: q.question, reason: q.reason, evidence_ids: q.evidence_ids,
  }));
  const verify = clean(raw?.verify, ["text"], 4).map((v) => v.text);

  if (!summary || !changes.length || questions.length < 2) throw new Error("Validation left too little usable content");
  return { brief: { summary, changes, questions, verify }, dropped };
}