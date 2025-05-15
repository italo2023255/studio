
import { config } from 'dotenv';
config();

// Primary flow for generating quizzes
import '@/ai/flows/generate-questions.ts'; 
import '@/ai/flows/find-simulated-external-questions.ts'; // For simulating external questions

// Supporting flows for enriching questions
import '@/ai/flows/enhance-answer-with-internet-search.ts';
import '@/ai/flows/generate-mnemonics.ts';
// import '@/ai/flows/generate-image-for-question.ts'; // Direct AI image per question removed

// Deprecated or less used flows:
// import '@/ai/flows/answer-legal-question.ts'; // This was for the chatbot-style interaction
// import '@/ai/flows/generate-answers.ts'; // Logic likely merged or handled within generate-questions or its sub-prompts
