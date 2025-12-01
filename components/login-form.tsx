'use client';

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import LoginImage from "@/public/login.jpg"


import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { IconEye, IconEyeOff } from "@tabler/icons-react"
import { settingAPI } from "@/lib/api"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<'staff' | 'admin'>('staff');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logoPath, setLogoPath] = useState<string | null>(null);

  // Fetch logo from settings on component mount
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        // Use direct fetch for public access (no auth required)
        const response = await fetch('https://mmcsb-tnapro-postgres2-production.up.railway.app/api/setting');
        if (response.ok) {
          const settings = await response.json();
          if (settings && settings.length > 0 && settings[0].logoPath) {
            setLogoPath(settings[0].logoPath);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch logo, using default');
      }
    };

    fetchLogo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(username, password, userType);
      toast.success("Login successful!");
    } catch (error: any) {
      toast.error(error.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                {logoPath ? (
                  <div className="h-16 w-16 rounded-full overflow-hidden shadow-lg border-2 border-primary/10">
                    <Image
                      src={logoPath}
                      alt="Company Logo"
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    TNA
                  </div>
                )}
                <h1 className="text-2xl font-bold">Welcome</h1>
                <p className="text-muted-foreground text-balance">
                  Login to your TNAPro account
                </p>
              </div>
              <Field>
                <FieldLabel>Login as</FieldLabel>
                <div className="flex gap-2 p-1 bg-muted rounded-lg">
                  <button
                    type="button"
                    onClick={() => setUserType('staff')}
                    disabled={isLoading}
                    className={cn(
                      "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                      userType === 'staff'
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Staff
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('admin')}
                    disabled={isLoading}
                    className={cn(
                      "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                      userType === 'admin'
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Admin
                  </button>
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="username">{userType === 'staff' ? 'Staff ID' : 'Username'}</FieldLabel>
                <Input
                  id="username"
                  type="text"
                  placeholder={userType === 'staff' ? 'Enter your staff ID' : 'Enter your username'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                </div>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
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
              </Field>
              <Field>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </Field>

              {/* {userType === 'admin' && (
                <div className="text-center text-sm">
                  <span className="text-muted-foreground">Don't have an account? </span>
                  <a 
                    href="/signup" 
                    className="text-primary hover:underline font-medium"
                  >
                    Sign up here
                  </a>
                </div>
              )} */}
            </FieldGroup>
          </form>
          {/* <div className="bg-linear-to-br from-blue-300 to-purple-400 relative hidden md:block overflow-hidden"> */}
          <div className="bg-gray-200 relative hidden md:block overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <Image
              src={LoginImage}
              width={500}
              height={500}
              alt="login-image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
            </div>
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
