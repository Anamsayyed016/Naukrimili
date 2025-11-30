'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Slider from '@/components/ui/slider';
import { 
  Upload, Camera, Crop, RotateCw, RotateCcw, ZoomIn, ZoomOut, 
  X, Check, Image as ImageIcon, RefreshCw, Circle, Square
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoUploadProps {
  value?: string; // base64 data URL or URL
  onChange: (value: string) => void;
  className?: string;
}

type CropShape = 'circle' | 'square';
type FilterType = 'brightness' | 'contrast' | 'saturate' | 'blur' | 'grayscale';

export default function PhotoUpload({ value, onChange, className }: PhotoUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
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

  // Initialize with existing value
  useEffect(() => {
    if (value) {
      setImageSrc(value);
    }
  }, [value]);

  // Reset editor state when dialog opens
  useEffect(() => {
    if (isOpen && imageSrc) {
      // Reset to defaults when opening with existing image
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
  }, [isOpen, imageSrc]);

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/i)) {
      alert('Please select a PNG or JPG image');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageSrc(result);
      setIsOpen(true);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleCamera = useCallback(async () => {
    try {
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
      alert('Unable to access camera. Please check permissions.');
    }
  }, []);

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
    if (!imageSrc) return '';

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    return new Promise<string>((resolve) => {
      img.onload = () => {
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

        // Calculate size based on crop shape
        const size = Math.max(img.width, img.height) * zoom;
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
        if (cropShape === 'circle') {
          const finalCanvas = document.createElement('canvas');
          const finalSize = Math.min(canvas.width, canvas.height);
          finalCanvas.width = finalSize;
          finalCanvas.height = finalSize;
          const finalCtx = finalCanvas.getContext('2d');
          
          if (finalCtx) {
            finalCtx.beginPath();
            finalCtx.arc(finalSize / 2, finalSize / 2, finalSize / 2, 0, Math.PI * 2);
            finalCtx.clip();
            
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
          } else {
            resolve(canvas.toDataURL('image/png'));
          }
        } else {
          // Square crop - center crop
          const finalSize = Math.min(canvas.width, canvas.height);
          const finalCanvas = document.createElement('canvas');
          finalCanvas.width = finalSize;
          finalCanvas.height = finalSize;
          const finalCtx = finalCanvas.getContext('2d');
          
          if (finalCtx) {
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
          } else {
            resolve(canvas.toDataURL('image/png'));
          }
        }
      };
      img.src = imageSrc;
    });
  }, [imageSrc, zoom, rotation, filters, cropShape]);

  const handleSave = useCallback(async () => {
    setIsProcessing(true);
    try {
      const finalImage = await processImage();
      onChange(finalImage);
      setIsOpen(false);
      
      // Cleanup camera if active
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [processImage, onChange]);

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

  return (
    <>
      <div className={cn('space-y-2', className)}>
        <label className="text-sm font-semibold text-gray-800">Profile Photo</label>
        <div className="flex items-center gap-4">
          {value ? (
            <div className="relative group">
              <img
                src={value}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 shadow-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-md"
                onClick={() => onChange('')}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUpload}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCamera}
            >
              <Camera className="w-4 h-4 mr-2" />
              Camera
            </Button>
            {value && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setImageSrc(value);
                  setIsOpen(true);
                }}
              >
                <Crop className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
      />

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Photo</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Preview Area */}
            <div className="flex items-center justify-center bg-gray-50 rounded-lg p-8 min-h-[400px]">
              {imageSrc ? (
                <div className="relative">
                  <div
                    className={cn(
                      'overflow-hidden bg-white shadow-lg',
                      cropShape === 'circle' ? 'rounded-full' : 'rounded-lg'
                    )}
                    style={{
                      width: '300px',
                      height: '300px',
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
                    />
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  {streamRef.current ? (
                    <div className="space-y-4">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="max-w-full max-h-[400px] rounded-lg"
                      />
                      <Button onClick={captureFromCamera}>
                        <Camera className="w-4 h-4 mr-2" />
                        Capture Photo
                      </Button>
                    </div>
                  ) : (
                    <p>No image selected</p>
                  )}
                </div>
              )}
            </div>

            {/* Controls */}
            {imageSrc && (
              <div className="space-y-4">
                {/* Crop Shape */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Crop Shape</label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={cropShape === 'circle' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCropShape('circle')}
                    >
                      <Circle className="w-4 h-4 mr-2" />
                      Circle
                    </Button>
                    <Button
                      type="button"
                      variant={cropShape === 'square' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCropShape('square')}
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Square
                    </Button>
                  </div>
                </div>

                {/* Zoom */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Zoom: {Math.round(zoom * 100)}%
                  </label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                    >
                      <ZoomOut className="w-4 h-4" />
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
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Rotation */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Rotation: {rotation}°
                  </label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setRotation(rotation - 15)}
                    >
                      <RotateCcw className="w-4 h-4" />
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
                    >
                      <RotateCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Filters */}
                <div className="space-y-3">
                  <label className="text-sm font-medium block">Filters</label>
                  
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">
                      Brightness: {filters.brightness}%
                    </label>
                    <Slider
                      value={[filters.brightness]}
                      onValueChange={([val]) => updateFilter('brightness', val)}
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">
                      Contrast: {filters.contrast}%
                    </label>
                    <Slider
                      value={[filters.contrast]}
                      onValueChange={([val]) => updateFilter('contrast', val)}
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">
                      Saturation: {filters.saturate}%
                    </label>
                    <Slider
                      value={[filters.saturate]}
                      onValueChange={([val]) => updateFilter('saturate', val)}
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">
                      Blur: {filters.blur}px
                    </label>
                    <Slider
                      value={[filters.blur]}
                      onValueChange={([val]) => updateFilter('blur', val)}
                      min={0}
                      max={10}
                      step={0.5}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">
                      Grayscale: {filters.grayscale}%
                    </label>
                    <Slider
                      value={[filters.grayscale]}
                      onValueChange={([val]) => updateFilter('grayscale', val)}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

