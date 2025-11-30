'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Slider from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useResponsive } from '@/components/ui/use-mobile';
import { 
  Upload, Camera, Crop, RotateCw, RotateCcw, ZoomIn, ZoomOut, 
  X, Check, Image as ImageIcon, RefreshCw, Circle, Square, Loader2,
  Sun, Contrast as ContrastIcon, Palette, Blur as BlurIcon, 
  ImageOff, ChevronDown, ChevronUp
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
  const [activeFilterSection, setActiveFilterSection] = useState<string | null>('adjustments');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value !== undefined) {
      setImageSrc(value || '');
    }
  }, [value]);

  useEffect(() => {
    if (isOpen && imageSrc && value === imageSrc) {
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
  }, [isOpen]);

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
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const brightnessFactor = filters.brightness / 100;
          const contrastFactor = filters.contrast / 100;
          const intercept = 128 * (1 - contrastFactor);
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, Math.max(0, data[i] * brightnessFactor));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * brightnessFactor));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * brightnessFactor));
            data[i] = Math.min(255, Math.max(0, data[i] * contrastFactor + intercept));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * contrastFactor + intercept));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * contrastFactor + intercept));
            if (filters.grayscale > 0) {
              const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
              const grayAmount = filters.grayscale / 100;
              data[i] = data[i] * (1 - grayAmount) + gray * grayAmount;
              data[i + 1] = data[i + 1] * (1 - grayAmount) + gray * grayAmount;
              data[i + 2] = data[i + 2] * (1 - grayAmount) + gray * grayAmount;
            }
          }
          ctx.putImageData(imageData, 0, 0);
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
          finalCtx.drawImage(canvas, sourceX, sourceY, finalSize, finalSize, 0, 0, finalSize, finalSize);
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

  const FilterSection = ({ 
    id, 
    title, 
    icon, 
    children 
  }: { 
    id: string; 
    title: string; 
    icon: React.ReactNode; 
    children: React.ReactNode;
  }) => {
    const isOpen = activeFilterSection === id;
    return (
      <motion.div 
        className="border border-gray-200 rounded-lg overflow-hidden bg-white"
        initial={false}
        animate={{ 
          borderColor: isOpen ? 'rgb(59, 130, 246)' : 'rgb(229, 231, 235)'
        }}
        transition={{ duration: 0.2 }}
      >
        <button
          onClick={() => setActiveFilterSection(isOpen ? null : id)}
          className={cn(
            'w-full px-4 py-3 bg-gradient-to-r transition-all duration-200 flex items-center justify-between',
            isOpen 
              ? 'from-blue-50 to-blue-100/50' 
              : 'from-gray-50 to-gray-50 hover:from-gray-100 hover:to-gray-100'
          )}
        >
          <div className="flex items-center gap-3">
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
            <ChevronUp className={cn('text-gray-600', isMobile ? 'w-4 h-4' : 'w-5 h-5')} />
          ) : (
            <ChevronDown className={cn('text-gray-400', isMobile ? 'w-4 h-4' : 'w-5 h-5')} />
          )}
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className={cn('p-4 space-y-4', isMobile && 'p-3 space-y-3')}>
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

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
          e.target.value = '';
        }}
      />

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className={cn(
          'overflow-y-auto',
          isMobile 
            ? 'max-w-full w-full max-h-[95vh] m-0 rounded-none p-4 sm:p-6 left-0 top-0 translate-x-0 translate-y-0' 
            : 'max-w-5xl max-h-[90vh] p-6'
        )}>
          <DialogHeader className={cn(isMobile && 'pb-3')}>
            <DialogTitle className={cn(
              'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent',
              isMobile ? 'text-base' : 'text-xl'
            )}>
              Edit Photo
            </DialogTitle>
          </DialogHeader>

          <div className={cn('space-y-4', isMobile ? 'sm:space-y-5' : 'space-y-6')}>
            {/* Preview Area */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 rounded-xl border border-gray-200/50',
                isMobile ? 'p-4 min-h-[250px]' : 'p-6 sm:p-8 min-h-[300px] sm:min-h-[400px]'
              )}
            >
              {imageSrc ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="relative"
                >
                  <div
                    className={cn(
                      'overflow-hidden bg-white shadow-2xl transition-all duration-300 ring-4 ring-blue-100',
                      cropShape === 'circle' ? 'rounded-full' : 'rounded-xl'
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
                        className={cn(
                          'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
                          isMobile ? 'h-11 min-h-[44px] w-full' : ''
                        )}
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
            </motion.div>

            {/* Controls */}
            {imageSrc && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={cn('space-y-4', isMobile && 'space-y-3')}
              >
                {/* Crop Shape */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <label className={cn(
                    'font-semibold mb-3 block text-gray-900',
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
                        'flex-1 transition-all',
                        cropShape === 'circle' && 'bg-gradient-to-r from-blue-600 to-purple-600',
                        isMobile ? 'h-11 min-h-[44px]' : ''
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
                        'flex-1 transition-all',
                        cropShape === 'square' && 'bg-gradient-to-r from-blue-600 to-purple-600',
                        isMobile ? 'h-11 min-h-[44px]' : ''
                      )}
                    >
                      <Square className={cn(isMobile ? 'w-4 h-4 mr-1.5' : 'w-4 h-4 mr-2')} />
                      <span className={isMobile ? 'text-xs' : ''}>Square</span>
                    </Button>
                  </div>
                </div>

                {/* Transform Controls */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
                  <label className={cn(
                    'font-semibold block text-gray-900',
                    isMobile ? 'text-xs' : 'text-sm'
                  )}>Transform</label>
                  
                  {/* Zoom */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn('text-gray-700', isMobile ? 'text-xs' : 'text-sm')}>
                        Zoom
                      </span>
                      <span className={cn('font-semibold text-blue-600', isMobile ? 'text-xs' : 'text-sm')}>
                        {Math.round(zoom * 100)}%
                      </span>
                    </div>
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
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn('text-gray-700', isMobile ? 'text-xs' : 'text-sm')}>
                        Rotation
                      </span>
                      <span className={cn('font-semibold text-blue-600', isMobile ? 'text-xs' : 'text-sm')}>
                        {rotation}°
                      </span>
                    </div>
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
                </div>

                {/* Filters - Collapsible Sections */}
                <div className="space-y-3">
                  <FilterSection
                    id="adjustments"
                    title="Adjustments"
                    icon={<Sun className={cn(isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4')} />}
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
                    icon={<BlurIcon className={cn(isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4')} />}
                  >
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <BlurIcon className={cn('text-indigo-500', isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
                            <span className={cn('text-gray-700', isMobile ? 'text-xs' : 'text-sm')}>
                              Blur
                            </span>
                          </div>
                          <span className={cn('font-semibold text-blue-600', isMobile ? 'text-xs' : 'text-sm')}>
                            {filters.blur}px
                          </span>
                        </div>
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
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <ImageOff className={cn('text-gray-500', isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
                            <span className={cn('text-gray-700', isMobile ? 'text-xs' : 'text-sm')}>
                              Grayscale
                            </span>
                          </div>
                          <span className={cn('font-semibold text-blue-600', isMobile ? 'text-xs' : 'text-sm')}>
                            {filters.grayscale}%
                          </span>
                        </div>
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
                  </FilterSection>
                </div>

                {/* Action Buttons */}
                <div className={cn(
                  'flex items-center pt-4 border-t border-gray-200 gap-3',
                  isMobile ? 'flex-col' : 'justify-between'
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
                    <span className={isMobile ? 'text-xs' : ''}>Reset All</span>
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
                        'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
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
                          <span className={isMobile ? 'text-xs' : ''}>Save Photo</span>
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
