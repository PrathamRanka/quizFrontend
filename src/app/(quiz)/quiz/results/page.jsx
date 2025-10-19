"use client";

import Link from 'next/link';

// In a real Next.js app, you'd pass results via query params or fetch them again.
// For this example, we assume it could be passed via router state if coming from a SPA-like navigation.
export default function ResultsPage() {
    // const location = useLocation(); // This needs to be adapted for Next.js
    // const { resultsData } = location.state || {};
    const resultsData = { score: 'N/A', results: [] }; // Placeholder

    if (!resultsData) {
        return <div className="text-center p-8">Loading results...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-md">
            <h1 className="text-4xl font-bold text-center mb-4">Quiz Complete!</h1>
            {/* <p className="text-center text-2xl text-blue-600 mb-8">Your Final Score: {resultsData.score}</p> */}
            {/* Map over results to display them */}
            <div className="text-center mt-8">
                <Link href="/quiz/instructions" className="bg-blue-600 text-white px-6 py-2 rounded">
                    Attempt Another Quiz
                </Link>
            </div>
        </div>
    );
}
