'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { authAPI } from '@/lib/api';
import { toast } from 'sonner';

export default function TestingPage() {
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading testing page...</p>
        </div>
      </div>
    );
  }

  const handleResetPassword = async () => {
    if (!identifier.trim()) {
      toast.error('Please enter username or email');
      return;
    }

    setIsLoading(true);
    try {
      const appBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      
      await authAPI.forgotPassword({
        identifier: identifier.trim(),
        userType: 'staff',
        appBaseUrl
      });

      toast.success(
        `Reset password email sent successfully to ${identifier}! Please check your email for the reset link.`
      );
      
      // Clear form after success
      setIdentifier('');
    } catch (error: any) {
      console.error('Reset password error:', error);
      
      if (error.response?.status === 404) {
        toast.error('Staff with this identifier not found');
      } else if (error.response?.status === 400) {
        toast.error('Invalid request. Please check your input.');
      } else if (error.message?.includes('timeout')) {
        toast.error('Request timeout. The server is taking too long. Please try again.');
      } else if (error.message?.includes('network') || error.message?.includes('connect')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error(error.message || 'Failed to send reset email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const testBackendConnection = async () => {
    try {
      const response = await fetch('https://mmcsb-tnapro-postgres2-production.up.railway.app/api/health');
      if (response.ok) {
        toast.success('Backend connection successful!');
      } else {
        toast.error(`Backend responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Backend connection test failed:', error);
      toast.error('Failed to connect to backend server');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Testing Page</h1>
          <p className="text-gray-600">Test password reset functionality and backend connection</p>
        </div>

        {/* Reset Password Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔐 Password Reset Test
            </CardTitle>
            <CardDescription>
              Test the forgot password functionality for staff members
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">Staff Username or Email</Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="Enter staff username or email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button 
              onClick={handleResetPassword} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Sending Reset Email...' : 'Test Reset Password'}
            </Button>

            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
              <strong>Instructions:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Enter a valid staff username or email from your database</li>
                <li>Click "Test Reset Password" to send a reset email</li>
                <li>Check the console for detailed request/response logs</li>
                <li>Note: This test is only for staff members, not admin users</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Backend Connection Test */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🌐 Backend Connection Test
            </CardTitle>
            <CardDescription>
              Test the connection to the Railway backend server
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testBackendConnection}
              variant="outline"
              className="w-full"
            >
              Test Backend Connection
            </Button>
            
            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg mt-4">
              <strong>Backend URL:</strong><br />
              <code className="text-xs">https://mmcsb-tnapro-postgres2-production.up.railway.app/api</code>
            </div>
          </CardContent>
        </Card> */}

        {/* Debug Information */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔧 Debug Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div><strong>Environment:</strong> {process.env.NODE_ENV || 'development'}</div>
              <div><strong>API Base URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'https://mmcsb-tnapro-postgres2-production.up.railway.app/api'}</div>
              <div><strong>Current Domain:</strong> {mounted ? window.location.origin : 'Loading...'}</div>
              <div><strong>Timeout Setting:</strong> 30 seconds</div>
            </div>
          </CardContent>
        </Card> */}

        {/* Back to Home */}
        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/';
              }
            }}
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}