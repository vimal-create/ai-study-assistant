import React, { useEffect, useMemo, useState } from "react";
import { analyzeDiagnosis, getAssessmentHistory, getClinicalCatalog } from "./services/api";

const fallbackSymptoms = [
  "fever",
  "cough",
  "shortness of breath",
  "chest pain",
  "headache",
  "fatigue",
  "abdominal pain",
  "burning urination",
  "increased thirst",
  "one-sided weakness",
  "anxiety",
  "rash",
];

const fallbackRisks = ["diabetes", "hypertension", "pregnancy", "age above 60", "smoking", "mosquito exposure"];

const quickCases = [
  {
    label: "Cardiac risk",
    symptoms: ["chest pain", "shortness of breath", "nausea", "dizziness"],
    riskFactors: ["hypertension", "diabetes", "smoking"],
    vitals: { temperature: 37, heartRate: 118, systolic: 168, spo2: 95 },
  },
  {
    label: "Fever cluster",
    symptoms: ["fever", "headache", "body pain", "rash", "nausea"],
    riskFactors: ["mosquito exposure", "recent travel"],
    vitals: { temperature: 39.1, heartRate: 104, systolic: 112, spo2: 98 },
  },
  {
    label: "Metabolic",
    symptoms: ["increased thirst", "frequent urination", "fatigue", "blurred vision", "weight loss"],
    riskFactors: ["family history", "hypertension"],
    vitals: { temperature: 36.8, heartRate: 88, systolic: 146, spo2: 98 },
  },
];

