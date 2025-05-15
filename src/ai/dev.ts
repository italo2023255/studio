
import { config } from 'dotenv';
config();

// Remove or comment out old question generation flow if it's no longer primary
// import '@/ai/flows/generate-questions.ts'; 

import '@/ai/flows/answer-legal-question.ts'; // New primary flow
import '@/ai/flows/enhance-answer-with-internet-search.ts';
import '@/ai/flows/generate-mnemonics.ts';
// import '@/ai/flows/generate-answers.ts'; // This might be obsolete or its logic merged
import '@/ai/flows/generate-image-for-question.ts';
