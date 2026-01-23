import { createContext, useContext, useEffect, useState, useRef, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { sendWelcomeEmail } from "@/lib/emailService";
import type { User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  username: string;
  karma_points: number;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signInWithTwitter: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithGitHub: async () => {},
  signInWithTwitter: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const createProfile = async (userId: string) => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Generate username from email or metadata
      const username = 
        user.user_metadata?.username ||
        user.user_metadata?.name?.toLowerCase().replace(/\s+/g, '_') ||
        user.email?.split('@')[0] ||
        `user_${userId.slice(0, 8)}`;

      const { data, error } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          username: username,
          karma_points: 0,
          avatar_url: user.user_metadata?.avatar_url || null,
        })
        .select()
        .single();

      if (error) {
        // If profile already exists, try to load it
        if (error.code === '23505' || error.message?.includes('duplicate')) {
          console.log("Profile already exists, loading it...");
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("id, username, karma_points, avatar_url")
            .eq("id", userId)
            .single();
          
          if (existingProfile) {
            setProfile({
              ...existingProfile,
              karma_points: existingProfile.karma_points ?? 0,
            });
            console.log("✅ Existing profile loaded:", existingProfile.username);
            setLoading(false);
            return;
          }
        }
        throw error;
      }
      
      // Ensure karma_points is set
      const profileData = {
        ...data,
        karma_points: data.karma_points ?? 0,
      };
      
      setProfile(profileData);
      console.log("✅ New profile created:", profileData.username);

      // Migrate localStorage saves to database
      try {
        const { migrateLocalStorageSaves } = await import('@/lib/savedStacksMigration');
        await migrateLocalStorageSaves(userId);
      } catch (err) {
        console.log('LocalStorage migration skipped:', err);
      }

      // Send welcome email to new users
      if (user.email) {
        sendWelcomeEmail(user.email, username, userId).catch(err => {
          console.log('Welcome email not sent (service may not be configured):', err);
        });
      }
    } catch (error) {
      console.error("Error creating profile:", error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Track in-flight profile loading requests to prevent race conditions
  const loadingProfileRef = useRef<string | null>(null);

  const loadProfile = async (userId: string) => {
    // Prevent concurrent loads for the same user
    if (loadingProfileRef.current === userId) {
      console.log("Profile load already in progress for user:", userId);
      return;
    }

    loadingProfileRef.current = userId;

    try {
      setLoading(true);
      console.log("Loading profile for user:", userId);

      // Add timeout to catch hanging queries (3 seconds - reduced for faster UX)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile query timeout')), 3000)
      );

      const queryPromise = supabase
        .from("profiles")
        .select("id, username, karma_points, avatar_url")
        .eq("id", userId)
        .single();

      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      const { data, error } = result;

      if (error) {
        // Profile might not exist yet - create it
        if (error.code === 'PGRST116' || error.message?.includes('No rows') || error.message?.includes('not found')) {
          console.log("Profile not found, creating new profile...");
          await createProfile(userId);
          return;
        }
        
        // Query timeout
        if (error.message === 'Profile query timeout') {
          console.error("⏱️ Profile query timed out after 3 seconds");
          console.error("This usually means a database connection issue or RLS policy problem");
          setProfile(null);
          setLoading(false);
          return;
        }
        
        console.error("Error loading profile:", error);
        setProfile(null);
        setLoading(false);
        return;
      }
      
      // Ensure karma_points is a number (not null)
      const profileData = {
        ...data,
        karma_points: data.karma_points ?? 0,
      };
      
      console.log("✅ Profile loaded successfully:", profileData.username, `(${profileData.karma_points} karma)`);
      setProfile(profileData);
    } catch (error: any) {
      // Ignore AbortError (expected in React Strict Mode)
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        return;
      }
      
      if (error.message === 'Profile query timeout') {
        console.error("⏱️ Profile query timed out after 3 seconds");
        console.error("This usually means a database connection issue or RLS policy problem");
      } else {
        console.error("Error loading profile:", error);
      }
      setProfile(null);
    } finally {
      setLoading(false);
      // Clear the loading ref for this user
      if (loadingProfileRef.current === userId) {
        loadingProfileRef.current = null;
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    // Check active sessions
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return; // Don't update state if unmounted
        
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error: any) {
        // Ignore AbortError (expected in React Strict Mode)
        if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
          return;
        }
        console.error("Error checking session:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    checkSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return; // Don't update state if unmounted
      
      try {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      } catch (error: any) {
        // Ignore AbortError (expected in React Strict Mode)
        if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
          return;
        }
        console.error("Error in auth state change:", error);
      }
    });

    // Also listen for custom auth state change events
    const handleAuthStateChanged = () => {
      if (!isMounted) return;
      console.log("Auth state changed event received, refreshing session...");
      checkSession();
    };
    
    window.addEventListener('auth-state-changed', handleAuthStateChanged);

    return () => {
      isMounted = false; // Prevent state updates after unmount
      subscription.unsubscribe();
      window.removeEventListener('auth-state-changed', handleAuthStateChanged);
    };
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw error;
  };

  const signInWithGitHub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw error;
  };

  const signInWithTwitter = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = useCallback(async () => {
    if (user) {
      console.log('🔄 Refreshing profile after karma update...');
      await loadProfile(user.id);
    }
  }, [user]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    profile,
    loading,
    signInWithGoogle,
    signInWithGitHub,
    signInWithTwitter,
    signOut,
    refreshProfile
  }), [user, profile, loading, refreshProfile]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};