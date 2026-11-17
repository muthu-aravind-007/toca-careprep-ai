export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { patient } = req.body || {};
  if (!patient || !patient.id) return res.status(400).json({ error: "A valid demo patient is required." });

  const facts = {
    name: patient.name,
    age: patient.age,
    conditions: patient.conditions,
    vitals: patient.vitals,
    missedReadings: patient.missedReadings,
    medications: patient.medications,
    notes: patient.notes
  };

  if (!process.env.OPENAI_API_KEY) {
    return res.status(200).json({
      mode: "demo",
      summary: `${patient.name}'s latest record includes ${patient.vitals[0].label.toLowerCase()} of ${patient.vitals[0].value}, compared with a previous value of ${patient.vitals[0].previous}. There are ${patient.missedReadings} missed scheduled readings and a recent medication record that should be confirmed during the call.`,
      changes: [
        { title: `${patient.vitals[0].label} changed`, detail: `Latest: ${patient.vitals[0].value}; previous: ${patient.vitals[0].previous}. Review the trend and confirm the context with the patient.`, source: "Vitals history", level: "review" },
        { title: "Missed readings", detail: `${patient.missedReadings} scheduled readings are not present in the supplied demo record. Ask whether the patient had difficulty taking or submitting them.`, source: "Reading schedule", level: "follow-up" },
        { title: "Medication record needs confirmation", detail: patient.medications[0].detail, source: "Medication history", level: "follow-up" }
      ],
      questions: [
        { question: "Have you been able to follow your current medication schedule?", reason: "A recent medication record is present and should be reconciled with the patient's account.", source: "Medication history" },
        { question: "Was anything getting in the way of completing your scheduled readings?", reason: `${patient.missedReadings} readings are missing from the supplied record.`, source: "Reading schedule" },
        { question: "Have you noticed any new symptoms or changes since we last spoke?", reason: "An open-ended check-in helps the care manager gather current context.", source: "Call preparation guidance" }
      ],
      verify: ["Confirm the medication list against the authoritative clinical record.", "Ask the patient to explain missing readings; do not assume the reason.", "Escalate concerns according to the organisation's clinical protocols."],
      disclaimer: "Demo-mode output generated from fictional sample data using predefined logic. It is not a clinical assessment or medical advice."
    });
  }

  const prompt = `You are an administrative call-preparation assistant for trained care managers. Use only the supplied fictional patient record. Do not diagnose, assign a clinical risk score, recommend treatment, or suggest medication changes. Separate recorded facts from questions. If information is missing, say so. Return valid JSON only with keys: summary (string), changes (array of {title,detail,source,level}), questions (array of {question,reason,source}), verify (array of strings), disclaimer (string). levels should be "review" or "follow-up". Include 3-5 questions. Clearly flag data that needs human confirmation. Patient record: ${JSON.stringify(facts)}`;

  try {
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        messages: [{ role: "system", content: "Return only valid JSON. No markdown fences." }, { role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.2
      })
    });
    if (!upstream.ok) {
      const detail = await upstream.text();
      console.error("Model API error:", detail);
      return res.status(502).json({ error: "The AI service could not complete the request. Check the server-side API configuration." });
    }
    const data = await upstream.json();
    const result = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    return res.status(200).json({ mode: "ai", ...result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Unable to prepare the call brief." });
  }
}
