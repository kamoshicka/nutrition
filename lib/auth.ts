import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getDatabase } from './database';
import { z } from 'zod';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).optional(),
});

export interface User {
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
  searchCount: {
    count: number;
    lastResetDate: string;
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const validation = loginSchema.safeParse(credentials);
          if (!validation.success) {
            return null;
          }

          const db = await getDatabase();
          const user = await db.get(
            'SELECT * FROM users WHERE email = ?',
            [credentials.email]
          );

          if (!user || !user.password_hash) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password_hash
          );

          if (!isPasswordValid) {
            return null;
          }

          // Get subscription info
          const subscription = await db.get(
            'SELECT * FROM subscriptions WHERE user_id = ?',
            [user.id]
          );

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            subscription: subscription || {
              status: 'free',
              cancelAtPeriodEnd: false,
            },
            searchCount: {
              count: user.search_count || 0,
              lastResetDate: user.search_count_reset_date || new Date().toISOString(),
            },
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user && 'subscription' in user) {
        token.user = user as User;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.user) {
        session.user = token.user as User;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Helper functions for user management
export async function createUser(data: z.infer<typeof signupSchema>) {
  const validation = signupSchema.safeParse(data);
  if (!validation.success) {
    throw new Error('Invalid user data');
  }

  const { email, password, name } = validation.data;
  const db = await getDatabase();

  // Check if user already exists
  const existingUser = await db.get(
    'SELECT id FROM users WHERE email = ?',
    [email]
  );

  if (existingUser) {
    throw new Error('User already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);
  const userId = crypto.randomUUID();

  // Create user
  await db.run(
    'INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)',
    [userId, email, name || null, passwordHash]
  );

  // Create default subscription
  await db.run(
    'INSERT INTO subscriptions (id, user_id, status) VALUES (?, ?, ?)',
    [crypto.randomUUID(), userId, 'free']
  );

  return userId;
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const db = await getDatabase();
    const user = await db.get(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (!user) {
      return null;
    }

    const subscription = await db.get(
      'SELECT * FROM subscriptions WHERE user_id = ?',
      [id]
    );

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      subscription: subscription ? {
        status: subscription.status,
        stripeCustomerId: subscription.stripe_customer_id,
        stripeSubscriptionId: subscription.stripe_subscription_id,
        currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start) : undefined,
        currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end) : undefined,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      } : {
        status: 'free',
        cancelAtPeriodEnd: false,
      },
      searchCount: {
        count: user.search_count || 0,
        lastResetDate: user.search_count_reset_date || new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

export async function updateUserSearchCount(userId: string, newCount: number, currentMonth: string) {
  const db = await getDatabase();
  const now = new Date();
  
  await db.run(
    'UPDATE users SET search_count = ?, search_count_reset_date = ? WHERE id = ?',
    [newCount, now.toISOString(), userId]
  );
  
  return newCount;
}

export async function updateUserSubscription(userId: string, subscriptionData: {
  status: 'free' | 'premium' | 'cancelled';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
}) {
  const db = await getDatabase();
  
  // Check if subscription record exists
  const existingSubscription = await db.get(
    'SELECT id FROM subscriptions WHERE user_id = ?',
    [userId]
  );

  if (existingSubscription) {
    // Update existing subscription
    await db.run(
      `UPDATE subscriptions SET 
        status = ?, 
        stripe_customer_id = ?, 
        stripe_subscription_id = ?, 
        current_period_start = ?, 
        current_period_end = ?, 
        cancel_at_period_end = ?
      WHERE user_id = ?`,
      [
        subscriptionData.status,
        subscriptionData.stripeCustomerId || null,
        subscriptionData.stripeSubscriptionId || null,
        subscriptionData.currentPeriodStart?.toISOString() || null,
        subscriptionData.currentPeriodEnd?.toISOString() || null,
        subscriptionData.cancelAtPeriodEnd,
        userId
      ]
    );
  } else {
    // Create new subscription record
    await db.run(
      `INSERT INTO subscriptions (
        id, user_id, status, stripe_customer_id, stripe_subscription_id, 
        current_period_start, current_period_end, cancel_at_period_end
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        crypto.randomUUID(),
        userId,
        subscriptionData.status,
        subscriptionData.stripeCustomerId || null,
        subscriptionData.stripeSubscriptionId || null,
        subscriptionData.currentPeriodStart?.toISOString() || null,
        subscriptionData.currentPeriodEnd?.toISOString() || null,
        subscriptionData.cancelAtPeriodEnd
      ]
    );
  }
}