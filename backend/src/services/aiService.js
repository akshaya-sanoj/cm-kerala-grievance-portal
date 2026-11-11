import { z } from 'zod';
import { env } from '../config/env.js';
import {
  CATEGORY_TO_DEPARTMENT_CODE,
  GRIEVANCE_CATEGORIES,
  GRIEVANCE_PRIORITIES
} from '../utils/constants.js';

const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'of', 'for',
  'with', 'by', 'from', 'as', 'that', 'this', 'are', 'was', 'were', 'be', 'been',
  'have', 'has', 'had', 'not', 'but', 'or', 'our', 'we', 'my', 'near', 'since',
  'please', 'kindly', 'request', 'issue', 'problem', 'complaint', 'kerala'
]);

const DEFAULT_DEPARTMENTS = [
  { code: 'PWD', name: 'Public Works Department (PWD)' },
  { code: 'HEALTH', name: 'Health & Family Welfare Department' },
  { code: 'EDU', name: 'General Education Department' },
  { code: 'KSEB', name: 'Kerala State Electricity Board (KSEB)' },
  { code: 'KWA', name: 'Kerala Water Authority (KWA)' },
  { code: 'LSGD', name: 'Local Self Government Department (LSGD)' },
  { code: 'REVENUE', name: 'Revenue & Disaster Management' },
  { code: 'TRANSPORT', name: 'Transport & Motor Vehicles Department' }
];

const KEYWORD_PROFILES = [
  {
    category: 'Electricity & Power',
    departmentCode: 'KSEB',
    keywords: ['electricity', 'power', 'transformer', 'kseb', 'voltage', 'blackout', 'outage', 'wire', 'electric', 'pole', 'meter', 'shock', 'feeder']
  },
  {
    category: 'Water Supply & Drainage',
    departmentCode: 'KWA',
    keywords: ['water', 'drinking', 'pipe', 'pipeline', 'kwa', 'tap', 'leakage', 'contamination', 'sewage', 'drainage', 'flooded', 'borewell', 'tanker']
  },
  {
    category: 'Healthcare',
    departmentCode: 'HEALTH',
    keywords: ['hospital', 'doctor', 'medicine', 'clinic', 'phc', 'ambulance', 'health', 'medical', 'vaccine', 'dengue', 'ward', 'nurse', 'patient']
  },
  {
    category: 'Education',
    departmentCode: 'EDU',
    keywords: ['school', 'college', 'teacher', 'classroom', 'student', 'scholarship', 'exam', 'mid-day', 'hostel', 'library', 'textbook', 'tuition']
  },
  {
    category: 'Public Infrastructure',
    departmentCode: 'PWD',
    keywords: ['road', 'bridge', 'pothole', 'highway', 'culvert', 'pavement', 'footpath', 'building', 'construction', 'pwd', 'repair', 'damaged']
  },
  {
    category: 'Civic Services & Sanitation',
    departmentCode: 'LSGD',
    keywords: ['waste', 'garbage', 'sanitation', 'streetlight', 'panchayat', 'municipality', 'corporation', 'stray', 'mosquito', 'cleaning', 'dump']
  },
  {
    category: 'Revenue & Land Records',
    departmentCode: 'REVENUE',
    keywords: ['land', 'patta', 'revenue', 'village office', 'certificate', 'mutation', 'tax', 'flood relief', 'compensation', 'survey', 'encroachment']
  },
  {
    category: 'Transport & Road Safety',
    departmentCode: 'TRANSPORT',
    keywords: ['bus', 'ksrtc', 'transport', 'traffic', 'signal', 'accident', 'junction', 'auto', 'permit', 'license', 'rto', 'station']
  },
  {
    category: 'Public Welfare & Ration',
    departmentCode: 'LSGD',
    keywords: ['ration', 'pension', 'welfare', 'subsidy', 'food', 'bpl', 'senior citizen', 'allowance']
  }
];

const HIGH_URGENCY_TERMS = [
  'emergency', 'urgent', 'life-threatening', 'danger', 'collapsed', 'collapse',
  'accident', 'death', 'electrocution', 'live wire', 'contaminated', 'outbreak',
  'critical', 'no water', 'hospital', 'pregnant', 'children', 'flood', 'hospitalized',
  'fire', 'broken bridge', 'weeks', 'months'
];

const LOW_URGENCY_TERMS = [
  'request', 'suggestion', 'inquiry', 'information', 'minor', 'cosmetic',
  'update', 'clarification', 'new installation', 'schedule'
];

const aiResponseSchema = z.object({
  suggestedDepartmentCode: z.string().min(2),
  suggestedCategory: z.string().min(2),
  recommendedPriority: z.enum(GRIEVANCE_PRIORITIES),
  summary: z.string().min(10).max(400),
  reasoning: z.string().min(5).max(500)
});

