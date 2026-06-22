import { conditionKnowledge, riskFactors, symptomCatalog } from "../data/clinicalKnowledge.js";

const emergencyTerms = [
  "severe chest pain",
  "crushing chest pain",
  "shortness of breath at rest",
  "fainting",
  "confusion",
  "one-sided weakness",
  "speech difficulty",
  "seizure",
  "blood in stool",
  "oxygen saturation below 92",
  "self-harm thoughts",
  "pregnancy with fever",
];

const inMemoryAssessments = [];

function normalizeList(items = []) {
  return items.map((item) => String(item).trim().toLowerCase()).filter(Boolean);
}

function scoreCondition(condition, symptoms, risks, vitals) {
  const matchedSymptoms = condition.symptoms.filter((symptom) => symptoms.includes(symptom));
  const matchedRisks = condition.riskFactors.filter((risk) => risks.includes(risk));
  const matchedRedFlags = condition.redFlags.filter((flag) =>
    symptoms.some((symptom) => flag.includes(symptom) || symptom.includes(flag))
  );

  let score = matchedSymptoms.length * 14 + matchedRisks.length * 8 + matchedRedFlags.length * 18;

  if (vitals.temperature >= 39 && condition.symptoms.includes("fever")) score += 8;
  if (vitals.spo2 && vitals.spo2 < 94 && condition.symptoms.includes("shortness of breath")) score += 16;
  if (vitals.systolic >= 180 && condition.id.includes("hypertension")) score += 18;
  if (vitals.heartRate >= 120 && ["acute-coronary-syndrome", "pneumonia", "asthma-copd-exacerbation"].includes(condition.id)) {
    score += 8;
  }

  const confidence = Math.min(96, Math.round(score));

  return {
    ...condition,
    confidence,
    matchedSymptoms,
    matchedRisks,
    matchedRedFlags,
    evidence: [
      ...matchedSymptoms.map((item) => `Symptom match: ${item}`),
      ...matchedRisks.map((item) => `Risk factor: ${item}`),
      ...matchedRedFlags.map((item) => `Red flag overlap: ${item}`),
    ].slice(0, 7),
  };
}

function getAcuity({ symptoms, risks, vitals, topMatches }) {
  const directEmergency = emergencyTerms.some((term) => symptoms.includes(term));
  const unstableVitals =
    vitals.spo2 < 92 ||
    vitals.systolic >= 180 ||
    vitals.systolic < 90 ||
    vitals.heartRate >= 130 ||
    vitals.temperature >= 40;
  const highRiskMatch = topMatches.some((match) => match.confidence >= 60 && match.matchedRedFlags.length > 0);
  const vulnerable = risks.some((risk) => ["pregnancy", "age above 60", "immunocompromised"].includes(risk));

  if (directEmergency || unstableVitals || highRiskMatch) {
    return {
      level: "Emergency",
      tone: "critical",
      timeWindow: "Now",
      instruction: "Seek emergency care immediately. This prototype cannot rule out life-threatening disease.",
    };
  }

  if (vulnerable || topMatches[0]?.confidence >= 50) {
    return {
      level: "Urgent",
      tone: "warning",
      timeWindow: "Same day",
      instruction: "Arrange same-day clinician review, especially if symptoms are worsening or persistent.",
    };
  }

  return {
    level: "Routine",
    tone: "stable",
    timeWindow: "24-72 hours",
    instruction: "Monitor symptoms and book routine care if they continue, recur, or affect daily activity.",
  };
}

function buildCarePlan(topMatches, acuity) {
  const tests = [...new Set(topMatches.flatMap((match) => match.tests).slice(0, 10))];
  const actions = [...new Set(topMatches.flatMap((match) => match.actions).slice(0, 8))];
  const specialists = [...new Set(topMatches.map((match) => match.specialist))].slice(0, 4);

  return {
    immediate: [acuity.instruction, ...actions.slice(0, 3)],
    diagnostics: tests,
    specialists,
    monitoring: [
      "Track temperature, pulse, blood pressure, oxygen saturation, fluid intake, and symptom changes.",
      "Return immediately for new chest pain, breathing difficulty, weakness, confusion, severe dehydration, bleeding, or feeling unsafe.",
      "Share this report with a qualified clinician; it is decision support, not a diagnosis.",
    ],
  };
}

