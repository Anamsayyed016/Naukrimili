'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateName: string;
  previewImage: string;
  thumbnail?: string;
  onSelect?: () => void;
}

export default function TemplatePreviewModal({
  isOpen,
  onClose,
  templateName,
  previewImage,
  thumbnail,
  onSelect,
}: TemplatePreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-4 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">{templateName}</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="p-6">
          <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden mb-4 shadow-lg">
            {previewImage ? (
              <img
                src={previewImage}
                alt={`${templateName} preview`}
                className="w-full h-auto object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.parentElement?.querySelector('.fallback');
                  if (fallback) {
                    (fallback as HTMLElement).style.display = 'flex';
                  }
                }}
              />
            ) : (
              <div className="fallback w-full aspect-[4/5] flex items-center justify-center bg-gray-200">
                <p className="text-gray-500">Preview image not available</p>
              </div>
            )}
            {!previewImage && (
              <div className="fallback w-full aspect-[4/5] flex items-center justify-center bg-gray-200" style={{ display: 'none' }}>
                <p className="text-gray-500">Preview image not available</p>
              </div>
            )}
          </div>
          
          {onSelect && (
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={onSelect}>
                Use This Template
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

