import { useState, useEffect, useCallback } from 'react';
import { User as AppUser } from '../types';
import { supabase, getUserProfile } from '../supabaseClient';
import { AuthError, User as SupabaseUser } from '@supabase/supabase-js';
import { ADMIN_EMAIL } from '../constants';

export const useAuth = () => {
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  
  const processSupabaseUser = useCallback(async (supabaseUser: SupabaseUser | null): Promise<AppUser | null> => {
    if (!supabaseUser) {
      return null;
    }

    const profile = await getUserProfile(supabaseUser.id);
    
    const userEmail = supabaseUser.email || profile?.email || '';
    return {
      id: supabaseUser.id,
      email: userEmail,
      isAdmin: (profile?.isAdmin || false) || (userEmail === ADMIN_EMAIL),
      isSubscribed: profile?.isSubscribed || false,
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const fetchSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (sessionError) {
          setAuthError(sessionError);
        } else {
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
        }
      } catch (err) {
        if (isMounted) {
          if (err instanceof AuthError) {
            setAuthError(err);
          } else if (err instanceof Error) {
            setAuthError(new AuthError(err.message));
          } else {
            setAuthError(new AuthError('Unknown error during session fetch.'));
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
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
          if(isMounted) {
            setAuthError(err instanceof AuthError ? err : new AuthError(err instanceof Error ? err.message : 'Unknown error during auth state change.'));
          }
        }
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [processSupabaseUser]);

  const signIn = useCallback(async (email: string, password?: string) => {
    setAuthError(null);
    let response;
    if (password) {
      response = await supabase.auth.signInWithPassword({ email, password });
    } else {
      response = await supabase.auth.signInWithOtp({ 
        email,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });
    }
    if (response.error) {
      setAuthError(response.error);
      return response.error;
    }
    return null;
  }, []);

  const signUp = useCallback(async (email: string, password?: string) => {
    setAuthError(null);
    
    let response;
    if (password) {
      response = await supabase.auth.signUp({ email, password });
    } else {
      response = await supabase.auth.signInWithOtp({ 
        email,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });
    }
    if (response.error) {
      setAuthError(response.error);
      return response.error;
    } else if (response.data.user) {
      try {
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', response.data.user.id)
          .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Error checking existing profile:", profileError);
        }
        
        if (!existingProfile) {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({ 
              id: response.data.user.id,
              email: response.data.user.email,
              is_admin: response.data.user.email === ADMIN_EMAIL,
              is_subscribed: false,
              updated_at: new Date().toISOString()
            });
          if (insertError) {
            console.error("Error creating profile client-side:", insertError);
            setAuthError(new AuthError(`Failed to create profile: ${insertError.message}. User registration was successful.`));
          }
        }
      } catch (profileCreationError) {
        console.error("Unexpected error during profile check/creation:", profileCreationError);
        setAuthError(new AuthError(profileCreationError instanceof Error ? profileCreationError.message : 'Unexpected profile error.'));
      }
    }
    return null;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(error);
    }
  }, []);

  const subscribe = useCallback(async (): Promise<AuthError | null> => {
    if (!appUser) {
      const noUserError = new AuthError("No user logged in to subscribe.");
      setAuthError(noUserError);
      return noUserError;
    }
    if (appUser.isAdmin) {
      return null;
    }

    setAuthError(null);
    const { error } = await supabase
      .from('profiles')
      .update({ is_subscribed: true, updated_at: new Date().toISOString() })
      .eq('id', appUser.id);
    
    if (error) {
      const profileUpdateError = new AuthError(`Failed to update profile during subscription: ${error.message}`);
      setAuthError(profileUpdateError);
      return profileUpdateError;
    }

    setAppUser(prev => prev ? { ...prev, isSubscribed: true } : null);
    return null;
  }, [appUser]);

  const resetPasswordForEmail = useCallback(async (email: string): Promise<{ error: AuthError | null }> => {
    setAuthError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#password-reset`,
    });
    if (error) {
      setAuthError(error);
    }
    return { error };
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