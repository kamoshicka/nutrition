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
  searchCount: number;
  searchCountResetDate: Date;
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
            searchCount: user.search_count,
            searchCountResetDate: new Date(user.search_count_reset_date),
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
      if (user) {
        token.user = user;
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
    signUp: '/auth/signup',
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
      searchCount: user.search_count,
      searchCountResetDate: new Date(user.search_count_reset_date),
    };
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

export async function updateUserSearchCount(userId: string, increment: number = 1) {
  const db = await getDatabase();
  const now = new Date();
  const user = await db.get('SELECT search_count, search_count_reset_date FROM users WHERE id = ?', [userId]);
  
  if (!user) {
    throw new Error('User not found');
  }

  const resetDate = new Date(user.search_count_reset_date);
  const shouldReset = now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear();

  if (shouldReset) {
    // Reset search count for new month
    await db.run(
      'UPDATE users SET search_count = ?, search_count_reset_date = ? WHERE id = ?',
      [increment, now.toISOString(), userId]
    );
    return increment;
  } else {
    // Increment search count
    const newCount = user.search_count + increment;
    await db.run(
      'UPDATE users SET search_count = ? WHERE id = ?',
      [newCount, userId]
    );
    return newCount;
  }
}