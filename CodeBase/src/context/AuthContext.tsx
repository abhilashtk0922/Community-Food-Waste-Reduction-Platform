import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getCurrentUser } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  error: null,
  refreshUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const createProfile = async (userId: string, userData: any) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            full_name: userData.full_name || '',
            username: userData.username || '',
            account_type: userData.account_type || 'recipient',
            organization: userData.organization || '',
            address: userData.address || '',
            phone: userData.phone || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating profile:', error);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error('Error in createProfile:', err);
      return null;
    }
  };

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, create it
          const userData = await supabase.auth.getUser();
          if (userData.data.user) {
            return await createProfile(userId, userData.data.user.user_metadata);
          }
        }
        console.error('Error loading profile:', error);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error('Error in loadProfile:', err);
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
      console.error('Error refreshing user:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial check for user session
    refreshUser();
    
    // Set up auth listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && session.user) {
        setUser(session.user);
        const userProfile = await loadProfile(session.user.id);
        setProfile(userProfile);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}