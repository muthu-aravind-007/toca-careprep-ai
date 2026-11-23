
const MAX_PATIENT_SIZE = 30000;
const MAX_EVIDENCE_ITEMS = 100;

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function cleanString(value, maxLength = 1000) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function buildEvidenceCatalogue(patient) {
  const evidence = [];

  function walk(value, path, depth = 0) {
    if (evidence.length >= MAX_EVIDENCE_ITEMS || depth > 6) return;

    if (Array.isArray(value)) {
      // Include the complete collection as evidence, as well as its items.
      if (path) {
        evidence.push({
          source: path,
          value: JSON.stringify(value).slice(0, 2000)
        });
      }

      value.forEach((item, index) => {
        walk(item, `${path}[${index}]`, depth + 1);
      });
      return;
    }

    if (isPlainObject(value)) {
      if (path) {
        evidence.push({
          source: path,
          value: JSON.stringify(value).slice(0, 1000)
        });
      }

      for (const [key, item] of Object.entries(value)) {
        walk(item, path ? `${path}.${key}` : key, depth + 1);
      }
      return;
    }

    if (
      value !== null &&
      value !== undefined &&
      ["string", "number", "boolean"].includes(typeof value)
    ) {
      evidence.push({
        source: path,
        value: String(value).slice(0, 500)
      });
    }
  }

  walk(patient, "patient");
  return evidence;
}

// Calculate factual observations in application code.
// Groq does not generate or modify these observations.
function buildDeterministicChanges(patient) {
  const changes = [];

  const vitals = Array.isArray(patient.vitals) ? patient.vitals : [];

  const bloodPressure = vitals.find(
    (v) => v.label?.toLowerCase() === "blood pressure"
  );

  if (bloodPressure?.value) {
    const trend = Array.isArray(patient.trend) ? patient.trend : [];

    if (trend.length >= 2) {
      const first = trend[0];
      const latest = trend[trend.length - 1];

      if (
        typeof first.bp === "number" &&
        typeof latest.bp === "number"
      ) {
        const difference = latest.bp - first.bp;
        const direction =
          difference > 0 ? "increased" :
          difference < 0 ? "decreased" :
          "remained unchanged";

        changes.push({
          title: "Seven-day systolic reading trend",
          detail: `The recorded systolic value ${direction} from ${first.bp} mmHg on ${first.day} to ${latest.bp} mmHg on ${latest.day}. Latest blood pressure record: ${bloodPressure.value}.`,
          source: "patient.trend",
          level: "review"
        });
      }
    } else {
      changes.push({
        title: "Latest blood pressure reading",
        detail: `The latest supplied blood pressure record is ${bloodPressure.value}, dated ${bloodPressure.date || "date not supplied"}.`,
        source: "patient.vitals",
        level: "review"
      });
    }
  }

  if (
    typeof patient.missedReadings === "number" &&
    patient.missedReadings > 0
  ) {
    changes.push({
      title: "Missed scheduled readings",
      detail: `${patient.missedReadings} scheduled reading(s) are recorded as missed in the supplied patient record.`,
      source: "patient.missedReadings",
      level: "review"
    });
  }

  const notes = Array.isArray(patient.notes) ? patient.notes : [];

  notes.forEach((note, index) => {
    if (!note.text) return;

    changes.push({
      title: note.title || "Previous care note",
      detail: `${note.date ? `${note.date}: ` : ""}${note.text}`,
      source: `patient.notes[${index}]`,
      level: "info"
    });
  });

  const medications = Array.isArray(patient.medications)
    ? patient.medications
    : [];

  medications.forEach((medication, index) => {
    if (!medication.name || !medication.detail) return;

    changes.push({
      title: `${medication.name} — record for confirmation`,
      detail: medication.detail,
      source: `patient.medications[${index}]`,
      level: "review"
    });
  });

  return changes.slice(0, 12);
}

