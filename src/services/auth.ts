import axios from 'axios';
import { User, LoginCredentials, RegisterData } from '../types';
import { API_BASE_URL } from './api';

// For demo purposes, we'll use mock data
const USE_MOCK_DATA = false;

// Create an axios instance for auth requests
const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Mock user data
const mockUser: User = {
  id: '1',
  username: 'demo_user',
  email: 'demo@example.com',
  first_name: 'Demo',
  last_name: 'User',
  profilePicture: 'https://randomuser.me/api/portraits/lego/1.jpg',
  createdAt: new Date().toISOString(),
};

// Mock token
const mockToken = 'mock-jwt-token-for-demo-purposes';

// Login function
export const login = async (credentials: LoginCredentials): Promise<{ user: User; token: string }> => {
  // Simulate network delay
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock validation
    if (credentials.username !== 'demo_user' || credentials.password !== 'password') {
      throw new Error('Invalid username or password');
    }
    
    return { user: mockUser, token: mockToken };
  }

  try {
    // Additional validation before sending request
    if (!credentials.username) {
      throw new Error('Username is required');
    }
    
    if (!credentials.password) {
      throw new Error('Password is required');
    }
    
    // Debug log to check credentials
    console.log('Sending login request to:', `${API_BASE_URL}/auth/login/`);
    console.log('Login credentials:', { 
      username: credentials.username,
      password: credentials.password ? `${credentials.password.length} chars` : 'missing',
      passwordType: typeof credentials.password
    });
    
    // Create a complete payload with both username and password
    const loginPayload = {
      username: credentials.username,
      password: credentials.password
    };
    
    // Debug log to check the actual payload being sent
    console.log('Login payload:', {
      ...loginPayload,
      password: loginPayload.password ? `${loginPayload.password.length} chars` : 'missing'
    });
    
    // Stringify the payload to check for any serialization issues
    const payloadString = JSON.stringify(loginPayload);
    console.log('Stringified payload:', payloadString);
    
    // Check if password is still in the stringified payload
    if (!payloadString.includes('"password"')) {
      console.error('Password is missing from stringified payload!');
      throw new Error('Password could not be properly serialized');
    }
    
    // Try both JSON and form-encoded approaches
    let response;
    
    try {
      // First try with JSON
      console.log('Trying JSON approach...');
      response = await authApi.post('/auth/login/', loginPayload);
    } catch (jsonError) {
      console.error('JSON approach failed:', jsonError);
      
      // If JSON fails, try with form-encoded
      console.log('Trying form-encoded approach...');
      
      // Create form data
      const formData = new URLSearchParams();
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);
      
      console.log('Form data created:', formData.toString().replace(credentials.password, '********'));
      
      // Try with form-encoded data
      try {
        response = await authApi.post('/auth/login/', formData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
      } catch (formError) {
        console.error('Form-encoded approach also failed:', formError);
        throw formError; // Re-throw the error
      }
    }
    
    console.log('Login response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Login error details:', error.response?.data || error.message);
    console.error('Login error status:', error.response?.status);
    console.error('Login error headers:', error.response?.headers);
    
    if (error.response && error.response.data) {
      if (error.response.data.message) {
        throw new Error(error.response.data.message);
      } else if (typeof error.response.data === 'string') {
        throw new Error(error.response.data);
      }
    }
    throw new Error('Login failed. Please try again.');
  }
};

// Register function
export const register = async (data: RegisterData): Promise<{ user: User; token: string }> => {
  // Validate password match
  if (data.password !== data.confirmPassword) {
    throw new Error('Passwords do not match');
  }
  
  // Simulate network delay
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock validation
    if (data.email === 'demo@example.com') {
      throw new Error('Email already in use');
    }
    
    // Create a new mock user
    const newUser: User = {
      id: '2',
      username: data.username,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      createdAt: new Date().toISOString(),
    };
    
    return { user: newUser, token: mockToken };
  }

  try {
    console.log('Sending registration request to:', `${API_BASE_URL}/auth/register/`);
    // Log data but mask the password for security
    console.log('Registration data:', {
      username: data.username,
      email: data.email,
      password: '********',
      first_name: data.first_name,
      last_name: data.last_name
    });
    
    // Ensure all required fields are present
    if (!data.username || !data.email || !data.password || !data.first_name || !data.last_name) {
      throw new Error('All fields are required');
    }
    
    // Create a payload without the confirmPassword field
    const payload = {
      username: data.username,
      email: data.email,
      password: data.password,
      first_name: data.first_name,
      last_name: data.last_name
    };
    
    const response = await authApi.post('/auth/register/', payload);
    console.log('Registration response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Registration error details:', error.response?.data || error.message);
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Registration failed. Please try again.');
  }
};

// Logout function
export const logout = async (): Promise<void> => {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return;
  }

  try {
    console.log('Sending logout request to:', `${API_BASE_URL}/auth/logout`);
    await authApi.post('/auth/logout');
    console.log('Logout successful');
  } catch (error) {
    console.error('Error during logout:', error);
    // We don't throw here because we want to clear the local state regardless
  }
};

// Get current user function
export const getCurrentUser = async (): Promise<User> => {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 800));
    return mockUser;
  }

  try {
    console.log('Fetching current user data from:', `${API_BASE_URL}/auth/me`);
    const response = await authApi.get('/auth/me');
    console.log('Current user data:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw new Error('Failed to get user information');
  }
}; 