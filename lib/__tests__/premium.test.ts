import {
  isPremiumUser,
  canAccessPremiumFeature,
  hasSearchLimitReached,
  getRemainingSearches,
  checkPremiumFeatureAccess,
} from '../premium';
import { User } from '../auth';

describe('Premium Functions', () => {
  const createMockUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    subscription: {
      status: 'free',
      cancelAtPeriodEnd: false,
    },
    searchCount: 0,
    searchCountResetDate: new Date(),
    ...overrides,
  });

  describe('isPremiumUser', () => {
    it('should return true for premium user', () => {
      const user = createMockUser({
        subscription: { status: 'premium', cancelAtPeriodEnd: false },
      });

      expect(isPremiumUser(user)).toBe(true);
    });

    it('should return false for free user', () => {
      const user = createMockUser({
        subscription: { status: 'free', cancelAtPeriodEnd: false },
      });

      expect(isPremiumUser(user)).toBe(false);
    });

    it('should return false for cancelled user', () => {
      const user = createMockUser({
        subscription: { status: 'cancelled', cancelAtPeriodEnd: true },
      });

      expect(isPremiumUser(user)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(isPremiumUser(null)).toBe(false);
    });
  });

  describe('canAccessPremiumFeature', () => {
    it('should return true for premium user', () => {
      const user = createMockUser({
        subscription: { status: 'premium', cancelAtPeriodEnd: false },
      });

      expect(canAccessPremiumFeature(user)).toBe(true);
    });

    it('should return false for non-premium user', () => {
      const user = createMockUser({
        subscription: { status: 'free', cancelAtPeriodEnd: false },
      });

      expect(canAccessPremiumFeature(user)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(canAccessPremiumFeature(null)).toBe(false);
    });
  });

  describe('hasSearchLimitReached', () => {
    it('should return false for premium user regardless of search count', () => {
      const user = createMockUser({
        subscription: { status: 'premium', cancelAtPeriodEnd: false },
        searchCount: 50,
      });

      expect(hasSearchLimitReached(user)).toBe(false);
    });

    it('should return true for free user with 30+ searches', () => {
      const user = createMockUser({
        subscription: { status: 'free', cancelAtPeriodEnd: false },
        searchCount: 30,
      });

      expect(hasSearchLimitReached(user)).toBe(true);
    });

    it('should return false for free user with less than 30 searches', () => {
      const user = createMockUser({
        subscription: { status: 'free', cancelAtPeriodEnd: false },
        searchCount: 25,
      });

      expect(hasSearchLimitReached(user)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(hasSearchLimitReached(null)).toBe(false);
    });
  });

  describe('getRemainingSearches', () => {
    it('should return Infinity for premium user', () => {
      const user = createMockUser({
        subscription: { status: 'premium', cancelAtPeriodEnd: false },
        searchCount: 25,
      });

      expect(getRemainingSearches(user)).toBe(Infinity);
    });

    it('should return correct remaining searches for free user', () => {
      const user = createMockUser({
        subscription: { status: 'free', cancelAtPeriodEnd: false },
        searchCount: 25,
      });

      expect(getRemainingSearches(user)).toBe(5);
    });

    it('should return 0 when search limit is reached', () => {
      const user = createMockUser({
        subscription: { status: 'free', cancelAtPeriodEnd: false },
        searchCount: 35,
      });

      expect(getRemainingSearches(user)).toBe(0);
    });

    it('should return 0 for null user', () => {
      expect(getRemainingSearches(null)).toBe(0);
    });
  });

  describe('checkPremiumFeatureAccess', () => {
    describe('for unauthenticated user', () => {
      it('should deny access and redirect to signin', () => {
        const result = checkPremiumFeatureAccess(null, 'favorites');

        expect(result).toEqual({
          hasAccess: false,
          reason: 'not_authenticated',
          upgradeUrl: '/auth/signin',
        });
      });
    });

    describe('for unlimited_search feature', () => {
      it('should allow access for free user under limit', () => {
        const user = createMockUser({
          subscription: { status: 'free', cancelAtPeriodEnd: false },
          searchCount: 25,
        });

        const result = checkPremiumFeatureAccess(user, 'unlimited_search');

        expect(result).toEqual({
          hasAccess: true,
        });
      });

      it('should deny access for free user over limit', () => {
        const user = createMockUser({
          subscription: { status: 'free', cancelAtPeriodEnd: false },
          searchCount: 30,
        });

        const result = checkPremiumFeatureAccess(user, 'unlimited_search');

        expect(result).toEqual({
          hasAccess: false,
          reason: 'search_limit_reached',
          upgradeUrl: '/pricing',
        });
      });

      it('should allow access for premium user', () => {
        const user = createMockUser({
          subscription: { status: 'premium', cancelAtPeriodEnd: false },
          searchCount: 50,
        });

        const result = checkPremiumFeatureAccess(user, 'unlimited_search');

        expect(result).toEqual({
          hasAccess: true,
        });
      });
    });

    describe('for premium features', () => {
      const premiumFeatures = ['favorites', 'nutrition_calculator', 'pdf_export', 'shopping_list'] as const;

      premiumFeatures.forEach((feature) => {
        it(`should allow access to ${feature} for premium user`, () => {
          const user = createMockUser({
            subscription: { status: 'premium', cancelAtPeriodEnd: false },
          });

          const result = checkPremiumFeatureAccess(user, feature);

          expect(result).toEqual({
            hasAccess: true,
          });
        });

        it(`should deny access to ${feature} for free user`, () => {
          const user = createMockUser({
            subscription: { status: 'free', cancelAtPeriodEnd: false },
          });

          const result = checkPremiumFeatureAccess(user, feature);

          expect(result).toEqual({
            hasAccess: false,
            reason: 'not_premium',
            upgradeUrl: '/pricing',
          });
        });

        it(`should deny access to ${feature} for cancelled user`, () => {
          const user = createMockUser({
            subscription: { status: 'cancelled', cancelAtPeriodEnd: true },
          });

          const result = checkPremiumFeatureAccess(user, feature);

          expect(result).toEqual({
            hasAccess: false,
            reason: 'not_premium',
            upgradeUrl: '/pricing',
          });
        });
      });
    });
  });
});