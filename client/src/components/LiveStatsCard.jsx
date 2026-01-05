import { motion } from "framer-motion";

export default function LiveStatsCard({ liveFeedback }) {
    return (
        <motion.div className="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3>⚡ Live Stats</h3>

            <div className="stat">
                <label>Speaking Pace</label>
                <strong>{liveFeedback.wpm} WPM</strong>
            </div>

            <div className="stat">
                <label>Fillers</label>
                <strong>{liveFeedback.fillers}</strong>
            </div>

            <div className="ai-tip">
                💡 {liveFeedback.aiTip || "Waiting for audio..."}
            </div>
        </motion.div>
    );
}
