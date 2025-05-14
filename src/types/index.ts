export interface IQGeneratedQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
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
  timestamp: number;
}
