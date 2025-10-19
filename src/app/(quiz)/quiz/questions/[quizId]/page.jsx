"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import api from "../../../../services/api";

// Helper Icon Components
const BookmarkIcon = ({ filled }) => ( <svg className="w-5 h-5" fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg> );
const ClockIcon = () => ( <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> );

export default function QuestionPage() {
  // Core State
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes

  // User Interaction State
  const [answers, setAnswers] = useState({});
  const [bookmarked, setBookmarked] = useState({});
  const [visited, setVisited] = useState({});
  
  // Proctoring & UI State
  const [tabSwitchViolations, setTabSwitchViolations] = useState(0);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [fullscreenWarning, setFullscreenWarning] = useState(null);
  const [isQuizTerminated, setIsQuizTerminated] = useState(false);
  const [showSubmitWarning, setShowSubmitWarning] = useState(false);
  
  const router = useRouter();
  const params = useParams();
  const { quizId } = params;
  const mainWrapperRef = useRef(null);

  // --- Submission Logic ---
  const handleSubmitQuiz = useCallback(async (force = false, reason = "Quiz submitted.") => {
    const unansweredCount = Object.values(answers).filter(a => a === null).length;
    if (unansweredCount > 0 && !force) {
      setShowSubmitWarning(true);
      return;
    }
    
    setLoading(true);
    setShowSubmitWarning(false);
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) { 
      setLoading(false); 
      return alert("Session ID missing."); 
    }

    const formattedAnswers = Object.entries(answers).filter(([, val]) => val !== null).map(([key, val]) => ({ questionId: key, selectedOption: val }));
    
    try {
      const response = await api.post(`/sessions/${sessionId}/submit`, { answers: formattedAnswers });
      if (response.data.success) {
        localStorage.removeItem(`quiz-progress-${sessionId}`); // Clear saved progress
        sessionStorage.setItem('quizResults', JSON.stringify(response.data.data));
        if (reason) sessionStorage.setItem('quizTerminationReason', reason);
        router.push('/quiz/results');
      } else {
         alert(`Submission failed: ${response.data.message || 'Error.'}`);
         setLoading(false);
      }
    } catch (err) {
      alert("An error occurred during submission.");
      setLoading(false);
    }
  }, [answers, router]);

  const handleSubmitQuizRef = useRef(handleSubmitQuiz);
  useEffect(() => {
    handleSubmitQuizRef.current = handleSubmitQuiz;
  }, [handleSubmitQuiz]);

  // --- Data Fetching & State Hydration ---
  useEffect(() => {
    const startQuizAndFetch = async () => {
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) { setError("Session invalid. Please restart."); setLoading(false); return; }
      
      const savedProgress = localStorage.getItem(`quiz-progress-${sessionId}`);
      
      try {
        const response = await api.post(`/quizzes/${quizId}/start`);
        const fetchedQuestions = response.data.data.questions;
        if (!fetchedQuestions || fetchedQuestions.length === 0) { setError("No questions found."); setLoading(false); return; }
        
        setQuestions(fetchedQuestions);
        
        if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            setAnswers(progress.answers || {});
            setBookmarked(progress.bookmarked || {});
            setVisited(progress.visited || {});
            setCurrentQuestionIndex(progress.currentQuestionIndex || 0);
            setTimeLeft(progress.timeLeft || 1200);
        } else {
            setAnswers(fetchedQuestions.reduce((acc, q) => ({ ...acc, [q._id]: null }), {}));
            setBookmarked(fetchedQuestions.reduce((acc, q) => ({ ...acc, [q._id]: false }), {}));
            setVisited(fetchedQuestions.reduce((acc, q) => ({ ...acc, [q._id]: false }), {}));
        }
      } catch (err) { setError("Failed to load quiz."); } finally { setLoading(false); }
    };
    if(quizId) startQuizAndFetch();
  }, [quizId]);

  // --- Progress Saving ---
  useEffect(() => {
    const saveProgress = () => {
        if (questions.length > 0 && !loading) {
            const sessionId = localStorage.getItem('sessionId');
            const progress = { answers, bookmarked, visited, currentQuestionIndex, timeLeft };
            localStorage.setItem(`quiz-progress-${sessionId}`, JSON.stringify(progress));
        }
    };
    const interval = setInterval(saveProgress, 5000); // Save every 5 seconds
    return () => clearInterval(interval);
  }, [answers, bookmarked, visited, currentQuestionIndex, timeLeft, questions, loading]);

  // --- Timer ---
  useEffect(() => {
    if (timeLeft === 0) handleSubmitQuizRef.current(true, "Quiz automatically submitted because time ran out.");
    if (!loading && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev > 0 ? prev - 1 : 0), 1000);
      return () => clearInterval(timer);
    }
  }, [loading, timeLeft]);

  // --- User Interaction Handlers ---
  const handleSelect = (qId, option) => setAnswers(p => ({ ...p, [qId]: option }));
  const handleBookmark = (qId) => setBookmarked(p => ({ ...p, [qId]: !p[qId] }));

  useEffect(() => {
    if (questions.length > 0 && questions[currentQuestionIndex]) {
      setVisited(p => ({ ...p, [questions[currentQuestionIndex]._id]: true }));
    }
  }, [currentQuestionIndex, questions]);

  const handleNext = () => { if (currentQuestionIndex < questions.length - 1) setCurrentQuestionIndex(p => p + 1); };
  const handlePrevious = () => { if (currentQuestionIndex > 0) setCurrentQuestionIndex(p => p - 1); };

  // --- Proctoring Logic ---
  const enterFullscreen = useCallback(async () => {
    try {
      if (mainWrapperRef.current && mainWrapperRef.current.requestFullscreen) {
        await mainWrapperRef.current.requestFullscreen({ navigationUI: "hide" });
      }
    } catch (err) { console.warn("Fullscreen request failed."); }
  }, []);

  useEffect(() => {
    if (!loading && mainWrapperRef.current) mainWrapperRef.current.focus();
  }, [loading]);

  useEffect(() => {
    const handleVisibilityChange = () => { if (document.hidden) setTabSwitchViolations(p => p + 1); };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setFullscreenExitCount(count => {
          const newCount = count + 1;
          if (newCount >= 4) {
            setIsQuizTerminated(true);
            handleSubmitQuizRef.current(true, "Quiz terminated due to multiple fullscreen exits.");
          } else {
            setFullscreenWarning({ count: newCount });
          }
          return newCount;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);
  
  const handleWrapperKeyDown = (e) => e.preventDefault();

  // --- Render Logic ---
  if (loading && questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center">
        <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-lg text-gray-700 font-semibold">Loading Your Quiz...</p>
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
            <Link href="/quiz/instructions" className="mt-6 inline-block bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg">Go Back</Link>
        </div>
      </div>
    );
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center">
        <div className="text-5xl mb-4">🤔</div>
        <h2 className="text-2xl font-bold text-gray-800">No Question Data</h2>
        <p className="text-gray-600">The quiz seems to be empty.</p>
      </div>
    );
  }

  const unansweredQuestionsCount = Object.values(answers).filter(a => a === null).length;
  
  if (isQuizTerminated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Quiz Terminated</h2>
            <p className="text-gray-700">Your quiz was automatically submitted due to repeated proctoring violations.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gray-100 select-none outline-none"
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={handleWrapperKeyDown}
      ref={mainWrapperRef}
      tabIndex={-1}
    >
      {fullscreenWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999]">
          <div className="bg-white p-8 rounded-lg text-center shadow-2xl max-w-sm">
            <h2 className="text-2xl font-bold text-yellow-600 mb-4">Warning ({fullscreenWarning.count}/3)</h2>
            <p className="text-gray-700 mb-6">You have exited fullscreen. After 3 warnings, your quiz will be automatically submitted.</p>
            <button onClick={() => { enterFullscreen(); setFullscreenWarning(null); }} className="bg-blue-600 text-white font-bold px-6 py-3 rounded-lg w-full">Re-enter Fullscreen</button>
          </div>
        </div>
      )}
      
      {showSubmitWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9998]">
          <div className="bg-white p-8 rounded-lg text-center shadow-2xl max-w-sm">
            <h2 className="text-2xl font-bold text-yellow-600 mb-4">Confirm Submission</h2>
            <p className="text-gray-700 mb-6">You have <strong>{unansweredQuestionsCount} unanswered question(s)</strong>. Are you sure?</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setShowSubmitWarning(false)} className="px-6 py-2 rounded-lg border font-semibold">Cancel</button>
              <button onClick={() => handleSubmitQuiz(true)} className="bg-red-600 text-white font-bold px-6 py-2 rounded-lg">Submit Anyway</button>
            </div>
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
            <button onClick={() => handleSubmitQuiz(false)} className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded-lg">Submit Quiz</button>
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
            <button onClick={() => handleBookmark(currentQuestion._id)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${bookmarked[currentQuestion._id] ? "text-yellow-700 bg-yellow-100" : "text-gray-600 bg-gray-100"}`}>
                <BookmarkIcon filled={bookmarked[currentQuestion._id]} /> {bookmarked[currentQuestion._id] ? "Bookmarked" : "Bookmark"}
            </button>
          </div>
          <div className="space-y-4">
            {currentQuestion.options.map((option) => (
              <label key={option.id} className={`flex items-center p-4 border-2 rounded-lg cursor-pointer ${answers[currentQuestion._id] === option.optionText ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                <input type="radio" name={currentQuestion._id} value={option.optionText} checked={answers[currentQuestion._id] === option.optionText} onChange={() => handleSelect(currentQuestion._id, option.optionText)} className="w-5 h-5"/>
                <span className="ml-4 font-medium">{option.optionText}</span>
              </label>
            ))}
          </div>
          <div className="mt-8 flex justify-between">
            <button onClick={handlePrevious} disabled={currentQuestionIndex === 0} className="px-6 py-2 rounded-lg border font-semibold disabled:opacity-50">Previous</button>
            <button onClick={handleNext} disabled={currentQuestionIndex === questions.length - 1} className="px-8 py-2 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-50">Next</button>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-semibold mb-4 text-gray-800">Question Palette</h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, index) => {
                const qId = q._id;
                let statusClass = "bg-gray-200 text-gray-700";
                if (answers[qId]) statusClass = "bg-green-500 text-white";
                else if (visited[qId]) statusClass = "bg-blue-200 text-blue-800";
                if (bookmarked[qId]) statusClass = "bg-yellow-400 text-white";
                if (index === currentQuestionIndex) statusClass += " ring-2 ring-offset-2 ring-blue-600";
                return <button key={qId} onClick={() => setCurrentQuestionIndex(index)} className={`w-10 h-10 rounded-lg font-medium ${statusClass}`}>{index + 1}</button>
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}