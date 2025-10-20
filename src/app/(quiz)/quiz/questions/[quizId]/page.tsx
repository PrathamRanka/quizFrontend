//eslint-disable
"use client";

import { useContext } from "react";
import { QuizContext } from "./layout"; 
import QuizInterface from "../../../../components/QuizInterface"; 

export default function QuizPage() {
  const context = useContext(QuizContext);


  if (!context) {
    return <div>Loading quiz logic...</div>;
  }

 
  return <QuizInterface {...context} />;
}