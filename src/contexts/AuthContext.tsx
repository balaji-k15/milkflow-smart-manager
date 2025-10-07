import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: 'admin' | 'supplier' | null;
  loading: boolean;
  signIn: (phone: string, password: string) => Promise<void>;
  signUp: (phone: string, password: string, fullName: string, role: 'admin' | 'supplier') => Promise<void>;
  signOut: () => Promise<void>;
  sendOTP: (phone: string) => Promise<void>;
  verifyOTP: (phone: string, otp: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'supplier' | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event);
        
        // Handle token refresh failure
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.error('Token refresh failed, signing out');
          setSession(null);
          setUser(null);
          setUserRole(null);
          toast.error('Session expired. Please sign in again.');
          navigate('/auth');
          return;
        }

        // Handle sign out
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setUserRole(null);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user role when session changes
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setUserRole(data.role as 'admin' | 'supplier');
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const signIn = async (phone: string, password: string) => {
    // For phone auth, we need to format phone as email for Supabase
    const phoneEmail = `${phone}@milkflow.in`;
    
    const { error } = await supabase.auth.signInWithPassword({
      email: phoneEmail,
      password,
    });

    if (error) {
      toast.error(error.message);
      throw error;
    }

    toast.success('Successfully signed in!');
  };

  const signUp = async (
    phone: string,
    password: string,
    fullName: string,
    role: 'admin' | 'supplier'
  ) => {
    // Format phone as email for Supabase auth
    const phoneEmail = `${phone}@milkflow.in`;
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email: phoneEmail,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          phone: phone,
          role: role,
        },
      },
    });

    if (error) {
      toast.error(error.message);
      throw error;
    }

    toast.success('Account created successfully! You can now sign in.');
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast.error(error.message);
      throw error;
    }

    setUser(null);
    setSession(null);
    setUserRole(null);
    navigate('/auth');
    toast.success('Successfully signed out!');
  };

  const sendOTP = async (phone: string) => {
    const { data, error } = await supabase.functions.invoke('send-otp', {
      body: { phone }
    });

    if (error) {
      toast.error('Failed to send OTP');
      throw error;
    }

    toast.success('OTP sent to your mobile number');
  };

  const verifyOTP = async (phone: string, otp: string): Promise<boolean> => {
    const { data, error } = await supabase.functions.invoke('verify-otp', {
      body: { phone, otp }
    });

    if (error || !data?.success) {
      toast.error('Invalid or expired OTP');
      return false;
    }

    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userRole,
        loading,
        signIn,
        signUp,
        signOut,
        sendOTP,
        verifyOTP,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};