# AegisCare AI - Healthcare Diagnosis Support System

AegisCare AI is a full-stack clinical decision-support prototype for symptom intake, explainable triage, differential diagnosis, care planning, and public-health signal detection.

It is built as a resume-impact project: React frontend, Express API, structured medical knowledge base, rule-based AI scoring, safety guardrails, session history, and deployment-ready configuration.

> Educational project only. It does not diagnose, prescribe, or replace licensed medical care.

## Key Features

- AI-assisted symptom and risk-factor intake
- Differential diagnosis ranking across major disease families
- Emergency, urgent, and routine triage classification
- Explainable evidence for every ranked condition
- Recommended diagnostic tests and specialist routing
- Vitals-aware scoring for fever, blood pressure, pulse, and oxygen saturation
- Public-health signals for respiratory, food/water-borne, and vector-borne clusters
- Recent assessment history for clinician-style workflow
- Safe medical disclaimer and emergency escalation messaging
- Responsive dashboard UI built for desktop and mobile

## Covered Disease Areas

- Cardiology: acute coronary syndrome, hypertension complications
- Neurology: stroke and TIA
- Respiratory: pneumonia, asthma, COPD flare
- Infectious disease: viral illness, flu/COVID-like illness, dengue, malaria
- Gastroenterology: gastroenteritis and food-borne infection
- Urology/Nephrology: urinary tract infection, kidney risk
- Endocrinology: diabetes and hyperglycemia
- General medicine: anemia, thyroid, nutritional deficiency
- Mental health: anxiety, depression, stress-related conditions
- Dermatology: rash, allergy, soft tissue infection
- Internal medicine: liver, kidney, inflammatory/systemic disorders

## Tech Stack

- Frontend: React 18, Vite, CSS
- Backend: Node.js, Express
- Data: Structured local clinical knowledge base with in-memory assessment history
- Optional database support: MongoDB already available for the existing notes module
- Deployment: Express serves the built React app

## Run Locally

```bash
npm run install:all
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:5000

## API Endpoints

```txt
GET  /api/diagnosis/catalog
POST /api/diagnosis/analyze
GET  /api/diagnosis/history
GET  /api/health
```

## Deploy

```txt
Build Command: npm run build
Start Command: npm start
```

The Express server serves both the API and the React production build.
