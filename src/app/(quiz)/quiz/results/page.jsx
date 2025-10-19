"use client";
import  { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
export default function ResultsPage() {
    const [resultsData, setResultsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [countdown, setCountdown] = useState(5);
    const { logout } = useAuth();

    // Fetch results data from sessionStorage when the component mounts
    useEffect(() => {
        const data = sessionStorage.getItem('quizResults');
        if (data) {
            setResultsData(JSON.parse(data));
        }
        setLoading(false);

        // Cleanup sessionStorage after reading the data
        return () => {
            sessionStorage.removeItem('quizResults');
            sessionStorage.removeItem('quizTerminationReason');
        };
    }, []);

    // Handle the countdown and automatic logout
    useEffect(() => {
        // Only start the timer if data is loaded and countdown is active
        if (!loading && resultsData && countdown > 0) {
            const timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }

        // When countdown finishes, log the user out
        if (countdown === 0) {
            logout();
        }
    }, [countdown, loading, resultsData, logout]);

    if (loading) {
        return <div className="text-center p-8 font-semibold text-gray-700">Loading Results...</div>;
    }

    if (!resultsData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">No Results Found</h1>
                <p className="text-gray-600 mb-6">It seems you haven't completed a quiz yet or the results are unavailable.</p>
                <Link href="/quiz/instructions" className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                    Go to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8 flex items-center justify-center">
            <div className="max-w-2xl w-full mx-auto">
                <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <h1 className="text-4xl font-bold text-gray-800">Quiz Complete!</h1>
                    <p className="text-lg text-gray-500 mt-2">Thanks for participating in the OWASP Student Chapter Recruitment Quiz!</p>
                    
                    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-gray-600">Results</h2>
                        <p className="text-2xl font-bold text-blue-600 my-2">
                            You will be notified soon if you make the cut.
                        </p>
                    </div>
                    
                    <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="font-semibold text-yellow-800">
                            You will be automatically logged out in <span className="text-2xl font-bold">{countdown}</span> seconds.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}