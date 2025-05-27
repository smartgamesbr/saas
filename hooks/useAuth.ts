
import { useState, useEffect, useCallback } from 'react';
import { User as AppUser } from '../types'; // Renamed to avoid conflict with Supabase User
import { supabase, getUserProfile } from '../supabaseClient'; // Import Supabase client and profile helper
import { AuthError, Session, User as SupabaseUser, PostgrestError } from '@supabase/supabase-js';
import { ADMIN_EMAIL } from '../constants'; // Import ADMIN_EMAIL

export const useAuth = () => {
  console.log('useAuth: Hook initialized/re-rendered. Initial isLoading: true.');
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading true
  const [authError, setAuthError] = useState<AuthError | null>(null);
  
  const processSupabaseUser = useCallback(async (supabaseUser: SupabaseUser | null): Promise<AppUser | null> => {
    console.log('useAuth: processSupabaseUser called with supabaseUser:', supabaseUser);
    if (!supabaseUser) {
      console.log('useAuth: processSupabaseUser - no supabaseUser, returning null.');
      return null;
    }

    const profile = await getUserProfile(supabaseUser.id);
    console.log('useAuth: processSupabaseUser - getUserProfile result for', supabaseUser.id, ':', profile);
    
    const userEmail = supabaseUser.email || profile?.email || '';
    const processedUser = {
      id: supabaseUser.id,
      email: userEmail,
      isAdmin: (profile?.isAdmin || false) || (userEmail === ADMIN_EMAIL),
      isSubscribed: profile?.isSubscribed || false,
    };
    console.log('useAuth: processSupabaseUser - processed user:', processedUser);
    return processedUser;
  }, []);


  useEffect(() => {
    console.log('useAuth: Main useEffect started.');
    let isMounted = true;
    
    const fetchSession = async () => {
      console.log('useAuth: fetchSession started.');
      try {
        console.log('useAuth: supabase.auth.getSession() call started.');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('useAuth: supabase.auth.getSession() - session:', session, 'error:', sessionError);

        if (!isMounted) {
          console.log('useAuth: fetchSession - unmounted after getSession.');
          return;
        }

        if (sessionError) {
            console.error('useAuth: fetchSession - getSession error:', sessionError);
            if (isMounted) setAuthError(sessionError);
        } else {
            // getSession call was successful (sessionError is null)
            if (session?.user) {
                const processedUser = await processSupabaseUser(session.user);
                if (isMounted) {
                    setAppUser(processedUser);
                    setAuthError(null); // User processed, no error
                }
            } else { // getSession successful, but no user
                if (isMounted) {
                    setAppUser(null);
                    setAuthError(null); // No user, no error
                }
            }
        }
      } catch (err) { 
        if (isMounted) {
          console.error("useAuth: fetchSession - caught error during processing:", err);
          if (err instanceof AuthError) {
            setAuthError(err);
          } else if (err instanceof Error) {
            setAuthError(new AuthError(err.message));
          } else if (typeof err === 'string') {
            setAuthError(new AuthError(err));
          } else {
            setAuthError(new AuthError('Unknown error during session fetch.'));
          }
        }
      } finally {
        if (isMounted) {
          console.log('useAuth: fetchSession finally block. Current isLoading:', isLoading, '. Setting isLoading to false.');
          setIsLoading(false);
        } else {
          console.log('useAuth: fetchSession finally block - component unmounted before isLoading could be set to false.');
        }
      }
    };

    fetchSession();

    console.log('useAuth: Setting up onAuthStateChange listener.');
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) {
          console.log('useAuth: onAuthStateChange - unmounted.');
          return;
        }
        console.log('useAuth: onAuthStateChange triggered. Event:', _event, 'Has Session:', !!session);
        
        try {
          if (session?.user) {
            const processedUser = await processSupabaseUser(session.user);
            if (isMounted) {
              console.log('useAuth: Setting appUser (from onAuthStateChange) to:', processedUser);
              setAppUser(processedUser);
              setAuthError(null); 
            }
          } else { // No session.user (e.g. signed out)
            if (isMounted) {
              console.log('useAuth: Setting appUser (from onAuthStateChange) to null.');
              setAppUser(null);
              setAuthError(null); // No user, no error
            }
          }
        } catch (err) {
            if(isMounted) {
                console.error("useAuth: onAuthStateChange - caught error during processing:", err);
                setAuthError(err instanceof AuthError ? err : new AuthError(err instanceof Error ? err.message : 'Unknown error during auth state change.'));
            }
        }
      }
    );

    return () => {
      console.log('useAuth: Main useEffect cleanup. Unsubscribing authListener, isMounted = false.');
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [processSupabaseUser]); // processSupabaseUser is stable due to useCallback with empty deps

  useEffect(() => {
    console.log('useAuth: isLoading state changed to:', isLoading);
  }, [isLoading]);

  useEffect(() => {
    console.log('useAuth: appUser state changed to:', appUser);
  }, [appUser]);

  useEffect(() => {
    console.log('useAuth: authError state changed to:', authError);
  }, [authError]);


  const signIn = useCallback(async (email: string, password?: string) => {
    console.log('useAuth: signIn called for email:', email);
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
    console.log('useAuth: signIn response:', response);
    if (response.error) {
      setAuthError(response.error);
      return response.error;
    } 
    // If sign-in is successful, onAuthStateChange will handle setting appUser and clearing authError.
    return null; 
  }, []);

  const signUp = useCallback(async (email: string, password?: string) => {
    console.log('useAuth: signUp called for email:', email);
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
    console.log('useAuth: signUp response:', response);
    if (response.error) {
      setAuthError(response.error);
      return response.error;
    } else if (response.data.user) {
       console.log('useAuth: signUp successful for user:', response.data.user.id, 'Attempting client-side profile creation if needed.');
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
          console.log('useAuth: signUp - Profile not found for new user, creating...');
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
            // Set authError here as this is an issue post-signup but related to user setup.
            setAuthError(new AuthError(`Falha ao criar perfil: ${insertError.message}. O registro do usuário foi bem-sucedido.`));
          } else {
            console.log('useAuth: signUp - Profile created client-side successfully.');
          }
        } else {
            console.log('useAuth: signUp - Profile already exists for user.');
        }

       } catch (profileCreationError) {
           console.error("useAuth: signUp - Unexpected error during profile check/creation:", profileCreationError);
           setAuthError(new AuthError(profileCreationError instanceof Error ? profileCreationError.message : 'Erro inesperado no perfil.'));
       }
       // If sign-up is successful, onAuthStateChange will handle setting appUser and clearing authError.
    } else if (response.data.session === null && !response.error) {
        console.log("Sign up successful, user might need to confirm email (OTP sent).");
        // For OTP, onAuthStateChange will eventually reflect the new user state post-confirmation.
    }
    return null; 
  }, []);

  const signOut = useCallback(async () => {
    console.log('useAuth: signOut called.');
    // setAuthError(null); // onAuthStateChange will set it to null upon successful sign out.
    const { error } = await supabase.auth.signOut();
    console.log('useAuth: signOut response - error:', error);
    if (error) {
      setAuthError(error);
    }
    // If signOut is successful, onAuthStateChange will set appUser to null and authError to null.
  }, []);

  const subscribeUser = useCallback(async (): Promise<AuthError | null> => {
    console.log('useAuth: subscribeUser called.');
    if (!appUser) {
      const noUserError = new AuthError("Usuário não logado para assinar.");
      console.warn('useAuth: subscribeUser - No user logged in.');
      setAuthError(noUserError);
      return noUserError;
    }
    if (appUser.isAdmin) { 
        console.log('useAuth: subscribeUser - Admin user, no subscription needed.');
        return null;
    }

    setAuthError(null);
    const { error } = await supabase
      .from('profiles')
      .update({ is_subscribed: true, updated_at: new Date().toISOString() })
      .eq('id', appUser.id);
    
    if (error) { 
      console.error("Supabase subscribe error:", error);
      const profileUpdateError = new AuthError(`Falha ao atualizar o perfil durante a assinatura: ${error.message}`);
      setAuthError(profileUpdateError);
      return profileUpdateError;
    }

    console.log('useAuth: subscribeUser - Profile updated successfully. Setting appUser.');
    setAppUser(prev => prev ? { ...prev, isSubscribed: true } : null);
    return null;
  }, [appUser]);

  const resetPasswordForEmail = useCallback(async (email: string): Promise<{ error: AuthError | null }> => {
    console.log('useAuth: resetPasswordForEmail called for email:', email);
    setAuthError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#password-reset`, 
    });
    if (error) {
      console.error('useAuth: resetPasswordForEmail error:', error);
      setAuthError(error);
    }
    // No specific success state to set here, user gets an email.
    return { error };
  }, []);

  return { user: appUser, signIn, signUp, signOut, subscribe: subscribeUser, resetPasswordForEmail, isLoading, authError, setAuthError };
};
