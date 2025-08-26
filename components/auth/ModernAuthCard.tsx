'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Loader2, Mail, Lock, User, AlertCircle, Smartphone, Monitor } from 'lucide-react'
import Link from 'next/link'
import { 
  isMobileDevice, 
  getPreferredAuthMethod, 
  validateMobileAuthEnvironment,
  getMobileOAuthErrorMessage 
} from '@/lib/mobile-auth'

interface ModernAuthCardProps {
  mode: 'signin' | 'signup'
  onModeChange: (mode: 'signin' | 'signup') => void
}

export default function ModernAuthCard({ mode, onModeChange }: ModernAuthCardProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState('')
  const [error, setError] = useState('')
  const [mobileInfo, setMobileInfo] = useState<{
    isMobile: boolean;
    warnings: string[];
    errors: string[];
  }>({ isMobile: false, warnings: [], errors: [] })

  // Check mobile environment on component mount
  useEffect(() => {
    const env = validateMobileAuthEnvironment()
    setMobileInfo({
      isMobile: isMobileDevice(),
      warnings: env.warnings,
      errors: env.errors
    })
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleCredentialsAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading('credentials')
    setError('')

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      })

      if (result?.error) {
        setError('Invalid credentials')
      } else {
        window.location.href = '/dashboard'
      }
    } catch (error) {
      setError('Authentication failed')
    } finally {
      setIsLoading('')
    }
  }

  const handleOAuthSignIn = async (provider: string) => {
    setIsLoading(provider)
    setError('')
    
    try {
      const isMobile = isMobileDevice()
      const authMethod = getPreferredAuthMethod()
      
      console.log(`🔐 OAuth sign-in: ${provider} on ${isMobile ? 'mobile' : 'desktop'} using ${authMethod}`)
      
      const result = await signIn(provider, { 
        callbackUrl: '/dashboard',
        redirect: authMethod === 'redirect'
      })
      
      if (result?.error) {
        const mobileError = getMobileOAuthErrorMessage(result.error)
        setError(mobileError)
        console.error(`❌ OAuth error for ${provider}:`, result.error)
      }
    } catch (error: any) {
      const mobileError = getMobileOAuthErrorMessage(error)
      setError(mobileError)
      console.error(`❌ OAuth exception for ${provider}:`, error)
    } finally {
      setIsLoading('')
    }
  }

  return (
    <div className="auth-container">
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="auth-card w-full max-w-md">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-4">
              <User className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="auth-title font-heading gradient-text">
              {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <p className="text-muted-foreground font-body">
              {mode === 'signin' 
                ? 'Sign in to access your job portal account' 
                : 'Join thousands of job seekers today'}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert className="alert-error">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Mobile Device Information */}
            {mobileInfo.isMobile && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Smartphone className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Mobile Device Detected</span>
                </div>
                <p className="text-xs text-blue-700">
                  Using mobile-optimized authentication flow for better compatibility.
                </p>
              </div>
            )}

            {/* HTTPS Warning for Mobile */}
            {mobileInfo.isMobile && mobileInfo.warnings.some(w => w.includes('HTTPS')) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">HTTPS Recommended</span>
                </div>
                <p className="text-xs text-yellow-700">
                  For best mobile authentication experience, use HTTPS.
                </p>
              </div>
            )}

            {/* OAuth Buttons */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="oauth-button oauth-button-google w-full"
                disabled={!!isLoading}
                onClick={() => handleOAuthSignIn('google')}
              >
                {isLoading === 'google' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Continue with Google
              </Button>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="oauth-button oauth-button-linkedin w-full"
                disabled={!!isLoading}
                onClick={() => handleOAuthSignIn('linkedin')}
              >
                {isLoading === 'linkedin' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                )}
                Continue with LinkedIn
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground font-body">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleCredentialsAuth} className="auth-form space-y-4">
              {mode === 'signup' && (
                <div className="auth-form-field space-y-2">
                  <Label htmlFor="name" className="font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="auth-input pl-10"
                      required={mode === 'signup'}
                    />
                  </div>
                </div>
              )}

              <div className="auth-form-field space-y-2">
                <Label htmlFor="email" className="font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="auth-input pl-10"
                    required
                  />
                </div>
              </div>

              <div className="auth-form-field space-y-2">
                <Label htmlFor="password" className="font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="auth-input pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="btn-primary w-full"
                disabled={!!isLoading}
              >
                {isLoading === 'credentials' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="text-center font-body">
              <p className="text-sm text-muted-foreground">
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => onModeChange(mode === 'signin' ? 'signup' : 'signin')}
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}





