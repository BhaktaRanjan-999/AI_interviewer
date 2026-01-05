import { motion } from "framer-motion";
import { fadeIn } from "C:/Users/Asus/Desktop/VS CODE/ai_interviewer/client/src/animations/motions.js";

export default function ChatPanel({ messages }) {
    return (
        <div className="chat-box">
            {messages.length === 0 && (
                <p className="placeholder">Click "Push to Answer" to start...</p>
            )}

            {messages.map((msg, i) => (
                <motion.div
                    key={i}
                    variants={fadeIn}
                    initial="hidden"
                    animate="visible"
                    className={`msg ${msg.sender}`}
                >
                    {msg.text}
                </motion.div>
            ))}
        </div>
    );
}
