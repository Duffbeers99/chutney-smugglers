import Link from "next/link"

export const dynamic = 'force-dynamic'
export const dynamicParams = true

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Public header with login link */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">Chutney Smugglers</span>
            <span className="text-xs text-muted-foreground">(Read-only)</span>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
          >
            Login
          </Link>
        </div>
      </header>

      {/* Banner to indicate read-only mode */}
      <div className="bg-muted/50 border-b py-2">
        <div className="container">
          <p className="text-sm text-center text-muted-foreground">
            You&apos;re viewing in read-only mode. Login to participate in curry adventures!
          </p>
        </div>
      </div>

      {children}
    </div>
  )
}
