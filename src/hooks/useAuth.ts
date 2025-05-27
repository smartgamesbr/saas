import { useState, useEffect, useCallback } from 'react';
import { User as AppUser } from '../types';
import { supabase, getUserProfile } from '../supabaseClient';
import { AuthError, User as SupabaseUser } from '@supabase/supabase-js';
import { ADMIN_EMAIL } from '../constants';
import Logger from '../utils/logger';

export const useAuth = () => {
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  
  const processSupabaseUser = useCallback(async (supabaseUser: SupabaseUser | null): Promise<AppUser | null> => {
    Logger.debug('Processing Supabase user:', { userId: supabaseUser?.id });
    if (!supabaseUser) {
      return null;
    }

    try {
      const profile = await getUserProfile(supabaseUser.id);
      const userEmail = supabaseUser.email || profile?.email || '';
      return {
        id: supabaseUser.id,
        email: userEmail,
        isAdmin: (profile?.isAdmin || false) || (userEmail === ADMIN_EMAIL),
        isSubscribed: profile?.isSubscribed || false,
      };
    } catch (err) {
      Logger.error('Error processing user profile:', err);
      return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        isAdmin: supabaseUser.email === ADMIN_EMAIL,
        isSubscribed: false,
      };
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const fetchSession = async () => {
      Logger.debug('Fetching session...');
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!isMounted) {
          Logger.debug('Component unmounted during session fetch');
          return;
        }

        if (sessionError) {
          Logger.error('Session fetch error:', sessionError);
          setAuthError(sessionError);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          Logger.debug('Session found, processing user');
          const processedUser = await processSupabaseUser(session.user);
          if (isMounted) {
            setAppUser(processedUser);
            setAuthError(null);
          }
        } else {
          Logger.debug('No session found');
          if (isMounted) {
            setAppUser(null);
            setAuthError(null);
          }
        }
      } catch (err) {
        Logger.error('Unexpected error during session fetch:', err);
        if (!isMounted) return;
        
        if (err instanceof AuthError) {
          setAuthError(err);
        } else {
          setAuthError(new AuthError(err instanceof Error ? err.message : 'Unknown error during session fetch.'));
        }
      } finally {
        if (isMounted) {
          Logger.debug('Setting loading state to false');
          setIsLoading(false);
        }
      }
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        Logger.debug('Auth state changed:', { event: _event, hasSession: !!session });
        if (!isMounted) return;
        
        try {
          if (session?.user) {
            const processedUser = await processSupabaseUser(session.user);
            if (isMounted) {
              setAppUser(processedUser);
              setAuthError(null);
            }
          } else {
            if (isMounted) {
              setAppUser(null);
              setAuthError(null);
            }
          }
        } catch (err) {
          Logger.error('Error during auth state change:', err);
          if (!isMounted) return;
          setAuthError(err instanceof AuthError ? err : new AuthError(err instanceof Error ? err.message : 'Unknown error during auth state change.'));
        }
      }
    );

    return () => {
      Logger.debug('Cleaning up auth effect');
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [processSupabaseUser]);

  const signIn = useCallback(async (email: string, password?: string) => {
    setAuthError(null);
    try {
      const response = password 
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signInWithOtp({ 
            email,
            options: { emailRedirectTo: window.location.origin }
          });

      if (response.error) {
        setAuthError(response.error);
        return response.error;
      }
      return null;
    } catch (err) {
      const error = err instanceof AuthError ? err : new AuthError('Unknown error during sign in');
      setAuthError(error);
      return error;
    }
  }, []);

  const signUp = useCallback(async (email: string, password?: string) => {
    setAuthError(null);
    try {
      const response = password
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: window.location.origin }
          });

      if (response.error) {
        setAuthError(response.error);
        return response.error;
      }

      if (response.data.user) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: response.data.user.id,
              email: response.data.user.email,
              is_admin: response.data.user.email === ADMIN_EMAIL,
              is_subscribed: false,
              updated_at: new Date().toISOString()
            });

          if (profileError) {
            console.error("Error creating profile:", profileError);
          }
        } catch (profileErr) {
          console.error("Error during profile creation:", profileErr);
        }
      }
      return null;
    } catch (err) {
      const error = err instanceof AuthError ? err : new AuthError('Unknown error during sign up');
      setAuthError(error);
      return error;
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(error);
    }
  }, []);

  const subscribe = useCallback(async (): Promise<AuthError | null> => {
    if (!appUser) {
      const error = new AuthError("User not logged in");
      setAuthError(error);
      return error;
    }

    setAuthError(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_subscribed: true, updated_at: new Date().toISOString() })
        .eq('id', appUser.id);
      
      if (error) {
        const authError = new AuthError(`Failed to update subscription: ${error.message}`);
        setAuthError(authError);
        return authError;
      }

      setAppUser(prev => prev ? { ...prev, isSubscribed: true } : null);
      return null;
    } catch (err) {
      const error = err instanceof AuthError ? err : new AuthError('Unknown error during subscription');
      setAuthError(error);
      return error;
    }
  }, [appUser]);

  const resetPasswordForEmail = useCallback(async (email: string) => {
    setAuthError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#password-reset`,
      });
      if (error) {
        setAuthError(error);
      }
      return { error };
    } catch (err) {
      const error = err instanceof AuthError ? err : new AuthError('Unknown error during password reset');
      setAuthError(error);
      return { error };
    }
  }, []);

  return {
    user: appUser,
    signIn,
    signUp,
    signOut,
    subscribe,
    resetPasswordForEmail,
    isLoading,
    authError,
    setAuthError
  };
};