import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import UserButton from '@/components/layout/UserButton'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <main className="flex-1 relative transition-all duration-200">
        <div className="absolute mobile:hidden left-4 top-4 bg-white rounded-2 border border-gray-20 p-1">
          <SidebarTrigger />
        </div>
        <div className="px-4 py-4 lg:px-8 h-full">{children}</div>
        <UserButton />
      </main>
    </SidebarProvider>
  )
}
