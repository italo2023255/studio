
import type { IAnsweredQuestion, ILegalAnswer } from '@/types';

const QUIZ_HISTORY_KEY = 'lexquiz_ai_history_v3'; // Updated key to include subject/topic

export function getHistory(): IAnsweredQuestion[] {
  try {
    if (typeof window !== 'undefined') {
      const historyJson = localStorage.getItem(QUIZ_HISTORY_KEY);
      if (historyJson) {
        const parsedHistory = JSON.parse(historyJson) as IAnsweredQuestion[];
        // Add basic validation for new fields, though older items might not have them
        if (Array.isArray(parsedHistory) && parsedHistory.every(item => 'question' in item && 'options' in item && 'correctAnswerIndex' in item && 'questionStyle' in item)) {
            return parsedHistory.map(item => ({
                ...item,
                // Ensure subject and topic exist, even if undefined from older entries
                subject: item.subject || undefined,
                topic: item.topic || undefined,
            }));
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
  const updatedHistory = [answeredQuestion, ...history].slice(0, 100); // Keep last 100 entries
  saveHistory(updatedHistory);
}


// --- Functions for ILegalAnswer (legal assistant feature history, now secondary) ---
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
