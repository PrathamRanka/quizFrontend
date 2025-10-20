/*eslint-disable */
"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  createContext,
  ReactNode
} from "react";
import { useRouter, useParams } from "next/navigation";
import api from "../../../../services/api"; 

// --- Define Types ---
type Question = {
  _id: string;
  questionText: string;
  options: { id: string; optionText: string }[];
  marks: number;
};

// --- Define Context Shape ---
interface QuizContextType {
  questions: Question[];
  currentQuestionIndex: number;
  loading: boolean;
  error: string;
  answers: Record<string, string | null>;
  bookmarked: Record<string, boolean>;
  visited: Record<string, boolean>;
  timeLeft: number;
  tabSwitchViolations: number;
  isQuizTerminated: boolean;
  showSubmitWarning: boolean;
  fullscreenWarning: { count: number } | null;
  onSelectOption: (questionId: string, option: string) => void;
  onToggleBookmark: (questionId: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onNavigateToQuestion: (index: number) => void;
  onSubmitQuiz: (force: boolean) => void;
  onCloseSubmitWarning: () => void;
  onReEnterFullscreen: () => void;
  mainWrapperRef: React.RefObject<HTMLDivElement | null >; // <-- made non-nullable
}

// --- Create Context ---
// Note: We export this so page.tsx can import it
export const QuizContext = createContext<QuizContextType | null>(null);

// --- Main Layout Component ---
export default function QuizLayout({ children }: { children: ReactNode }) {
  // Core State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes

  // User Interaction State
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
  const [visited, setVisited] = useState<Record<string, boolean>>({});

  // Proctoring & UI State
  const [tabSwitchViolations, setTabSwitchViolations] = useState(0);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [fullscreenWarning, setFullscreenWarning] = useState<{ count: number } | null>(null);
  const [isQuizTerminated, setIsQuizTerminated] = useState(false);
  const [showSubmitWarning, setShowSubmitWarning] = useState(false);

  const router = useRouter();
  const params = useParams();
  const { quizId } = params;
  
  // This ref is created here and passed via context to the UI
  const mainWrapperRef = useRef<HTMLDivElement>(null);

  // --- Submit Logic ---
  const handleSubmitQuiz = useCallback(
    async (force = false, reason = "Quiz submitted.") => {
      const unansweredCount = Object.values(answers).filter(
        (a) => a === null
      ).length;
      if (unansweredCount > 0 && !force) {
        setShowSubmitWarning(true);
        return;
      }

      setLoading(true);
      setShowSubmitWarning(false);
      const sessionId = localStorage.getItem("sessionId");
      if (!sessionId) {
        setLoading(false);
        return alert("Session ID missing.");
      }

      const formattedAnswers = Object.entries(answers)
        .filter(([, val]) => val !== null)
        .map(([key, val]) => ({
          questionId: key,
          selectedOption: val,
        }));

      try {
        const response = await api.post(`/sessions/${sessionId}/submit`, {
          answers: formattedAnswers,
        });
        if (response.data.success) {
          localStorage.removeItem(`quiz-progress-${sessionId}`);
          sessionStorage.setItem(
            "quizResults",
            JSON.stringify(response.data.data)
          );
          if (reason) sessionStorage.setItem("quizTerminationReason", reason);
          router.push("/quiz/results");
        } else {
          alert(`Submission failed: ${response.data.message || "Error."}`);
          setLoading(false);
        }
      } catch (err) {
        alert("An error occurred during submission.");
        setLoading(false);
      }
    },
    [answers, router]
  );

  const handleSubmitQuizRef = useRef(handleSubmitQuiz);
  useEffect(() => {
    handleSubmitQuizRef.current = handleSubmitQuiz;
  }, [handleSubmitQuiz]);

  // --- Data Fetching ---
  useEffect(() => {
    const startQuizAndFetch = async () => {
      const sessionId = localStorage.getItem("sessionId");
      if (!sessionId) {
        setError("Session invalid. Please restart.");
        setLoading(false);
        return;
      }

      const savedProgress = localStorage.getItem(`quiz-progress-${sessionId}`);
      try {
        const response = await api.post(`/quizzes/${quizId}/start`);
        const fetchedQuestions = response.data.data.questions;
        if (!fetchedQuestions || fetchedQuestions.length === 0) {
          setError("No questions found.");
          setLoading(false);
          return;
        }

        setQuestions(fetchedQuestions);
        if (savedProgress) {
          const progress = JSON.parse(savedProgress);
          setAnswers(progress.answers || {});
          setBookmarked(progress.bookmarked || {});
          setVisited(progress.visited || {});
          setCurrentQuestionIndex(progress.currentQuestionIndex || 0);
          setTimeLeft(progress.timeLeft || 1200);
        } else {
          setAnswers(
            fetchedQuestions.reduce(
              (acc: any, q: Question) => ({ ...acc, [q._id]: null }),
              {}
            )
          );
          setBookmarked(
            fetchedQuestions.reduce(
              (acc: any, q: Question) => ({ ...acc, [q._id]: false }),
              {}
            )
          );
          setVisited(
            fetchedQuestions.reduce(
              (acc: any, q: Question) => ({ ...acc, [q._id]: false }),
              {}
            )
          );
        }
      } catch {
        setError("Failed to load quiz.");
      } finally {
        setLoading(false);
      }
    };
    if (quizId) startQuizAndFetch();
  }, [quizId]);

  // --- Save Progress (Persistence) ---
  useEffect(() => {
    const saveProgress = () => {
      if (questions.length > 0 && !loading) {
        const sessionId = localStorage.getItem("sessionId");
        const progress = {
          answers,
          bookmarked,
          visited,
          currentQuestionIndex,
          timeLeft,
        };
        localStorage.setItem(
          `quiz-progress-${sessionId}`,
          JSON.stringify(progress)
        );
      }
    };
    const interval = setInterval(saveProgress, 5000);
    return () => clearInterval(interval);
  }, [answers, bookmarked, visited, currentQuestionIndex, timeLeft, questions, loading]);

  // --- Timer ---
  useEffect(() => {
    if (timeLeft === 0)
      handleSubmitQuizRef.current(true, "Time ran out.");
    if (!loading && timeLeft > 0) {
      const timer = setInterval(
        () => setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0)),
        1000
      );
      return () => clearInterval(timer);
    }
  }, [loading, timeLeft]);

  // --- Mark Visited ---
  useEffect(() => {
    if (questions.length > 0 && questions[currentQuestionIndex]) {
      setVisited((p) => ({
        ...p,
        [questions[currentQuestionIndex]._id]: true,
      }));
    }
  }, [currentQuestionIndex, questions]);

  // --- Fullscreen Control ---
  const enterFullscreen = useCallback(async () => {
    try {
      if (mainWrapperRef.current?.requestFullscreen) {
        await mainWrapperRef.current.requestFullscreen({ navigationUI: "hide" });
      }
    } catch {
      console.warn("Fullscreen request failed.");
    }
  }, []);

  // --- Security: Key Locking + Focus ---
  useEffect(() => {
    if (mainWrapperRef.current) mainWrapperRef.current.focus();

    const blockKeys = (e: KeyboardEvent) => {
      const blockedKeys = [
        "F12", "F11", "F5", "Escape", "Tab", "Alt", "Meta", "Control",
      ];
      if (
        blockedKeys.includes(e.key) ||
        (e.ctrlKey &&
          ["r", "R", "c", "v", "x", "t", "w", "n"].includes(e.key))
      ) {
        e.preventDefault();
        e.stopPropagation();
        alert("Keyboard shortcuts are disabled during the quiz.");
      }
    };

    document.addEventListener("keydown", blockKeys);
    return () => document.removeEventListener("keydown", blockKeys);
  }, []);

  // --- Security: Tab Switch / Fullscreen Watchers ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) setTabSwitchViolations((p) => p + 1);
    };

    // --- Add this new useEffect to watch for tab switch violations ---
