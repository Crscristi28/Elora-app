// ============================================
// 📋 CONSENT SERVICE
// ============================================
// Manages user consent tracking for Terms of Service and Privacy Policy
// GDPR Compliance: Tracks explicit user consent with timestamps and versions
//
// Usage:
//   import { consentService } from './services/consent/consentService';
//   const needsConsent = await consentService.needsTermsConsent();
//   await consentService.acceptTerms('v1.0');
// ============================================

import { supabase, isSupabaseReady } from '../supabase/client.js';
import { authService } from '../auth/supabaseAuth.js';

// ============================================
// 💾 LOCALSTORAGE CACHE KEY
// ============================================
const STORAGE_KEY = 'elora-consent';

class ConsentService {
  constructor() {
    console.log('📋 [CONSENT] ConsentService initialized');
  }

  // ============================================
  // 💾 LOCALSTORAGE CACHE METHODS
  // ============================================

  /**
   * Save consent status to localStorage for offline access
   * @private
   * @param {Object} consentStatus - Consent status object
   */
  _saveToLocalStorage(consentStatus) {
    try {
      const cacheData = {
        ...consentStatus,
        cached_at: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));
      console.log('💾 [CONSENT] Saved to localStorage:', {
        has_terms: !!consentStatus.terms_accepted_at,
        has_privacy: !!consentStatus.privacy_policy_accepted_at,
        cached_at: cacheData.cached_at
      });
    } catch (error) {
      console.error('❌ [CONSENT] Failed to save to localStorage:', error);
    }
  }

  /**
   * Load consent status from localStorage
   * @private
   * @returns {Object|null} Cached consent status or null if not found
   */
  _loadFromLocalStorage() {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        console.log('💾 [CONSENT] Loaded from localStorage:', {
          has_terms: !!data.terms_accepted_at,
          has_privacy: !!data.privacy_policy_accepted_at,
          cached_at: data.cached_at
        });
        return data;
      }
    } catch (error) {
      console.error('❌ [CONSENT] Failed to load from localStorage:', error);
    }
    return null;
  }

  /**
   * Clear consent cache from localStorage (e.g., on sign out)
   * @public
   */
  clearLocalStorageCache() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('🧹 [CONSENT] Cleared localStorage cache');
    } catch (error) {
      console.error('❌ [CONSENT] Failed to clear localStorage:', error);
    }
  }

  // ============================================
  // 🔐 AUTHENTICATION HELPERS
  // ============================================

  /**
   * Get current authenticated user ID
   * @returns {Promise<string|null>} User ID or null if not authenticated
   */
  async getCurrentUserId() {
    try {
      const user = await authService.getCurrentUser();
      return user?.id || null;
    } catch (error) {
      console.error('❌ [CONSENT] Error getting current user:', error);
      return null;
    }
  }

  // ============================================
  // 📥 LOAD CONSENT STATUS
  // ============================================

  /**
   * Load user's consent status from profiles table
   * Strategy: localStorage-first (fast, offline-safe), Supabase-fallback (source of truth)
   * @param {string} userId - Optional user ID (uses current user if not provided)
   * @returns {Promise<Object>} Consent status object with terms_accepted_at, terms_version, etc.
   */
  async getConsentStatus(userId = null) {
    // 1️⃣ FIRST: Try localStorage (fast, offline-safe)
    const cached = this._loadFromLocalStorage();
    if (cached && cached.terms_accepted_at) {
      console.log('✅ [CONSENT] Using cached consent from localStorage (skip Supabase)');
      return {
        terms_accepted_at: cached.terms_accepted_at,
        terms_version: cached.terms_version,
        privacy_policy_accepted_at: cached.privacy_policy_accepted_at,
        privacy_policy_version: cached.privacy_policy_version
      };
    }

    console.log('📥 [CONSENT] localStorage miss - fetching from Supabase');

    // 2️⃣ FALLBACK: Fetch from Supabase
    if (!isSupabaseReady()) {
      console.warn('⚠️ [CONSENT] Supabase not configured - consent tracking disabled');
      return {
        terms_accepted_at: null,
        terms_version: null,
        privacy_policy_accepted_at: null,
        privacy_policy_version: null
      };
    }

    const targetUserId = userId || await this.getCurrentUserId();
    if (!targetUserId) {
      console.warn('👤 [CONSENT] User not authenticated');
      return {
        terms_accepted_at: null,
        terms_version: null,
        privacy_policy_accepted_at: null,
        privacy_policy_version: null
      };
    }

    try {
      console.log('📥 [CONSENT] Loading consent status from Supabase for user:', targetUserId);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('terms_accepted_at, terms_version, privacy_policy_accepted_at, privacy_policy_version')
        .eq('id', targetUserId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found - return empty consent status
          console.log('📭 [CONSENT] No profile found, returning empty consent');
          return {
            terms_accepted_at: null,
            terms_version: null,
            privacy_policy_accepted_at: null,
            privacy_policy_version: null
          };
        }
        console.error('❌ [CONSENT] Error loading consent status:', error);
        return {
          terms_accepted_at: null,
          terms_version: null,
          privacy_policy_accepted_at: null,
          privacy_policy_version: null
        };
      }

      const consentStatus = {
        terms_accepted_at: profile.terms_accepted_at,
        terms_version: profile.terms_version,
        privacy_policy_accepted_at: profile.privacy_policy_accepted_at,
        privacy_policy_version: profile.privacy_policy_version
      };

      console.log('✅ [CONSENT] Consent status loaded from Supabase:', {
        has_terms: !!consentStatus.terms_accepted_at,
        terms_version: consentStatus.terms_version,
        has_privacy: !!consentStatus.privacy_policy_accepted_at,
        privacy_version: consentStatus.privacy_policy_version
      });

      // 3️⃣ Save to localStorage for next time (if consent exists)
      if (consentStatus.terms_accepted_at) {
        this._saveToLocalStorage(consentStatus);
      }

      return consentStatus;

    } catch (error) {
      console.error('❌ [CONSENT] Error during consent status load:', error);
      return {
        terms_accepted_at: null,
        terms_version: null,
        privacy_policy_accepted_at: null,
        privacy_policy_version: null
      };
    }
  }

  // ============================================
  // ✅ CHECK CONSENT
  // ============================================

  /**
   * Check if user needs to accept Terms of Service
   * @param {string} userId - Optional user ID (uses current user if not provided)
   * @returns {Promise<boolean>} True if user needs to accept terms, false if already accepted
   */
  async needsTermsConsent(userId = null) {
    const consentStatus = await this.getConsentStatus(userId);
    const needsConsent = !consentStatus.terms_accepted_at;

    console.log('🔍 [CONSENT] Needs terms consent:', needsConsent);
    return needsConsent;
  }

  /**
   * Check if user needs to accept Privacy Policy
   * @param {string} userId - Optional user ID (uses current user if not provided)
   * @returns {Promise<boolean>} True if user needs to accept privacy policy
   */
  async needsPrivacyConsent(userId = null) {
    const consentStatus = await this.getConsentStatus(userId);
    const needsConsent = !consentStatus.privacy_policy_accepted_at;

    console.log('🔍 [CONSENT] Needs privacy consent:', needsConsent);
    return needsConsent;
  }

  /**
   * Check if user needs to accept ANY consent (terms OR privacy)
   * @param {string} userId - Optional user ID (uses current user if not provided)
   * @returns {Promise<boolean>} True if user needs to accept any consent
   */
  async needsAnyConsent(userId = null) {
    const consentStatus = await this.getConsentStatus(userId);
    const needsAny = !consentStatus.terms_accepted_at || !consentStatus.privacy_policy_accepted_at;

    console.log('🔍 [CONSENT] Needs any consent:', needsAny);
    return needsAny;
  }

  // ============================================
  // 📤 SAVE CONSENT
  // ============================================

  /**
   * Record user's acceptance of Terms of Service
   * @param {string} version - Terms version being accepted (e.g., 'v1.0', '2025-11-02')
   * @param {string} userId - Optional user ID (uses current user if not provided)
   * @returns {Promise<boolean>} True if saved successfully, false otherwise
   */
  async acceptTerms(version = 'v1.0', userId = null) {
    if (!isSupabaseReady()) {
      console.warn('⚠️ [CONSENT] Supabase not configured');
      throw new Error('Supabase configuration missing');
    }

    const targetUserId = userId || await this.getCurrentUserId();
    if (!targetUserId) {
      console.warn('👤 [CONSENT] User not authenticated');
      throw new Error('User authentication required');
    }

    try {
      console.log('📤 [CONSENT] Recording terms acceptance:', {
        user: targetUserId,
        version: version,
        timestamp: new Date().toISOString()
      });

      const { error } = await supabase
        .from('profiles')
        .update({
          terms_accepted_at: new Date().toISOString(),
          terms_version: version
        })
        .eq('id', targetUserId);

      if (error) {
        throw new Error(`Terms consent save failed: ${error.message}`);
      }

      console.log('✅ [CONSENT] Terms acceptance recorded successfully');
      return true;

    } catch (error) {
      console.error('❌ [CONSENT] Error saving terms consent:', error);
      throw error;
    }
  }

  /**
   * Record user's acceptance of Privacy Policy
   * @param {string} version - Privacy policy version being accepted
   * @param {string} userId - Optional user ID (uses current user if not provided)
   * @returns {Promise<boolean>} True if saved successfully, false otherwise
   */
  async acceptPrivacyPolicy(version = 'v1.0', userId = null) {
    if (!isSupabaseReady()) {
      console.warn('⚠️ [CONSENT] Supabase not configured');
      throw new Error('Supabase configuration missing');
    }

    const targetUserId = userId || await this.getCurrentUserId();
    if (!targetUserId) {
      console.warn('👤 [CONSENT] User not authenticated');
      throw new Error('User authentication required');
    }

    try {
      console.log('📤 [CONSENT] Recording privacy policy acceptance:', {
        user: targetUserId,
        version: version,
        timestamp: new Date().toISOString()
      });

      const { error } = await supabase
        .from('profiles')
        .update({
          privacy_policy_accepted_at: new Date().toISOString(),
          privacy_policy_version: version
        })
        .eq('id', targetUserId);

      if (error) {
        throw new Error(`Privacy consent save failed: ${error.message}`);
      }

      console.log('✅ [CONSENT] Privacy policy acceptance recorded successfully');
      return true;

    } catch (error) {
      console.error('❌ [CONSENT] Error saving privacy consent:', error);
      throw error;
    }
  }

  /**
   * Record user's acceptance of BOTH Terms and Privacy Policy
   * (Most common use case - user accepts both at once)
   * @param {string} termsVersion - Terms version being accepted
   * @param {string} privacyVersion - Privacy policy version being accepted (defaults to same as terms)
   * @param {string} userId - Optional user ID (uses current user if not provided)
   * @returns {Promise<boolean>} True if saved successfully, false otherwise
   */
  async acceptAll(termsVersion = 'v1.0', privacyVersion = null, userId = null) {
    if (!isSupabaseReady()) {
      console.warn('⚠️ [CONSENT] Supabase not configured');
      throw new Error('Supabase configuration missing');
    }

    const targetUserId = userId || await this.getCurrentUserId();
    if (!targetUserId) {
      console.warn('👤 [CONSENT] User not authenticated');
      throw new Error('User authentication required');
    }

    const actualPrivacyVersion = privacyVersion || termsVersion;

    try {
      console.log('📤 [CONSENT] Recording full consent acceptance:', {
        user: targetUserId,
        terms_version: termsVersion,
        privacy_version: actualPrivacyVersion,
        timestamp: new Date().toISOString()
      });

      const timestamp = new Date().toISOString();

      const { error } = await supabase
        .from('profiles')
        .update({
          terms_accepted_at: timestamp,
          terms_version: termsVersion,
          privacy_policy_accepted_at: timestamp,
          privacy_policy_version: actualPrivacyVersion
        })
        .eq('id', targetUserId);

      if (error) {
        throw new Error(`Full consent save failed: ${error.message}`);
      }

      console.log('✅ [CONSENT] Full consent acceptance recorded to Supabase');

      // 🆕 Save to localStorage for offline access and faster future checks
      const consentStatus = {
        terms_accepted_at: timestamp,
        terms_version: termsVersion,
        privacy_policy_accepted_at: timestamp,
        privacy_policy_version: actualPrivacyVersion
      };
      this._saveToLocalStorage(consentStatus);

      return true;

    } catch (error) {
      console.error('❌ [CONSENT] Error saving full consent:', error);
      throw error;
    }
  }

  // ============================================
  // 🧹 REVOKE CONSENT (for testing/admin)
  // ============================================

  /**
   * Revoke all consents (set to NULL)
   * WARNING: Only use for testing or admin purposes
   * @param {string} userId - Optional user ID (uses current user if not provided)
   * @returns {Promise<boolean>} True if revoked successfully
   */
  async revokeAllConsents(userId = null) {
    if (!isSupabaseReady()) {
      console.warn('⚠️ [CONSENT] Supabase not configured');
      throw new Error('Supabase configuration missing');
    }

    const targetUserId = userId || await this.getCurrentUserId();
    if (!targetUserId) {
      console.warn('👤 [CONSENT] User not authenticated');
      throw new Error('User authentication required');
    }

    try {
      console.log('🧹 [CONSENT] Revoking all consents for user:', targetUserId);

      const { error } = await supabase
        .from('profiles')
        .update({
          terms_accepted_at: null,
          terms_version: null,
          privacy_policy_accepted_at: null,
          privacy_policy_version: null
        })
        .eq('id', targetUserId);

      if (error) {
        throw new Error(`Consent revocation failed: ${error.message}`);
      }

      console.log('✅ [CONSENT] All consents revoked successfully');
      return true;

    } catch (error) {
      console.error('❌ [CONSENT] Error revoking consents:', error);
      throw error;
    }
  }
}

// ============================================
// EXPORT SINGLETON INSTANCE
// ============================================

export const consentService = new ConsentService();
export default consentService;
