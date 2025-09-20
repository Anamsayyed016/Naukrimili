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
import { useSocket } from "@/hooks/useSocket";

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

interface ActivityNotification {
  id: string;
  type: 'RESUME_UPLOADED' | 'JOB_APPLIED' | 'JOB_VIEWED' | 'RESUME_VIEWED' | 'PROFILE_UPDATED' | 'APPLICATION_STATUS_CHANGED';
  title: string;
  message: string;
  data?: any;
  timestamp: string;
  isRead: boolean;
}

export default function MessagesPage() {
  const { data: session } = useSession() || {};
  const { socket, isConnected, notifications, unreadCount } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'messages' | 'activities'>('messages');
  const [activityNotifications, setActivityNotifications] = useState<ActivityNotification[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle Socket.io notifications and convert to activity notifications
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const newActivities = notifications
        .filter(notification => 
          ['RESUME_UPLOADED', 'JOB_APPLIED', 'JOB_VIEWED', 'RESUME_VIEWED', 'PROFILE_UPDATED', 'APPLICATION_STATUS_CHANGED'].includes(notification.type)
        )
        .map(notification => ({
          id: notification.id,
          type: notification.type as ActivityNotification['type'],
          title: notification.title,
          message: notification.message,
          data: notification.data,
          timestamp: notification.createdAt || notification.timestamp || new Date().toISOString(),
          isRead: notification.isRead
        }));

      setActivityNotifications(prev => {
        // Merge with existing activities, avoiding duplicates
        const existingIds = prev.map(a => a.id);
        const uniqueNewActivities = newActivities.filter(a => !existingIds.includes(a.id));
        return [...uniqueNewActivities, ...prev];
      });
    }
  }, [notifications]);

  useEffect(() => {
    let isMounted = true;
    
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

        if (isMounted) {
          setConversations(mockConversations);
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching conversations:', error);
          setLoading(false);
        }
      }
    };

    fetchConversations();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      let isMounted = true;
      
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

          if (isMounted) {
            setMessages(mockMessages);
            setTimeout(scrollToBottom, 100);
          }
        } catch (error) {
          if (isMounted) {
            console.error('Error fetching messages:', error);
          }
        }
      };

      fetchMessages();

      return () => {
        isMounted = false;
      };
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

  const getActivityIcon = (type: ActivityNotification['type']) => {
    switch (type) {
      case 'RESUME_UPLOADED':
        return '📄';
      case 'JOB_APPLIED':
        return '💼';
      case 'JOB_VIEWED':
        return '👀';
      case 'RESUME_VIEWED':
        return '👁️';
      case 'PROFILE_UPDATED':
        return '✏️';
      case 'APPLICATION_STATUS_CHANGED':
        return '📊';
      default:
        return '🔔';
    }
  };

  const getActivityColor = (type: ActivityNotification['type']) => {
    switch (type) {
      case 'RESUME_UPLOADED':
        return 'bg-green-100 text-green-800';
      case 'JOB_APPLIED':
        return 'bg-blue-100 text-blue-800';
      case 'JOB_VIEWED':
        return 'bg-yellow-100 text-yellow-800';
      case 'RESUME_VIEWED':
        return 'bg-purple-100 text-purple-800';
      case 'PROFILE_UPDATED':
        return 'bg-orange-100 text-orange-800';
      case 'APPLICATION_STATUS_CHANGED':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages & Activities</h1>
          <p className="text-gray-600">Connect with employers and track your job search activities</p>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 mt-4">
            <button
              onClick={() => setActiveTab('messages')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'messages'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MessageCircle className="h-4 w-4 inline mr-2" />
              Messages
              {conversations.filter(c => c.unreadCount > 0).length > 0 && (
                <Badge className="ml-2 bg-red-500 text-white text-xs">
                  {conversations.filter(c => c.unreadCount > 0).length}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'activities'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Activities
              {activityNotifications.filter(a => !a.isRead).length > 0 && (
                <Badge className="ml-2 bg-orange-500 text-white text-xs">
                  {activityNotifications.filter(a => !a.isRead).length}
                </Badge>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Sidebar - Conversations or Activities */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {activeTab === 'messages' ? 'Conversations' : 'Recent Activities'}
                </CardTitle>
                <Badge variant="secondary">
                  {activeTab === 'messages' 
                    ? `${conversations.filter(c => c.unreadCount > 0).length} unread`
                    : `${activityNotifications.filter(a => !a.isRead).length} new`
                  }
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
                  {activeTab === 'messages' ? (
                    // Messages Tab Content
                    filteredConversations.map((conversation) => (
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
                    ))
                  ) : (
                    // Activities Tab Content
                    activityNotifications.length > 0 ? (
                      activityNotifications.map((activity) => (
                        <div
                          key={activity.id}
                          className={`p-3 rounded-lg transition-colors ${
                            !activity.isRead ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-gray-900 text-sm">
                                  {activity.title}
                                </h4>
                                <span className="text-xs text-gray-500">
                                  {formatTime(activity.timestamp)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
                                {activity.message}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge className={`text-xs ${getActivityColor(activity.type)}`}>
                                  {activity.type.replace('_', ' ')}
                                </Badge>
                                {!activity.isRead && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-sm">No activities yet</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Your job search activities will appear here
                        </p>
                      </div>
                    )
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Main Content Area */}
          <Card className="lg:col-span-2">
            {activeTab === 'messages' ? (
              // Messages Tab - Chat Window
              selectedConv ? (
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
              )
            ) : (
              // Activities Tab - Activity Details
              <CardContent className="p-6">
                <div className="text-center">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Activity Feed</h3>
                  <p className="text-gray-500 mb-4">
                    Track all your job search activities in real-time
                  </p>
                  
                  {/* Connection Status */}
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-600">
                      {isConnected ? 'Real-time connected' : 'Connecting...'}
                    </span>
                  </div>

                  {/* Activity Types Info */}
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl mb-2">📄</div>
                      <h4 className="font-medium text-green-800">Resume Uploads</h4>
                      <p className="text-xs text-green-600">Track when you upload resumes</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl mb-2">💼</div>
                      <h4 className="font-medium text-blue-800">Job Applications</h4>
                      <p className="text-xs text-blue-600">Monitor your applications</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl mb-2">👁️</div>
                      <h4 className="font-medium text-purple-800">Resume Views</h4>
                      <p className="text-xs text-purple-600">See who viewed your resume</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl mb-2">✏️</div>
                      <h4 className="font-medium text-orange-800">Profile Updates</h4>
                      <p className="text-xs text-orange-600">Track profile changes</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
