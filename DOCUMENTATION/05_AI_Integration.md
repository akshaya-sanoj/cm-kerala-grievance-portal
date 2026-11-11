# 05. AI Integration

## 1. Overview & Objectives
The **AI Grievance Assistant** (`backend/src/services/aiService.js`) assists citizens during submission and CMO administrators during triage by analyzing unstructured complaint text and generating structured recommendations:
1. **Suggested Department** (`suggestedDepartmentCode`, `suggestedDepartmentName`)
2. **Suggested Category** (`suggestedCategory`)
3. **Recommended Priority** (`Low`, `Medium`, or `High`)
4. **Short CMO Summary** (`summary`, max 260–280 chars) and brief rationale (`reasoning`)
5. **Potential Duplicate Flagging** (`potentialDuplicates[]` with Reference ID, subject, status, and similarity score)

## 2. Live Model Integration (Google Gemini API)
- **Provider:** Google Gemini REST API (`generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent`)
- **Default Model:** `gemini-2.5-flash` (configurable via `GEMINI_MODEL` in `.env`)
- **Structured Output & Validation:** Requests `responseMimeType: "application/json"` with `temperature: 0.2` and a 12-second `AbortController` timeout. Output is strictly validated using `zod` (`aiResponseSchema`) before returning to the client or persisting on `Grievance.aiAnalysis`.

### Prompt Design (`backend/src/services/aiService.js`)
The prompt supplies:
- The active list of department codes and names from MongoDB (`PWD`, `HEALTH`, `EDU`, `KSEB`, `KWA`, `LSGD`, `REVENUE`, `TRANSPORT`)
- Allowed categories (`GRIEVANCE_CATEGORIES`) and priorities (`Low`, `Medium`, `High`)
- Citizen-entered `district`, optional `category`, `subject`, and `description`
- Explicit system instruction that outputs are **strictly advisory** for human review.

## 3. Duplicate Detection Workflow
`findPotentialDuplicates()` compares incoming `subject + description` against up to 60 recent grievances stored in MongoDB:
1. Normalizes text, strips common stop-words, and computes token **Jaccard similarity**.
2. Applies a `+0.12` district affinity boost when the candidate grievance is from the same Kerala district.
3. Filters candidates with score `>= 0.25` and surfaces the top 3 matches (`referenceId`, `subject`, `status`, `similarityScore`) inside the AI Assistant UI card for human review.

## 4. Labelled Fallback Mechanism
When `GEMINI_API_KEY` is absent, placeholder-valued, rate-limited, or unreachable over the network:
- `analyzeGrievance()` transparently falls back to `analyzeWithFallback()`.
- Uses weighted domain keyword profiles (`KEYWORD_PROFILES`), urgency signal scoring (`HIGH_URGENCY_TERMS` / `LOW_URGENCY_TERMS`), and extractive sentence summarization.
- **Explicit Transparency:** Sets `isFallback: true`, `source: "fallback"`, `model: "heuristic-fallback-v1"`, and populates `fallbackReason` (e.g., `"GEMINI_API_KEY is not configured in the server environment."`).
- The frontend (`AiAssistantCard.jsx`) displays a distinct amber warning banner and badge identifying **Labelled Fallback Mode** rather than live Gemini AI.

## 5. Safeguards & Limitations
- **Human-in-the-Loop Guarantee:** AI never creates a `DepartmentAssignment`, changes `status`, or closes a grievance automatically. Citizens must click **"Apply Suggested Category & Priority"** to copy suggestions into their form, and CMO administrators explicitly choose the final department and priority when forwarding.
- **Prompt & PII Restraint:** Only complaint text, district, and category are sent to Gemini—never user passwords, emails, or mobile numbers.
- **Limitation:** Duplicate detection compares the most recent 60 grievances via lexical similarity rather than vector embeddings; live Gemini calls depend on external network availability and `GEMINI_API_KEY` quota.
