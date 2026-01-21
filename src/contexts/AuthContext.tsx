import { createContext, useContext, useEffect, useState } from "react";
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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithGitHub: async () => {},
  signInWithTwitter: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, karma_points, avatar_url")
        .eq("id", userId)
        .single();

      if (error) {
        // Profile might not exist yet for OAuth users - create it
        if (error.code === 'PGRST116') {
          await createProfile(userId);
          return;
        }
        throw error;
      }
      setProfile(data);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (userId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      
      if (!user) return;

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

      if (error) throw error;
      setProfile(data);

      // Send welcome email to new users
      if (user.email) {
        sendWelcomeEmail(user.email, username, userId).catch(err => {
          console.log('Welcome email not sent (service may not be configured):', err);
        });
      }
    } catch (error) {
      console.error("Error creating profile:", error);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signInWithGoogle,
      signInWithGitHub,
      signInWithTwitter,
      signOut 
    }}>
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