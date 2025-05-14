export type QuestionStyle = 'cespe' | 'mcq4' | 'mcq5';

export interface IQGeneratedQuestion {
  question: string;
  options: string[]; // 2 for Cespe, 4 for mcq4, 5 for mcq5
  correctAnswerIndex: number; // 0-1 for Cespe, 0-3 for mcq4, 0-4 for mcq5
  explanation: string;
  questionStyle: QuestionStyle;
  mnemonic?: string; // Optional: from initial generation
  searchLinks?: string[]; // Optional: from initial generation
}

export interface IAnsweredQuestion extends IQGeneratedQuestion {
  id: string; // unique id for this answered instance
  legalTextContext: string; // The original legal text provided by the user
  userAnswerIndex: number;
  isCorrect: boolean;
  enhancedExplanation?: string; // From enhanceAnswerWithInternetSearch flow
  additionalSearchLinks?: string[]; // From enhanceAnswerWithInternetSearch flow
  generatedMnemonics?: string[]; // From generateMnemonics flow (can be multiple)
  imageDataUri?: string | null; // From generateImageForQuestion flow
  timestamp: number;
}
