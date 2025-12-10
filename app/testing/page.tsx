'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { authAPI } from '@/lib/api';
import { toast } from 'sonner';
import { IconEye, IconEyeOff } from '@tabler/icons-react';

export default function TestingPage() {
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Reset password test states
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

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

  const handleTestResetPassword = async () => {
    if (!resetToken.trim()) {
      toast.error('Please enter a valid reset token');
      return;
    }

    if (!newPassword.trim()) {
      toast.error('Please enter a new password');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      toast.error('Password must contain uppercase, lowercase, and numbers');
      return;
    }

    setResetLoading(true);
    try {
      const response = await authAPI.resetPassword({
        token: resetToken.trim(),
        userType: 'staff',
        newPassword
      });

      toast.success(response.message || 'Password reset successful!');
      
      // Clear form after success
      setResetToken('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Reset password test error:', error);
      
      if (error.response?.status === 400) {
        toast.error('Invalid or expired reset token');
      } else if (error.response?.status === 404) {
        toast.error('Reset password endpoint not found');
      } else if (error.message?.includes('timeout')) {
        toast.error('Request timeout. Please try again.');
      } else if (error.message?.includes('network') || error.message?.includes('connect')) {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error(error.message || 'Failed to reset password. Please try again.');
      }
    } finally {
      setResetLoading(false);
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

        {/* Reset Password Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔑 Reset Password Test
            </CardTitle>
            <CardDescription>
              Test the reset password functionality with a token
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetToken">Reset Token</Label>
                <Input
                  id="resetToken"
                  type="text"
                  placeholder="Enter reset token from email link"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  disabled={resetLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={resetLoading}
                    minLength={8}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={resetLoading}
                  >
                    {showPassword ? (
                      <IconEyeOff className="size-4 text-muted-foreground" />
                    ) : (
                      <IconEye className="size-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={resetLoading}
                    minLength={8}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={resetLoading}
                  >
                    {showConfirmPassword ? (
                      <IconEyeOff className="size-4 text-muted-foreground" />
                    ) : (
                      <IconEye className="size-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  Password must be at least 8 characters with uppercase, lowercase, and numbers
                </div>
              </div>
            </div>

            <Button 
              onClick={handleTestResetPassword} 
              disabled={resetLoading}
              className="w-full"
            >
              {resetLoading ? 'Testing Reset Password...' : 'Test Reset Password'}
            </Button>

            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
              <strong>Instructions:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Get a reset token by using the "Test Reset Password" section above first</li>
                <li>Copy the token from the email link (after token= in the URL)</li>
                <li>Enter a new password that meets the requirements</li>
                <li>Click "Test Reset Password" to complete the reset</li>
                <li>Check the console for detailed request/response logs</li>
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