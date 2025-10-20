"use client";

import Link from "next/link";
import { RefObject } from "react";

const BookmarkIcon = ({ filled }: { filled: boolean }) => (
  <svg
    className="w-5 h-5"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
    />
  </svg>
);

const ClockIcon = () => (
  <svg
    className="w-5 h-5 text-gray-600"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

// --- Type Definitions ---

type Question = {
  _id: string;
  questionText: string;
  options: { id: string; optionText: string }[];
  marks: number;
};

interface QuizInterfaceProps {
  // Data State
  questions: Question[];
  currentQuestionIndex: number;
  loading: boolean;
  error: string;

  // UI/Interaction State
  answers: Record<string, string | null>;
  bookmarked: Record<string, boolean>;
  visited: Record<string, boolean>;
  timeLeft: number;
  tabSwitchViolations: number;
  isQuizTerminated: boolean;
  showSubmitWarning: boolean;
  fullscreenWarning: { count: number } | null;

  // Event Handlers (from layout)
  onSelectOption: (questionId: string, option: string) => void;
  onToggleBookmark: (questionId: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onNavigateToQuestion: (index: number) => void;
  onSubmitQuiz: (force: boolean) => void;
  onCloseSubmitWarning: () => void;
  onReEnterFullscreen: () => void;

  // Ref from layout
  mainWrapperRef: RefObject<HTMLDivElement | null>;
}

// --- Helper Function (Presentational) ---
const formatTime = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(
    s % 60
  ).padStart(2, "0")}`;

// --- Main UI Component ---

export default function QuizInterface({
  questions,
  currentQuestionIndex,
  loading,
  error,
  answers,
  bookmarked,
  visited,
  timeLeft,
  tabSwitchViolations,
  isQuizTerminated,
  showSubmitWarning,
  fullscreenWarning,
  onSelectOption,
  onToggleBookmark,
  onNext,
  onPrevious,
  onNavigateToQuestion,
  onSubmitQuiz,
  onCloseSubmitWarning,
  onReEnterFullscreen,
  mainWrapperRef,
}: QuizInterfaceProps) {
  
  // --- Conditional UI Renders ---

  if (loading && questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center">
        <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-lg text-gray-700 font-semibold">
          Loading Your Quiz...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="text-5xl mb-4">☹️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            An Error Occurred
          </h2>
          <p className="text-gray-700">{error}</p>
          <Link
            href="/quiz/instructions"
            className="mt-6 inline-block bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg"
          >
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center">
        <div className="text-5xl mb-4">🤔</div>
        <h2 className="text-2xl font-bold text-gray-800">No Question Data</h2>
        <p className="text-gray-600">The quiz seems to be empty.</p>
      </div>
    );
  }

  if (isQuizTerminated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Quiz Terminated
          </h2>
          <p className="text-gray-700">
            Your quiz was automatically submitted due to repeated violations.
          </p>
        </div>
      </div>
    );
  }

  const unansweredQuestionsCount = Object.values(answers).filter(
    (a) => a === null
  ).length;

  // --- Main Quiz Layout ---

  return (
    <div
      className="min-h-screen bg-gray-100 select-none outline-none"
      ref={mainWrapperRef} // Attach ref from parent
      tabIndex={-1}
    >
      {/* Fullscreen Warning Modal */}
      {fullscreenWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999]">
          <div className="bg-white p-8 rounded-lg text-center shadow-2xl max-w-sm">
            <h2 className="text-2xl font-bold text-yellow-600 mb-4">
              Warning ({fullscreenWarning.count}/3)
            </h2>
            <p className="text-gray-700 mb-6">
              You have exited fullscreen. After 3 warnings, your quiz will end.
            </p>
            <button
              onClick={onReEnterFullscreen} // Use prop handler
              className="bg-blue-600 text-white font-bold px-6 py-3 rounded-lg w-full"
            >
              Re-enter Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* Submit Warning Modal */}
      {showSubmitWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9998]">
          <div className="bg-white p-8 rounded-lg text-center shadow-2xl max-w-sm">
            <h2 className="text-2xl font-bold text-yellow-600 mb-4">
              Confirm Submission
            </h2>
            <p className="text-gray-700 mb-6">
              You have <strong>{unansweredQuestionsCount}</strong> unanswered
              question(s). Are you sure?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={onCloseSubmitWarning} // Use prop handler
                className="px-6 py-2 rounded-lg border font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => onSubmitQuiz(true)} // Use prop handler
                className="bg-red-600 text-white font-bold px-6 py-2 rounded-lg"
              >
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-800">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
            {tabSwitchViolations > 0 && (
              <p className="text-xs text-red-500 font-bold mt-1">
                Violations: {tabSwitchViolations}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-md">
              <ClockIcon />
              <span className="font-semibold text-lg text-gray-800">
                {formatTime(timeLeft)}
              </span>
            </div>
            <button
              onClick={() => onSubmitQuiz(false)} // Use prop handler
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded-lg"
            >
              Submit Quiz
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Question Area */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-xl shadow-sm border">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-sm font-medium text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                Marks: {currentQuestion.marks || 1}
              </span>
              <h2 className="text-xl font-semibold text-gray-900 mt-3">
                {currentQuestion.questionText}
              </h2>
            </div>
            <button
              onClick={() => onToggleBookmark(currentQuestion._id)} // Use prop handler
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                bookmarked[currentQuestion._id]
                  ? "text-yellow-700 bg-yellow-100"
                  : "text-gray-600 bg-gray-100"
              }`}
            >
              <BookmarkIcon filled={bookmarked[currentQuestion._id]} />{" "}
              {bookmarked[currentQuestion._id] ? "Bookmarked" : "Bookmark"}
            </button>
          </div>

          <div className="space-y-4">
            {currentQuestion.options.map((option) => (
              <label
                key={option.id}
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer ${
                  answers[currentQuestion._id] === option.optionText
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name={currentQuestion._id}
                  value={option.optionText}
                  checked={
                    answers[currentQuestion._id] === option.optionText
                  }
                  onChange={() =>
                    onSelectOption(currentQuestion._id, option.optionText) // Use prop handler
                  }
                  className="w-5 h-5"
                />
                <span className="ml-4 font-medium">{option.optionText}</span>
              </label>
            ))}
          </div>

          <div className="mt-8 flex justify-between">
            <button
              onClick={onPrevious} // Use prop handler
              disabled={currentQuestionIndex === 0}
              className="px-6 py-2 rounded-lg border font-semibold disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={onNext} // Use prop handler
              disabled={currentQuestionIndex === questions.length - 1}
              className="px-8 py-2 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        {/* Question Palette */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-semibold mb-4 text-gray-800">
              Question Palette
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, index) => {
                const qId = q._id;
                let statusClass = "bg-gray-200 text-gray-700"; // Not visited
                if (answers[qId])
                  statusClass = "bg-green-500 text-white"; // Answered
                else if (visited[qId])
                  statusClass = "bg-blue-200 text-blue-800"; // Visited, not answered
                if (bookmarked[qId])
                  statusClass = "bg-yellow-400 text-white"; // Bookmarked
                if (index === currentQuestionIndex)
                  statusClass += " ring-2 ring-offset-2 ring-blue-600"; // Current

                return (
                  <button
                    key={qId}
                    onClick={() => onNavigateToQuestion(index)} // Use prop handler
                    className={`w-10 h-10 rounded-lg font-medium ${statusClass}`}
                  >
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