function toggleValue(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function Stat({ label, value, note }) {
  return (
    <article className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

export default function App() {
  const [catalog, setCatalog] = useState({ symptoms: fallbackSymptoms, riskFactors: fallbackRisks, conditions: [] });
  const [history, setHistory] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState(["fever", "cough", "fatigue"]);
  const [selectedRisks, setSelectedRisks] = useState(["hypertension"]);
  const [demographics, setDemographics] = useState({ age: 42, sex: "Female" });
  const [duration, setDuration] = useState("3 days");
  const [vitals, setVitals] = useState({ temperature: 38.4, heartRate: 96, systolic: 132, spo2: 97 });
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("differentials");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getClinicalCatalog()
      .then((res) => setCatalog(res.data))
      .catch(() => setCatalog({ symptoms: fallbackSymptoms, riskFactors: fallbackRisks, conditions: [] }));

    getAssessmentHistory()
      .then((res) => setHistory(res.data))
      .catch(() => setHistory([]));
  }, []);

  const categoryCount = useMemo(() => {
    const groups = new Set(catalog.conditions.map((item) => item.category));
    return groups.size || 10;
  }, [catalog.conditions]);

  async function runAssessment(payloadOverride = {}) {
    setLoading(true);
    setError("");
    try {
      const payload = {
        demographics,
        duration,
        vitals,
        symptoms: selectedSymptoms,
        riskFactors: selectedRisks,
        ...payloadOverride,
      };
      const res = await analyzeDiagnosis(payload);
      setResult(res.data);
      setActiveTab("differentials");
      const historyRes = await getAssessmentHistory();
      setHistory(historyRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Clinical analysis is unavailable right now.");
    } finally {
      setLoading(false);
    }
  }

  function applyQuickCase(item) {
    setSelectedSymptoms(item.symptoms);
    setSelectedRisks(item.riskFactors);
    setVitals(item.vitals);
    runAssessment({
      symptoms: item.symptoms,
      riskFactors: item.riskFactors,
      vitals: item.vitals,
      duration,
      demographics,
    });
  }

  const topMatch = result?.differentials?.[0];

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">AegisCare AI</p>
          <h1>Clinical diagnosis support cockpit</h1>
          <p className="sidebar-copy">Explainable triage, differential diagnosis, care planning, and public-health signals in one full-stack system.</p>
        </div>

        <div className="sidebar-grid">
          <Stat label="Disease families" value={categoryCount} note="Major social-health categories" />
          <Stat label="Symptom graph" value={catalog.symptoms.length} note="Structured clinical signals" />
          <Stat label="Mode" value="Decision support" note="Safe educational prototype" />
        </div>

        <div className="safety-note">
          This app does not replace doctors. Emergency symptoms need immediate medical care.
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Patient Intake</p>
            <h2>AI-assisted diagnosis and triage</h2>
          </div>
          <button className="primary-action" onClick={() => runAssessment()} disabled={loading}>
            {loading ? "Analyzing..." : "Run clinical AI"}
          </button>
        </header>

        {error && <div className="alert">{error}</div>}

        <section className="panel intake-panel">
          <div className="section-head">
            <div>
              <h3>Smart intake</h3>
              <p className="muted">Select symptoms, risk factors, vitals, and duration. The API returns ranked differentials with evidence.</p>
            </div>
            <div className="quick-cases">
              {quickCases.map((item) => (
                <button className="ghost-button" key={item.label} onClick={() => applyQuickCase(item)} disabled={loading}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-grid">
            <label>
              Age
              <input
                type="number"
                min="0"
                max="120"
                value={demographics.age}
                onChange={(event) => setDemographics((current) => ({ ...current, age: Number(event.target.value) }))}
              />
            </label>
            <label>
              Sex
              <select value={demographics.sex} onChange={(event) => setDemographics((current) => ({ ...current, sex: event.target.value }))}>
                <option>Female</option>
                <option>Male</option>
                <option>Intersex</option>
                <option>Prefer not to say</option>
              </select>
            </label>
            <label>
              Duration
              <input value={duration} onChange={(event) => setDuration(event.target.value)} />
            </label>
            <label>
              Temp C
              <input type="number" step="0.1" value={vitals.temperature} onChange={(event) => setVitals((current) => ({ ...current, temperature: Number(event.target.value) }))} />
            </label>
            <label>
              Pulse
              <input type="number" value={vitals.heartRate} onChange={(event) => setVitals((current) => ({ ...current, heartRate: Number(event.target.value) }))} />
            </label>
            <label>
              Systolic BP
              <input type="number" value={vitals.systolic} onChange={(event) => setVitals((current) => ({ ...current, systolic: Number(event.target.value) }))} />
            </label>
            <label>
              SpO2 %
              <input type="number" value={vitals.spo2} onChange={(event) => setVitals((current) => ({ ...current, spo2: Number(event.target.value) }))} />
            </label>
          </div>

          <div className="chip-section">
            <h4>Symptoms</h4>
            <div className="chip-grid">
              {catalog.symptoms.map((symptom) => (
                <button
                  className={selectedSymptoms.includes(symptom) ? "chip selected" : "chip"}
                  key={symptom}
                  onClick={() => setSelectedSymptoms((current) => toggleValue(current, symptom))}
                >
                  {symptom}
                </button>
              ))}
            </div>
          </div>

          <div className="chip-section">
            <h4>Risk factors</h4>
            <div className="chip-grid compact">
              {catalog.riskFactors.map((risk) => (
                <button
                  className={selectedRisks.includes(risk) ? "chip risk selected" : "chip risk"}
                  key={risk}
                  onClick={() => setSelectedRisks((current) => toggleValue(current, risk))}
                >
                  {risk}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="results-grid">
          <div className={`acuity-card ${result?.assessment?.acuity?.tone || "stable"}`}>
            <p className="eyebrow">Triage</p>
            <h3>{result?.assessment?.acuity?.level || "Not analyzed"}</h3>
            <strong>{result?.assessment?.acuity?.timeWindow || "Run assessment"}</strong>
            <p>{result?.assessment?.acuity?.instruction || "Results will show urgency, likely conditions, diagnostic tests, and next best actions."}</p>
          </div>

          <div className="panel result-panel">
            <div className="tabs">
              {["differentials", "care plan", "signals", "history"].map((tab) => (
                <button className={activeTab === tab ? "tab active" : "tab"} key={tab} onClick={() => setActiveTab(tab)}>
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "differentials" && (
              <div className="differential-list">
                {!result && <div className="empty-state">Run an assessment to see ranked disease probabilities and explainable evidence.</div>}
                {result?.differentials.map((item) => (
                  <article className="condition-card" key={item.id}>
                    <div className="condition-top">
                      <div>
                        <span>{item.category}</span>
                        <h4>{item.name}</h4>
                      </div>
                      <strong>{item.confidence}%</strong>
                    </div>
                    <div className="meter"><span style={{ width: `${item.confidence}%` }} /></div>
                    <p>{item.prevalence}</p>
                    <div className="evidence-row">
                      {(item.evidence.length ? item.evidence : ["Needs more patient information"]).map((evidence) => (
                        <small key={evidence}>{evidence}</small>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}

            {activeTab === "care plan" && (
              <div className="care-grid">
                {["immediate", "diagnostics", "specialists", "monitoring"].map((key) => (
                  <article className="care-card" key={key}>
                    <h4>{key}</h4>
                    {(result?.carePlan?.[key] || ["Run assessment to generate a plan."]).map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </article>
                ))}
              </div>
            )}

            {activeTab === "signals" && (
              <div className="signals">
                <article className="signal-hero">
                  <span>Top clinical hypothesis</span>
                  <strong>{topMatch?.name || "Awaiting data"}</strong>
                  <p>{result?.safety?.disclaimer || "The system is designed as an educational prototype with safety guardrails."}</p>
                </article>
                <div className="care-grid">
                  {(result?.populationInsights?.communitySignals || ["Run assessment to see public-health signals."]).map((signal) => (
                    <article className="care-card" key={signal}>
                      <h4>Community signal</h4>
                      <p>{signal}</p>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="history-list">
                {history.length === 0 && <div className="empty-state">Recent assessments will appear here during this server session.</div>}
                {history.map((item) => (
                  <article className="history-card" key={item.id}>
                    <strong>{item.acuity.level}</strong>
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                    <p>{item.symptoms.join(", ")}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
