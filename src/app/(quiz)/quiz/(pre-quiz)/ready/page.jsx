"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../../../services/api";

export default function ReadyPage() {
  const router = useRouter();
  const [isServerReady, setIsServerReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await api.get("/status");
        if (response.data?.data?.status === "running") {
          setIsServerReady(true);
        } else {
          setError("The quiz server is not ready yet.");
        }
      } catch (err) {
        setError("Could not connect to the server.");
      } finally {
        setLoading(false);
      }
    };
    checkServerStatus();
  }, []);

  const handleStartQuiz = () => {
    const quizId = localStorage.getItem('quizId');
    if (quizId) {
      router.push(`/quiz/questions/${quizId}`);
    } else {
      alert("Error: Quiz ID not found.");
      router.push('/quiz/instructions');
    }
  };

  if (loading) {
    return <div className="text-center p-10">Checking server status...</div>
  }
  if (!isServerReady) {
    return <div className="text-center p-10 text-red-600">{error}</div>
  }

  return (
    <div className="text-center bg-white p-10 rounded-lg shadow-md">
      <div className="text-6xl mb-4">✓</div>
      <h2 className="text-3xl font-bold mb-2">You're Ready to Begin!</h2>
      <p className="text-gray-600 mb-8">Everything is set up. Click the button below to start.</p>
      <button onClick={handleStartQuiz} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700">
        Start Quiz
      </button>
    </div>
  );
}
