import { PublicBottomNav } from "@/components/navigation/public-bottom-nav"

export const dynamic = 'force-dynamic'
export const dynamicParams = true

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <PublicBottomNav />
    </>
  )
}
