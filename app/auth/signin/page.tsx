'use client'

import { useState } from 'react'
import ModernAuthCard from '@/components/auth/ModernAuthCard'

export default function SignInPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  
  return <ModernAuthCard mode={mode} onModeChange={setMode} />
}