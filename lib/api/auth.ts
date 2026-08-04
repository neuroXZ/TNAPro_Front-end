import axios from 'axios';
import { api, API_BASE_URL } from './client';

export const authAPI = {
  login: async (credentials: { username: string; password: string; userType: 'staff' | 'admin' }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  forgotPassword: async (data: { identifier: string; userType: 'staff' | 'admin'; appBaseUrl: string }) => {
    console.log('🔐 FORGOT PASSWORD REQUEST STARTING...');
    console.log('🌐 API Base URL:', API_BASE_URL);
    console.log('📡 Full Request URL:', `${API_BASE_URL}/auth/forgot-password`);
    console.log('📨 Request data:', data);

    // Retry mechanism for server cold start
    const maxRetries = 2;
    let lastError: unknown = undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔍 Attempt ${attempt}/${maxRetries}: Sending request to server...`);

        const response = await api.post('/auth/forgot-password', data, {
          timeout: 60000, // 60 seconds for this specific request
        })

        console.log('✅ SUCCESS! Response:', response);
        return response;
      } catch (error: unknown) {
        lastError = error;
        console.log(`❌ ATTEMPT ${attempt} FAILED!`);
        const isAxios = axios.isAxiosError(error);
        const errorName = error instanceof Error ? error.name : 'UnknownError';
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorCode = isAxios ? error.code : undefined;
        const status = isAxios ? error.response?.status : undefined;
        const responseData = isAxios ? error.response?.data : undefined;

        console.log('❌ Error type:', errorName);
        console.log('❌ Error message:', errorMessage);
        console.log('❌ Error code:', errorCode);
        console.log('❌ Response status:', status);
        console.log('❌ Response data:', responseData);

        // If it's a timeout and we have retries left, continue
        if (errorMessage.includes('timeout') && attempt < maxRetries) {
          console.log(`⏳ Timeout on attempt ${attempt}, retrying in 3 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          continue;
        }

        // If it's not a timeout error, don't retry
        if (!errorMessage.includes('timeout')) {
          break;
        }
      }
    }

    // Handle final error after all retries
    if (!lastError) {
      throw new Error('Forgot password request failed.');
    }

    if (axios.isAxiosError(lastError) && (lastError.code === 'ECONNREFUSED' || lastError.code === 'NETWORK_ERROR')) {
      throw new Error('Cannot connect to server. Please check your network connection.');
    } else if ((lastError instanceof Error ? lastError.message : '').includes('timeout')) {
      throw new Error('Server is slow to respond. This may be due to cold start. Please wait a moment and try again.');
    } else if (axios.isAxiosError(lastError) && lastError.response?.status === 404) {
      throw new Error('Forgot password endpoint not found on the server.');
    } else if (axios.isAxiosError(lastError) && (lastError.response?.status ?? 0) >= 500) {
      throw new Error('Server error. Please try again later.');
    }

    throw lastError;
  },

  resetPassword: async (data: { token: string; userType: 'staff' | 'admin'; newPassword: string }) => {
    console.log('🔐 RESET PASSWORD REQUEST STARTING...');
    console.log('📨 Request data:', { ...data, newPassword: '[HIDDEN]' });

    try {
      const response = await api.post('/auth/reset-password', data, {
        timeout: 60000, // 60 seconds for password reset
      });
      console.log('✅ RESET PASSWORD SUCCESS!', response.data);
      return response.data;
    } catch (error: unknown) {
      console.log('❌ RESET PASSWORD FAILED!');
      const isAxios = axios.isAxiosError(error);
      const status = isAxios ? error.response?.status : undefined;
      const data = isAxios ? error.response?.data : undefined;
      const message = error instanceof Error ? error.message : String(error);

      console.log('❌ Error:', data || message);

      if (status === 400) {
        const anyData = data as { error?: string } | undefined;
        throw new Error(anyData?.error || 'Invalid request. Please check your input.');
      } else if (status === 404) {
        throw new Error('Reset password endpoint not found.');
      } else if ((status ?? 0) >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (message.includes('timeout')) {
        throw new Error('server timeout. Please wait a moment and try again.');
      }

      throw error;
    }
  },
};
