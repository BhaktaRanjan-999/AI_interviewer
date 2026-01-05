import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";

import InterviewerHeader from "./components/InterviewHeader.jsx";
import ChatPanel from "./components/ChatPanel.jsx";
import ControlPanel from "./components/ControlPanel.jsx";
import LiveStatsCard from "./components/LiveStatsCard.jsx";
import FinalReport from "./components/FinalReport.jsx";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://ai-interviewer-dyqf.onrender.com";

function App() {
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [liveFeedback, setLiveFeedback] = useState({
    wpm: 0,
    fillers: 0,
    aiTip: "",
  });
  const [finalReport, setFinalReport] = useState(null);

  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [sessionId, setSessionId] = useState(
    "sess-" + Math.random().toString(36).substr(2, 9)
  );

  const startTimeRef = useRef(null);
  const recognitionRef = useRef(null);

  // ================================
  // NEW COMPONENTS - DEFINED INLINE
  // ================================

  function SessionSummary({ targetRole, messages }) {
    const totalQ = messages.filter((m) => m.sender === "ai").length;
    const totalAnswers = messages.filter((m) => m.sender === "user").length;

    return (
      <div className="session-summary">
        <div className="summary-item">
          <span className="label">Role</span>
          <span className="value">{targetRole}</span>
        </div>
        <div className="summary-item">
          <span className="label">Questions</span>
          <span className="value">{totalQ}</span>
        </div>
        <div className="summary-item">
          <span className="label">Answers</span>
          <span className="value">{totalAnswers}</span>
        </div>
      </div>
    );
  }

  function QuestionTimeline({ messages }) {
    const questions = messages.filter((m) => m.sender === "ai");
    const currentIndex = questions.length - 1;

    return (
      <div className="question-timeline">
        {questions.length === 0 ? (
          <span className="timeline-empty">Questions will appear here</span>
        ) : (
          questions.map((q, idx) => (
            <div
              key={idx}
              className={`timeline-dot ${idx === currentIndex ? "active" : ""}`}
              title={q.text.slice(0, 30) + "..."}
            >
              <span className="dot-number">{idx + 1}</span>
            </div>
          ))
        )}
      </div>
    );
  }

  function ConfidenceMeter({ wpm }) {
    const percent = Math.min(wpm / 2, 100);
    let label = "Warm up";
    let color = "bg-orange-400";

    if (wpm >= 90) {
      label = "Excellent";
      color = "bg-green-500";
    } else if (wpm >= 60) {
      label = "Good";
      color = "bg-blue-500";
    } else if (wpm >= 30) {
      label = "Fair";
      color = "bg-yellow-500";
    }

    return (
      <div className="confidence">
        <div className="confidence-header">
          <span>Confidence</span>
          <span className="confidence-label">{label}</span>
        </div>
        <div className="confidence-bar">
          <div
            className={`bar-fill ${color}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="confidence-scale">
          <span>30</span>
          <span>60</span>
          <span>90+</span>
        </div>
      </div>
    );
  }

  function HelperHints({ isRecording, hasStarted }) {
    if (isRecording) return null;

    return (
      <div className="helper-hints">
        <div className="hint-icon">💡</div>
        <div className="hint-text">
          {!hasStarted
            ? "Press 'Push to Answer' and speak naturally. AI tracks pace & fillers."
            : "Structure answers: Situation → Action → Result"}
        </div>
      </div>
    );
  }

  // ================================
  // EXISTING LOGIC (unchanged)
  // ================================

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Use Chrome for best experience");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      startTimeRef.current = Date.now();
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join("");

      const fillers =
        (transcript.match(/\b(um|uh|like|you know)\b/gi) || []).length;
      const words = transcript.trim().split(/\s+/).length;
      const minutes = (Date.now() - startTimeRef.current) / 60000;
      const wpm = minutes > 0 ? Math.round(words / minutes) : 0;

      setLiveFeedback((prev) => ({ ...prev, wpm, fillers }));

      if (event.results[0].isFinal) {
        handleTurnComplete(transcript);
      }
    };

    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
  }, []);

  const handleTurnComplete = async (transcript) => {
    const history = [...messages, { sender: "user", text: transcript }];
    setMessages(history);

    try {
      const res = await axios.post(`${API_BASE_URL}/chat`, {
        message: transcript,
        sessionId,
        jobRole: targetRole,
      });

      const { feedback, question } = res.data;
      setLiveFeedback((p) => ({ ...p, aiTip: feedback }));
      setMessages([...history, { sender: "ai", text: question }]);
      speak(question);
    } catch {
      alert("Backend error");
    }
  };

  const getFeedback = async () => {
    const res = await axios.post(`${API_BASE_URL}/feedback`, { sessionId });
    setFinalReport(res.data);
  };

  const startNewSession = () => {
    setSessionId("sess-" + Math.random().toString(36).substr(2, 9));
    setMessages([]);
    setFinalReport(null);
    setLiveFeedback({ wpm: 0, fillers: 0, aiTip: "" });
  };

  const speak = (text) => {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  };

  const startListening = () => {
    if (!isRecording) recognitionRef.current.start();
  };

  const hasStarted = messages.length > 0;

  // ================================
  // UPDATED JSX LAYOUT
  // ================================

  return (
    <div className="container">
      <div className="layout">
        <div className="center">
          {/* Role Selector */}
          <div className="role-bar">
            <span>Role</span>
            <input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            />
            <button onClick={startNewSession}>New</button>
          </div>

          <InterviewerHeader isRecording={isRecording} />

          {/* NEW: Session Summary */}
          <SessionSummary targetRole={targetRole} messages={messages} />

          {/* Progress Bar */}
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(messages.length * 10, 100)}%` }}
            />
          </div>

          {/* NEW: Question Timeline */}
          <QuestionTimeline messages={messages} />

          <ChatPanel messages={messages} />

          {isRecording && <div className="wave" />}

          <ControlPanel
            isRecording={isRecording}
            startListening={startListening}
            getFeedback={getFeedback}
          />

          {/* NEW: Enhanced Confidence */}
          <ConfidenceMeter wpm={liveFeedback.wpm} />

          {/* NEW: Helper Hints */}
          <HelperHints isRecording={isRecording} hasStarted={hasStarted} />

          <FinalReport report={finalReport} />
        </div>

        <LiveStatsCard liveFeedback={liveFeedback} />
      </div>
    </div>
  );
}

export default App;
