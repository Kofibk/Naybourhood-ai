import { LogoIcon } from '@/components/Logo'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Simple header with logo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <LogoIcon className="w-8 h-8" variant="light" />
          <span className="ml-2 font-display text-lg font-medium">Naybourhood</span>
        </div>
      </header>

      {/* Main content with top padding for fixed header */}
      <main className="pt-20">
        {children}
      </main>
    </div>
  )
}
