
import type { IAnsweredQuestion, ILegalAnswer } from '@/types';

// Key for the quiz generator history
const QUIZ_HISTORY_KEY = 'lexquiz_ai_history'; // Reverted to original key for quiz questions

export function getHistory(): IAnsweredQuestion[] {
  try {
    if (typeof window !== 'undefined') {
      const historyJson = localStorage.getItem(QUIZ_HISTORY_KEY);
      if (historyJson) {
        const parsedHistory = JSON.parse(historyJson);
        // Basic check for IAnsweredQuestion structure
        if (Array.isArray(parsedHistory) && parsedHistory.every(item => 'question' in item && 'options' in item && 'correctAnswerIndex' in item && 'questionStyle' in item)) {
            return parsedHistory as IAnsweredQuestion[];
        }
        console.warn("Invalid quiz history format detected. Returning empty history.");
        return [];
      }
    }
  } catch (error) {
    console.error('Failed to retrieve quiz history from localStorage:', error);
  }
  return [];
}

export function saveHistory(history: IAnsweredQuestion[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(history));
    }
  } catch (error) {
    console.error('Failed to save quiz history to localStorage:', error);
  }
}

export function addAnswerToHistory(answeredQuestion: IAnsweredQuestion): void {
  const history = getHistory();
  // Add to the beginning of the array so newest items are first
  const updatedHistory = [answeredQuestion, ...history].slice(0, 50); // Keep last 50 entries
  saveHistory(updatedHistory);
}


// --- Functions for ILegalAnswer (legal assistant feature history, now secondary) ---
// Kept for potential future use or if you decide to have a separate history for it.
const LEGAL_ASSISTANT_HISTORY_KEY = 'lexquiz_ai_legal_assistant_history_v2';

export function getLegalAssistantHistory(): ILegalAnswer[] {
  try {
    if (typeof window !== 'undefined') {
      const historyJson = localStorage.getItem(LEGAL_ASSISTANT_HISTORY_KEY);
      if (historyJson) {
        const parsedHistory = JSON.parse(historyJson);
        if (Array.isArray(parsedHistory) && parsedHistory.every(item => 'userQuestion' in item && 'citedArticle' in item)) {
            return parsedHistory as ILegalAnswer[];
        }
        console.warn("Old legal assistant history format detected or invalid data. Returning empty history.");
        return [];
      }
    }
  } catch (error) {
    console.error('Failed to retrieve legal assistant history from localStorage:', error);
  }
  return [];
}

export function saveLegalAssistantHistory(history: ILegalAnswer[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LEGAL_ASSISTANT_HISTORY_KEY, JSON.stringify(history));
    }
  } catch (error) {
    console.error('Failed to save legal assistant history to localStorage:', error);
  }
}

export function addLegalAssistantAnswerToHistory(answeredOutput: ILegalAnswer): void {
  const history = getLegalAssistantHistory();
  const updatedHistory = [answeredOutput, ...history].slice(0, 50);
  saveLegalAssistantHistory(updatedHistory);
}
