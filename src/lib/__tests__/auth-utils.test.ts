import {
  getCurrentUser,
  requireAuth,
  requirePremium,
  canUserSearch,
  getSubscriptionStatus,
  formatSubscriptionPeriod,
} from '../auth-utils';
import { getServerSession } from 'next-auth';
import { User } from '../../../lib/auth';

// Mock dependencies
jest.mock('next-auth');
jest.mock('../../../lib/auth');

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('Auth Utils', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should return user from session', async () => {
      const mockUser = createMockUser();
      mockGetServerSession.mockResolvedValueOnce({
        user: mockUser,
        expires: '2024-12-31',
      });

      const result = await getCurrentUser();

      expect(result).toEqual(mockUser);
    });

    it('should return null if no session', async () => {
      mockGetServerSession.mockResolvedValueOnce(null);

      const result = await getCurrentUser();

      expect(result).toBeNull();
    });

    it('should return null if session has no user', async () => {
      mockGetServerSession.mockResolvedValueOnce({
        expires: '2024-12-31',
      });

      const result = await getCurrentUser();

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      mockGetServerSession.mockRejectedValueOnce(new Error('Session error'));

      const result = await getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('requireAuth', () => {
    it('should return user if authenticated', async () => {
      const mockUser = createMockUser();
      mockGetServerSession.mockResolvedValueOnce({
        user: mockUser,
        expires: '2024-12-31',
      });

      const result = await requireAuth();

      expect(result).toEqual(mockUser);
    });

    it('should throw error if not authenticated', async () => {
      mockGetServerSession.mockResolvedValueOnce(null);

      await expect(requireAuth()).rejects.toThrow('Authentication required');
    });
  });

  describe('requirePremium', () => {
    it('should return user if premium', async () => {
      const mockUser = createMockUser({
        subscription: { status: 'premium', cancelAtPeriodEnd: false },
      });
      mockGetServerSession.mockResolvedValueOnce({
        user: mockUser,
        expires: '2024-12-31',
      });

      const result = await requirePremium();

      expect(result).toEqual(mockUser);
    });

    it('should throw error if not authenticated', async () => {
      mockGetServerSession.mockResolvedValueOnce(null);

      await expect(requirePremium()).rejects.toThrow('Authentication required');
    });

    it('should throw error if not premium', async () => {
      const mockUser = createMockUser({
        subscription: { status: 'free', cancelAtPeriodEnd: false },
      });
      mockGetServerSession.mockResolvedValueOnce({
        user: mockUser,
        expires: '2024-12-31',
      });

      await expect(requirePremium()).rejects.toThrow('Premium subscription required');
    });
  });

  describe('canUserSearch', () => {
    it('should allow search for authenticated user', async () => {
      const mockUser = createMockUser({
        subscription: { status: 'free', cancelAtPeriodEnd: false },
        searchCount: 10,
      });
      mockGetServerSession.mockResolvedValueOnce({
        user: mockUser,
        expires: '2024-12-31',
      });

      const result = await canUserSearch();

      expect(result).toEqual({
        canSearch: true,
        remainingSearches: -1, // Unlimited for all users now
        isPremium: false,
      });
    });

    it('should allow search for premium user', async () => {
      const mockUser = createMockUser({
        subscription: { status: 'premium', cancelAtPeriodEnd: false },
        searchCount: 50,
      });
      mockGetServerSession.mockResolvedValueOnce({
        user: mockUser,
        expires: '2024-12-31',
      });

      const result = await canUserSearch();

      expect(result).toEqual({
        canSearch: true,
        remainingSearches: -1,
        isPremium: true,
      });
    });

    it('should deny search for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValueOnce(null);

      const result = await canUserSearch();

      expect(result).toEqual({
        canSearch: false,
        remainingSearches: 0,
        isPremium: false,
      });
    });
  });

  describe('getSubscriptionStatus', () => {
    it('should return premium status for premium user', () => {
      const mockUser = createMockUser({
        subscription: { status: 'premium', cancelAtPeriodEnd: false },
      });

      const result = getSubscriptionStatus(mockUser);

      expect(result).toEqual({
        isPremium: true,
        isCancelled: false,
        isFree: false,
        status: 'premium',
      });
    });

    it('should return cancelled status for cancelled user', () => {
      const mockUser = createMockUser({
        subscription: { status: 'cancelled', cancelAtPeriodEnd: true },
      });

      const result = getSubscriptionStatus(mockUser);

      expect(result).toEqual({
        isPremium: false,
        isCancelled: true,
        isFree: false,
        status: 'cancelled',
      });
    });

    it('should return free status for free user', () => {
      const mockUser = createMockUser({
        subscription: { status: 'free', cancelAtPeriodEnd: false },
      });

      const result = getSubscriptionStatus(mockUser);

      expect(result).toEqual({
        isPremium: false,
        isCancelled: false,
        isFree: true,
        status: 'free',
      });
    });

    it('should return free status for null user', () => {
      const result = getSubscriptionStatus(null);

      expect(result).toEqual({
        isPremium: false,
        isCancelled: false,
        isFree: true,
        status: 'free',
      });
    });
  });

  describe('formatSubscriptionPeriod', () => {
    it('should format subscription period dates', () => {
      const mockUser = createMockUser({
        subscription: {
          status: 'premium',
          cancelAtPeriodEnd: false,
          currentPeriodStart: new Date('2024-01-01'),
          currentPeriodEnd: new Date('2024-02-01'),
        },
      });

      const result = formatSubscriptionPeriod(mockUser);

      expect(result.currentPeriodStart).toBe('2024/1/1');
      expect(result.currentPeriodEnd).toBe('2024/2/1');
      expect(result.daysUntilRenewal).toBeGreaterThanOrEqual(0);
    });

    it('should return null values for user without period dates', () => {
      const mockUser = createMockUser({
        subscription: {
          status: 'free',
          cancelAtPeriodEnd: false,
        },
      });

      const result = formatSubscriptionPeriod(mockUser);

      expect(result).toEqual({
        currentPeriodStart: null,
        currentPeriodEnd: null,
        daysUntilRenewal: null,
      });
    });

    it('should calculate days until renewal correctly', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);

      const mockUser = createMockUser({
        subscription: {
          status: 'premium',
          cancelAtPeriodEnd: false,
          currentPeriodStart: new Date('2024-01-01'),
          currentPeriodEnd: futureDate,
        },
      });

      const result = formatSubscriptionPeriod(mockUser);

      expect(result.daysUntilRenewal).toBe(15);
    });

    it('should return 0 days for past renewal date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const mockUser = createMockUser({
        subscription: {
          status: 'premium',
          cancelAtPeriodEnd: false,
          currentPeriodStart: new Date('2024-01-01'),
          currentPeriodEnd: pastDate,
        },
      });

      const result = formatSubscriptionPeriod(mockUser);

      expect(result.daysUntilRenewal).toBe(0);
    });
  });
});