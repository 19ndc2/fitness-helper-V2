/**
 * API Service Layer
 * 
 * This file contains all API calls for the Fitness AI Journal app.
 * Direct Supabase calls for: Goals, Entries, and Plans
 * 
 * All functions return typed responses and throw errors on failure.
 */

import { createClient } from '@supabase/supabase-js';
import { getSession } from './supabaseAuth';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Initialize Supabase client for direct database access
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

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
// GOALS ENDPOINTS (Direct Supabase - stored in app_users.goal)
// ============================================================================

/**
 * GET /api/goals
 * Returns the user's single goal or null if no goal exists
 * Reads from app_users.goal field
 * Returns: Goal | null
 */
export async function getGoals(): Promise<Goal | null> {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('app_users')
    .select('id, goal, created_at, updated_at')
    .eq('id', session.user.id)
    .single();

  if (error) throw new Error(error.message);
  
  if (!data || !data.goal) return null;

  // Transform app_users row to Goal type
  return {
    id: data.id,
    userId: data.id,
    text: data.goal,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * POST /api/goals
 * Body: { text: string }
 * Creates or replaces the user's goal in app_users.goal
 * Returns: Goal
 */
export async function createGoal(text: string): Promise<Goal> {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('app_users')
    .update({
      goal: text,
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.user.id)
    .select('id, goal, created_at, updated_at')
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    userId: data.id,
    text: data.goal,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * PUT /api/goals/:id
 * Body: { text: string }
 * Updates the user's goal in app_users.goal
 * Returns: Goal
 */
export async function updateGoal(id: string, text: string): Promise<Goal> {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('app_users')
    .update({
      goal: text,
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.user.id)
    .select('id, goal, created_at, updated_at')
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    userId: data.id,
    text: data.goal,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * DELETE /api/goals/:id
 * Clears the user's goal (sets app_users.goal to null)
 * Returns: { success: boolean }
 */
export async function deleteGoal(id: string): Promise<{ success: boolean }> {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('app_users')
    .update({
      goal: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.user.id);

  if (error) throw new Error(error.message);

  return { success: true };
}

// ============================================================================
// ENTRIES (WORKOUT NOTES) ENDPOINTS (Direct Supabase)
// ============================================================================

/**
 * GET /api/entries
 * Query params: limit and offset for pagination
 * Returns: Entry[]
 */
export async function getEntries(limit = 50, offset = 0): Promise<Entry[]> {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('entries')
    .select('id, user_id, content, created_at, updated_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);

  return data.map((entry) => ({
    id: entry.id,
    userId: entry.user_id,
    content: entry.content,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
  }));
}

/**
 * POST /api/entries
 * Body: { content: string }
 * Returns: Entry
 */
export async function createEntry(content: string): Promise<Entry> {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('entries')
    .insert({
      user_id: session.user.id,
      content,
      type: 'workout_note', // Default type
    })
    .select('id, user_id, content, created_at, updated_at')
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    userId: data.user_id,
    content: data.content,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * PUT /api/entries/:id
 * Body: { content: string }
 * Returns: Entry
 */
export async function updateEntry(id: string, content: string): Promise<Entry> {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('entries')
    .update({
      content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', session.user.id)
    .select('id, user_id, content, created_at, updated_at')
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    userId: data.user_id,
    content: data.content,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * DELETE /api/entries/:id
 * Returns: { success: boolean }
 */
export async function deleteEntry(id: string): Promise<{ success: boolean }> {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id);

  if (error) throw new Error(error.message);

  return { success: true };
}

// ============================================================================
// AI FITNESS PLAN ENDPOINTS
// ============================================================================

/**
 * GET /api/plan
 * Returns the current AI-generated fitness plan
 * Direct Supabase query for latest plan
 * Returns: FitnessPlan | null
 */
export async function getFitnessPlan(): Promise<FitnessPlan | null> {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('plans')
    .select('id, user_id, plan_text, generated_at')
    .eq('user_id', session.user.id)
    .order('generated_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message); // PGRST116 = no rows
  
  if (!data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    content: data.plan_text,
    generatedAt: data.generated_at,
  };
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
