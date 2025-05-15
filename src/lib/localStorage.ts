
import type { ILegalAnswer, IAnsweredQuestion } from '@/types'; // Added ILegalAnswer

const HISTORY_KEY = 'lexquiz_ai_history_v2'; // Changed key to avoid conflicts with old structure

// Get history can now return ILegalAnswer or potentially old IAnsweredQuestion if you want to migrate
export function getHistory(): ILegalAnswer[] {
  try {
    if (typeof window !== 'undefined') {
      const historyJson = localStorage.getItem(HISTORY_KEY);
      if (historyJson) {
        // Add more sophisticated migration logic if needed
        const parsedHistory = JSON.parse(historyJson);
        // Basic check to see if it's the new or old format
        if (Array.isArray(parsedHistory) && parsedHistory.every(item => 'userQuestion' in item && 'citedArticle' in item)) {
            return parsedHistory as ILegalAnswer[];
        }
        // If it's not new format, return empty or attempt migration
        console.warn("Old history format detected or invalid data. Returning empty history.");
        return [];
      }
    }
  } catch (error) {
    console.error('Failed to retrieve history from localStorage:', error);
  }
  return [];
}

export function saveHistory(history: ILegalAnswer[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
  } catch (error) {
    console.error('Failed to save history to localStorage:', error);
  }
}

export function addAnswerToHistory(answeredOutput: ILegalAnswer): void {
  const history = getHistory();
  // Add to the beginning of the array so newest items are first
  const updatedHistory = [answeredOutput, ...history].slice(0, 50); // Keep last 50 entries
  saveHistory(updatedHistory);
}

// --- Old functions for IAnsweredQuestion (quiz history) ---
// You might want to keep them if you plan to have both functionalities
// or provide a way to migrate old history.
const OLD_HISTORY_KEY = 'lexquiz_ai_history';

export function getOldQuizHistory(): IAnsweredQuestion[] {
  try {
    if (typeof window !== 'undefined') {
      const historyJson = localStorage.getItem(OLD_HISTORY_KEY);
      if (historyJson) {
        return JSON.parse(historyJson);
      }
    }
  } catch (error) {
    console.error('Failed to retrieve old quiz history from localStorage:', error);
  }
  return [];
}

export function addQuestionToOldHistory(answeredQuestion: IAnsweredQuestion): void {
  const history = getOldQuizHistory();
  const updatedHistory = [answeredQuestion, ...history].slice(0, 50);
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(OLD_HISTORY_KEY, JSON.stringify(updatedHistory));
    }
  } catch (error) {
    console.error('Failed to save old quiz history to localStorage:', error);
  }
}
