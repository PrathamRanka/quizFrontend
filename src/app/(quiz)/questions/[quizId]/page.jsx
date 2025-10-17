"use client";

// This file would contain the full code for your QuizQuestion component
// It would use the `useParams` hook to get the quizId and fetch questions.
// All the proctoring logic and UI would be here.
// For brevity, a simplified version is provided.
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../../../services/api';

export default function QuestionPage() {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const params = useParams();
    const router = useRouter();
    const { quizId } = params;

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const response = await api.post(`/quizzes/${quizId}/start`);
                setQuestions(response.data.data.questions);
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch questions", error);
                setLoading(false);
            }
        };
        fetchQuestions();
    }, [quizId]);

    const handleSubmitQuiz = useCallback(async () => {
        const sessionId = localStorage.getItem('sessionId');
        const formattedAnswers = Object.entries(answers)
          .map(([questionId, selectedOption]) => ({ questionId, selectedOption }));
        
        try {
          const response = await api.post(`/sessions/${sessionId}/submit`, { answers: formattedAnswers });
          router.push('/quiz/results', { state: { resultsData: response.data.data } });
        } catch (error) {
          alert("Submission failed.");
        }
    }, [answers, router]);

    if (loading) return <div className="text-center p-10">Loading questions...</div>;
    
    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div>
            {/* The full UI of your Question Page goes here */}
            <h1>Question {currentQuestionIndex + 1}</h1>
            <p>{currentQuestion?.questionText}</p>
            {/* Render options and handle answers */}
            <button onClick={handleSubmitQuiz}>Submit Quiz</button>
        </div>
    );
}
