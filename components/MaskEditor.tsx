import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';

interface MaskEditorProps {
  imageUrl: string;
  onMaskChange: (maskBase64: string | null) => void;
  brushSize: number;
}

export interface MaskEditorRef {
  clear: () => void;
}

export const MaskEditor = forwardRef<MaskEditorRef, MaskEditorProps>(
  ({ imageUrl, onMaskChange, brushSize }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onMaskChange(null);
  }, [onMaskChange]);
  
  useImperativeHandle(ref, () => ({
    clear: clearCanvas,
  }));

  const drawOnCanvas = useCallback((x: number, y: number, isNewLine: boolean = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (isNewLine) {
        ctx.beginPath();
        ctx.moveTo(x, y);
    }
    
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [brushSize]);
  
  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const touch = (e as React.TouchEvent).touches?.[0];
    const clientX = touch ? touch.clientX : (e as React.MouseEvent).clientX;
    const clientY = touch ? touch.clientY : (e as React.MouseEvent).clientY;
    return {
      x: (clientX - rect.left) / rect.width * canvas.width,
      y: (clientY - rect.top) / rect.height * canvas.height,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getCoords(e);
    drawOnCanvas(x, y, true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const { x, y } = getCoords(e);
    drawOnCanvas(x, y);
  };

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    // Create a temporary canvas to generate the final black and white mask
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = image.naturalWidth;
    maskCanvas.height = image.naturalHeight;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    // Fill with black
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    
    // Draw the user's drawing from the overlay canvas
    maskCtx.drawImage(canvas, 0, 0, maskCanvas.width, maskCanvas.height);
    
    // Use compositing to turn the semi-transparent drawing into a solid white mask
    maskCtx.globalCompositeOperation = 'source-in';
    maskCtx.fillStyle = 'white';
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    const maskBase64 = maskCanvas.toDataURL('image/png').split(',')[1];
    onMaskChange(maskBase64);
  }, [isDrawing, onMaskChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageUrl;
    image.onload = () => {
        if (canvas) {
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
        }
        imageRef.current = image;
        clearCanvas();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  return (
    <div className="relative w-full aspect-video bg-gray-900 rounded-md overflow-hidden select-none">
      <img src={imageUrl} alt="Remix preview" className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none" />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
    </div>
  );
});
