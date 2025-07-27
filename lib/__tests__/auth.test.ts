import { createUser, getUserById, updateUserSearchCount, updateUserSubscription } from '../auth';
import { getDatabase } from '../database';
import bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('../database');
jest.mock('bcryptjs');

const mockDb = {
  get: jest.fn(),
  run: jest.fn(),
  all: jest.fn(),
};

const mockGetDatabase = getDatabase as jest.MockedFunction<typeof getDatabase>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('Auth Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDatabase.mockResolvedValue(mockDb as any);
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      mockDb.get.mockResolvedValueOnce(null); // No existing user
      mockBcrypt.hash.mockResolvedValueOnce('hashed-password');
      mockDb.run.mockResolvedValueOnce(undefined);

      const userId = await createUser(userData);

      expect(userId).toBeDefined();
      expect(mockDb.get).toHaveBeenCalledWith(
        'SELECT id FROM users WHERE email = ?',
        [userData.email]
      );
      expect(mockBcrypt.hash).toHaveBeenCalledWith(userData.password, 12);
      expect(mockDb.run).toHaveBeenCalledTimes(2); // User and subscription creation
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
      };

      mockDb.get.mockResolvedValueOnce({ id: 'existing-user-id' });

      await expect(createUser(userData)).rejects.toThrow('User already exists');
    });

    it('should throw error for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
      };

      await expect(createUser(userData)).rejects.toThrow('Invalid user data');
    });

    it('should throw error for short password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
      };

      await expect(createUser(userData)).rejects.toThrow('Invalid user data');
    });
  });

  describe('getUserById', () => {
    it('should return user with subscription data', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        search_count: 5,
        search_count_reset_date: '2024-01-01T00:00:00.000Z',
      };

      const mockSubscription = {
        status: 'premium',
        stripe_customer_id: 'cus_123',
        stripe_subscription_id: 'sub_123',
        current_period_start: '2024-01-01T00:00:00.000Z',
        current_period_end: '2024-02-01T00:00:00.000Z',
        cancel_at_period_end: false,
      };

      mockDb.get
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockSubscription);

      const result = await getUserById('user-123');

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        subscription: {
          status: 'premium',
          stripeCustomerId: 'cus_123',
          stripeSubscriptionId: 'sub_123',
          currentPeriodStart: new Date('2024-01-01T00:00:00.000Z'),
          currentPeriodEnd: new Date('2024-02-01T00:00:00.000Z'),
          cancelAtPeriodEnd: false,
        },
        searchCount: 5,
        searchCountResetDate: new Date('2024-01-01T00:00:00.000Z'),
      });
    });

    it('should return null if user not found', async () => {
      mockDb.get.mockResolvedValueOnce(null);

      const result = await getUserById('non-existent');

      expect(result).toBeNull();
    });

    it('should handle user without subscription', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        search_count: 0,
        search_count_reset_date: '2024-01-01T00:00:00.000Z',
      };

      mockDb.get
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null); // No subscription

      const result = await getUserById('user-123');

      expect(result?.subscription).toEqual({
        status: 'free',
        cancelAtPeriodEnd: false,
      });
    });

    it('should handle database errors gracefully', async () => {
      mockDb.get.mockRejectedValueOnce(new Error('Database error'));

      const result = await getUserById('user-123');

      expect(result).toBeNull();
    });
  });

  describe('updateUserSearchCount', () => {
    it('should update user search count', async () => {
      mockDb.run.mockResolvedValueOnce(undefined);

      const result = await updateUserSearchCount('user-123', 10, '2024-01');

      expect(result).toBe(10);
      expect(mockDb.run).toHaveBeenCalledWith(
        'UPDATE users SET search_count = ?, search_count_reset_date = ? WHERE id = ?',
        expect.arrayContaining([10, expect.any(String), 'user-123'])
      );
    });
  });

  describe('updateUserSubscription', () => {
    it('should update existing subscription', async () => {
      const subscriptionData = {
        status: 'premium' as const,
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        currentPeriodStart: new Date('2024-01-01'),
        currentPeriodEnd: new Date('2024-02-01'),
        cancelAtPeriodEnd: false,
      };

      mockDb.get.mockResolvedValueOnce({ id: 'existing-sub-id' });
      mockDb.run.mockResolvedValueOnce(undefined);

      await updateUserSubscription('user-123', subscriptionData);

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE subscriptions SET'),
        expect.arrayContaining([
          'premium',
          'cus_123',
          'sub_123',
          '2024-01-01T00:00:00.000Z',
          '2024-02-01T00:00:00.000Z',
          false,
          'user-123',
        ])
      );
    });

    it('should create new subscription if none exists', async () => {
      const subscriptionData = {
        status: 'premium' as const,
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        currentPeriodStart: new Date('2024-01-01'),
        currentPeriodEnd: new Date('2024-02-01'),
        cancelAtPeriodEnd: false,
      };

      mockDb.get.mockResolvedValueOnce(null); // No existing subscription
      mockDb.run.mockResolvedValueOnce(undefined);

      await updateUserSubscription('user-123', subscriptionData);

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO subscriptions'),
        expect.arrayContaining([
          expect.any(String), // UUID
          'user-123',
          'premium',
          'cus_123',
          'sub_123',
          '2024-01-01T00:00:00.000Z',
          '2024-02-01T00:00:00.000Z',
          false,
        ])
      );
    });
  });
});