// 👤 Profile Service - User profile management with Supabase
import { supabase, isSupabaseReady } from '../supabase/client.js';
import { authService } from '../auth/supabaseAuth.js';

class ProfileService {
  constructor() {
    console.log('👤 [PROFILE] ProfileService initialized');
    
    // Profile cache for performance optimization
    this.profileCache = null;
    this.cacheUserId = null;
  }

  // 🔐 Get current user ID for auth-scoped operations
  async getCurrentUserId() {
    try {
      const user = await authService.getCurrentUser();
      return user?.id || null;
    } catch (error) {
      console.error('❌ [PROFILE] Error getting current user:', error);
      return null;
    }
  }

  // 📥 Load user profile from Supabase
  async loadProfile() {
    if (!isSupabaseReady()) {
      console.warn('⚠️ [PROFILE] Supabase not configured - profile disabled');
      return { full_name: null, name: null };
    }

    const userId = await this.getCurrentUserId();
    if (!userId) {
      console.warn('👤 [PROFILE] User not authenticated - profile disabled');
      return { full_name: null, name: null };
    }

    try {
      console.log('📥 [PROFILE] Loading profile for user:', userId);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, name')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist yet - return empty
          console.log('📭 [PROFILE] No profile found, returning empty');
          return { full_name: null, name: null };
        }
        console.error('❌ [PROFILE] Error loading profile:', error);
        return { full_name: null, name: null };
      }

      console.log('✅ [PROFILE] Profile loaded:', { 
        full_name: profile.full_name, 
        name: profile.name 
      });
      
      return {
        full_name: profile.full_name || null,
        name: profile.name || null
      };

    } catch (error) {
      console.error('❌ [PROFILE] Error during profile load:', error);
      return { full_name: null, name: null };
    }
  }

  // 📤 Save user profile to Supabase
  async saveProfile(profileData) {
    if (!isSupabaseReady()) {
      console.warn('⚠️ [PROFILE] Supabase not configured - profile save disabled');
      throw new Error('Supabase configuration missing');
    }

    const userId = await this.getCurrentUserId();
    if (!userId) {
      console.warn('👤 [PROFILE] User not authenticated - profile save disabled');
      throw new Error('User authentication required for profile save');
    }

    try {
      console.log('📤 [PROFILE] Saving profile for user:', userId, profileData);

      // Prepare data for upsert
      const dataToSave = {
        id: userId,
        full_name: profileData.full_name || null,
        name: profileData.name || null,
        updated_at: new Date().toISOString()
      };

      const { data: profile, error } = await supabase
        .from('profiles')
        .upsert(dataToSave, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select('full_name, name')
        .single();

      if (error) {
        console.error('❌ [PROFILE] Error saving profile:', error);
        throw new Error(`Profile save failed: ${error.message}`);
      }

      console.log('✅ [PROFILE] Profile saved successfully:', profile);
      
      // Update cache with new profile data
      this.profileCache = {
        full_name: profile.full_name || null,
        name: profile.name || null
      };
      this.cacheUserId = userId;
      console.log('🔄 [PROFILE] Cache updated after save');
      
      return {
        full_name: profile.full_name || null,
        name: profile.name || null
      };

    } catch (error) {
      console.error('❌ [PROFILE] Error during profile save:', error);
      throw error;
    }
  }

  // 🚀 Private method to get cached profile data
  async _getCachedProfile() {
    const currentUserId = await this.getCurrentUserId();
    
    // Return cached profile if available for current user
    if (this.profileCache && this.cacheUserId === currentUserId) {
      console.log('💨 [PROFILE] Using cached profile data');
      return this.profileCache;
    }
    
    // Load from database and cache
    console.log('📥 [PROFILE] Loading and caching profile data');
    this.profileCache = await this.loadProfile();
    this.cacheUserId = currentUserId;
    return this.profileCache;
  }

  // 🎯 Get user name for AI personalization
  async getUserNameForAI() {
    try {
      const profile = await this._getCachedProfile();
      return profile.name || null;
    } catch (error) {
      console.error('❌ [PROFILE] Error getting name for AI:', error);
      return null;
    }
  }

  // 📋 Get full name for UI display  
  async getFullNameForUI() {
    try {
      const profile = await this._getCachedProfile();
      return profile.full_name || null;
    } catch (error) {
      console.error('❌ [PROFILE] Error getting full name for UI:', error);
      return null;
    }
  }
}

// Export singleton instance
export const profileService = new ProfileService();
export default profileService;