'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Slider from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useResponsive } from '@/components/ui/use-mobile';
import { 
  Upload, Camera, Crop, RotateCw, RotateCcw, ZoomIn, ZoomOut, 
  X, Check, Image as ImageIcon, RefreshCw, Circle, Square, Loader2,
  Sun, Contrast as ContrastIcon, Palette, Filter, 
  ImageOff, ChevronDown, ChevronUp, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoUploadProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

type CropShape = 'circle' | 'square';
type FilterType = 'brightness' | 'contrast' | 'saturate' | 'blur' | 'grayscale';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

// FilterSection component - moved outside to prevent React error #130
const FilterSection = ({ 
  id: _id,
  title, 
  icon, 
  children,
  isOpen,
  onToggle,
  onReset,
  isMobile
}: { 
  id: string;
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onReset?: () => void;
  isMobile: boolean;
}) => {
  return (
    <motion.div 
      className="border border-gray-200 rounded-lg overflow-hidden bg-white"
      initial={false}
      animate={{ 
        borderColor: isOpen ? 'rgb(59, 130, 246)' : 'rgb(229, 231, 235)'
      }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'flex-1 px-3 py-2.5 bg-gradient-to-r transition-all duration-200 flex items-center justify-between',
            isOpen 
              ? 'from-blue-50 to-blue-100/50' 
              : 'from-gray-50 to-gray-50 hover:from-gray-100 hover:to-gray-100'
          )}
        >
          <div className="flex items-center gap-2.5">
            <div className={cn(
              'p-1.5 rounded-md transition-colors',
              isOpen ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
            )}>
              {icon}
            </div>
            <span className={cn(
              'font-semibold',
              isMobile ? 'text-xs' : 'text-sm',
              isOpen ? 'text-blue-700' : 'text-gray-900'
            )}>
              {title}
            </span>
          </div>
          {isOpen ? (
            <ChevronUp className={cn('text-gray-600', isMobile ? 'w-4 h-4' : 'w-4 h-4')} />
          ) : (
            <ChevronDown className={cn('text-gray-400', isMobile ? 'w-4 h-4' : 'w-4 h-4')} />
          )}
        </button>
        {onReset && isOpen && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReset();
            }}
            className={cn(
              'px-2.5 py-2.5 text-blue-600 hover:bg-blue-50 border-l border-gray-200 shrink-0',
              isMobile ? 'text-[10px]' : 'text-xs'
            )}
          >
            Reset
          </button>
        )}
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
            style={{ pointerEvents: 'auto' }}
          >
            <div className={cn('p-3 space-y-3', isMobile && 'p-2.5 space-y-2.5')} style={{ pointerEvents: 'auto' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function PhotoUpload({ value, onChange, className }: PhotoUploadProps) {
  const { toast } = useToast();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [isOpen, setIsOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cropShape, setCropShape] = useState<CropShape>('circle');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturate: 100,
    blur: 0,
    grayscale: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>('transform');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const isNewImageRef = useRef(false);

  useEffect(() => {
    if (!isOpen && value !== undefined) {
      setImageSrc(value || '');
    }
  }, [value, isOpen]);

  // Reset editor state only when opening dialog with a NEW image (not when editing existing)
  useEffect(() => {
    if (isOpen && imageSrc && isNewImageRef.current) {
      // Only reset if this is a brand new image (not editing existing)
      setZoom(1);
      setRotation(0);
      setFilters({
        brightness: 100,
        contrast: 100,
        saturate: 100,
        blur: 0,
        grayscale: 0,
      });
      isNewImageRef.current = false; // Reset flag
    }
  }, [isOpen, imageSrc]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: 'Please select a PNG or JPG image' };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }
    return { valid: true };
  }, []);

  const processFile = useCallback((file: File) => {
    console.log('[PhotoUpload] Processing file:', { name: file.name, size: file.size, type: file.type });
    const validation = validateFile(file);
    if (!validation.valid) {
      console.warn('[PhotoUpload] File validation failed:', validation.error);
      toast({
        title: 'Invalid file',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        console.log('[PhotoUpload] File read successfully, opening dialog');
        isNewImageRef.current = true; // Mark as new image
        setImageSrc(result);
        // Use setTimeout to ensure state is updated before opening dialog
        setTimeout(() => {
          console.log('[PhotoUpload] Setting dialog open');
          setIsOpen(true);
        }, 0);
        setIsLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('[PhotoUpload] Error in reader onload:', error);
        setIsLoading(false);
        toast({
          title: 'Error reading file',
          description: 'Failed to process the image file. Please try again.',
          variant: 'destructive',
        });
      }
    };
    reader.onerror = (error) => {
      console.error('[PhotoUpload] FileReader error:', error);
      setIsLoading(false);
      toast({
        title: 'Error reading file',
        description: 'Failed to read the image file. Please try again.',
        variant: 'destructive',
      });
    };
    reader.readAsDataURL(file);
  }, [validateFile, toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleFileSelect = useCallback((file: File) => {
    processFile(file);
  }, [processFile]);

  const handleUpload = useCallback(() => {
    console.log('[PhotoUpload] Upload button clicked');
    if (fileInputRef.current) {
      console.log('[PhotoUpload] Triggering file input click');
      fileInputRef.current.click();
    } else {
      console.error('[PhotoUpload] File input ref not available');
      toast({
        title: 'Error',
        description: 'Unable to open file picker. Please try again.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleCamera = useCallback(async () => {
    console.log('[PhotoUpload] Camera button clicked');
    try {
      // Check for camera support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('[PhotoUpload] Camera API not supported');
        toast({
          title: 'Camera not supported',
          description: 'Your browser does not support camera access.',
          variant: 'destructive',
        });
        return;
      }

      // Stop existing stream if any
      if (streamRef.current) {
        console.log('[PhotoUpload] Stopping existing stream');
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Open dialog first so video element is rendered
      console.log('[PhotoUpload] Opening dialog to render video element');
      setIsOpen(true);
      
      // Wait for dialog to render and video element to be available
      await new Promise<void>((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 50 * 50ms = 2.5 seconds max wait
        const checkVideoElement = () => {
          if (videoRef.current) {
            console.log('[PhotoUpload] Video element is now available');
            resolve();
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(checkVideoElement, 50);
          } else {
            console.error('[PhotoUpload] Video element timeout - dialog may not have rendered');
            reject(new Error('Video element not available - dialog failed to render'));
          }
        };
        checkVideoElement();
      });

      // Now request camera access
      console.log('[PhotoUpload] Requesting camera access');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      console.log('[PhotoUpload] Camera stream obtained, setting on video element');
      streamRef.current = stream;
      
      // Set stream on video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('[PhotoUpload] Video stream set successfully');
      } else {
        console.error('[PhotoUpload] Video ref not available after dialog opened');
        // Clean up stream
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        throw new Error('Video element not available');
      }
    } catch (error: unknown) {
      console.error('[PhotoUpload] Camera access error:', error);
      const errorObj = error as { name?: string };
      const errorMessage = errorObj?.name === 'NotAllowedError' 
        ? 'Camera permission denied. Please allow camera access in your browser settings.'
        : errorObj?.name === 'NotFoundError'
        ? 'No camera found on this device.'
        : 'Unable to access camera. Please check permissions and try again.';
      
      toast({
        title: 'Camera access denied',
        description: errorMessage,
        variant: 'destructive',
      });
      // Close dialog if camera access failed
      setIsOpen(false);
    }
  }, [toast]);

  const captureFromCamera = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    const dataUrl = canvas.toDataURL('image/png');
    isNewImageRef.current = true; // Mark as new image
    setImageSrc(dataUrl);
  }, []);

  const processImage = useCallback(() => {
    if (!imageSrc) return Promise.resolve('');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    return new Promise<string>((resolve, reject) => {
      img.onerror = () => reject(new Error('Failed to load image'));
      img.onload = () => {
        try {
          // Ensure canvas is available - create one if ref is not set
          let canvas = canvasRef.current;
          if (!canvas) {
            canvas = document.createElement('canvas');
            canvasRef.current = canvas;
          }
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(imageSrc);
            return;
          }
          const baseSize = Math.max(img.width, img.height);
          const size = baseSize * Math.max(zoom, 1);
          canvas.width = size;
          canvas.height = size;
          ctx.clearRect(0, 0, size, size);
          ctx.save();
          ctx.translate(size / 2, size / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.translate(-size / 2, -size / 2);
          const zoomedWidth = img.width * zoom;
          const zoomedHeight = img.height * zoom;
          const offsetX = (size - zoomedWidth) / 2;
          const offsetY = (size - zoomedHeight) / 2;
          ctx.drawImage(img, offsetX, offsetY, zoomedWidth, zoomedHeight);
          ctx.restore();
          // Apply brightness, contrast, and grayscale filters to image data
          // Note: These need to be applied via pixel manipulation to match CSS filter behavior
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const brightnessFactor = filters.brightness / 100; // CSS brightness is multiplicative
          const contrastFactor = filters.contrast / 100;
          const intercept = 128 * (1 - contrastFactor);
          
          for (let i = 0; i < data.length; i += 4) {
            // Store original RGB values
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];
            
            // Apply brightness (multiplicative to match CSS filter)
            r = r * brightnessFactor;
            g = g * brightnessFactor;
            b = b * brightnessFactor;
            
            // Apply contrast (multiplicative with intercept)
            r = r * contrastFactor + intercept;
            g = g * contrastFactor + intercept;
            b = b * contrastFactor + intercept;

            // Apply saturation
            if (filters.saturate !== 100) {
              const satFactor = filters.saturate / 100;
              const gray = r * 0.299 + g * 0.587 + b * 0.114;
              r = gray + (r - gray) * satFactor;
              g = gray + (g - gray) * satFactor;
              b = gray + (b - gray) * satFactor;
            }
            
            // Apply grayscale if needed
            if (filters.grayscale > 0) {
              const gray = r * 0.299 + g * 0.587 + b * 0.114;
              const grayAmount = filters.grayscale / 100;
              r = r * (1 - grayAmount) + gray * grayAmount;
              g = g * (1 - grayAmount) + gray * grayAmount;
              b = b * (1 - grayAmount) + gray * grayAmount;
            }
            
            // Clamp values to valid range and apply
            data[i] = Math.min(255, Math.max(0, Math.round(r)));
            data[i + 1] = Math.min(255, Math.max(0, Math.round(g)));
            data[i + 2] = Math.min(255, Math.max(0, Math.round(b)));
          }
          
          ctx.putImageData(imageData, 0, 0);
          
          // Apply blur using CSS filter on canvas (matches live preview)
          if (filters.blur > 0) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            if (tempCtx) {
              tempCtx.filter = `blur(${filters.blur}px)`;
              tempCtx.drawImage(canvas, 0, 0);
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(tempCanvas, 0, 0);
            }
          }
          // Apply crop shape to create final image
          const finalSize = Math.min(canvas.width, canvas.height);
          const finalCanvas = document.createElement('canvas');
          finalCanvas.width = finalSize;
          finalCanvas.height = finalSize;
          const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: false });
          if (!finalCtx) {
            resolve(canvas.toDataURL('image/png'));
            return;
          }
          
          // Clear the final canvas
          finalCtx.clearRect(0, 0, finalSize, finalSize);
          
          // Calculate source coordinates for center crop
          const sourceX = Math.round((canvas.width - finalSize) / 2);
          const sourceY = Math.round((canvas.height - finalSize) / 2);
          
          if (cropShape === 'circle') {
            // For circle: create clipping path, then draw image
            finalCtx.save();
            finalCtx.beginPath();
            finalCtx.arc(finalSize / 2, finalSize / 2, finalSize / 2, 0, Math.PI * 2);
            finalCtx.closePath();
            finalCtx.clip();
            // Fill with white background first (for transparency)
            finalCtx.fillStyle = '#FFFFFF';
            finalCtx.fill();
            // Draw the cropped image
            finalCtx.drawImage(canvas, sourceX, sourceY, finalSize, finalSize, 0, 0, finalSize, finalSize);
            finalCtx.restore();
          } else {
            // For square: draw image directly (no clipping needed)
            finalCtx.drawImage(canvas, sourceX, sourceY, finalSize, finalSize, 0, 0, finalSize, finalSize);
          }
          
          // Generate and return the cropped image as base64
          const croppedImageDataUrl = finalCanvas.toDataURL('image/png');
          resolve(croppedImageDataUrl);
        } catch (error) {
          reject(error);
        }
      };
      img.src = imageSrc;
    });
  }, [imageSrc, zoom, rotation, filters, cropShape]);

  const handleReset = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setCropShape('circle');
    setFilters({
      brightness: 100,
      contrast: 100,
      saturate: 100,
      blur: 0,
      grayscale: 0,
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!imageSrc) {
      toast({
        title: 'No image',
        description: 'Please select an image first.',
        variant: 'destructive',
      });
      return;
    }
    setIsProcessing(true);
    try {
      const finalImage = await processImage();
      if (finalImage) {
        onChange(finalImage);
        setImageSrc(finalImage);
        handleReset();
      }
      setIsOpen(false);
      toast({
        title: 'Photo saved',
        description: 'Your profile photo has been updated.',
      });
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: 'Error processing image',
        description: 'Failed to process the image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [processImage, onChange, imageSrc, toast, handleReset]);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    if (!open) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }, []);

  const handleRemovePhoto = useCallback(() => {
    onChange('');
    setImageSrc('');
    handleReset();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsOpen(false);
    toast({
      title: 'Photo removed',
      description: 'Profile photo has been removed.',
    });
  }, [onChange, handleReset, toast]);

  const toggleSection = useCallback((section: string) => {
    setActiveSection((prev) => (prev === section ? null : section));
  }, []);

  const resetCrop = useCallback(() => setCropShape('circle'), []);
  const resetTransform = useCallback(() => {
    setZoom(1);
    setRotation(0);
  }, []);
  const resetAdjustments = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      brightness: 100,
      contrast: 100,
      saturate: 100,
    }));
  }, []);
  const resetEffects = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      blur: 0,
      grayscale: 0,
    }));
  }, []);

  const updateFilter = useCallback((key: FilterType, value: number) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      return newFilters;
    });
  }, []);

  const hasImage = !!value;
  const previewSize = isMobile ? 168 : isTablet ? 200 : 220;
  const previewFilter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%) blur(${filters.blur}px) grayscale(${filters.grayscale}%)`;

  return (
    <>
      <div className={cn('space-y-2 sm:space-y-3', className)}>
        <label className="text-xs sm:text-sm font-semibold text-gray-800">Profile Photo</label>
        <div
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'relative border-2 border-dashed rounded-lg sm:rounded-xl transition-all duration-300',
            'hover:border-blue-400 hover:bg-blue-50/50',
            isDragging 
              ? 'border-blue-500 bg-blue-100/50 scale-[1.01] sm:scale-[1.02]' 
              : 'border-gray-300 bg-gray-50/50',
            hasImage && 'border-gray-200 bg-white'
          )}
        >
          {hasImage ? (
            <div className="p-3 sm:p-4">
              <div className={cn(
                'flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap',
                isMobile ? 'flex-col' : 'flex-row'
              )}>
                <div className="relative group flex-shrink-0">
                  <motion.img
                    src={value}
                    alt="Profile"
                    className={cn(
                      'rounded-full object-cover border-2 border-gray-200 shadow-sm',
                      isMobile ? 'w-20 h-20' : 'w-24 h-24'
                    )}
                    whileHover={{ scale: isMobile ? 1 : 1.05 }}
                    transition={{ duration: 0.2 }}
                  />
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: isMobile ? 0.8 : 1 }}
                    className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'text-white hover:bg-white/20',
                        isMobile ? 'h-9 w-9' : 'h-8 w-8'
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange('');
                        toast({
                          title: 'Photo removed',
                          description: 'Profile photo has been removed.',
                        });
                      }}
                    >
                      <X className={cn(isMobile ? 'w-5 h-5' : 'w-4 h-4')} />
                    </Button>
                  </motion.div>
                </div>
                <div className={cn(
                  'flex-1 min-w-0',
                  isMobile ? 'w-full text-center' : ''
                )}>
                  <p className={cn(
                    'font-medium text-gray-900',
                    isMobile ? 'text-xs' : 'text-sm'
                  )}>Photo uploaded</p>
                  <p className={cn(
                    'text-gray-500',
                    isMobile ? 'text-[10px]' : 'text-xs'
                  )}>Click edit to modify or replace</p>
                </div>
                <div className={cn(
                  'flex gap-2 flex-shrink-0 flex-wrap',
                  isMobile ? 'w-full justify-center' : 'sm:flex-nowrap'
                )}>
                  <Button
                    type="button"
                    variant="outline"
                    size={isMobile ? 'default' : 'sm'}
                    onClick={handleUpload}
                    className={cn(
                      'flex-shrink-0',
                      isMobile ? 'h-11 min-h-[44px] flex-1 min-w-[100px]' : ''
                    )}
                  >
                    <Upload className={cn(isMobile ? 'w-4 h-4 mr-1.5' : 'w-4 h-4 mr-2')} />
                    <span className={isMobile ? 'text-xs' : ''}>Replace</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size={isMobile ? 'default' : 'sm'}
                    onClick={handleCamera}
                    className={cn(
                      'flex-shrink-0',
                      isMobile ? 'h-11 min-h-[44px] flex-1 min-w-[100px]' : ''
                    )}
                  >
                    <Camera className={cn(isMobile ? 'w-4 h-4 mr-1.5' : 'w-4 h-4 mr-2')} />
                    <span className={isMobile ? 'text-xs' : ''}>Camera</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size={isMobile ? 'default' : 'sm'}
                    onClick={() => {
                      if (value) {
                        setImageSrc(value);
                      }
                      handleReset();
                      setIsOpen(true);
                    }}
                    className={cn(
                      'flex-shrink-0',
                      isMobile ? 'h-11 min-h-[44px] flex-1 min-w-[100px]' : ''
                    )}
                  >
                    <Crop className={cn(isMobile ? 'w-4 h-4 mr-1.5' : 'w-4 h-4 mr-2')} />
                    <span className={isMobile ? 'text-xs' : ''}>Edit</span>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className={cn(
              'flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4',
              isMobile ? 'p-6' : 'p-8'
            )}>
              <motion.div
                animate={isDragging ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'rounded-full flex items-center justify-center transition-colors',
                  isDragging ? 'bg-blue-100' : 'bg-gray-100',
                  isMobile ? 'w-16 h-16' : 'w-20 h-20'
                )}
              >
                {isLoading ? (
                  <Loader2 className={cn(
                    'text-blue-600 animate-spin',
                    isMobile ? 'w-8 h-8' : 'w-10 h-10'
                  )} />
                ) : (
                  <ImageIcon className={cn(
                    'transition-colors',
                    isDragging ? 'text-blue-600' : 'text-gray-400',
                    isMobile ? 'w-8 h-8' : 'w-10 h-10'
                  )} />
                )}
              </motion.div>
              <div className="space-y-1">
                <p className={cn(
                  'font-medium text-gray-900',
                  isMobile ? 'text-xs' : 'text-sm'
                )}>
                  {isDragging ? 'Drop your photo here' : 'Drag & drop your photo'}
                </p>
                <p className={cn(
                  'text-gray-500',
                  isMobile ? 'text-[10px]' : 'text-xs'
                )}>
                  or click to browse • PNG, JPG up to 5MB
                </p>
              </div>
              <div className={cn(
                'flex gap-2 pt-2',
                isMobile ? 'w-full flex-col' : 'flex-row'
              )}>
                <Button
                  type="button"
                  variant="outline"
                  size={isMobile ? 'default' : 'sm'}
                  onClick={handleUpload}
                  disabled={isLoading}
                  className={cn(
                    'flex-shrink-0',
                    isMobile ? 'h-11 min-h-[44px] w-full' : ''
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className={cn(
                        'animate-spin',
                        isMobile ? 'w-4 h-4 mr-1.5' : 'w-4 h-4 mr-2'
                      )} />
                      <span className={isMobile ? 'text-xs' : ''}>Loading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className={cn(isMobile ? 'w-4 h-4 mr-1.5' : 'w-4 h-4 mr-2')} />
                      <span className={isMobile ? 'text-xs' : ''}>Upload</span>
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size={isMobile ? 'default' : 'sm'}
                  onClick={handleCamera}
                  disabled={isLoading}
                  className={cn(
                    'flex-shrink-0',
                    isMobile ? 'h-11 min-h-[44px] w-full' : ''
                  )}
                >
                  <Camera className={cn(isMobile ? 'w-4 h-4 mr-1.5' : 'w-4 h-4 mr-2')} />
                  <span className={isMobile ? 'text-xs' : ''}>Camera</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        className="hidden"
        onChange={(e) => {
          console.log('[PhotoUpload] File input onChange triggered');
          try {
            const file = e.target.files?.[0];
            if (file) {
              console.log('[PhotoUpload] File selected:', { name: file.name, size: file.size });
              handleFileSelect(file);
            } else {
              console.warn('[PhotoUpload] No file in input');
            }
          } catch (error) {
            console.error('[PhotoUpload] Error in onChange:', error);
            toast({
              title: 'Error',
              description: 'Failed to select file. Please try again.',
              variant: 'destructive',
            });
          } finally {
            e.target.value = '';
          }
        }}
        aria-label="Upload profile photo"
        data-testid="photo-upload-input"
      />

      <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className={cn(
          'flex flex-col gap-0 p-0 overflow-hidden',
          isMobile 
            ? 'max-w-full w-full max-h-[92vh] m-0 rounded-none left-0 top-0 translate-x-0 translate-y-0' 
            : 'max-w-3xl max-h-[88vh]'
        )}>
          <DialogHeader className="shrink-0 px-4 py-3 border-b border-gray-100">
            <DialogTitle className={cn(
              'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent',
              isMobile ? 'text-base' : 'text-lg'
            )}>
              Edit Photo
            </DialogTitle>
          </DialogHeader>

          <div className={cn(
            'flex flex-1 min-h-0 overflow-hidden',
            isDesktop ? 'flex-row' : 'flex-col'
          )}>
            {/* Preview */}
            <div className={cn(
              'shrink-0 flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20',
              isDesktop ? 'w-[240px] border-r border-gray-100 p-4' : 'p-3 border-b border-gray-100'
            )}>
              {imageSrc ? (
                <div className="relative">
                  <div
                    className={cn(
                      'overflow-hidden bg-white shadow-lg ring-2 ring-blue-100/80',
                      cropShape === 'circle' ? 'rounded-full' : 'rounded-xl'
                    )}
                    style={{ width: previewSize, height: previewSize }}
                  >
                    <img
                      src={imageSrc}
                      alt="Preview"
                      className="w-full h-full object-cover will-change-transform"
                      draggable={false}
                      style={{
                        filter: previewFilter,
                        transform: `rotate(${rotation}deg) scale(${zoom})`,
                        transformOrigin: 'center center',
                      }}
                    />
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              ) : (
                <div className="text-center text-gray-500 space-y-3 py-2">
                  {streamRef.current ? (
                    <div className="space-y-3">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="max-w-full rounded-lg shadow-md max-h-[180px]"
                      />
                      <Button 
                        type="button"
                        onClick={captureFromCamera} 
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-10"
                      >
                        <Camera className="w-4 h-4 mr-1.5" />
                        Capture Photo
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <ImageIcon className="w-10 h-10 mx-auto text-gray-300" />
                      <p className="text-xs">No image selected</p>
                      <Button type="button" variant="outline" onClick={handleUpload} size="sm" className="h-10">
                        <Upload className="w-4 h-4 mr-1.5" />
                        Select Image
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Controls */}
            {imageSrc && (
              <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
                <FilterSection
                  id="crop"
                  title="Crop"
                  icon={<Crop className="w-4 h-4" />}
                  isOpen={activeSection === 'crop'}
                  onToggle={() => toggleSection('crop')}
                  onReset={resetCrop}
                  isMobile={isMobile}
                >
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={cropShape === 'circle' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCropShape('circle')}
                      className={cn('flex-1 h-9', cropShape === 'circle' && 'bg-gradient-to-r from-blue-600 to-purple-600')}
                    >
                      <Circle className="w-4 h-4 mr-1.5" />
                      Circle
                    </Button>
                    <Button
                      type="button"
                      variant={cropShape === 'square' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCropShape('square')}
                      className={cn('flex-1 h-9', cropShape === 'square' && 'bg-gradient-to-r from-blue-600 to-purple-600')}
                    >
                      <Square className="w-4 h-4 mr-1.5" />
                      Square
                    </Button>
                  </div>
                </FilterSection>

                <FilterSection
                  id="transform"
                  title="Transform"
                  icon={<RotateCw className="w-4 h-4" />}
                  isOpen={activeSection === 'transform'}
                  onToggle={() => toggleSection('transform')}
                  onReset={resetTransform}
                  isMobile={isMobile}
                >
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-700">Zoom</span>
                        <span className="text-xs font-semibold text-blue-600">{Math.round(zoom * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} disabled={zoom <= 0.5}>
                          <ZoomOut className="w-3.5 h-3.5" />
                        </Button>
                        <Slider value={[zoom]} onValueChange={([val]) => setZoom(val)} min={0.5} max={3} step={0.1} className="flex-1" />
                        <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => setZoom(Math.min(3, zoom + 0.1))} disabled={zoom >= 3}>
                          <ZoomIn className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-700">Rotation</span>
                        <span className="text-xs font-semibold text-blue-600">{rotation}°</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => setRotation(rotation - 15)}>
                          <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                        <Slider value={[rotation]} onValueChange={([val]) => setRotation(val)} min={-180} max={180} step={15} className="flex-1" />
                        <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => setRotation(rotation + 15)}>
                          <RotateCw className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </FilterSection>

                <FilterSection
                  id="adjustments"
                  title="Adjustments"
                  icon={<Sun className="w-4 h-4" />}
                  isOpen={activeSection === 'adjustments'}
                  onToggle={() => toggleSection('adjustments')}
                  onReset={resetAdjustments}
                  isMobile={isMobile}
                >
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Sun className={cn('text-yellow-500', isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
                            <span className={cn('text-gray-700', isMobile ? 'text-xs' : 'text-sm')}>
                              Brightness
                            </span>
                          </div>
                          <span className={cn('font-semibold text-blue-600', isMobile ? 'text-xs' : 'text-sm')}>
                            {filters.brightness}%
                          </span>
                        </div>
                        <Slider
                          value={[filters.brightness]}
                          onValueChange={([val]) => updateFilter('brightness', val)}
                          min={0}
                          max={200}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <ContrastIcon className={cn('text-purple-500', isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
                            <span className={cn('text-gray-700', isMobile ? 'text-xs' : 'text-sm')}>
                              Contrast
                            </span>
                          </div>
                          <span className={cn('font-semibold text-blue-600', isMobile ? 'text-xs' : 'text-sm')}>
                            {filters.contrast}%
                          </span>
                        </div>
                        <Slider
                          value={[filters.contrast]}
                          onValueChange={([val]) => updateFilter('contrast', val)}
                          min={0}
                          max={200}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Palette className={cn('text-pink-500', isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
                            <span className={cn('text-gray-700', isMobile ? 'text-xs' : 'text-sm')}>
                              Saturation
                            </span>
                          </div>
                          <span className={cn('font-semibold text-blue-600', isMobile ? 'text-xs' : 'text-sm')}>
                            {filters.saturate}%
                          </span>
                        </div>
                        <Slider
                          value={[filters.saturate]}
                          onValueChange={([val]) => updateFilter('saturate', val)}
                          min={0}
                          max={200}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </FilterSection>

                <FilterSection
                  id="effects"
                  title="Effects"
                  icon={<Filter className="w-4 h-4" />}
                  isOpen={activeSection === 'effects'}
                  onToggle={() => toggleSection('effects')}
                  onReset={resetEffects}
                  isMobile={isMobile}
                >
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-700">Blur</span>
                        <span className="text-xs font-semibold text-blue-600">{filters.blur}px</span>
                      </div>
                      <Slider value={[filters.blur]} onValueChange={([val]) => updateFilter('blur', val)} min={0} max={10} step={0.5} className="w-full" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-700">Grayscale</span>
                        <span className="text-xs font-semibold text-blue-600">{filters.grayscale}%</span>
                      </div>
                      <Slider value={[filters.grayscale]} onValueChange={([val]) => updateFilter('grayscale', val)} min={0} max={100} step={1} className="w-full" />
                    </div>
                  </div>
                </FilterSection>
              </div>
            )}
          </div>

          {imageSrc && (
            <div className="shrink-0 border-t border-gray-200 bg-white px-3 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={handleRemovePhoto}
                disabled={isProcessing}
                size="sm"
                className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50 order-2 sm:order-1"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Remove Photo
              </Button>
              <div className="flex gap-2 order-1 sm:order-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogOpenChange(false)}
                  disabled={isProcessing}
                  size="sm"
                  className="h-9 flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={isProcessing}
                  size="sm"
                  className="h-9 flex-1 sm:flex-none"
                >
                  <RefreshCw className="w-4 h-4 mr-1.5" />
                  Reset All
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isProcessing}
                  size="sm"
                  className="h-9 flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-1.5" />
                      Save Photo
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
