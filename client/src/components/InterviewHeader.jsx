import { motion } from "framer-motion";
import { fadeUp } from "../animations/motions.js";

export default function InterviewerHeader({ isRecording }) {
    return (
        <motion.div className="header" variants={fadeUp} initial="hidden" animate="visible">
            <div className="avatar">🤖</div>
            <div>
                <h2>AIVA</h2>
                <p>AI Technical Interviewer</p>
            </div>
            <span className={isRecording ? "status live" : "status idle"}>
                {isRecording ? "Listening" : "Idle"}
            </span>
        </motion.div>
    );
}
