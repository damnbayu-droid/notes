'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

export function FileHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // 1. Handle URL Action (from Manifest or Link)
    const action = searchParams.get('action')
    if (action === 'open-pdf') {
      toast.info('Neural Bridge: Initializing PDF Stream...', {
        description: 'Synchronizing local file with cloud intelligence.'
      })
      // Redirect to the scanner/PDF tool if not already there
      // We don't want to loop, so we only do this if we are at the root
      if (window.location.pathname === '/') {
        router.push('/?view=scanner&file_launched=true')
      }
    }

    // 2. Handle PWA Launch Queue (Native File Association)
    if ('launchQueue' in window && (window as any).launchQueue) {
      (window as any).launchQueue.setConsumer(async (launchParams: any) => {
        if (launchParams.files && launchParams.files.length > 0) {
          toast.success('Neural File Detected', {
            description: 'Injecting local intelligence into the scanner...'
          })
          
          // Store the file handle in a global way or pass it via state
          // For now, we'll redirect to the scanner which should handle the "last launched file"
          // In a real implementation, you'd use a state manager or IndexedDB
          const fileHandle = launchParams.files[0]
          const file = await fileHandle.getFile()
          
          // Trigger a custom event that the Scanner tool can listen to
          const event = new CustomEvent('dcpi-file-launch', { 
            detail: { file, name: file.name } 
          })
          window.dispatchEvent(event)
          
          router.push('/?view=scanner&file_injected=true')
        }
      })
    }
  }, [searchParams, router])

  return null
}
