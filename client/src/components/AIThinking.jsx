import { motion } from "framer-motion";

export default function AIThinking({ thinking }) {
    if (!thinking) return null;

    return (
        <motion.div
            className="thinking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            🤖 Analyzing
            <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
            >
                ...
            </motion.span>
        </motion.div>
    );
}