function tokenize(text = '') {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function computeSimilarity(textA, textB) {
  const tokensA = new Set(tokenize(textA));
  const tokensB = new Set(tokenize(textB));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection += 1;
  }
  const union = tokensA.size + tokensB.size - intersection;
  return union === 0 ? 0 : Number((intersection / union).toFixed(2));
}

export function findPotentialDuplicates(subject = '', description = '', district = '', existingGrievances = []) {
  const queryText = `${subject} ${description}`;
  return existingGrievances
    .map((item) => {
      const baseScore = computeSimilarity(queryText, `${item.subject} ${item.description}`);
      const districtBoost = district && item.district === district ? 0.12 : 0;
      const score = Math.min(1, Number((baseScore + districtBoost).toFixed(2)));
      return {
        referenceId: item.referenceId,
        subject: item.subject,
        status: item.status,
        similarityScore: score
      };
    })
    .filter((candidate) => candidate.similarityScore >= 0.25)
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, 3);
}

function resolveDepartmentName(code, departments = DEFAULT_DEPARTMENTS) {
  const match = departments.find((d) => d.code === code);
  if (match) return match.name;
  const fallback = DEFAULT_DEPARTMENTS.find((d) => d.code === code);
  return fallback ? fallback.name : 'Local Self Government Department (LSGD)';
}

function normalizeCategory(rawCategory, fallbackCode) {
  if (GRIEVANCE_CATEGORIES.includes(rawCategory)) return rawCategory;
  const lowered = String(rawCategory || '').toLowerCase();
  const fuzzy = GRIEVANCE_CATEGORIES.find((cat) =>
    cat.toLowerCase().includes(lowered) || lowered.includes(cat.toLowerCase().split(' ')[0])
  );
  if (fuzzy) return fuzzy;
  const mapped = Object.entries(CATEGORY_TO_DEPARTMENT_CODE).find(
    ([, code]) => code === fallbackCode
  );
  return mapped ? mapped[0] : 'Other';
}

export function analyzeWithFallback({
  subject = '',
  description = '',
  district = '',
  category = '',
  departments = DEFAULT_DEPARTMENTS,
  existingGrievances = [],
  fallbackReason = 'Gemini API unavailable'
}) {
  const combined = `${subject} ${description} ${category}`.toLowerCase();

  let bestProfile = KEYWORD_PROFILES[5]; // LSGD default
  let bestHits = 0;

  for (const profile of KEYWORD_PROFILES) {
    let hits = 0;
    for (const kw of profile.keywords) {
      if (combined.includes(kw)) hits += 1;
    }
    if (profile.category === category) hits += 0.5;
    if (hits > bestHits) {
      bestHits = hits;
      bestProfile = profile;
    }
  }

  let urgencyScore = 0;
  const matchedUrgencyTerms = [];
  for (const term of HIGH_URGENCY_TERMS) {
    if (combined.includes(term)) {
      urgencyScore += 1;
      matchedUrgencyTerms.push(term);
    }
  }
  for (const term of LOW_URGENCY_TERMS) {
    if (combined.includes(term)) {
      urgencyScore -= 1;
    }
  }

  let recommendedPriority = 'Medium';
  if (urgencyScore >= 2) recommendedPriority = 'High';
  else if (urgencyScore <= -1) recommendedPriority = 'Low';

  const cleanDesc = description.trim().replace(/\s+/g, ' ');
  const firstSentence = cleanDesc.split(/(?<=[.!?])\s+/)[0] || cleanDesc;
  const truncated =
    firstSentence.length > 180 ? `${firstSentence.slice(0, 177)}...` : firstSentence;
  const districtLabel = district ? ` in ${district}` : '';
  const summary = `${bestProfile.category} grievance${districtLabel}: ${
    subject ? `${subject.trim()} — ` : ''
  }${truncated}`.slice(0, 280);

  const potentialDuplicates = findPotentialDuplicates(
    subject,
    description,
    district,
    existingGrievances
  );

  return {
    suggestedDepartmentCode: bestProfile.departmentCode,
    suggestedDepartmentName: resolveDepartmentName(bestProfile.departmentCode, departments),
    suggestedCategory: bestProfile.category,
    recommendedPriority,
    summary,
    reasoning:
      matchedUrgencyTerms.length > 0
        ? `Labelled fallback classified text via domain heuristics; elevated urgency indicators detected (${matchedUrgencyTerms
            .slice(0, 3)
            .join(', ')}). Requires human confirmation.`
        : 'Labelled fallback classified text via weighted domain heuristics. Requires human confirmation.',
    potentialDuplicates,
    source: 'fallback',
    model: 'heuristic-fallback-v1',
    isFallback: true,
    fallbackReason,
    analyzedAt: new Date()
  };
}

