"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Building2, 
  CheckCircle, 
  AlertTriangle,
  Lock,
  Info
} from 'lucide-react';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoleSelect: (role: 'jobseeker' | 'employer') => void;
  userEmail?: string;
  isLogin?: boolean;
}

export default function RoleSelectionModal({ 
  isOpen, 
  onClose, 
  onRoleSelect, 
  userEmail,
  isLogin = false 
}: RoleSelectionModalProps) {
  const [selectedRole, setSelectedRole] = useState<'jobseeker' | 'employer' | null>(null);
  const [isLocking, setIsLocking] = useState(false);

  if (!isOpen) return null;

  const handleRoleConfirm = async () => {
    if (!selectedRole) return;

    setIsLocking(true);
    try {
      // Call the role lock API
      const response = await fetch('/api/auth/lock-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          role: selectedRole,
          reason: `Role locked as ${selectedRole} after ${isLogin ? 'login' : 'registration'}`
        }),
      });

      if (response.ok) {
        onRoleSelect(selectedRole);
      } else {
        const error = await response.json();
        console.error('Failed to lock role:', error);
        alert('Failed to confirm role selection. Please try again.');
      }
    } catch (error) {
      console.error('Error locking role:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {isLogin ? 'Select Your Role' : 'Choose Your Account Type'}
          </CardTitle>
          <p className="text-gray-600 mt-2">
            {isLogin 
              ? `Welcome back! Please select how you'd like to access your account.`
              : 'This choice will determine your experience on our platform.'
            }
          </p>
          {userEmail && (
            <Badge variant="outline" className="mt-2">
              <User className="h-3 w-3 mr-1" />
              {userEmail}
            </Badge>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Role Lock Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">Important: Role Lock</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Once you select a role, you won't be able to switch between jobseeker and employer accounts. 
                  This ensures data integrity and prevents conflicts.
                </p>
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Jobseeker Option */}
            <Card 
              className={`cursor-pointer transition-all duration-200 ${
                selectedRole === 'jobseeker' 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedRole('jobseeker')}
            >
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Job Seeker</CardTitle>
                <p className="text-sm text-gray-600">
                  Looking for job opportunities
                </p>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Browse and apply to jobs
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Upload and manage resume
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Track applications
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Get job recommendations
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Employer Option */}
            <Card 
              className={`cursor-pointer transition-all duration-200 ${
                selectedRole === 'employer' 
                  ? 'ring-2 ring-green-500 bg-green-50' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedRole('employer')}
            >
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <Building2 className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">Employer</CardTitle>
                <p className="text-sm text-gray-600">
                  Hiring talent for your company
                </p>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Post job openings
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Manage applications
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Review candidate profiles
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Company dashboard
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Confirmation Message */}
          {selectedRole && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800">Confirm Your Selection</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    You've selected <strong>{selectedRole === 'jobseeker' ? 'Job Seeker' : 'Employer'}</strong>. 
                    This choice cannot be changed later. Are you sure you want to proceed?
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isLocking}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRoleConfirm}
              disabled={!selectedRole || isLocking}
              className="min-w-[120px]"
            >
              {isLocking ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Confirming...
                </>
              ) : (
                'Confirm & Continue'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
