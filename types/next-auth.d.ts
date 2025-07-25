import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      subscription: {
        status: 'free' | 'premium' | 'cancelled';
        stripeCustomerId?: string;
        stripeSubscriptionId?: string;
        currentPeriodStart?: Date;
        currentPeriodEnd?: Date;
        cancelAtPeriodEnd: boolean;
      };
      searchCount: number;
      searchCountResetDate: Date;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string;
    subscription: {
      status: 'free' | 'premium' | 'cancelled';
      stripeCustomerId?: string;
      stripeSubscriptionId?: string;
      currentPeriodStart?: Date;
      currentPeriodEnd?: Date;
      cancelAtPeriodEnd: boolean;
    };
    searchCount: number;
    searchCountResetDate: Date;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    user: {
      id: string;
      email: string;
      name?: string;
      subscription: {
        status: 'free' | 'premium' | 'cancelled';
        stripeCustomerId?: string;
        stripeSubscriptionId?: string;
        currentPeriodStart?: Date;
        currentPeriodEnd?: Date;
        cancelAtPeriodEnd: boolean;
      };
      searchCount: number;
      searchCountResetDate: Date;
    };
  }
}