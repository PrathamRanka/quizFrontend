"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import api from "../../../services/api";


const BookmarkIcon = ({ filled }) => (
  <svg className="w-5 h-5" fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
  </svg>
);
const ClockIcon = () => (
    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);

// --- The Main Quiz Component ---
export default function QuestionPage() {
  // Core State
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes

  // User Interaction State
  const [answers, setAnswers] = useState({});
  const [bookmarked, setBookmarked] = useState({});
  const [visited, setVisited] = useState({});
  
  // Proctoring State
  const [tabSwitchViolations, setTabSwitchViolations] = useState(0);
  const [fullscreenExited, setFullscreenExited] = useState(false);
  
  const router = useRouter();
  const params = useParams();
  const { quizId } = params;
  const mainWrapperRef = useRef(null);

  // --- Data Fetching ---
  useEffect(() => {
    const startQuizAndFetch = async () => {
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        setError("Your session is invalid. Please restart from the instructions page.");
        setLoading(false);
        return;
      }
      try {
        const response = await api.post(`/quizzes/${quizId}/start`);
        const fetchedQuestions = response.data.data.questions;
        if (!fetchedQuestions || fetchedQuestions.length === 0) {
            setError("No questions found for this quiz. Please contact an administrator.");
            setLoading(false);
            return;
        }
        setQuestions(fetchedQuestions);
        // Initialize interaction states based on the questions from the backend
        setAnswers(fetchedQuestions.reduce((acc, q) => ({ ...acc, [q._id]: null }), {}));
        setBookmarked(fetchedQuestions.reduce((acc, q) => ({ ...acc, [q._id]: false }), {}));
        setVisited(fetchedQuestions.reduce((acc, q) => ({ ...acc, [q._id]: false }), {}));
      } catch (err) {
        setError("Failed to load the quiz. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    };
    startQuizAndFetch();
  }, [quizId]);

  // --- Timer & Auto-Submission ---
  const handleSubmitQuiz = useCallback(async () => {
    // Prevent multiple submissions
    setLoading(true); 
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) return alert("Critical Error: Session ID is missing. Cannot submit.");

    const formattedAnswers = Object.entries(answers)
      .filter(([, selectedOption]) => selectedOption !== null)
      .map(([questionId, selectedOption]) => ({ questionId, selectedOption }));
    
    try {
      const response = await api.post(`/sessions/${sessionId}/submit`, { answers: formattedAnswers });
      if (response.data.success) {
        sessionStorage.setItem('quizResults', JSON.stringify(response.data.data));
        router.push('/quiz/results');
      } else {
         alert(`Submission failed: ${response.data.message || 'An unknown error occurred.'}`);
         setLoading(false);
      }
    } catch (err) {
      alert("An error occurred during submission. Please check your internet connection.");
      setLoading(false);
    }
  }, [answers, router]);

  useEffect(() => {
    if (timeLeft === 0) {
      handleSubmitQuiz();
    }
    if (!loading && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [loading, timeLeft, handleSubmitQuiz]);


  // --- User Interaction Handlers ---
  const handleSelect = (qId, option) => setAnswers(p => ({ ...p, [qId]: option }));
  const handleBookmark = (qId) => setBookmarked(p => ({ ...p, [qId]: !p[qId] }));

  useEffect(() => {
    if (questions.length > 0) {
      setVisited(p => ({ ...p, [questions[currentQuestionIndex]._id]: true }));
    }
  }, [currentQuestionIndex, questions]);


  // --- Proctoring Logic ---
  const enterFullscreen = useCallback(async () => {
    try {
      if (mainWrapperRef.current && document.documentElement.requestFullscreen) {
        await mainWrapperRef.current.requestFullscreen();
      }
    } catch (err) { console.warn("Fullscreen request failed."); }
  }, []);

  useEffect(() => {
    enterFullscreen();
    const handleVisibilityChange = () => {
      if (document.hidden) setTabSwitchViolations(prev => prev + 1);
    };
    const handleFullscreenChange = () => {
      setFullscreenExited(!document.fullscreenElement);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [enterFullscreen]);

  const handleWrapperKeyDown = (e) => {
    if (e.key === "F12" || 
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && ['U', 'S', 'C', 'V'].includes(e.key.toUpperCase()))
    ) {
      e.preventDefault();
    }
  };

  // --- Render Logic ---
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center">
        <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-lg text-gray-700 font-semibold">Loading Your Quiz...</p>
        <p className="text-gray-500">Please wait a moment.</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
            <div className="text-5xl mb-4">☹️</div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">An Error Occurred</h2>
            <p className="text-gray-700">{error}</p>
            <Link href="/quiz/instructions" className="mt-6 inline-block bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Go Back to Instructions
            </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  return (
    <div 
      className="min-h-screen bg-gray-100 select-none"
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={handleWrapperKeyDown}
      ref={mainWrapperRef}
      tabIndex={-1}
    >
      {fullscreenExited && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[9999]">
          <div className="bg-white p-8 rounded-lg text-center shadow-2xl max-w-sm">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Action Required</h2>
            <p className="text-gray-700 mb-6">You have exited fullscreen mode. You must remain in fullscreen to continue the quiz.</p>
            <button onClick={enterFullscreen} className="bg-blue-600 text-white font-bold px-6 py-3 rounded-lg w-full hover:bg-blue-700 transition">Re-enter Fullscreen</button>
          </div>
        </div>
      )}

      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-800">Question {currentQuestionIndex + 1} of {questions.length}</p>
            {tabSwitchViolations > 0 && <p className="text-xs text-red-500 font-bold mt-1">Violations: {tabSwitchViolations}</p>}
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-md">
              <ClockIcon />
              <span className="font-semibold text-lg text-gray-800">{formatTime(timeLeft)}</span>
            </div>
            <button onClick={handleSubmitQuiz} className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded-lg transition-colors text-sm sm:text-base">
              Submit Quiz
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-xl shadow-sm border">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-sm font-medium text-blue-700 bg-blue-100 px-3 py-1 rounded-full">Marks: {currentQuestion.marks || 1}</span>
              <h2 className="text-xl font-semibold text-gray-900 mt-3">{currentQuestion.questionText}</h2>
            </div>
            <button onClick={() => handleBookmark(currentQuestion._id)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${bookmarked[currentQuestion._id] ? "text-yellow-700 bg-yellow-100 hover:bg-yellow-200" : "text-gray-600 bg-gray-100 hover:bg-gray-200"}`}>
                <BookmarkIcon filled={bookmarked[currentQuestion._id]} /> {bookmarked[currentQuestion._id] ? "Bookmarked" : "Bookmark"}
            </button>
          </div>
          <div className="space-y-4">
            {currentQuestion.options.map((option) => (
              <label key={option.id} className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${answers[currentQuestion._id] === option.optionText ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-gray-400'}`}>
                <input type="radio" name={currentQuestion._id} value={option.optionText} checked={answers[currentQuestion._id] === option.optionText} onChange={() => handleSelect(currentQuestion._id, option.optionText)} className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300"/>
                <span className="ml-4 text-gray-800 font-medium">{option.optionText}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-semibold mb-4 text-gray-800">Question Palette</h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, index) => {
                const qId = q._id;
                let statusClass = "bg-gray-200 hover:bg-gray-300 text-gray-700";
                if (answers[qId]) statusClass = "bg-green-500 text-white";
                else if (visited[qId]) statusClass = "bg-blue-200 text-blue-800";
                if (bookmarked[qId]) statusClass = "bg-yellow-400 text-white";
                if (index === currentQuestionIndex) statusClass += " ring-2 ring-offset-2 ring-blue-600 font-bold";
                
                return (
                  <button key={qId} onClick={() => setCurrentQuestionIndex(index)} className={`w-10 h-10 rounded-lg font-medium transition-all text-sm flex items-center justify-center ${statusClass}`}>
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

