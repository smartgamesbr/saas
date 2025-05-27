import { createClient, SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { User as AppUser, ActivityFormData, GeneratedPage, SavedActivity } from './types'; // Renamed to avoid conflict

// WARNING: Hardcoding keys is NOT recommended for production.
// This is a fallback for environments where .env files might not be loaded automatically (e.g., certain sandboxed playgrounds).
// Ensure proper environment variable setup (e.g., via .env files loaded by a build tool or platform settings) for development and deployment.
const FALLBACK_SUPABASE_URL = "https://ntupwkrctidjoxkoyklu.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50dXB3a3JjdGlkam94a295a2x1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxOTQzODUsImV4cCI6MjA2Mzc3MDM4NX0.e_cRNHQFhxBEzUwJ79bNK7g6IaYALZkv6x-dSAxii2A";

let supabaseUrl = import.meta.env.SUPABASE_URL;
let supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;
let usingFallbackKeys = false;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "----------------------------------------------------------------------------------\n" +
    "WARNING: Supabase URL or Anon Key not found in environment variables. \n" +
    "Attempting to use hardcoded fallback keys. \n" +
    "This is intended for specific development/demonstration environments only. \n" +
    "For actual development and production, ensure SUPABASE_URL and SUPABASE_ANON_KEY are correctly set as environment variables.\n" +
    "----------------------------------------------------------------------------------"
  );
  supabaseUrl = FALLBACK_SUPABASE_URL;
  supabaseAnonKey = FALLBACK_SUPABASE_ANON_KEY;
  usingFallbackKeys = true;
}

// createClient itself will throw an error if supabaseUrl is still effectively undefined/empty or invalid after the fallback.
// We ensure it's a string by this point by providing a fallback.
const supabase: SupabaseClient = createClient(supabaseUrl!, supabaseAnonKey!);

if (usingFallbackKeys) {
    console.warn("Supabase client initialized using FALLBACK keys. Please verify this is the intended behavior for your current environment.");
}

export { supabase };

// Helper function to get user profile
export const getUserProfile = async (userId: string): Promise<Pick<AppUser, 'isAdmin' | 'isSubscribed' | 'email'> | null> => {
  if (!supabase) {
    console.error("getUserProfile called, but Supabase client is not properly initialized.");
    return null;
  }
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin, is_subscribed, email')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: 'No rows found' which is okay for new users
      console.error('Error fetching profile:', error);
      return null;
    }
    if (data) {
      return {
        isAdmin: data.is_admin || false,
        isSubscribed: data.is_subscribed || false,
        email: data.email || ''
      };
    }
    // If no data and no critical error (e.g., new user, profile not yet created)
    return { isAdmin: false, isSubscribed: false, email: '' }; 
  } catch (error) {
    console.error('Unexpected error fetching profile:', error);
    return null;
  }
};

// --- Saved Activities ---

export const saveActivity = async (
  userId: string,
  activityName: string,
  formData: ActivityFormData,
  generatedPagesData: GeneratedPage[]
): Promise<{ data: SavedActivity | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('saved_activities')
    .insert([{
      user_id: userId,
      activity_name: activityName,
      form_data: formData,
      generated_pages_data: generatedPagesData,
    }])
    .select()
    .single(); // Assuming you want the inserted row back

  if (error) {
    console.error('Error saving activity:', error);
  }
  return { data: data as SavedActivity | null, error };
};

export const getSavedActivities = async (
  userId: string
): Promise<{ data: SavedActivity[] | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('saved_activities')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching saved activities:', error);
  }
  return { data: data as SavedActivity[] | null, error };
};

export const deleteSavedActivity = async (
  activityId: string
): Promise<{ error: PostgrestError | null }> => {
  const { error } = await supabase
    .from('saved_activities')
    .delete()
    .eq('id', activityId);

  if (error) {
    console.error('Error deleting activity:', error);
  }
  return { error };
};