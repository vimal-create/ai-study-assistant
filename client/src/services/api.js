import axios from "axios";

const localApiUrl =
  typeof window === "undefined"
    ? "http://localhost:5000/api"
    : window.location.port === "5173"
      ? `${window.location.protocol}//${window.location.hostname}:5000/api`
      : "/api";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || localApiUrl,
});

export const askQuestion = (payload) => api.post("/ai/ask", payload);
export const generateSummary = (payload) => api.post("/ai/summary", payload);
export const generateFlashcards = (payload) => api.post("/ai/flashcards", payload);
export const generateQuiz = (payload) => api.post("/ai/quiz", payload);
export const getClinicalCatalog = () => api.get("/diagnosis/catalog");
export const analyzeDiagnosis = (payload) => api.post("/diagnosis/analyze", payload);
export const getAssessmentHistory = () => api.get("/diagnosis/history");
export const uploadNote = (formData) =>
  api.post("/notes/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const getNotes = () => api.get("/notes");

export default api;
