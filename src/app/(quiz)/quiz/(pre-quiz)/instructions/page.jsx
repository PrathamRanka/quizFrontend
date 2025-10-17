"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../../../../services/api";
import { RECRUITMENT_QUIZ_ID } from "../../../../../lib/constants";

export default function InstructionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/instructions', { quizId: RECRUITMENT_QUIZ_ID });
      if (response.data.success) {
        const { sessionId } = response.data.data;
        localStorage.setItem('sessionId', sessionId);
        localStorage.setItem('quizId', RECRUITMENT_QUIZ_ID);
        router.push("/quiz/permissions");
      } else {
        setError('Could not start a quiz session.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold text-center mb-6">Quiz Instructions</h2>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-6">
        {/* Rules, Requirements, Privacy Notice can be listed here */}
        <p>You have 30 minutes to complete the quiz. Ensure your camera and microphone are active. Do not switch tabs. Good luck!</p>
        {error && <p className="text-red-600 text-center font-semibold">{error}</p>}
      </div>
      <div className="flex justify-center mt-8">
        <button onClick={handleContinue} disabled={loading} className="w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-md shadow-md transition-all disabled:opacity-50">
          {loading ? 'Setting up...' : 'I Understand, Continue'}
        </button>
      </div>
    </div>
  );
};
