'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, FileText, User, Calendar, Eye, ArrowLeft } from 'lucide-react';

interface Resume {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  atsScore: number | null;
  isActive: boolean;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  _count: {
    applications: number;
    views: number;
  };
}

export default function AdminResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResumes, setTotalResumes] = useState(0);

  const fetchResumes = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchTerm
      });

      const response = await fetch(`/api/admin/resumes?${params}`);
      if (response.ok) {
        const data = await response.json();
        console.log('📥 Admin resumes data received:', {
          total: data.resumes?.length || 0,
          totalPages: data.totalPages,
          totalResumes: data.total
        });
        setResumes(data.resumes || []);
        setTotalPages(data.totalPages || 1);
        setTotalResumes(data.total || 0);
      }
    } catch (_error) {
      console.error('Error fetching resumes:', _error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const handleDownloadResume = async (resumeId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/admin/resumes/${resumeId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download resume. Please try again.');
      }
    } catch (_error) {
      console.error('Error downloading resume:', _error);
      alert('Failed to download resume. Please try again.');
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    return `${Math.round(kb / 1024)} MB`;
  };

  const filteredResumes = resumes.filter(resume =>
    resume.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resume.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${resume.user.firstName || ''} ${resume.user.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/dashboard/admin" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors mb-3 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Resume Management</h1>
        <p className="text-gray-600 mt-2">View and manage all uploaded resumes</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search resumes by name, email, or filename..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      fetchResumes();
                    }
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="text-sm text-gray-600 flex items-center">
              Total: {totalResumes} resumes
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading resumes...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>ATS Score</TableHead>
                    <TableHead>Applications</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResumes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        <p className="text-gray-500">No resumes found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredResumes.map((resume) => (
                      <TableRow key={resume.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium">
                                {resume.user.firstName || resume.user.lastName
                                  ? `${resume.user.firstName || ''} ${resume.user.lastName || ''}`.trim()
                                  : 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">{resume.user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{resume.fileName}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatFileSize(resume.fileSize)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {resume.mimeType?.split('/')[1]?.toUpperCase() || 'PDF'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {resume.atsScore !== null ? (
                            <Badge variant={resume.atsScore >= 70 ? 'default' : resume.atsScore >= 50 ? 'secondary' : 'destructive'}>
                              {resume.atsScore}%
                            </Badge>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{resume._count.applications}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3 text-gray-400" />
                            <span>{resume._count.views}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar className="h-3 w-3" />
                            {new Date(resume.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={resume.isActive ? 'default' : 'secondary'}>
                            {resume.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadResume(resume.id, resume.fileName)}
                            className="flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}