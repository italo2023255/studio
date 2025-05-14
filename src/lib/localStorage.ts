import type { IAnsweredQuestion } from '@/types';

const HISTORY_KEY = 'lexquiz_ai_history';

export function getHistory(): IAnsweredQuestion[] {
  try {
    const historyJson = localStorage.getItem(HISTORY_KEY);
    if (historyJson) {
      return JSON.parse(historyJson);
    }
  } catch (error) {
    console.error('Failed to retrieve history from localStorage:', error);
  }
  return [];
}

export function saveHistory(history: IAnsweredQuestion[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save history to localStorage:', error);
  }
}

export function addQuestionToHistory(answeredQuestion: IAnsweredQuestion): void {
  const history = getHistory();
  // Add to the beginning of the array so newest items are first
  const updatedHistory = [answeredQuestion, ...history]; 
  saveHistory(updatedHistory);
}
