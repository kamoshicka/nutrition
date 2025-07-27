import { POST } from '../signup/route';
import { createUser } from '../../../../../lib/auth';
import { initializeDatabase } from '../../../../../lib/database';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('../../../../../lib/auth');
jest.mock('../../../../../lib/database');

const mockCreateUser = createUser as jest.MockedFunction<typeof createUser>;
const mockInitializeDatabase = initializeDatabase as jest.MockedFunction<typeof initializeDatabase>;

describe('/api/auth/signup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new user successfully', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User'
    };

    mockCreateUser.mockResolvedValue(mockUser);

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.user).toEqual(mockUser);
    expect(mockCreateUser).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    });
  });

  it('should return error for invalid email', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should return error for missing required fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com'
        // missing password and name
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});