function buildPopulationInsights(symptoms, topMatches) {
  const categories = topMatches.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  return {
    likelyCareLoad: Object.entries(categories).map(([category, count]) => ({ category, count })),
    communitySignals: [
      symptoms.includes("fever") && symptoms.includes("cough")
        ? "Respiratory illness cluster signal detected from selected symptoms."
        : "No respiratory cluster signal from this assessment.",
      symptoms.includes("diarrhea") || symptoms.includes("vomiting")
        ? "Water/food safety surveillance signal should be considered."
        : "No digestive outbreak signal from this assessment.",
      symptoms.includes("fever") && symptoms.includes("body pain")
        ? "Vector-borne fever screening may be relevant in mosquito-prone areas."
        : "No vector-borne fever signal from this assessment.",
    ],
  };
}

export function getClinicalCatalog(req, res) {
  res.json({
    symptoms: symptomCatalog,
    riskFactors,
    conditions: conditionKnowledge.map(({ id, name, category, prevalence }) => ({ id, name, category, prevalence })),
  });
}

export function getAssessmentHistory(req, res) {
  res.json(inMemoryAssessments.slice(-8).reverse());
}

export function analyzeCase(req, res) {
  const symptoms = normalizeList(req.body.symptoms);
  const risks = normalizeList(req.body.riskFactors);
  const vitals = {
    age: Number(req.body.demographics?.age || 0),
    temperature: Number(req.body.vitals?.temperature || 0),
    heartRate: Number(req.body.vitals?.heartRate || 0),
    systolic: Number(req.body.vitals?.systolic || 0),
    spo2: Number(req.body.vitals?.spo2 || 0),
  };

  if (!symptoms.length) {
    return res.status(400).json({ message: "Select at least one symptom to run triage." });
  }

  if (vitals.age >= 60 && !risks.includes("age above 60")) risks.push("age above 60");

  const ranked = conditionKnowledge
    .map((condition) => scoreCondition(condition, symptoms, risks, vitals))
    .filter((condition) => condition.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 6);

  const topMatches = ranked.length
    ? ranked
    : conditionKnowledge.slice(0, 4).map((condition) => ({ ...condition, confidence: 12, matchedSymptoms: [], matchedRisks: [], matchedRedFlags: [], evidence: [] }));

  const acuity = getAcuity({ symptoms, risks, vitals, topMatches });
  const carePlan = buildCarePlan(topMatches.slice(0, 3), acuity);
  const populationInsights = buildPopulationInsights(symptoms, topMatches);

  const assessment = {
    id: `HX-${Date.now()}`,
    createdAt: new Date().toISOString(),
    patient: {
      age: vitals.age || "Not specified",
      sex: req.body.demographics?.sex || "Not specified",
      duration: req.body.duration || "Not specified",
    },
    acuity,
    symptoms,
    topMatches: topMatches.map(({ id, name, category, confidence }) => ({ id, name, category, confidence })),
  };

  inMemoryAssessments.push(assessment);
  if (inMemoryAssessments.length > 25) inMemoryAssessments.shift();

  res.json({
    assessment,
    differentials: topMatches,
    carePlan,
    populationInsights,
    safety: {
      disclaimer:
        "This is an educational clinical decision-support prototype. It does not diagnose, prescribe, or replace a licensed clinician.",
      emergency:
        "For chest pain, breathing difficulty, stroke signs, severe bleeding, seizure, self-harm thoughts, pregnancy emergencies, or rapidly worsening symptoms, seek emergency care now.",
    },
  });
}
