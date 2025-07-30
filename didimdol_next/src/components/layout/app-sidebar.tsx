'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import { MessageSquare, BarChart, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

const items = [
  { title: '채팅', href: '/chat', icon: MessageSquare },
  { title: '분석', href: '/analysis', icon: BarChart },
  { title: '마이페이지', href: '/mypage', icon: User },
]

export function AppSidebar() {
  const pathname = usePathname()
  const isMobile = useIsMobile()

  return (
    <Sidebar
      variant="sidebar"
      collapsible={isMobile ? 'offcanvas' : 'none'} // ✅ 모바일: offcanvas / 데스크탑: icon 또는 none
      className="border-r h-screen shrink-0"
    >
      <SidebarHeader className="border-b px-6 py-4">
        <Link href="/" className="flex items-center">
          <h2 className="text-lg font-semibold">My App</h2>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                          'hover:bg-accent hover:text-accent-foreground',
                          isActive && 'bg-accent text-accent-foreground'
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t px-6 py-4">
        <div className="text-xs text-muted-foreground">© 2025 MyApp</div>
      </SidebarFooter>
    </Sidebar>
  )
}
