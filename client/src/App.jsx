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

  /* ---------------- Speech Recognition ---------------- */
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

  /* ---------------- Handle Turn ---------------- */
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

  /* ---------------- UI ---------------- */
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

          {/* Progress Bar */}
          <div className="progress">
            <div style={{ width: `${Math.min(messages.length * 10, 100)}%` }} />
          </div>

          <ChatPanel messages={messages} />

          {/* Mic Wave */}
          {isRecording && <div className="wave" />}

          <ControlPanel
            isRecording={isRecording}
            startListening={startListening}
            getFeedback={getFeedback}
          />

          {/* Confidence Meter */}
          <div className="confidence">
            Confidence
            <div className="bar">
              <div
                style={{
                  width: `${Math.min(liveFeedback.wpm / 2, 100)}%`,
                }}
              />
            </div>
          </div>

          <FinalReport report={finalReport} />
        </div>

        {/* Stats BELOW */}
        <LiveStatsCard liveFeedback={liveFeedback} />

      </div>
    </div>
  );
}

export default App;
