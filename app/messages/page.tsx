"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Search, Send, Paperclip, MoreVertical, Phone, Video, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

const conversations = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "Senior Recruiter at TechFlow",
    avatar: "/placeholder.svg?height=40&width=40",
    lastMessage:
      "Thanks for your interest! I'd love to schedule a call to discuss the Senior Frontend Engineer position.",
    timestamp: "2 min ago",
    unread: 2,
    online: true,
    company: "TechFlow",
  },
  {
    id: 2,
    name: "Mike Rodriguez",
    role: "Hiring Manager at DataVision",
    avatar: "/placeholder.svg?height=40&width=40",
    lastMessage:
      "Your background looks great for our Product Manager role. Are you available for a quick chat this week?",
    timestamp: "1 hour ago",
    unread: 0,
    online: false,
    company: "DataVision",
  },
  {
    id: 3,
    name: "Emily Johnson",
    role: "CTO at CloudNine",
    avatar: "/placeholder.svg?height=40&width=40",
    lastMessage: "I reviewed your portfolio and I'm impressed. Let's discuss the Full Stack Developer position.",
    timestamp: "3 hours ago",
    unread: 1,
    online: true,
    company: "CloudNine",
  },
  {
    id: 4,
    name: "Alex Kim",
    role: "Design Lead at DesignLab",
    avatar: "/placeholder.svg?height=40&width=40",
    lastMessage: "Your design work is exactly what we're looking for. When can we schedule an interview?",
    timestamp: "1 day ago",
    unread: 0,
    online: false,
    company: "DesignLab",
  },
]

const messages = [
  {
    id: 1,
    sender: "Sarah Chen",
    content: "Hi John! I came across your profile and I'm really impressed with your frontend development experience.",
    timestamp: "10:30 AM",
    isMe: false,
  },
  {
    id: 2,
    sender: "Me",
    content: "Thank you for reaching out! I'm definitely interested in learning more about opportunities at TechFlow.",
    timestamp: "10:45 AM",
    isMe: true,
  },
  {
    id: 3,
    sender: "Sarah Chen",
    content:
      "Great! We have a Senior Frontend Engineer position that I think would be perfect for you. The role involves working with React, TypeScript, and Next.js - which I see you have extensive experience with.",
    timestamp: "10:47 AM",
    isMe: false,
  },
  {
    id: 4,
    sender: "Me",
    content:
      "That sounds very interesting! Could you tell me more about the team structure and the specific projects I'd be working on?",
    timestamp: "11:00 AM",
    isMe: true,
  },
  {
    id: 5,
    sender: "Sarah Chen",
    content:
      "You'd be joining a team of 8 engineers working on our core platform. The main projects include rebuilding our dashboard with modern React patterns and implementing a new design system.",
    timestamp: "11:15 AM",
    isMe: false,
  },
  {
    id: 6,
    sender: "Sarah Chen",
    content: "Thanks for your interest! I'd love to schedule a call to discuss the Senior Frontend Engineer position.",
    timestamp: "2 min ago",
    isMe: false,
  },
]

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Add message logic here
      setNewMessage("")
    }
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex">
      {/* Conversations List */}
      <div className="w-80 border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-semibold mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {conversations.map((conversation) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                  selectedConversation.id === conversation.id ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                }`}
                onClick={() => setSelectedConversation(conversation)}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conversation.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {conversation.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-sm truncate">{conversation.name}</h3>
                      <span className="text-xs text-gray-500">{conversation.timestamp}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{conversation.role}</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{conversation.lastMessage}</p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-xs">
                        {conversation.company}
                      </Badge>
                      {conversation.unread > 0 && (
                        <Badge className="bg-blue-600 text-white text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
                          {conversation.unread}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedConversation.avatar || "/placeholder.svg"} />
                <AvatarFallback>
                  {selectedConversation.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              {selectedConversation.online && (
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>
            <div>
              <h2 className="font-semibold">{selectedConversation.name}</h2>
              <p className="text-sm text-gray-600">{selectedConversation.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Star className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.isMe ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-xs lg:max-w-md ${message.isMe ? "order-2" : "order-1"}`}>
                  {!message.isMe && (
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={selectedConversation.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">
                          {selectedConversation.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-600">{message.sender}</span>
                    </div>
                  )}
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.isMe ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <p className={`text-xs text-gray-500 mt-1 ${message.isMe ? "text-right" : "text-left"}`}>
                    {message.timestamp}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t bg-white">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Paperclip className="h-4 w-4" />
            </Button>
            <div className="flex-1 relative">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="pr-12"
              />
              <Button
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={handleSendMessage}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
;