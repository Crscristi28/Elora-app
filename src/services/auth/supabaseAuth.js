// 🔐 Supabase Authentication Service
// Simple email auth implementation

import { supabase } from '../supabase/client.js';

class SupabaseAuthService {
  // Sign in with email and password
  async signInWithEmail(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      console.log('✅ User signed in:', data.user?.email);
      return { user: data.user, error: null };
    } catch (error) {
      console.error('❌ Sign in error:', error.message);
      return { user: null, error: error.message };
    }
  }

  // Sign up with email and password
  async signUpWithEmail(email, password) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      console.log('✅ User signed up:', data.user?.email);
      return { user: data.user, error: null };
    } catch (error) {
      console.error('❌ Sign up error:', error.message);
      return { user: null, error: error.message };
    }
  }

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      console.log('✅ User signed out');
      return { error: null };
    } catch (error) {
      console.error('❌ Sign out error:', error.message);
      return { error: error.message };
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('❌ Get user error:', error.message);
      return null;
    }
  }

  // Get current session
  async getSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('❌ Get session error:', error.message);
      return null;
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event);
      callback(event, session);
    });
    
    return subscription;
  }

  // Send OTP to email for password reset
  async sendPasswordResetOTP(email) {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Don't create new user if email doesn't exist
        }
      });
      
      if (error) throw error;
      
      console.log('✅ OTP sent to:', email);
      return { success: true, error: null };
    } catch (error) {
      console.error('❌ Send OTP error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Verify OTP for password recovery
  async verifyOTP(email, token) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'recovery'
      });
      
      if (error) throw error;
      
      console.log('✅ Password reset OTP verified for:', email);
      return { success: true, user: data.user, session: data.session, error: null };
    } catch (error) {
      console.error('❌ Password reset OTP verification error:', error.message);
      return { success: false, user: null, session: null, error: error.message };
    }
  }

  // Verify OTP for signup confirmation
  async verifySignupOTP(email, token) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup'
      });
      
      if (error) throw error;
      
      console.log('✅ Signup OTP verified for:', email);
      return { success: true, user: data.user, session: data.session, error: null };
    } catch (error) {
      console.error('❌ Signup OTP verification error:', error.message);
      return { success: false, user: null, session: null, error: error.message };
    }
  }

  // Update password for logged in user
  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      console.log('✅ Password updated successfully');
      return { success: true, error: null };
    } catch (error) {
      console.error('❌ Password update error:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const authService = new SupabaseAuthService();
export default authService;