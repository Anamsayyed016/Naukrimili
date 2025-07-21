"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, Bell, MessageSquare, User, Settings, LogOut, Sparkles, Brain, Zap, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export function FuturisticHeader() {
  const [notifications, setNotifications] = useState(3)
  const [messages, setMessages] = useState(5)

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="sticky top-0 z-40 w-full bg-slate-900/80 backdrop-blur-xl border-b border-white/10 supports-[backdrop-filter]:bg-slate-900/60"
    >
      <div className="container flex h-16 items-center px-4 gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 min-w-[100px]" aria-label="Home">
          <img
            src="/naukrimili-logo.png"
            alt="Naukrimili Logo"
            className="h-10 w-auto max-w-[140px] object-contain"
            style={{ maxHeight: 40 }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-logo.png';
            }}
          />
        </Link>
        {/* Navigation Menu for Mobile */}
        <div className="md:hidden">
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-white hover:text-purple-300 transition-colors font-medium">
            Home
          </Link>
          <Link href="/jobs" className="text-white hover:text-purple-300 transition-colors font-medium">
            Jobs
          </Link>
          <Link href="/companies" className="text-white hover:text-purple-300 transition-colors font-medium">
            Companies
          </Link>
          <Link href="/messages" className="text-white hover:text-purple-300 transition-colors font-medium">
            Messages
          </Link>
          <Link href="/dashboard" className="text-white hover:text-purple-300 transition-colors font-medium">
            Dashboard
          </Link>
        </nav>
        {/* AI Search Bar */}
        <div className="flex-1 flex items-center gap-4 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="AI-powered search..."
              className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Badge className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white border-0 text-xs">
                <Brain className="w-3 h-3 mr-1" />
                AI
              </Badge>
            </div>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Link href="/auth/login">
            <Button
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white border-0"
            >
              Login
            </Button>
          </Link>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="ghost" size="sm" className="relative text-white hover:bg-white/10">
              <MessageSquare className="h-4 w-4" />
              {messages > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-xs text-white font-bold"
                >
                  {messages}
                </motion.div>
              )}
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="ghost" size="sm" className="relative text-white hover:bg-white/10">
              <Bell className="h-4 w-4" />
              {notifications > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold"
                >
                  {notifications}
                </motion.div>
              )}
            </Button>
          </motion.div>

          {/* AI Assistant Button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white border-0"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              AI Assistant
            </Button>
          </motion.div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full border-2 border-purple-500/50 hover:border-purple-500"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" alt="@user" />
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white">
                      JD
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 bg-slate-800/90 backdrop-blur-xl border-white/20 text-white"
              align="end"
              forceMount
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">John Doe</p>
                  <p className="text-xs leading-none text-gray-400">john@example.com</p>
                  <Badge className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white border-0 text-xs w-fit mt-1">
                    <Zap className="w-3 h-3 mr-1" />
                    Pro Member
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/20" />
              <DropdownMenuItem className="hover:bg-white/10">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-white/10">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/20" />
              <DropdownMenuItem className="hover:bg-white/10 text-red-400">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  )
}
