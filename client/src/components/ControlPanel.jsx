import { motion } from "framer-motion";

export default function ControlPanel({ isRecording, startListening, getFeedback }) {
    return (
        <div className="controls">
            <motion.button
                className={`primary ${isRecording ? "active" : ""}`}
                onClick={startListening}
                disabled={isRecording}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                {isRecording ? "🔴 Listening..." : "🎤 Push to Answer"}
            </motion.button>

            <motion.button
                className="danger"
                onClick={getFeedback}
                whileHover={{ scale: 1.05 }}
            >
                📋 End Interview
            </motion.button>
        </div>
    );
}
