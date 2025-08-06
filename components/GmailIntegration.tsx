"use client";
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Send, 
  Search, 
  RefreshCw, 
  User, 
  Calendar,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface Email {
  id: string;
  threadId: string;
  snippet: string;
  headers: Record<string, string>;
  body: string;
  internalDate: string;
}

export default function GmailIntegration() {
  const { data: session } = useSession();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    body: ''
  });

  // Fetch emails
  const fetchEmails = useCallback(async (query?: string) => {
    if (!session?.accessToken) {
      // console.warn('No access token available');
      return;
    }
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      params.append('maxResults', '10');
      
      const response = await fetch(`/api/gmail/emails?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setEmails(data.emails);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, setLoading, setEmails]);

  // Send email
  const sendEmail = async () => {
    if (!session?.accessToken) return;
    
    setSending(true);
    try {
      const response = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(composeData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowCompose(false);
        setComposeData({ to: '', subject: '', body: '' });
        // Refresh emails
        fetchEmails();
      }
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setSending(false);
    }
  };

  // Load emails on component mount
  useEffect(() => {
    if (session?.accessToken) {
      fetchEmails();
    }
  }, [session, fetchEmails]);

  if (!session?.accessToken) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-yellow-700">
            <AlertCircle className="w-5 h-5" />
            <span>Please sign in with Google to access Gmail integration</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="w-8 h-8 text-blue-500" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gmail Integration</h2>
            <p className="text-gray-600">Manage your emails directly from the job portal</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => fetchEmails()}
            disabled={loading}
            variant="outline"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </Button>
          <Button
            onClick={() => setShowCompose(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Compose
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchEmails(searchQuery)}
            />
            <Button
              onClick={() => fetchEmails(searchQuery)}
              disabled={loading}
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Compose Email Modal */}
      {showCompose && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Compose Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="To:"
              value={composeData.to}
              onChange={(e) => setComposeData(prev => ({ ...prev, to: e.target.value }))}
            />
            <Input
              placeholder="Subject:"
              value={composeData.subject}
              onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
            />
            <Textarea
              placeholder="Email body..."
              value={composeData.body}
              onChange={(e) => setComposeData(prev => ({ ...prev, body: e.target.value }))}
              rows={6}
            />
            <div className="flex gap-2">
              <Button
                onClick={sendEmail}
                disabled={sending || !composeData.to || !composeData.subject || !composeData.body}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send Email
              </Button>
              <Button
                onClick={() => setShowCompose(false)}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : emails.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              No emails found
            </CardContent>
          </Card>
        ) : (
          emails.map((email) => (
            <Card key={email.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {email.headers.From || 'Unknown Sender'}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {email.headers.Date ? new Date(email.headers.Date).toLocaleDateString() : 'No date'}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {email.headers.Subject || 'No Subject'}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {email.snippet}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 