import React, { useEffect, useMemo, useState } from "react";
import { askQuestion, generateFlashcards, generateQuiz, generateSummary, getNotes, uploadNote } from "./services/api";

const subjects = ["CSE", "AI", "Maths", "DBMS", "Networks"];

export default function App() {
  const [view, setView] = useState("chat");
  const [subject, setSubject] = useState("CSE");
  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState("");
  const [question, setQuestion] = useState("Explain AVL Tree in exam-ready points");
  const [chat, setChat] = useState([]);
  const [summary, setSummary] = useState("");
  const [flashcards, setFlashcards] = useState([]);
  const [quiz, setQuiz] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const activeNote = useMemo(
    () => notes.find((note) => note._id === activeNoteId) || notes[0],
    [notes, activeNoteId]
  );

  useEffect(() => {
    getNotes()
      .then((res) => setNotes(res.data))
      .catch(() => setNotes([]));
  }, []);

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("subject", subject);
    setUploading(true);
    setError("");

    try {
      const res = await uploadNote(formData);
      setNotes((current) => [res.data, ...current]);
      setActiveNoteId(res.data._id);
      setView("chat");
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed. Check the backend server.");
    } finally {
      setUploading(false);
    }
  }

  async function handleAsk() {
    if (!question.trim()) return;
    setLoading(true);
    setError("");
    const nextChat = [...chat, { role: "student", content: question }];
    setChat(nextChat);

    try {
      const res = await askQuestion({
        question,
        context: activeNote?.content || "",
        subject,
        history: chat.slice(-6),
      });
      setChat([...nextChat, { role: "assistant", content: res.data.answer }]);
      setQuestion("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not get an answer right now.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSummary() {
    setLoading(true);
    setError("");
    try {
      const res = await generateSummary({ text: activeNote?.content || question, subject });
      setSummary(res.data.summary);
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate summary.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFlashcards() {
    setLoading(true);
    setError("");
    try {
      const res = await generateFlashcards({ text: activeNote?.content || question, subject });
      setFlashcards(res.data.flashcards);
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate flashcards.");
    } finally {
      setLoading(false);
    }
  }

  async function handleQuiz() {
    setLoading(true);
    setError("");
    setAnswers({});
    try {
      const res = await generateQuiz({ text: activeNote?.content || question, subject });
      setQuiz(res.data.quiz);
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate quiz.");
    } finally {
      setLoading(false);
    }
  }

  const score = quiz.reduce((total, item, index) => total + (answers[index] === item.answer ? 1 : 0), 0);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Exam Prep Workspace</p>
          <h1>AI Study Assistant</h1>
        </div>

        <nav className="nav-list" aria-label="Primary navigation">
          {["chat", "upload", "summary", "flashcards", "quiz", "dashboard"].map((item) => (
            <button
              key={item}
              className={view === item ? "nav-button active" : "nav-button"}
              onClick={() => setView(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <label className="field-label">
          Subject
          <select value={subject} onChange={(event) => setSubject(event.target.value)}>
            {subjects.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Current material</p>
            <h2>{activeNote?.title || "No notes uploaded yet"}</h2>
          </div>
          <select value={activeNoteId} onChange={(event) => setActiveNoteId(event.target.value)}>
            <option value="">Latest note</option>
            {notes.map((note) => (
              <option key={note._id} value={note._id}>
                {note.title}
              </option>
            ))}
          </select>
        </header>

        {error && <div className="alert">{error}</div>}

        {view === "chat" && (
          <section className="tool-surface">
            <div className="chat-feed">
              {chat.length === 0 && (
                <div className="empty-state">
                  <h3>Ask from your notes</h3>
                  <p>Try a topic, definition, algorithm, derivation, or likely exam question.</p>
                </div>
              )}
              {chat.map((message, index) => (
                <article key={`${message.role}-${index}`} className={`message ${message.role}`}>
                  <strong>{message.role === "student" ? "You" : "Assistant"}</strong>
                  <p>{message.content}</p>
                </article>
              ))}
            </div>
            <div className="composer">
              <textarea value={question} onChange={(event) => setQuestion(event.target.value)} />
              <button onClick={handleAsk} disabled={loading}>
                {loading ? "Thinking..." : "Ask AI"}
              </button>
            </div>
          </section>
        )}

        {view === "upload" && (
          <section className="tool-surface upload-zone">
            <h3>Upload Notes</h3>
            <p>PDF and text files are supported. The extracted content becomes context for chat, quiz, and revision tools.</p>
            <label className="drop-target">
              <input type="file" accept=".pdf,.txt" onChange={handleUpload} />
              <span>{uploading ? "Uploading..." : "Choose PDF or text file"}</span>
            </label>
          </section>
        )}

        {view === "summary" && (
          <section className="tool-surface split">
            <div>
              <h3>Revision Summary</h3>
              <p className="muted">Condenses long notes into short, exam-ready points.</p>
              <button onClick={handleSummary} disabled={loading}>
                {loading ? "Generating..." : "Generate Summary"}
              </button>
            </div>
            <article className="output">{summary || "Your summary will appear here."}</article>
          </section>
        )}

        {view === "flashcards" && (
          <section className="tool-surface">
            <div className="section-head">
              <div>
                <h3>Flashcards</h3>
                <p className="muted">Quick active recall cards from the selected material.</p>
              </div>
              <button onClick={handleFlashcards} disabled={loading}>
                {loading ? "Generating..." : "Generate Cards"}
              </button>
            </div>
            <div className="grid-list">
              {flashcards.map((card, index) => (
                <article className="study-card" key={`${card.question}-${index}`}>
                  <strong>{card.question}</strong>
                  <p>{card.answer}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {view === "quiz" && (
          <section className="tool-surface">
            <div className="section-head">
              <div>
                <h3>Quiz Generator</h3>
                <p className="muted">MCQs with scoring for fast exam practice.</p>
              </div>
              <button onClick={handleQuiz} disabled={loading}>
                {loading ? "Generating..." : "Generate Quiz"}
              </button>
            </div>
            {quiz.length > 0 && <p className="score">Score: {score}/{quiz.length}</p>}
            <div className="quiz-list">
              {quiz.map((item, index) => (
                <article className="quiz-item" key={`${item.question}-${index}`}>
                  <strong>{index + 1}. {item.question}</strong>
                  <div className="options">
                    {item.options.map((option) => (
                      <button
                        key={option}
                        className={answers[index] === option ? "option selected" : "option"}
                        onClick={() => setAnswers((current) => ({ ...current, [index]: option }))}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {answers[index] && <p className="muted">Answer: {item.answer}</p>}
                </article>
              ))}
            </div>
          </section>
        )}

        {view === "dashboard" && (
          <section className="tool-surface">
            <h3>Saved Materials</h3>
            <div className="grid-list">
              {notes.map((note) => (
                <article className="study-card" key={note._id}>
                  <strong>{note.title}</strong>
                  <p>{note.subject}</p>
                  <small>{note.content.slice(0, 140)}...</small>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
