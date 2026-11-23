const sg = (n) => (n > 0 ? `+${n}` : `${n}`);
const parseBP = (s) => {
  const m = String(s || "").match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
  return m ? { sys: +m[1], dia: +m[2] } : null;
};
export const THRESHOLD = { sys: 140, dia: 90 }; // flagging only, not diagnosis
export const CRITICAL = { sys: 180, dia: 120 }; // skip AI, use escalation protocol

export function analyzePatient(p) {
  const facts = [];
  const add = (kind, label, text) => {
    const id = `F${facts.length + 1}`;
    facts.push({ id, kind, label, text });
  };

  const bpV = p.vitals.find((v) => /blood pressure/i.test(v.label));
  const cur = parseBP(bpV?.value);
  const prev = parseBP(bpV?.previous);
  if (cur) {
    add("vitals", "Blood pressure reading",
      `Latest blood pressure ${bpV.value} on ${bpV.date}; previous reading ${bpV.previous}` +
        (prev ? ` (change ${sg(cur.sys - prev.sys)}/${sg(cur.dia - prev.dia)} mmHg).` : "."));
    const above = cur.sys >= THRESHOLD.sys || cur.dia >= THRESHOLD.dia;
    add("vitals", "Blood pressure reading",
      `Latest blood pressure is ${above ? "at or above" : "below"} the review threshold of ${THRESHOLD.sys}/${THRESHOLD.dia} mmHg (flagging threshold only, not a diagnosis).`);
  }
  p.vitals.filter((v) => v !== bpV).forEach((v) =>
    add("vitals", `${v.label} reading`, `Latest ${v.label.toLowerCase()} ${v.value} on ${v.date}; previous ${v.previous}.`));

  if (p.trend?.length > 1) {
    const t = p.trend, a = t[0].bp, b = t[t.length - 1].bp;
    const rises = t.slice(1).filter((x, i) => x.bp > t[i].bp).length;
    add("trend", "Seven-day blood pressure trend",
      `Systolic readings from ${t[0].day} to ${t[t.length - 1].day} moved from ${a} to ${b} mmHg (change ${sg(b - a)}); the value rose on ${rises} of ${t.length - 1} day-to-day steps.`);
  }

  add("missed", "Missed readings",
    p.missedReadings > 0
      ? `${p.missedReadings} scheduled reading(s) not present in the record.`
      : "No missed scheduled readings in the record.");

  p.medications.forEach((m) => add("medication", "Medication record", `${m.name}: ${m.detail}`));
  p.notes.forEach((n) => add("note", "Previous care note", `Care note ${n.date} (${n.title}): ${n.text}`));
  add("profile", "Patient profile",
    `Conditions on record: ${p.conditions.join(", ")}. Program: ${p.program}. Last contact ${p.lastContact}; care team ${p.clinician}.`);

  const urgent = !!cur && (cur.sys >= CRITICAL.sys || cur.dia >= CRITICAL.dia);
  return { facts, urgent };
}