import { config } from 'dotenv';
config();

import '@/ai/flows/generate-questions.ts';
import '@/ai/flows/enhance-answer-with-internet-search.ts';
import '@/ai/flows/generate-mnemonics.ts';
import '@/ai/flows/generate-answers.ts';
import '@/ai/flows/generate-image-for-question.ts'; // Added new flow
