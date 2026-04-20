'use client'

import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'

// Neural Hydration Stabilization (v15.0.0)
// The root page uses 'use client' so next/dynamic with ssr: false is permitted. 
// Next.js still pre-renders Client Components on the server, ensuring the 
// DashboardSkeleton is delivered instantly as the initial HTML payload.
const DashboardContent = dynamic(() => 
  import('@/components/dashboard/DashboardContent').then(mod => mod.DashboardContent), 
  { 
    ssr: false,
    loading: () => <DashboardSkeleton />
  }
)

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
       <DashboardContent />
    </Suspense>
  )
}