useEffect(() => {
  if (tabSwitchViolations >= 5) {
    // Check if the quiz isn't already terminated
    if (isQuizTerminated) return;

    setIsQuizTerminated(true);
    handleSubmitQuizRef.current(
      true,
      "Quiz terminated due to excessive tab switching."
    );
  }
}, [tabSwitchViolations, isQuizTerminated]); // Run this check whenever 'tabSwitchViolations' changes

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setFullscreenExitCount((count) => {
          const newCount = count + 1;
          if (newCount >= 3) {
            setIsQuizTerminated(true);
            handleSubmitQuizRef.current(
              true,
              "Quiz terminated due to repeated fullscreen exits."
            );
          } else setFullscreenWarning({ count: newCount });
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

  // --- Security: Prevent right-click globally ---
  useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", preventContextMenu);
    return () => document.removeEventListener("contextmenu", preventContextMenu);
  }, []);
  
  // --- Event Handlers to pass via Context ---
  
  const onSelectOption = (qId: string, option: string) =>
    setAnswers((p) => ({ ...p, [qId]: option }));
    
  const onToggleBookmark = (qId: string) =>
    setBookmarked((p) => ({ ...p, [qId]: !p[qId] }));

  const onNext = () => {
    if (currentQuestionIndex < questions.length - 1)
      setCurrentQuestionIndex((p) => p + 1);
  };
  
  const onPrevious = () => {
    if (currentQuestionIndex > 0)
      setCurrentQuestionIndex((p) => p + 1);
  };
  
  const onNavigateToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };
  
  const onCloseSubmitWarning = () => {
    setShowSubmitWarning(false);
  };
  
  const onReEnterFullscreen = () => {
    enterFullscreen();
    setFullscreenWarning(null);
  };

  // --- Create Context Value ---
  const contextValue: QuizContextType = {
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
    onSubmitQuiz: handleSubmitQuiz,
    onCloseSubmitWarning,
    onReEnterFullscreen,
    mainWrapperRef,
  };

  // --- Render Provider ---
  return (
    <QuizContext.Provider value={contextValue}>
      {/* Wrap children in a focusable div so mainWrapperRef.current is attached */}
      <div
        ref={mainWrapperRef}
        tabIndex={0}
        style={{ outline: "none", width: "100%", height: "100%" }}
      >
        {children}
      </div>
    </QuizContext.Provider>
  );
}