function isRealGeminiKey(apiKey) {
  return Boolean(
    apiKey &&
      apiKey.trim().length > 15 &&
      !apiKey.includes('replace_with') &&
      !apiKey.includes('your_')
  );
}

export async function analyzeGrievance({
  subject = '',
  description = '',
  district = '',
  category = '',
  departments = DEFAULT_DEPARTMENTS,
  existingGrievances = []
}) {
  const potentialDuplicates = findPotentialDuplicates(
    subject,
    description,
    district,
    existingGrievances
  );

  if (!isRealGeminiKey(env.geminiApiKey)) {
    return analyzeWithFallback({
      subject,
      description,
      district,
      category,
      departments,
      existingGrievances,
      fallbackReason: 'GEMINI_API_KEY is not configured in the server environment.'
    });
  }

  const departmentListText = (departments.length ? departments : DEFAULT_DEPARTMENTS)
    .map((d) => `${d.code}: ${d.name}`)
    .join('\n');

  const prompt = `You are the AI Grievance Assistant for the CM Kerala Public Grievance Redressal Portal (a recruitment prototype).
Analyze the citizen grievance below and provide advisory suggestions for the Citizen and CMO Administrator. Remember: your output is strictly advisory and will be reviewed by a human.

Available Departments:
${departmentListText}

Allowed Categories:
${GRIEVANCE_CATEGORIES.join(', ')}

Allowed Priorities:
Low, Medium, High

Citizen Input:
- District: ${district || 'Not specified'}
- Selected Category (optional): ${category || 'Not specified'}
- Subject: ${subject || 'Not specified'}
- Description: ${description}

Return strictly valid JSON with keys:
- suggestedDepartmentCode (one of the department codes above)
- suggestedCategory (exact string from Allowed Categories)
- recommendedPriority (Low, Medium, or High)
- summary (concise 1-2 sentence executive summary for the CMO, max 260 chars)
- reasoning (brief 1-sentence rationale for the department and priority suggestion)`;

  const candidateModels = Array.from(
    new Set(
      [
        env.geminiModel,
        'gemini-3.1-flash-lite',
        'gemini-3.6-flash',
        'gemini-3.5-flash'
      ].filter(Boolean)
    )
  );

  let lastErrorMessage = 'Unknown Gemini API error.';

  for (const modelName of candidateModels) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        modelName
      )}:generateContent?key=${encodeURIComponent(env.geminiApiKey)}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        lastErrorMessage = `Gemini HTTP ${response.status} (${modelName}): ${errorText.slice(0, 140)}`;
        if ([404, 429, 500, 503].includes(response.status)) {
          continue;
        }
        throw new Error(lastErrorMessage);
      }

      const payload = await response.json();
      const rawText = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        lastErrorMessage = `Empty response returned by Gemini model ${modelName}.`;
        continue;
      }

      const parsed = aiResponseSchema.parse(JSON.parse(rawText));
      const validDeptCodes = new Set(
        (departments.length ? departments : DEFAULT_DEPARTMENTS).map((d) => d.code)
      );
      const deptCode = validDeptCodes.has(parsed.suggestedDepartmentCode.toUpperCase())
        ? parsed.suggestedDepartmentCode.toUpperCase()
        : CATEGORY_TO_DEPARTMENT_CODE[normalizeCategory(parsed.suggestedCategory)] || 'LSGD';

      return {
        suggestedDepartmentCode: deptCode,
        suggestedDepartmentName: resolveDepartmentName(deptCode, departments),
        suggestedCategory: normalizeCategory(parsed.suggestedCategory, deptCode),
        recommendedPriority: parsed.recommendedPriority,
        summary: parsed.summary,
        reasoning: parsed.reasoning,
        potentialDuplicates,
        source: 'gemini',
        model: modelName,
        isFallback: false,
        fallbackReason: '',
        analyzedAt: new Date()
      };
    } catch (error) {
      lastErrorMessage = error.message || String(error);
      if (error.name === 'AbortError') {
        lastErrorMessage = `Gemini request timed out on ${modelName}`;
      }
      if (!/HTTP (400|401|403)/.test(lastErrorMessage)) {
        continue;
      }
      break;
    } finally {
      clearTimeout(timeout);
    }
  }

  return analyzeWithFallback({
    subject,
    description,
    district,
    category,
    departments,
    existingGrievances,
    fallbackReason: `Gemini API unavailable (${lastErrorMessage}).`
  });
}
