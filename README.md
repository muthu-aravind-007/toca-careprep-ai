# TOCA CarePrep AI

A browser-deployable demonstration prototype for preparing care managers for patient calls.

## What's included
- React + Vite patient workspace
- Fictional patient records, vitals trend, medication notes and care history
- AI call preparation interface with evidence/source labels and human-review checklist
- Vercel serverless endpoint (`api/prepare-call.js`)
- Demo mode works without an API key; adding `OPENAI_API_KEY` in Vercel enables live model-generated structured output

## Run locally (optional)
Requires Node.js 18+.
```bash
npm install
npm run dev
```

## Deploy
1. Create a GitHub repository and upload the contents of this folder (not the ZIP itself).
2. In Vercel, choose **Add New → Project**, import the GitHub repository.
3. Framework preset: **Vite**. Build command: `npm run build`. Output directory: `dist`.
4. Deploy. Vercel automatically hosts the `api/prepare-call.js` function.
5. Optional live AI: in Vercel → Project → Settings → Environment Variables, add `OPENAI_API_KEY` and optionally `OPENAI_MODEL` (default `gpt-4.1-mini`), then redeploy.

## Important
- Use fictional demo data only. Do not enter real patient information.
- The default demo mode uses predefined illustrative logic; it is not an LLM response.
- AI output is for workflow demonstration and human review only. It is not diagnosis, treatment advice, or a clinical decision-support product.
- Never expose API keys in frontend code or commit `.env` files.