function buildPatientSummary(patient) {
  const parts = [];

  const identity = [
    patient.name,
    typeof patient.age === "number" ? `${patient.age} years old` : null,
    patient.program
  ].filter(Boolean);

  if (identity.length) {
    parts.push(`${identity.join(", ")}.`);
  }

  const vitals = Array.isArray(patient.vitals) ? patient.vitals : [];

  if (vitals.length) {
    const readings = vitals
      .filter((v) => v.label && v.value)
      .map((v) => `${v.label}: ${v.value}`)
      .join("; ");

    if (readings) parts.push(`Latest supplied readings: ${readings}.`);
  }

  if (typeof patient.missedReadings === "number") {
    parts.push(
      `${patient.missedReadings} missed scheduled reading(s) recorded.`
    );
  }

  const notes = Array.isArray(patient.notes) ? patient.notes : [];

  if (notes.length && notes[0].text) {
    parts.push(
      `Most recent supplied care note (${notes[0].date || "date not supplied"}): ${notes[0].text}`
    );
  }

  return parts.join(" ");
}

function validateAiResponse(result, validSources) {
  if (!isPlainObject(result)) {
    throw new Error("Invalid AI response format.");
  }

  const questions = Array.isArray(result.questions)
    ? result.questions
        .filter(
          (item) =>
            isPlainObject(item) &&
            validSources.has(item.source)
        )
        .slice(0, 8)
        .map((item) => ({
          question: cleanString(item.question, 400),
          reason: cleanString(item.reason, 500),
          source: item.source
        }))
        .filter((item) => item.question && item.reason)
    : [];

  const verify = Array.isArray(result.verify)
    ? result.verify
        .filter((item) => typeof item === "string")
        .map((item) => cleanString(item, 300))
        .filter(Boolean)
        .slice(0, 8)
    : [];

  return { questions, verify };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const { patient } = req.body || {};

  if (!isPlainObject(patient) || !patient.id || !patient.name) {
    return res.status(400).json({
      error: "Invalid patient record."
    });
  }

  let patientJson;

  try {
    patientJson = JSON.stringify(patient);
  } catch {
    return res.status(400).json({
      error: "Patient record could not be processed."
    });
  }

  if (patientJson.length > MAX_PATIENT_SIZE) {
    return res.status(413).json({
      error: "Patient record is too large."
    });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({
      error: "Groq API key is not configured."
    });
  }

  const evidence = buildEvidenceCatalogue(patient);
  const validSources = new Set(evidence.map((item) => item.source));

  const changes = buildDeterministicChanges(patient);
  const summary = buildPatientSummary(patient);

  const prompt = `
You are an administrative patient call preparation assistant.

Prepare practical conversation questions for a human care manager.

Use ONLY the supplied fictional patient record and evidence catalogue.

RULES:
- Do not diagnose or interpret clinical significance.
- Do not recommend treatment or medication changes.
- Do not invent readings, dates, medication details, or events.
- Questions must be relevant to information actually present.
- Every question must reference an exact source path from the evidence catalogue.
- Do not invent or modify source paths.
- Distinguish recorded facts from questions requiring confirmation.
- Do not repeat the same question in different words.
- Keep questions concise and respectful.

Return ONLY a JSON object with these fields:

{
  "questions": [
    {
      "question": "Question for the patient",
      "reason": "Why the question is relevant to the supplied record",
      "source": "Exact source path from the evidence catalogue"
    }
  ],
  "verify": [
    "Practical item for the care manager to verify"
  ]
}

Return empty arrays if no useful questions or verification items are supported.

PATIENT RECORD:
${patientJson}

EVIDENCE CATALOGUE:
${JSON.stringify(evidence)}
`;

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model:
            process.env.GROQ_MODEL ||
            "openai/gpt-oss-20b",
          messages: [
            {
              role: "system",
              content: "Return only a valid JSON object."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1
        }),
        signal: AbortSignal.timeout(25000)
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();

      console.error(
        "Groq request failed:",
        response.status,
        errorBody.slice(0, 500)
      );

      return res.status(502).json({
        error: "The AI service could not generate the call brief."
      });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (typeof content !== "string" || !content.trim()) {
      throw new Error("Groq returned an empty response.");
    }

    const parsed = JSON.parse(content);
    const validated = validateAiResponse(parsed, validSources);

    return res.status(200).json({
      mode: "ai",
      summary,
      changes,
      questions: validated.questions,
      verify: validated.verify,
      disclaimer:
        "This is an AI-assisted administrative preparation aid using fictional demo data. It does not provide diagnosis, treatment recommendations, or medication decisions. A qualified care professional must review all information."
    });
  } catch (error) {
    console.error("Call preparation error:", error.message);

    return res.status(500).json({
      error: "Unable to generate a validated patient call brief."
    });
  }
}
