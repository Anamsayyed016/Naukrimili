'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestOAuthPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>OAuth Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {session ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800">✅ Signed In Successfully!</h3>
                <p className="text-green-600">Welcome, {session.user?.name || session.user?.email}</p>
                <p className="text-sm text-green-500">Provider: {session.user?.provider || 'Unknown'}</p>
              </div>
              
              <Button 
                onClick={() => signOut()} 
                variant="destructive" 
                className="w-full"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-800">⚠️ Not Signed In</h3>
                <p className="text-yellow-600">Click below to test Google OAuth</p>
              </div>
              
              <Button 
                onClick={() => signIn('google')} 
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Test Google OAuth
              </Button>
            </div>
          )}
          
          <div className="text-sm text-gray-500">
            <p>Status: {status}</p>
            <p>Session: {session ? 'Active' : 'None'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
