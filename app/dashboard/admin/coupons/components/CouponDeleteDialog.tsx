'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

interface CouponDeleteDialogProps {
  open: boolean;
  couponCode?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CouponDeleteDialog({
  open,
  couponCode,
  loading,
  onClose,
  onConfirm,
}: CouponDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent className="sm:max-w-md bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold text-gray-900">
            Delete Coupon
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 space-y-2">
            <span className="block">
              Are you sure you want to permanently delete this coupon
              {couponCode ? (
                <>
                  {' '}
                  <span className="font-mono font-semibold text-gray-900">{couponCode}</span>
                </>
              ) : null}
              ?
            </span>
            <span className="block">This action cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={loading} className="border-gray-300">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete Coupon
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
