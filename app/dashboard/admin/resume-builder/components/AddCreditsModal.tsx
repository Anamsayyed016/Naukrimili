"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2, X, CreditCard } from "lucide-react";

interface AddCreditsModalProps {
  userId: string;
  userName: string;
  currentCredits: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddCreditsModal({ userId, userName, currentCredits, isOpen, onClose, onSuccess }: AddCreditsModalProps) {
  const [credits, setCredits] = useState<string>('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCredits('');
      setReason('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!credits || parseInt(credits) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid number of credits",
        variant: "destructive"
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Reason is required for audit trail",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/resume-users/${userId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_credits',
          value: parseInt(credits),
          reason: reason.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast({
            title: "Success",
            description: data.message || "Credits added successfully"
          });
          onSuccess();
          onClose();
        } else {
          throw new Error(data.error || 'Failed to add credits');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to add credits');
      }
    } catch (error) {
      console.error('Error adding credits:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add credits",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">Add Credits</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="user" className="text-sm font-medium text-gray-700">User</Label>
            <Input
              id="user"
              value={userName}
              disabled
              className="mt-1 bg-gray-50"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Current Credits</Label>
            <Input
              value={currentCredits.toString()}
              disabled
              className="mt-1 bg-gray-50"
            />
          </div>

          <div>
            <Label htmlFor="credits" className="text-sm font-medium text-gray-700">Credits to Add *</Label>
            <Input
              id="credits"
              type="number"
              min="1"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              className="mt-1"
              placeholder="Enter number of credits"
            />
            <p className="text-xs text-gray-500 mt-1">Enter the number of credits to add</p>
          </div>

          <div>
            <Label htmlFor="reason" className="text-sm font-medium text-gray-700">Reason *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1"
              placeholder="Enter reason for adding credits (required for audit trail)"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">This reason will be logged for audit purposes</p>
          </div>
        </div>

        <DialogFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4 mr-2" />
            )}
            Add Credits
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

