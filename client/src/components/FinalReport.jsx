import { motion } from "framer-motion";
import { fadeUp } from "./animations/motions.js";

export default function FinalReport({ report }) {
    if (!report) return null;

    return (
        <motion.div className="report" variants={fadeUp} initial="hidden" animate="visible">
            <h2>Interview Report</h2>
            <h3>Score: {report.score}/10</h3>

            <div className="grid">
                <div>
                    <h4 className="good">Strengths</h4>
                    <ul>{report.strengths?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
                <div>
                    <h4 className="bad">Improvements</h4>
                    <ul>{report.improvements?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
            </div>

            <div className="tip">
                💡 {report.suggested_answers}
            </div>
        </motion.div>
    );
}
