'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Slider from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useResponsive } from '@/components/ui/use-mobile';
import { 
  Upload, Camera, Crop, RotateCw, RotateCcw, ZoomIn, ZoomOut, 
  X, Check, Image as ImageIcon, RefreshCw, Circle, Square, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoUploadProps {
  value?: string; // base64 data URL or URL
  onChange: (value: string) => void;
  className?: string;
}

type CropShape = 'circle' | 'square';
type FilterType = 'brightness' | 'contrast' | 'saturate' | 'blur' | 'grayscale';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Sync value prop to internal state
  useEffect(() => {
    if (value !== undefined) {
      setImageSrc(value || '');
    }
  }, [value]);

  // Reset editor state when dialog opens with existing image
  useEffect(() => {
    if (isOpen && imageSrc && value === imageSrc) {
      // Only reset if opening with saved image
      setZoom(1);
      setRotation(0);
      setFilters({
        brightness: 100,
        contrast: 100,
        saturate: 100,
        blur: 0,
        grayscale: 0,
      });
    }
  }, [isOpen]); // Only depend on isOpen

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Validate file
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: 'Please select a PNG or JPG image' };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }
    return { valid: true };
  }, []);

  // Process file
  const processFile = useCallback((file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
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
      const result = e.target?.result as string;
      setImageSrc(result);
      setIsOpen(true);
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      setIsLoading(false);
      toast({
        title: 'Error reading file',
        description: 'Failed to read the image file. Please try again.',
        variant: 'destructive',
      });
    };
    reader.readAsDataURL(file);
  }, [validateFile, toast]);

  // Drag and drop handlers
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
    fileInputRef.current?.click();
  }, []);

  const handleCamera = useCallback(async () => {
    try {
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: 'Camera access denied',
        description: 'Unable to access camera. Please check permissions.',
        variant: 'destructive',
      });
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

    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    const dataUrl = canvas.toDataURL('image/png');
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
          if (!canvasRef.current) {
            resolve(imageSrc);
            return;
          }

          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(imageSrc);
            return;
          }

          // Calculate size based on crop shape and zoom
          const baseSize = Math.max(img.width, img.height);
          const size = baseSize * Math.max(zoom, 1);
          canvas.width = size;
          canvas.height = size;

          // Clear canvas
          ctx.clearRect(0, 0, size, size);

          // Apply rotation and zoom
          ctx.save();
          ctx.translate(size / 2, size / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.translate(-size / 2, -size / 2);

          // Draw image with zoom
          const zoomedWidth = img.width * zoom;
          const zoomedHeight = img.height * zoom;
          const offsetX = (size - zoomedWidth) / 2;
          const offsetY = (size - zoomedHeight) / 2;
          ctx.drawImage(img, offsetX, offsetY, zoomedWidth, zoomedHeight);
          ctx.restore();

          // Apply filters
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Apply brightness and contrast
          const brightnessFactor = filters.brightness / 100;
          const contrastFactor = filters.contrast / 100;
          const intercept = 128 * (1 - contrastFactor);

          for (let i = 0; i < data.length; i += 4) {
            // Brightness
            data[i] = Math.min(255, Math.max(0, data[i] * brightnessFactor));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * brightnessFactor));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * brightnessFactor));

            // Contrast
            data[i] = Math.min(255, Math.max(0, data[i] * contrastFactor + intercept));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * contrastFactor + intercept));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * contrastFactor + intercept));

            // Grayscale
            if (filters.grayscale > 0) {
              const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
              const grayAmount = filters.grayscale / 100;
              data[i] = data[i] * (1 - grayAmount) + gray * grayAmount;
              data[i + 1] = data[i + 1] * (1 - grayAmount) + gray * grayAmount;
              data[i + 2] = data[i + 2] * (1 - grayAmount) + gray * grayAmount;
            }
          }

          ctx.putImageData(imageData, 0, 0);

          // Apply blur and saturation using CSS filters
          if (filters.blur > 0 || filters.saturate !== 100) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            if (tempCtx) {
              const filterParts = [];
              if (filters.blur > 0) filterParts.push(`blur(${filters.blur}px)`);
              if (filters.saturate !== 100) filterParts.push(`saturate(${filters.saturate}%)`);
              tempCtx.filter = filterParts.join(' ');
              tempCtx.drawImage(canvas, 0, 0);
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(tempCanvas, 0, 0);
            }
          }

          // Apply crop shape
          const finalSize = Math.min(canvas.width, canvas.height);
          const finalCanvas = document.createElement('canvas');
          finalCanvas.width = finalSize;
          finalCanvas.height = finalSize;
          const finalCtx = finalCanvas.getContext('2d');
          
          if (!finalCtx) {
            resolve(canvas.toDataURL('image/png'));
            return;
          }

          if (cropShape === 'circle') {
            finalCtx.beginPath();
            finalCtx.arc(finalSize / 2, finalSize / 2, finalSize / 2, 0, Math.PI * 2);
            finalCtx.clip();
          }
          
          const sourceX = (canvas.width - finalSize) / 2;
          const sourceY = (canvas.height - finalSize) / 2;
          finalCtx.drawImage(
            canvas,
            sourceX,
            sourceY,
            finalSize,
            finalSize,
            0,
            0,
            finalSize,
            finalSize
          );
          
          resolve(finalCanvas.toDataURL('image/png'));
        } catch (error) {
          reject(error);
        }
      };
      
      img.src = imageSrc;
    });
  }, [imageSrc, zoom, rotation, filters, cropShape]);

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
      onChange(finalImage);
      setIsOpen(false);
      
      toast({
        title: 'Photo saved',
        description: 'Your profile photo has been updated.',
      });
      
      // Cleanup camera if active
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
  }, [processImage, onChange, imageSrc, toast]);

  const handleReset = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setFilters({
      brightness: 100,
      contrast: 100,
      saturate: 100,
      blur: 0,
      grayscale: 0,
    });
  }, []);

  const handleClose = useCallback(() => {
    // Cleanup camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsOpen(false);
  }, []);

  const updateFilter = useCallback((key: FilterType, value: number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const hasImage = !!value;

  return (
    <>
      <div className={cn('space-y-2 sm:space-y-3', className)}>
        <label className="text-xs sm:text-sm font-semibold text-gray-800">Profile Photo</label>
        
        {/* Dynamic Upload Zone - Fully Responsive */}
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
                'flex items-center gap-3 sm:gap-4',
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
                  'flex gap-2 flex-shrink-0',
                  isMobile ? 'w-full justify-center flex-wrap' : ''
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
                      setImageSrc(value);
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
          const file = e.target.files?.[0];
          if (file) {
            handleFileSelect(file);
          }
          // Reset input
          e.target.value = '';
        }}
      />

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className={cn(
          'overflow-y-auto',
          isMobile 
            ? 'max-w-full w-full max-h-[95vh] m-0 rounded-none p-4 sm:p-6 left-0 top-0 translate-x-0 translate-y-0' 
            : 'max-w-4xl max-h-[90vh] p-6'
        )}>
          <DialogHeader className={cn(isMobile && 'pb-3')}>
            <DialogTitle className={cn(isMobile ? 'text-base' : 'text-lg')}>
              Edit Photo
            </DialogTitle>
          </DialogHeader>

          <div className={cn('space-y-4', isMobile ? 'sm:space-y-5' : 'space-y-6')}>
            {/* Preview Area - Responsive */}
            <div className={cn(
              'flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg',
              isMobile ? 'p-4 min-h-[250px]' : 'p-6 sm:p-8 min-h-[300px] sm:min-h-[400px]'
            )}>
              {imageSrc ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative"
                >
                  <div
                    className={cn(
                      'overflow-hidden bg-white shadow-2xl transition-all duration-300',
                      cropShape === 'circle' ? 'rounded-full' : 'rounded-lg'
                    )}
                    style={{
                      width: isMobile ? '200px' : isTablet ? '250px' : '300px',
                      height: isMobile ? '200px' : isTablet ? '250px' : '300px',
                      filter: `
                        brightness(${filters.brightness}%)
                        contrast(${filters.contrast}%)
                        saturate(${filters.saturate}%)
                        blur(${filters.blur}px)
                        grayscale(${filters.grayscale}%)
                      `,
                      transform: `rotate(${rotation}deg) scale(${zoom})`,
                      transformOrigin: 'center',
                    }}
                  >
                    <img
                      src={imageSrc}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                </motion.div>
              ) : (
                <div className="text-center text-gray-500 space-y-3 sm:space-y-4">
                  {streamRef.current ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-3 sm:space-y-4"
                    >
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={cn(
                          'max-w-full rounded-lg shadow-lg',
                          isMobile ? 'max-h-[250px]' : 'max-h-[400px]'
                        )}
                      />
                      <Button 
                        onClick={captureFromCamera} 
                        size={isMobile ? 'default' : 'lg'}
                        className={isMobile ? 'h-11 min-h-[44px] w-full' : ''}
                      >
                        <Camera className={cn(isMobile ? 'w-4 h-4 mr-1.5' : 'w-4 h-4 mr-2')} />
                        <span className={isMobile ? 'text-xs' : ''}>Capture Photo</span>
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="space-y-2">
                      <ImageIcon className={cn(
                        'mx-auto text-gray-300',
                        isMobile ? 'w-12 h-12' : 'w-16 h-16'
                      )} />
                      <p className={cn(isMobile ? 'text-xs' : 'text-sm')}>No image selected</p>
                      <Button 
                        variant="outline" 
                        onClick={handleUpload}
                        size={isMobile ? 'default' : 'sm'}
                        className={isMobile ? 'h-11 min-h-[44px] w-full' : ''}
                      >
                        <Upload className={cn(isMobile ? 'w-4 h-4 mr-1.5' : 'w-4 h-4 mr-2')} />
                        <span className={isMobile ? 'text-xs' : ''}>Select Image</span>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Controls - Responsive */}
            {imageSrc && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('space-y-3', isMobile ? 'sm:space-y-4' : 'space-y-4')}
              >
                {/* Crop Shape */}
                <div>
                  <label className={cn(
                    'font-medium mb-2 block',
                    isMobile ? 'text-xs' : 'text-sm'
                  )}>Crop Shape</label>
                  <div className={cn(
                    'flex gap-2',
                    isMobile && 'w-full'
                  )}>
                    <Button
                      type="button"
                      variant={cropShape === 'circle' ? 'default' : 'outline'}
                      size={isMobile ? 'default' : 'sm'}
                      onClick={() => setCropShape('circle')}
                      className={cn(
                        isMobile ? 'h-11 min-h-[44px] flex-1' : ''
                      )}
                    >
                      <Circle className={cn(isMobile ? 'w-4 h-4 mr-1.5' : 'w-4 h-4 mr-2')} />
                      <span className={isMobile ? 'text-xs' : ''}>Circle</span>
                    </Button>
                    <Button
                      type="button"
                      variant={cropShape === 'square' ? 'default' : 'outline'}
                      size={isMobile ? 'default' : 'sm'}
                      onClick={() => setCropShape('square')}
                      className={cn(
                        isMobile ? 'h-11 min-h-[44px] flex-1' : ''
                      )}
                    >
                      <Square className={cn(isMobile ? 'w-4 h-4 mr-1.5' : 'w-4 h-4 mr-2')} />
                      <span className={isMobile ? 'text-xs' : ''}>Square</span>
                    </Button>
                  </div>
                </div>

                {/* Zoom */}
                <div>
                  <label className={cn(
                    'font-medium mb-2 block',
                    isMobile ? 'text-xs' : 'text-sm'
                  )}>
                    Zoom: {Math.round(zoom * 100)}%
                  </label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                      disabled={zoom <= 0.5}
                      className={cn(
                        'flex-shrink-0',
                        isMobile ? 'h-11 w-11 min-h-[44px] min-w-[44px]' : ''
                      )}
                    >
                      <ZoomOut className={cn(isMobile ? 'w-5 h-5' : 'w-4 h-4')} />
                    </Button>
                    <Slider
                      value={[zoom]}
                      onValueChange={([val]) => setZoom(val)}
                      min={0.5}
                      max={3}
                      step={0.1}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                      disabled={zoom >= 3}
                      className={cn(
                        'flex-shrink-0',
                        isMobile ? 'h-11 w-11 min-h-[44px] min-w-[44px]' : ''
                      )}
                    >
                      <ZoomIn className={cn(isMobile ? 'w-5 h-5' : 'w-4 h-4')} />
                    </Button>
                  </div>
                </div>

                {/* Rotation */}
                <div>
                  <label className={cn(
                    'font-medium mb-2 block',
                    isMobile ? 'text-xs' : 'text-sm'
                  )}>
                    Rotation: {rotation}°
                  </label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setRotation(rotation - 15)}
                      className={cn(
                        'flex-shrink-0',
                        isMobile ? 'h-11 w-11 min-h-[44px] min-w-[44px]' : ''
                      )}
                    >
                      <RotateCcw className={cn(isMobile ? 'w-5 h-5' : 'w-4 h-4')} />
                    </Button>
                    <Slider
                      value={[rotation]}
                      onValueChange={([val]) => setRotation(val)}
                      min={-180}
                      max={180}
                      step={15}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setRotation(rotation + 15)}
                      className={cn(
                        'flex-shrink-0',
                        isMobile ? 'h-11 w-11 min-h-[44px] min-w-[44px]' : ''
                      )}
                    >
                      <RotateCw className={cn(isMobile ? 'w-5 h-5' : 'w-4 h-4')} />
                    </Button>
                  </div>
                </div>

                {/* Filters */}
                <div className={cn('space-y-2', isMobile ? 'sm:space-y-3' : 'space-y-3')}>
                  <label className={cn(
                    'font-medium block',
                    isMobile ? 'text-xs' : 'text-sm'
                  )}>Filters</label>
                  
                  <div>
                    <label className={cn(
                      'text-gray-600 mb-1 block',
                      isMobile ? 'text-[10px]' : 'text-xs'
                    )}>
                      Brightness: {filters.brightness}%
                    </label>
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
                    <label className={cn(
                      'text-gray-600 mb-1 block',
                      isMobile ? 'text-[10px]' : 'text-xs'
                    )}>
                      Contrast: {filters.contrast}%
                    </label>
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
                    <label className={cn(
                      'text-gray-600 mb-1 block',
                      isMobile ? 'text-[10px]' : 'text-xs'
                    )}>
                      Saturation: {filters.saturate}%
                    </label>
                    <Slider
                      value={[filters.saturate]}
                      onValueChange={([val]) => updateFilter('saturate', val)}
                      min={0}
                      max={200}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className={cn(
                      'text-gray-600 mb-1 block',
                      isMobile ? 'text-[10px]' : 'text-xs'
                    )}>
                      Blur: {filters.blur}px
                    </label>
                    <Slider
                      value={[filters.blur]}
                      onValueChange={([val]) => updateFilter('blur', val)}
                      min={0}
                      max={10}
                      step={0.5}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className={cn(
                      'text-gray-600 mb-1 block',
                      isMobile ? 'text-[10px]' : 'text-xs'
                    )}>
                      Grayscale: {filters.grayscale}%
                    </label>
                    <Slider
                      value={[filters.grayscale]}
                      onValueChange={([val]) => updateFilter('grayscale', val)}
                      min={0}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Action Buttons - Responsive */}
                <div className={cn(
                  'flex items-center pt-3 sm:pt-4 border-t',
                  isMobile ? 'flex-col gap-2' : 'justify-between'
                )}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={isProcessing}
                    size={isMobile ? 'default' : 'sm'}
                    className={cn(
                      isMobile ? 'h-11 min-h-[44px] w-full' : ''
                    )}
                  >
                    <RefreshCw className={cn(isMobile ? 'w-4 h-4 mr-1.5' : 'w-4 h-4 mr-2')} />
                    <span className={isMobile ? 'text-xs' : ''}>Reset</span>
                  </Button>
                  <div className={cn(
                    'flex gap-2',
                    isMobile && 'w-full'
                  )}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={isProcessing}
                      size={isMobile ? 'default' : 'sm'}
                      className={cn(
                        isMobile ? 'h-11 min-h-[44px] flex-1' : ''
                      )}
                    >
                      <span className={isMobile ? 'text-xs' : ''}>Cancel</span>
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={isProcessing}
                      size={isMobile ? 'default' : 'sm'}
                      className={cn(
                        isMobile ? 'h-11 min-h-[44px] flex-1' : ''
                      )}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className={cn(
                            'animate-spin',
                            isMobile ? 'w-4 h-4 mr-1.5' : 'w-4 h-4 mr-2'
                          )} />
                          <span className={isMobile ? 'text-xs' : ''}>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Check className={cn(isMobile ? 'w-4 h-4 mr-1.5' : 'w-4 h-4 mr-2')} />
                          <span className={isMobile ? 'text-xs' : ''}>Save</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
