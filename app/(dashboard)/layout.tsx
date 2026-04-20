'use client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { NavIsland } from '@/components/dashboard/NavIsland'
import { InfoPanel } from '@/components/dashboard/InfoPanel'
import { useAuth } from '@/hooks/useAuth'
import { useNotes } from '@/hooks/useNotes'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading: authLoading } = useAuth()
  const { 
    activeFolder, 
    setActiveFolder,
    folders,
    createFolder,
    renameFolder,
    deleteFolder,
    pinnedFolders,
    togglePinFolder,
    forceSync,
    diagnostics
  } = useNotes(user)

  const [mounted, setMounted] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  useEffect(() => {
    setMounted(true)

    const handleToggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    window.addEventListener('toggle-sidebar', handleToggleSidebar);
    return () => window.removeEventListener('toggle-sidebar', handleToggleSidebar);
  }, [])

  return (
    <div 
      className="flex h-[100dvh] bg-white dark:bg-slate-950 overflow-hidden relative animate-in fade-in duration-500"
      style={{ overscrollBehaviorY: 'contain' }}
    >
      <Sidebar 
        currentView="notes" 
        onViewChange={() => {}} 
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onClose={() => setIsSidebarOpen(false)}
        folders={folders}
        activeFolder={activeFolder}
        onSelectFolder={setActiveFolder}
        onAddFolder={() => {
            const name = prompt("New Folder Name:");
            if (name) createFolder(name);
        }}
        renameFolder={async (oldName, newName) => {
            return renameFolder(oldName, newName);
        }}
        deleteFolder={async (name) => {
            return deleteFolder(name);
        }}
        pinnedFolders={pinnedFolders}
        togglePinFolder={togglePinFolder}
        subscriptionTier={user?.subscription_tier}
        onUpgrade={() => window.dispatchEvent(new CustomEvent('open-payment-modal'))}
        userEmail={user?.email}
        diagnostics={diagnostics}
        onForceSync={forceSync}
      />

      <main 
        className={`flex-1 flex flex-col h-[100dvh] overflow-hidden bg-white dark:bg-slate-950 relative min-w-0 transition-all duration-500 ease-in-out`}
        style={{ overscrollBehaviorY: 'contain' }}
      >
        {/* Production Header Hub: Scan (Left) | NavIsland (Center) | Toolbelt (Right) */}
          <header className={`h-16 sm:h-20 px-3 sm:px-8 lg:px-12 flex items-center justify-between gap-2 sm:gap-8 border-b border-slate-100 dark:border-white/5 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl z-30 sticky top-0 shrink-0 transition-all duration-300`}>
            <div id="header-hub-root" className="flex-1 flex items-center justify-between h-full min-w-0" />
            <div 
              className={`absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-none z-[200] transition-all duration-500 ease-in-out ${
                isSidebarOpen ? 'ml-[120px] sm:ml-0' : 'ml-0'
              }`}
            >
              <div className="pointer-events-auto">
                  <NavIsland compact={isSidebarOpen || isSidebarCollapsed} />
              </div>
            </div>
          </header>

        <div className="flex-1 overflow-y-auto px-1 sm:px-4 lg:px-12 py-6 custom-scrollbar relative">
          <InfoPanel />
          {children}
        </div>
        
        {/* Mobile Sidebar Toggle — Floating FAB */}
        {!isSidebarOpen && (
           <button 
              onClick={() => setIsSidebarOpen(true)}
              className="fixed bottom-8 left-8 z-50 p-4 bg-violet-600 text-white rounded-2xl shadow-2xl lg:hidden active:scale-95 transition-all"
           >
              <div className="w-6 h-0.5 bg-white mb-1.5 rounded-full" />
              <div className="w-4 h-0.5 bg-white mb-1.5 rounded-full" />
              <div className="w-6 h-0.5 bg-white rounded-full" />
           </button>
        )}
      </main>
    </div>
  )
}
