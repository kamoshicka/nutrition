import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const envCheck = {
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',
      NODE_ENV: process.env.NODE_ENV || 'not set',
      DATABASE_URL: !!process.env.DATABASE_URL,
    };

    return NextResponse.json({
      status: 'success',
      environment: envCheck,
      message: 'Environment variables check'
    });
  } catch (error) {
    console.error('Environment check failed:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Environment check failed'
    }, { status: 500 });
  }
}