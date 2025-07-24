import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '../../../../../lib/auth';
import { initializeDatabase } from '../../../../../lib/database';

export async function POST(request: NextRequest) {
  try {
    // Initialize database if not already done
    await initializeDatabase();

    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const userId = await createUser({ email, password, name });

    return NextResponse.json(
      { message: 'User created successfully', userId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'User already exists') {
        return NextResponse.json(
          { error: 'User already exists' },
          { status: 409 }
        );
      }
      if (error.message === 'Invalid user data') {
        return NextResponse.json(
          { error: 'Invalid user data' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}