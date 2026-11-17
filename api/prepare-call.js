export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { patient } = req.body || {};

  if (!patient?.id) {
    return res.status(400).json({ error: "Invalid patient record" });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({
      error: "Groq API key is not configured."
    });
  }

  const prompt = `
You are an administrative patient call preparation assistant.

Analyze only the supplied fictional patient records.

Do not diagnose, recommend treatments, or suggest
medication changes.

Return JSON containing:
- summary
- changes (title, detail, source, level)
- questions (question, reason, source)
- verify (array of strings)
- disclaimer

Clearly distinguish recorded facts from questions.

Patient information:
${JSON.stringify(patient)}
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
          model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
          messages: [
            {
              role: "system",
              content: "Return only valid JSON."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2
        })
      }
    );

    if (!response.ok) {
      return res.status(502).json({
        error: "Groq AI service request failed."
      });
    }

    const data = await response.json();
    const result = JSON.parse(
      data.choices[0].message.content
    );

    return res.status(200).json({
      mode: "ai",
      ...result
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Unable to generate patient call brief."
    });
  }
}
