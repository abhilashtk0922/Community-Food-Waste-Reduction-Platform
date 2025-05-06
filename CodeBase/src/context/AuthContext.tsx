import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, getCurrentUser } from "../lib/supabase";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  error: null,
  refreshUser: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error loading profile:", error);
        return null;
      }

      return data;
    } catch (err) {
      console.error("Error in loadProfile:", err);
      return null;
    }
  };

  const refreshUser = async () => {
    try {
      setLoading(true);
      const { user, error } = await getCurrentUser();

      if (error) {
        throw error;
      }

      setUser(user);

      if (user) {
        const userProfile = await loadProfile(user.id);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
    } catch (err: any) {
      console.error("Error refreshing user:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
    } catch (err: any) {
      console.error("Error signing out:", err);
      setError(err.message);
    }
  };

  useEffect(() => {
    // Initial check for user session
    refreshUser();

    // Set up auth listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session && session.user) {
          setUser(session.user);
          const userProfile = await loadProfile(session.user.id);
          setProfile(userProfile);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    profile,
    loading,
    error,
    refreshUser,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
