"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { authAPI } from "@/lib/api"
import { toast } from "sonner"
import { IconEye, IconEyeOff, IconArrowLeft } from "@tabler/icons-react"
import Link from "next/link"
import { useTranslations } from 'next-intl'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const t = useTranslations('ResetPasswordPage')
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const token = searchParams.get("token")
  const userType = (searchParams.get("userType") || searchParams.get("type")) as 'staff' | 'admin'

  useEffect(() => {
    if (!token || !userType) {
      toast.error("Invalid reset link. Please request a new password reset.")
      router.push("/login")
    }
  }, [token, userType, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token || !userType) {
      toast.error("Invalid reset link")
      return
    }

    // Enhanced password validation
    if (!newPassword.trim()) {
      toast.error("Password is required")
      return
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(newPassword)
    const hasLowerCase = /[a-z]/.test(newPassword)
    const hasNumbers = /\d/.test(newPassword)
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      toast.error("Password must contain at least one uppercase letter, lowercase letter, and number")
      return
    }

    setIsLoading(true)

    try {
      const response = await authAPI.resetPassword({
        token,
        userType,
        newPassword
      })
      
      toast.success(response.message || "Password reset successful! You can now login with your new password.")
      
      // Redirect to login after a brief delay
      setTimeout(() => {
        router.push("/login")
      }, 2000)
      
    } catch (error: unknown) {
      console.error('Reset password error:', error)
      
      if (error.response?.status === 400) {
        toast.error(error.response.data?.error || "Invalid request. The reset link may be invalid or expired.")
      } else if (error.response?.status === 404) {
        toast.error("Reset password service not available. Please try again later.")
      } else if (error.message?.includes('timeout')) {
        toast.error("Request timeout. The server is taking too long. Please try again.")
      } else if (error.message?.includes('network') || error.message?.includes('connect')) {
        toast.error("Network error. Please check your connection and try again.")
      } else {
        toast.error(error.message || "Failed to reset password. Please try again or request a new reset link.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!token || !userType) {
    return (
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">{t('loading')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-white font-bold text-2xl shadow-lg mx-auto mb-4">
              TNA
            </div>
            <CardTitle className="text-2xl">{t('title')}</CardTitle>
            <p className="text-muted-foreground text-sm">
              {t('subtitle', { userType })}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field>
                <FieldLabel htmlFor="newPassword">{t('newPassword')}</FieldLabel>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder={t('newPasswordPlaceholder')}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    minLength={8}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <IconEyeOff className="size-4 text-muted-foreground" />
                    ) : (
                      <IconEye className="size-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {t('passwordHint')}
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="confirmPassword">{t('confirmPassword')}</FieldLabel>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={t('confirmPasswordPlaceholder')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    minLength={8}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <IconEyeOff className="size-4 text-muted-foreground" />
                    ) : (
                      <IconEye className="size-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </Field>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('resettingButton') : t('resetButton')}
              </Button>

              <div className="text-center">
                <Link 
                  href="/login" 
                  className="text-sm text-primary hover:underline inline-flex items-center gap-2"
                >
                  <IconArrowLeft className="size-4" />
                  {t('backToLogin')}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <div className="text-center text-muted-foreground">...</div>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}