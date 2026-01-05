import { motion, AnimatePresence } from "framer-motion";
import { fadeUp } from "./animations/motions.js";

export default function QuestionCard({ question }) {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={question}
                className="question-card"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -10 }}
            >
                <h3>Interview Question</h3>
                <p>{question || "Click 'Push to Answer' to begin..."}</p>
            </motion.div>
        </AnimatePresence>
    );
}
