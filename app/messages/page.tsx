"use client";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Search, 
  User, 
  Building2, 
  Clock,
  MessageCircle,
  Users,
  MoreVertical
} from "lucide-react";
import { useSession } from "next-auth/react";
import AuthGuard from "@/components/auth/AuthGuard";

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  senderName?: string;
  isRead: boolean;
  createdAt: string;
  messageType: string;
}

interface Conversation {
  id: string;
  participantName: string;
  participantRole: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
}

export default function MessagesPage() {
  const { data: session } = useSession() || {};
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        // Mock conversations for demonstration
        const mockConversations: Conversation[] = [
          {
            id: "conv1",
            participantName: "TechCorp HR",
            participantRole: "employer",
            lastMessage: "Thank you for your application. We'd like to schedule an interview.",
            lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            unreadCount: 2,
            isOnline: true
          },
          {
            id: "conv2",
            participantName: "StartupXYZ Recruiter",
            participantRole: "employer",
            lastMessage: "Great profile! Are you open to remote work?",
            lastMessageTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            unreadCount: 0,
            isOnline: false
          },
          {
            id: "conv3",
            participantName: "Innovation Labs",
            participantRole: "employer",
            lastMessage: "We received your application for the Software Engineer position.",
            lastMessageTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            unreadCount: 1,
            isOnline: true
          }
        ];

        setConversations(mockConversations);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      const fetchMessages = async () => {
        try {
          // Mock messages for demonstration
          const mockMessages: Message[] = [
            {
              id: "msg1",
              content: "Hi! I saw your profile and think you'd be a great fit for our open position.",
              senderId: "employer1",
              receiverId: session?.user?.id || "user1",
              senderName: "TechCorp HR",
              isRead: true,
              createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
              messageType: "text"
            },
            {
              id: "msg2",
              content: "Thank you for reaching out! I'm very interested in learning more about the opportunity.",
              senderId: session?.user?.id || "user1",
              receiverId: "employer1",
              senderName: session?.user?.name || "You",
              isRead: true,
              createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
              messageType: "text"
            },
            {
              id: "msg3",
              content: "Great! We'd like to schedule a video interview for next week. Are you available?",
              senderId: "employer1",
              receiverId: session?.user?.id || "user1",
              senderName: "TechCorp HR",
              isRead: false,
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              messageType: "text"
            }
          ];

          setMessages(mockMessages);
          setTimeout(scrollToBottom, 100);
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      };

      fetchMessages();
    }
  }, [selectedConversation, session]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: `msg_${Date.now()}`,
      content: newMessage,
      senderId: session?.user?.id || "user1",
      receiverId: "employer1",
      senderName: session?.user?.name || "You",
      isRead: false,
      createdAt: new Date().toISOString(),
      messageType: "text"
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");
    setTimeout(scrollToBottom, 100);

    // Update conversation last message
    setConversations(prev => 
      prev.map(conv => 
        conv.id === selectedConversation 
          ? { ...conv, lastMessage: newMessage, lastMessageTime: new Date().toISOString() }
          : conv
      )
    );
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConv = conversations.find(conv => conv.id === selectedConversation);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          <Card className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2 animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
          <p className="text-gray-600">Connect with employers and manage your conversations</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Conversations</CardTitle>
                <Badge variant="secondary">
                  {conversations.filter(c => c.unreadCount > 0).length} unread
                </Badge>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[450px]">
                <div className="space-y-1 p-4">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedConversation === conversation.id
                          ? 'bg-blue-50 border-l-4 border-blue-500'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="relative">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-blue-600" />
                            </div>
                            {conversation.isOnline && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900 truncate">
                                {conversation.participantName}
                              </h4>
                              <span className="text-xs text-gray-500">
                                {formatTime(conversation.lastMessageTime)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.lastMessage}
                            </p>
                          </div>
                        </div>
                        {conversation.unreadCount > 0 && (
                          <Badge className="ml-2 bg-red-500 text-white text-xs min-w-[20px] h-5 p-0 flex items-center justify-center">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Window */}
          <Card className="lg:col-span-2">
            {selectedConv ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedConv.participantName}</h3>
                        <p className="text-sm text-gray-500">
                          {selectedConv.isOnline ? "Online" : "Offline"}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px] p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.senderId === session?.user?.id ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              message.senderId === session?.user?.id
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                message.senderId === session?.user?.id
                                  ? 'text-blue-100'
                                  : 'text-gray-500'
                              }`}
                            >
                              {new Date(message.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1"
                      />
                      <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                  <p className="text-gray-500">Choose a conversation from the list to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
