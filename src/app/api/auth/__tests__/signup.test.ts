import { POST } from '../signup/route';
import { createUser } from '../../../../../lib/auth';
import { initializeDatabase } from '../../../../../lib/database';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('../../../../../lib/auth');
jest.mock('../../../../../lib/database');

const mockCreateUser = createUser as jest.MockedFunction<typeof createUser>;
const mockInitializeDatabase = initializeDatabase as jest.MockedFunction<typeof initializeDatabase>;

describe('/api/auth/signup