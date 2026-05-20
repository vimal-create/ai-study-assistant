# AI Study Assistant

A full-stack study helper for uploading notes, asking AI questions, generating summaries, flashcards, and quizzes.

## Run Locally

```bash
npm run install:all
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:5000

## Environment

Copy `server/.env.example` to `server/.env` and add your keys.

The app includes a local fallback AI response, so it can run without an API key while you build the UI.

## Deploy For Mobile/Public Link

Deploy the project as a Node web service. The Express server serves both the API and the built React app.

Render settings:

```txt
Build Command: npm run build
Start Command: npm start
```

After deployment, open the Render URL on any phone or laptop.
