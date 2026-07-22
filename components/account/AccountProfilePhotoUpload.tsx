'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  ImageIcon,
  Loader2,
  RotateCcw,
  RotateCw,
  Trash2,
  Upload,
  ZoomOut,
} from 'lucide-react';
import UserAvatar from '@/components/account/UserAvatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { renderProfileImageCrop } from '@/lib/resume-builder/profile-image-crop';

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;
const DEFAULT_FILTERS = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  blur: 0,
  grayscale: 0,
};

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

function pickWebpMime(): string {
  if (typeof document === 'undefined') return 'image/jpeg';
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').startsWith('data:image/webp')
    ? 'image/webp'
    : 'image/jpeg';
}

export interface AccountProfilePhotoUploadProps {
  profilePicture?: string | null;
  oauthImage?: string | null;
  firstName?: string;
  lastName?: string;
  email?: string;
  cacheVersion?: string | number | null;
  disabled?: boolean;
  onPhotoSaved: (payload: {
    profilePicture: string;
    avatarUrl: string | null;
    version: number;
  }) => void | Promise<void>;
  onPhotoRemoved: (payload: {
    avatarUrl: string | null;
    version: number;
  }) => void | Promise<void>;
}

export default function AccountProfilePhotoUpload({
  profilePicture,
  oauthImage,
  firstName,
  lastName,
  email,
  cacheVersion,
  disabled,
  onPhotoSaved,
  onPhotoRemoved,
}: AccountProfilePhotoUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [sourceSrc, setSourceSrc] = useState<string | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [localVersion, setLocalVersion] = useState<number | null>(null);

  const displayVersion = localVersion ?? cacheVersion;

  const resetCropState = useCallback(() => {
    setSourceSrc(null);
    setPreviewSrc(null);
    setZoom(1);
    setRotation(0);
  }, []);

  const closeCropDialog = useCallback(() => {
    setCropOpen(false);
    resetCropState();
  }, [resetCropState]);

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type.toLowerCase())) {
      return 'Use JPG, PNG, or WebP images only.';
    }
    if (file.size > MAX_BYTES) {
      return 'Image must be 5MB or smaller.';
    }
    return null;
  }, []);

  const openWithFile = useCallback(
    (file: File) => {
      const error = validateFile(file);
      if (error) {
        toast({ title: 'Invalid image', description: error, variant: 'destructive' });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : null;
        if (!result) return;
        setSourceSrc(result);
        setPreviewSrc(result);
        setZoom(1);
        setRotation(0);
        setCropOpen(true);
      };
      reader.onerror = () => {
        toast({
          title: 'Could not read image',
          description: 'Please try another file.',
          variant: 'destructive',
        });
      };
      reader.readAsDataURL(file);
    },
    [toast, validateFile]
  );

  const refreshPreview = useCallback(async () => {
    if (!sourceSrc) return;
    try {
      const cropped = await renderProfileImageCrop({
        imageSrc: sourceSrc,
        zoom,
        rotation,
        filters: DEFAULT_FILTERS,
        outputSize: 512,
        quality: 0.9,
      });
      setPreviewSrc(cropped);
    } catch {
      setPreviewSrc(sourceSrc);
    }
  }, [rotation, sourceSrc, zoom]);

  useEffect(() => {
    if (!cropOpen || !sourceSrc) return;
    void refreshPreview();
  }, [cropOpen, refreshPreview, rotation, sourceSrc, zoom]);

  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items || disabled || uploading || removing) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            openWithFile(file);
          }
          break;
        }
      }
    },
    [disabled, openWithFile, removing, uploading]
  );

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const handleSave = async () => {
    if (!sourceSrc) return;
    setUploading(true);
    try {
      const cropped = await renderProfileImageCrop({
        imageSrc: sourceSrc,
        zoom,
        rotation,
        filters: DEFAULT_FILTERS,
        outputSize: 512,
        quality: 0.9,
      });

      const mime = pickWebpMime();
      const blob = await dataUrlToBlob(cropped);
      const extension = mime === 'image/webp' ? 'webp' : 'jpg';
      const file = new File([blob], `profile.${extension}`, { type: mime });

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/user/profile-photo', {
        method: 'POST',
        body: formData,
      });
      const json = await response.json().catch(() => ({}));

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Upload failed');
      }

      const version = json.version ?? Date.now();
      setLocalVersion(version);
      await onPhotoSaved({
        profilePicture: json.profilePicture,
        avatarUrl: json.avatarUrl ?? null,
        version,
      });

      toast({
        title: 'Profile photo updated',
        description: 'Your new photo is visible across the portal.',
      });
      closeCropDialog();
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const response = await fetch('/api/user/profile-photo', { method: 'DELETE' });
      const json = await response.json().catch(() => ({}));

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Remove failed');
      }

      const version = json.version ?? Date.now();
      setLocalVersion(version);
      await onPhotoRemoved({
        avatarUrl: json.avatarUrl ?? null,
        version,
      });

      toast({
        title: 'Profile photo removed',
        description: oauthImage
          ? 'Your OAuth profile image is still available.'
          : 'Your default avatar is restored.',
      });
      setRemoveOpen(false);
    } catch (error) {
      toast({
        title: 'Remove failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRemoving(false);
    }
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (file) openWithFile(file);
  };

  const hasAccountPhoto = Boolean(profilePicture?.trim());

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
      <UserAvatar
        profilePicture={profilePicture}
        image={oauthImage}
        firstName={firstName}
        lastName={lastName}
        email={email}
        size="xl"
        cacheVersion={displayVersion}
        className="border-2 border-white shadow-md ring-1 ring-slate-200"
      />

      <div className="min-w-0 flex-1 space-y-4">
        <div
          onDragEnter={(e) => {
            e.preventDefault();
            if (!disabled) setDragActive(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragActive(false);
          }}
          onDrop={onDrop}
          className={cn(
            'rounded-xl border border-dashed px-4 py-5 transition-colors',
            dragActive
              ? 'border-indigo-400 bg-indigo-50/50'
              : 'border-slate-200 bg-slate-50/40'
          )}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
              <ImageIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-slate-900">
                Upload your account profile photo
              </p>
              <p className="text-[13px] leading-relaxed text-slate-500">
                Drag and drop, browse files, use your camera, or paste an image.
                JPG, PNG, or WebP up to 5MB. This is separate from your resume
                photo.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) openWithFile(file);
                e.target.value = '';
              }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) openWithFile(file);
                e.target.value = '';
              }}
            />

            <Button
              type="button"
              variant="default"
              className="rounded-xl"
              disabled={disabled || uploading || removing}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              {hasAccountPhoto ? 'Change photo' : 'Upload photo'}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={disabled || uploading || removing}
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="mr-2 h-4 w-4" />
              Camera
            </Button>

            {hasAccountPhoto ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl text-red-600 hover:text-red-700"
                disabled={disabled || uploading || removing}
                onClick={() => setRemoveOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove photo
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <Dialog open={cropOpen} onOpenChange={(open) => !open && closeCropDialog()}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Adjust your photo</DialogTitle>
            <DialogDescription>
              Crop, zoom, and rotate before saving. Your image will be optimized
              automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="mx-auto flex h-56 w-56 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
              {previewSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewSrc}
                  alt="Crop preview"
                  className="h-full w-full object-cover object-center"
                />
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <ZoomOut className="h-3.5 w-3.5" />
                  Zoom
                </span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.01}
                onValueChange={(value) => setZoom(value[0] ?? 1)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setRotation((r) => r - 90)}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Rotate left
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setRotation((r) => r + 90)}
              >
                <RotateCw className="mr-2 h-4 w-4" />
                Rotate right
              </Button>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={uploading}
              onClick={closeCropDialog}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              disabled={uploading || !sourceSrc}
              onClick={() => void handleSave()}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save photo'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove profile photo?</AlertDialogTitle>
            <AlertDialogDescription>
              Your uploaded account photo will be removed.
              {oauthImage
                ? ' Your OAuth provider image will remain as the fallback.'
                : ' You will see your initials until you upload a new photo.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={removing}
              onClick={(e) => {
                e.preventDefault();
                void handleRemove();
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {removing ? 'Removing…' : 'Remove photo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
