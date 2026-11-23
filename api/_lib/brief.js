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

  
  const questions = [];

  const addQuestion = (question, reason, evidenceIds) => {
    if (evidenceIds.length) {
      questions.push({
        question,
        reason,
        evidence_ids: evidenceIds,
      });
    }
  };

  // Use the most recent care note to create a relevant conversation prompt.
  const latestNote = nt[0];

  if (latestNote && /medication schedule|taking medication/i.test(latestNote.text)) {
    addQuestion(
      "At your previous check-in, you mentioned difficulty maintaining a consistent medication schedule. How has that been going since we last spoke?",
      "Follows up on a barrier documented in the previous care note.",
      [latestNote.id]
    );
  } 
  
  else if (
    latestNote &&
    /requested a follow-up call to review home monitoring/i.test(latestNote.text)
  ) {
    addQuestion(
      "At your previous check-in, you asked for a follow-up about your home monitoring. How has your monitoring routine been going?",
      "Follows up on the previously requested monitoring discussion.",
      [latestNote.id]
    );
  }

  else if (latestNote && /submitting readings|monitoring routine/i.test(latestNote.text)) {
    addQuestion(
      "At your last check-in, you had questions about your home monitoring routine. How has submitting your readings been going?",
      "Follows up on the previously documented monitoring discussion.",
      [latestNote.id]
    );
  } else if (latestNote) {
    addQuestion(
      `Your previous care note mentioned: ${latestNote.text} Could you tell me how things have been since then?`,
      "Continues a topic documented in the previous care note.",
      [latestNote.id]
    );
  }

  // Ask about readings that are absent from the record.
  if (ms[0] && !ms[0].text.startsWith("No missed")) {
    addQuestion(
      "The record shows scheduled readings that were not received. Were there any difficulties completing or submitting them?",
      "Explores possible barriers without assuming why readings are missing.",
      [ms[0].id]
    );
  }

  // Distinguish actual medication names from reconciliation entries.
  if (md.length) {
    const medicationIds = md.map((f) => f.id);
    const hasReconciliation = md.some((f) =>
      /medication reconciliation/i.test(f.text)
    );

    if (hasReconciliation) {
      addQuestion(
        "Could we review the medication list together and confirm which medications you currently take?",
        "The patient-reported medication list requires confirmation.",
        medicationIds
      );
    } else {
      addQuestion(
        "The medication record contains recent information that needs confirmation. Could you walk me through your current medications and the schedule you follow?",
        "Confirms the medication information recorded in the care record.",
        medicationIds
      );
    }
  }

  // Keep a neutral general check-in if the record provides too few prompts.
  if (questions.length < 2 && vit[0]) {
    addQuestion(
      "How have you been feeling since your last check-in? Is there anything you would like the care team to know?",
      "Provides an open opportunity to raise concerns.",
      [vit[0].id]
    );
  }

  const finalQuestions = questions.slice(0, 5);


  return {
    summary: `Rule-based summary for ${patient.name}: ${vit[0]?.text || ""} ${ms[0]?.text || ""}`.trim(),
    changes, questions: finalQuestions,
    verify: [
      ...(md[0]
        ? [{
            text: "Confirm the current medication details with the patient.",
            evidence_ids: [md[0].id],
          }]
        : []),
      ...(vit[0]
        ? [{
            text: "Check the latest readings in the authoritative record.",
            evidence_ids: [vit[0].id],
          }]
        : []),
      ...(ms[0]
        ? [{
            text: "Review the scheduled readings recorded as missing.",
            evidence_ids: [ms[0].id],
          }]
        : []),
    ],
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