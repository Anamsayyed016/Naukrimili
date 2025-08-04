'use client';
"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Home,
  Building2,
  Users,
  MessageSquare,
  Settings,
  Briefcase,
  TrendingUp,
  Star,
  Bell,
  User,
  Brain,
  Target,
  BarChart3,
  Zap,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { usePathname } from 'next/navigation'

const mainNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "AI Jobs", url: "/jobs", icon: Brain },
  { title: "Companies", url: "/companies", icon: Building2 },
  { title: "Talent Pool", url: "/candidates", icon: Users },
  { title: "Messages", url: "/messages", icon: MessageSquare },
]

const jobSeekerItems = [
  { title: "My Applications", url: "/applications", icon: Briefcase },
  { title: "Saved Jobs", url: "/saved", icon: Star },
  { title: "AI Recommendations", url: "/recommendations", icon: Sparkles },
  { title: "Profile", url: "/profile", icon: User },
]

const recruiterItems = [
  { title: "Post Job", url: "/post-job", icon: TrendingUp },
  { title: "Applicant Pipeline", url: "/pipeline", icon: Target },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "AI Sourcing", url: "/sourcing", icon: Zap },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()
  const [userType] = useState<"jobseeker" | "recruiter">("jobseeker")

  return (
    <Sidebar collapsible="icon" className="border-r border-white/10 bg-slate-900/50 backdrop-blur-xl">
      <SidebarHeader className="border-b border-white/10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 px-2 py-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold text-lg">
            F
          </div>
          {state === "expanded" && (
            <div>
              <h1 className="font-bold text-lg bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                FutureJobs
              </h1>
              <p className="text-xs text-gray-400">AI-Powered Platform</p>
            </div>
          )}
        </motion.div>
      </SidebarHeader>

      <SidebarContent className="text-white">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400 text-xs uppercase tracking-wider">
            Main Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      tooltip={item.title}
                      className="hover:bg-white/10 data-[active=true]:bg-gradient-to-r data-[active=true]:from-purple-600/20 data-[active=true]:to-cyan-600/20 data-[active=true]:border-r-2 data-[active=true]:border-purple-500"
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </motion.div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {userType === "jobseeker" && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-gray-400 text-xs uppercase tracking-wider">Job Seeker</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {jobSeekerItems.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                  >
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.url}
                        tooltip={item.title}
                        className="hover:bg-white/10 data-[active=true]:bg-gradient-to-r data-[active=true]:from-purple-600/20 data-[active=true]:to-cyan-600/20"
                      >
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </motion.div>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {userType === "recruiter" && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-gray-400 text-xs uppercase tracking-wider">
              Recruiter Tools
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {recruiterItems.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                  >
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.url}
                        tooltip={item.title}
                        className="hover:bg-white/10 data-[active=true]:bg-gradient-to-r data-[active=true]:from-purple-600/20 data-[active=true]:to-cyan-600/20"
                      >
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </motion.div>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Notifications" className="hover:bg-white/10">
              <Button variant="ghost" size="sm" className="w-full justify-start text-white">
                <Bell className="h-4 w-4" />
                {state === "expanded" && <span>Notifications</span>}
                <Badge className="ml-auto bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 text-xs">
                  3
                </Badge>
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings" className="hover:bg-white/10">
              <Link href="/settings" className="text-white">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Profile" className="hover:bg-white/10">
              <div className="flex items-center gap-3 w-full text-white">
                <Avatar className="h-8 w-8 border-2 border-purple-500/50">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-sm">
                    JD
                  </AvatarFallback>
                </Avatar>
                {state === "expanded" && (
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">John Doe</p>
                    <p className="text-xs text-gray-400">Pro Member</p>
                  </div>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

