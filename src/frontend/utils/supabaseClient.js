/**
 * Supabase client for frontend applications
 * Handles connection and authentication with Supabase
 */
import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and anon key from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL and anon key must be defined in environment variables');
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

/**
 * Sign up a new user
 * @param {Object} userData - User data
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password
 * @param {Object} userData.metadata - Additional user metadata
 * @returns {Promise<Object>} User data and session
 */
export const signUp = async ({ email, password, metadata = {} }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  });
  
  if (error) throw error;
  return data;
};

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Session data
 */
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  return data;
};

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Get the current user session
 * @returns {Promise<Object>} Session data
 */
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

/**
 * Get the current user
 * @returns {Promise<Object>} User data
 */
export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
};

/**
 * Update user data
 * @param {Object} updates - User data to update
 * @returns {Promise<Object>} Updated user data
 */
export const updateUser = async (updates) => {
  const { data, error } = await supabase.auth.updateUser(updates);
  if (error) throw error;
  return data;
};

/**
 * Reset password with a token
 * @param {string} token - Reset password token
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Updated user data
 */
export const resetPassword = async (token, newPassword) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(token, {
    password: newPassword
  });
  if (error) throw error;
  return data;
};

/**
 * Request a password reset email
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
export const requestPasswordReset = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
};

// Export the Supabase client and auth methods
export { supabase };
export default supabase; 