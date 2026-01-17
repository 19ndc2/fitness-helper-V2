/**
 * API Service Layer
 * 
 * This file contains all API calls for the Fitness AI Journal app.
 * Auth is handled via Supabase.
 * Replace the BASE_URL and implement the actual API logic in each function.
 * 
 * All functions return typed responses and throw errors on failure.
 */

import { getSession } from './supabaseAuth';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = '/api'; // Change this to your actual API URL

// Helper for making authenticated requests
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const session = await getSession();
  
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    display_name?: string;
  };
}

export interface Goal {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface Entry {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface FitnessPlan {
  id: string;
  userId: string;
  content: string; // Could be markdown or structured JSON
  generatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatResponse {
  message: ChatMessage;
}

// ============================================================================
// AUTH ENDPOINTS (Handled by Supabase)
// ============================================================================

/**
 * Authentication is now handled by Supabase.
 * Use signIn, signUp, and signOut from @/services/supabaseAuth
 */

// ============================================================================
// GOALS ENDPOINTS
// ============================================================================

/**
 * GET /api/goals
 * Returns the user's single goal or null if no goal exists
 * Returns: Goal | null
 */
export async function getGoals(): Promise<Goal | null> {
  return fetchWithAuth<Goal | null>('/goals');
}

/**
 * POST /api/goals
 * Body: { text: string }
 * If a goal already exists, it will be replaced
 * Returns: Goal
 */
export async function createGoal(text: string): Promise<Goal> {
  return fetchWithAuth<Goal>('/goals', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

/**
 * PUT /api/goals/:id
 * Body: { text: string }
 * Returns: Goal
 */
export async function updateGoal(id: string, text: string): Promise<Goal> {
  return fetchWithAuth<Goal>(`/goals/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ text }),
  });
}

/**
 * DELETE /api/goals/:id
 * Returns: { success: boolean }
 */
export async function deleteGoal(id: string): Promise<{ success: boolean }> {
  return fetchWithAuth<{ success: boolean }>(`/goals/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// ENTRIES (WORKOUT NOTES) ENDPOINTS
// ============================================================================

/**
 * GET /api/entries
 * Query params: ?limit=number&offset=number
 * Returns: Entry[]
 */
export async function getEntries(limit = 50, offset = 0): Promise<Entry[]> {
  return fetchWithAuth<Entry[]>(`/entries?limit=${limit}&offset=${offset}`);
}

/**
 * POST /api/entries
 * Body: { content: string }
 * Returns: Entry
 */
export async function createEntry(content: string): Promise<Entry> {
  return fetchWithAuth<Entry>('/entries', {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

/**
 * PUT /api/entries/:id
 * Body: { content: string }
 * Returns: Entry
 */
export async function updateEntry(id: string, content: string): Promise<Entry> {
  return fetchWithAuth<Entry>(`/entries/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
}

/**
 * DELETE /api/entries/:id
 * Returns: { success: boolean }
 */
export async function deleteEntry(id: string): Promise<{ success: boolean }> {
  return fetchWithAuth<{ success: boolean }>(`/entries/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// AI FITNESS PLAN ENDPOINTS
// ============================================================================

/**
 * GET /api/plan
 * Returns the current AI-generated fitness plan
 * Returns: FitnessPlan | null
 */
export async function getFitnessPlan(): Promise<FitnessPlan | null> {
  return fetchWithAuth<FitnessPlan | null>('/plan');
}

/**
 * POST /api/plan/generate
 * Generates a new fitness plan based on goals and entries
 * Returns: FitnessPlan
 */
export async function generateFitnessPlan(): Promise<FitnessPlan> {
  return fetchWithAuth<FitnessPlan>('/plan/generate', {
    method: 'POST',
  });
}

// ============================================================================
// AI CHAT ENDPOINTS
// ============================================================================

/**
 * GET /api/chat/history
 * Returns chat history
 * Returns: ChatMessage[]
 */
export async function getChatHistory(): Promise<ChatMessage[]> {
  return fetchWithAuth<ChatMessage[]>('/chat/history');
}

/**
 * POST /api/chat
 * Send a message to the AI and get a response
 * Body: { message: string }
 * Returns: ChatResponse
 */
export async function sendChatMessage(message: string): Promise<ChatResponse> {
  return fetchWithAuth<ChatResponse>('/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

/**
 * DELETE /api/chat/history
 * Clear chat history
 * Returns: { success: boolean }
 */
export async function clearChatHistory(): Promise<{ success: boolean }> {
  return fetchWithAuth<{ success: boolean }>('/chat/history', {
    method: 'DELETE',
  });
}

// ============================================================================
// AUTH STATE HELPERS (Deprecated - use Supabase directly)
// ============================================================================

/**
 * @deprecated Use Supabase auth directly: import { getSession } from '@/services/supabaseAuth'
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('auth_token');
}

/**
 * @deprecated Use Supabase auth directly
 */
export function setAuthToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

/**
 * @deprecated Use Supabase auth directly
 */
export function clearAuthToken(): void {
  localStorage.removeItem('auth_token');
}
