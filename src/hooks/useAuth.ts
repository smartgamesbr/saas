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
      Logger.debug('No Supabase user to process');
      return null;
    }

    try {
      const profile = await getUserProfile(supabaseUser.id);
      Logger.debug('Got user profile:', { profile });
      
      const userEmail = supabaseUser.email || profile?.email || '';
      const processedUser = {
        id: supabaseUser.id,
        email: userEmail,
        isAdmin: (profile?.isAdmin || false) || (userEmail === ADMIN_EMAIL),
        isSubscribed: profile?.isSubscribed || false,
      };
      
      Logger.debug('Processed user:', processedUser);
      return processedUser;
    } catch (error) {
      Logger.error('Error processing Supabase user:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    Logger.debug('Auth hook initialized');
    let isMounted = true;
    
    const fetchSession = async () => {
      try {
        Logger.debug('Fetching session');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!isMounted) {
          Logger.debug('Component unmounted during session fetch');
          return;
        }

        if (sessionError) {
          Logger.error('Session fetch error:', sessionError);
          setAuthError(sessionError);
        } else {
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
        }
      } catch (err) {
        Logger.error('Unexpected error during session fetch:', err);
        if (isMounted) {
          setAuthError(err instanceof AuthError ? err : new AuthError(err instanceof Error ? err.message : 'Unknown error'));
        }
      } finally {
        if (isMounted) {
          Logger.debug('Setting isLoading to false');
          setIsLoading(false);
        }
      }
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      Logger.debug('Auth state changed:', { event, hasSession: !!session });
      
      if (!isMounted) {
        Logger.debug('Component unmounted during auth state change');
        return;
      }

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
        if (isMounted) {
          setAuthError(err instanceof AuthError ? err : new AuthError(err instanceof Error ? err.message : 'Unknown error'));
        }
      }
    });

    return () => {
      Logger.debug('Auth hook cleanup');
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [processSupabaseUser]);

  useEffect(() => {
    Logger.getAuthStateLog(appUser, isLoading);
  }, [appUser, isLoading]);

  // Rest of your auth methods with added logging...
  const signIn = useCallback(async (email: string, password?: string) => {
    Logger.debug('Sign in attempt:', { email });
    setAuthError(null);
    try {
      const response = password 
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signInWithOtp({ email });
      
      if (response.error) {
        Logger.error('Sign in error:', response.error);
        setAuthError(response.error);
        return response.error;
      }
      
      Logger.info('Sign in successful');
      return null;
    } catch (error) {
      Logger.error('Unexpected sign in error:', error);
      const authError = error instanceof AuthError ? error : new AuthError('Unknown error during sign in');
      setAuthError(authError);
      return authError;
    }
  }, []);

  // Add similar logging to other auth methods...

  return { user: appUser, signIn, isLoading, authError, setAuthError };
};