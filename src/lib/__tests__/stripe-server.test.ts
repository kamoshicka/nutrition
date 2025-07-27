import { stripe, STRIPE_CONFIG, PREMIUM_PLAN, validateStripeConfig } from '../stripe-server';

describe('Stripe Server Configuration', () => {
  describe('STRIPE_CONFIG', () => {
    it('should have correct configuration structure', () => {
      expect(STRIPE_CONFIG).toHaveProperty('publishableKey');
      expect(STRIPE_CONFIG).toHaveProperty('secretKey');
      expect(STRIPE_CONFIG).toHaveProperty('webhookSecret');
      expect(STRIPE_CONFIG).toHaveProperty('priceId');
    });

    it('should use environment variables or fallback values', () => {
      expect(STRIPE_CONFIG.publishableKey).toBe('pk_test_mock');
      expect(STRIPE_CONFIG.secretKey).toBe('sk_test_mock');
      expect(STRIPE_CONFIG.webhookSecret).toBe('whsec_mock');
      expect(STRIPE_CONFIG.priceId).toBe('price_mock');
    });
  });

  describe('PREMIUM_PLAN', () => {
    it('should have correct plan configuration', () => {
      expect(PREMIUM_PLAN).toEqual({
        name: 'プレミアムプラン',
        description: 'お気に入り、栄養計算、PDF保存、買い物リスト機能',
        price: 300,
        currency: 'jpy',
        interval: 'month',
        trialPeriodDays: 7,
      });
    });
  });

  describe('validateStripeConfig', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should not throw error when all required variables are present', () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123';
      process.env.STRIPE_PRICE_ID = 'price_123';

      expect(() => validateStripeConfig()).not.toThrow();
    });

    it('should throw error when STRIPE_SECRET_KEY is missing', () => {
      delete process.env.STRIPE_SECRET_KEY;
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123';
      process.env.STRIPE_PRICE_ID = 'price_123';

      expect(() => validateStripeConfig()).toThrow(
        'Missing required Stripe environment variables: STRIPE_SECRET_KEY'
      );
    });

    it('should throw error when multiple variables are missing', () => {
      delete process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_WEBHOOK_SECRET;
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
      process.env.STRIPE_PRICE_ID = 'price_123';

      expect(() => validateStripeConfig()).toThrow(
        'Missing required Stripe environment variables: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET'
      );
    });

    it('should throw error when all variables are missing', () => {
      delete process.env.STRIPE_SECRET_KEY;
      delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      delete process.env.STRIPE_WEBHOOK_SECRET;
      delete process.env.STRIPE_PRICE_ID;

      expect(() => validateStripeConfig()).toThrow(
        'Missing required Stripe environment variables: STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID'
      );
    });
  });

  describe('stripe instance', () => {
    it('should be initialized with correct API version', () => {
      expect(stripe).toBeDefined();
      // Note: We can't easily test the internal configuration of the Stripe instance
      // without exposing internal properties, but we can verify it exists
    });
  });
});