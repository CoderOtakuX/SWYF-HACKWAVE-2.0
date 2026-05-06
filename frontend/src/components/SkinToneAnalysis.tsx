import { useState, useRef, ChangeEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Palette, Scan, RefreshCw, Sparkles, X, Camera, Video } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { useSkinTone } from "@/contexts/SkinToneContext";
import { useAuth } from "@/contexts/AuthContext";
import { applyRewardAction } from "@/lib/rewards";

const SkinToneAnalysis = () => {
  const [images, setImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedGender, setSelectedGender] = useState<'masculine' | 'feminine' | 'neutral'>('feminine');
  const [results, setResults] = useState<{
    tone: string;
    colors: string[];
    description: string;
    recommendedColors?: string[];
    reportImage?: string;
    season?: string;
    photos_analyzed?: number;
  } | null>(null);
  
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { setSkinToneData } = useSkinTone();
  const { user } = useAuth();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Webcam States
  const [isCameraMode, setIsCameraMode] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cleanup camera on unmount & handle stream mounting
  useEffect(() => {
    if (isCameraMode && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    return () => {
      // Intentionally don't stop camera on every re-render, only when unmounting the whole component if it was left on
    };
  }, [stream, isCameraMode]);

  // A separate dedicated cleanup for unmount to avoid stopping stream prematurely
  const streamRef = useRef<MediaStream | null>(null);
  
  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(mediaStream);
      setIsCameraMode(true);
      // Removed direct assignment, relying on useEffect above
    } catch (err) {
      toast.error("Could not access camera. Please check your permissions.");
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraMode(false);
  };

  const capturePhoto = () => {
    if (selectedFiles.length >= 5) {
      toast.error("You can only upload up to 5 images.");
      return;
    }
    
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const fileName = `camera_capture_${Date.now()}.png`;
            const file = new File([blob], fileName, { type: 'image/png' });
            setSelectedFiles(prev => [...prev, file]);
            
            const reader = new FileReader();
            reader.onload = () => {
              setImages(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
            setResults(null);
            
            // Provide immediate UI feedback
            toast.success(`Photo ${selectedFiles.length + 1} captured! 📸`);
            
            // Automatically close the camera so they can see the grid and progress
            stopCamera();
          }
        }, 'image/png');
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Check if total would exceed 5
    if (selectedFiles.length + files.length > 5) {
      toast.error("You can only upload up to 5 images.");
      // Just take what we can fit
      const spaceLeft = 5 - selectedFiles.length;
      files.splice(spaceLeft);
    }
    
    const validFiles = files.filter(file => {
      if (!file.type.startsWith("image/")) {
        toast.error(`File ${file.name} is not an image.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setSelectedFiles(prev => [...prev, ...validFiles]);

    // Create URLs for previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setResults(null);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setResults(null);
  };
  
  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please upload at least one image.");
      return;
    }
    
    setAnalyzing(true);
    
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
          formData.append('images', file);
      });
      
      // Call API
      const response = await fetch('/api/skin-tone-analysis', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        const analysisResult = {
          tone: data.tone,
          colors: data.colors,
          description: data.description,
          recommendedColors: data.recommendedColors,
          reportImage: data.reportImage,
          season: data.season,
          photos_analyzed: data.photos_analyzed
        };
        setResults(analysisResult);
        // ✅ Write to global context so AI Stylist gets personalized
        setSkinToneData({
          tone: data.tone,
          season: data.season,
          description: data.description,
          recommendedColors: data.recommendedColors || [],
          colors: data.colors || [],
          gender: selectedGender,
        });
        const reward = applyRewardAction(user?.id ?? 'guest', 'color_analysis', {
          dedupeKey: `analysis-${Date.now()}`,
        });
        toast.success(`Analysis complete from ${data.photos_analyzed} valid sample(s)! ✨`, {
          description: reward.skipped ? `Profile: ${data.season} · ${data.tone}` : `${reward.message} Profile: ${data.season} · ${data.tone}`,
          duration: 5000,
        });
      } else {
        throw new Error(data.error || "Analysis failed");
      }
    } catch (error) {
      console.error("Error analyzing skin tone:", error);
      toast.error(error instanceof Error ? error.message : "Failed to analyze skin tone");
    } finally {
      setAnalyzing(false);
    }
  };
  
  const handleReset = () => {
    setImages([]);
    setSelectedFiles([]);
    setResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    stopCamera();
  };
  
  return (
    <div className="flex flex-col space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">Skin Tone Analyzer</h3>
        <p className="text-foreground/70">
          Upload up to 5 well-lit photos of your face for the most accurate color recommendations
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col space-y-4">
          <div 
            className={`border-2 border-dashed rounded-lg p-4 min-h-64 flex flex-col items-center justify-center relative overflow-hidden ${
              images.length > 0 || isCameraMode ? 'border-primary' : 'border-border'
            } dark:bg-gray-800/30`}
          >
            {isCameraMode ? (
              <div className="w-full h-full flex flex-col items-center justify-center z-20 bg-black rounded-lg overflow-hidden absolute inset-0">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-90" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                  <Button onClick={capturePhoto} className="px-8 bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg border-2 border-white/20">
                    <Camera className="mr-2 h-5 w-5" /> Capture Photo
                  </Button>
                  <Button onClick={stopCamera} variant="outline" className="rounded-full shadow-lg bg-black/50 text-white hover:bg-black/80 border-white/20">
                    <X className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                </div>
              </div>
            ) : null}

            {images.length > 0 ? (
              <div className="w-full flex-1 flex flex-col justify-center">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group shadow-md border border-white/10">
                      <img 
                        src={img} 
                        alt={`Face ${idx+1}`} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <button 
                        onClick={() => removeImage(idx)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  
                  {images.length < 5 && (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center hover:bg-primary/5 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <Upload className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-[10px] text-foreground/50 font-medium">Add Photo</span>
                    </button>
                  )}
                </div>
                <p className="text-center text-xs text-foreground/50 mt-4">
                  {images.length} of 5 photos selected
                </p>
              </div>
            ) : !isCameraMode ? (
              <div className="text-center text-foreground/50">
                <Upload className="h-12 w-12 mx-auto mb-4 text-primary/40" />
                <p className="font-medium text-foreground">Upload 1 to 5 photos</p>
                <p className="text-sm mt-1">Different lighting conditions recommended</p>
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            {!isCameraMode && (
              <div className="flex gap-2">
                {images.length === 0 && (
                  <>
                    <Button 
                      onClick={() => fileInputRef.current?.click()} 
                      variant="outline" 
                      className="flex-1 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 h-11"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Select Photos
                    </Button>
                    <Button 
                      onClick={startCamera} 
                      variant="outline" 
                      className="flex-1 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 h-11"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Use Camera
                    </Button>
                  </>
                )}
                {images.length > 0 && images.length < 5 && (
                   <Button 
                     onClick={startCamera} 
                     variant="outline" 
                     className="flex-1 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 h-11"
                   >
                     <Video className="mr-2 h-4 w-4" />
                     Take Photo
                   </Button>
                )}
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
              multiple // Allow selecting multiple files at once!
            />

            <div className="space-y-2 mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Style Preference</p>
              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant={selectedGender === 'masculine' ? 'default' : 'outline'}
                  onClick={() => setSelectedGender('masculine')}
                  className={`flex-1 h-9 text-xs ${selectedGender === 'masculine' ? 'bg-primary text-white' : ''}`}
                >
                  Masculine
                </Button>
                <Button 
                  type="button"
                  variant={selectedGender === 'feminine' ? 'default' : 'outline'}
                  onClick={() => setSelectedGender('feminine')}
                  className={`flex-1 h-9 text-xs ${selectedGender === 'feminine' ? 'bg-primary text-white' : ''}`}
                >
                  Feminine
                </Button>
                <Button 
                  type="button"
                  variant={selectedGender === 'neutral' ? 'default' : 'outline'}
                  onClick={() => setSelectedGender('neutral')}
                  className={`flex-1 h-9 text-xs ${selectedGender === 'neutral' ? 'bg-primary text-white' : ''}`}
                >
                  Neutral
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleAnalyze} 
                className="flex-[2] bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white h-11 shadow-lg shadow-primary/20"
                disabled={images.length === 0 || analyzing || isCameraMode}
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze Skin Tone
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleReset} 
                variant="outline" 
                className="flex-1 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 h-11"
                disabled={images.length === 0 && !isCameraMode}
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
        
        <div>
          {results ? (
            <div className="space-y-4 bg-background/50 border border-white/5 p-6 rounded-2xl shadow-xl shadow-black/5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xl font-display font-bold">Your Results</h4>
                {results.photos_analyzed && (
                  <span className="px-2.5 py-1 bg-green-500/10 text-green-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                    {results.photos_analyzed} samples averaged
                  </span>
                )}
              </div>
              
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1">Skin Tone</p>
                <div className="flex items-center">
                  <div 
                    className="w-6 h-6 rounded-full mr-2 border border-border shadow-inner" 
                    style={{ backgroundColor: isDark ? "#FFD54F" : "#FBC02D" }}
                  ></div>
                  <span className="font-medium text-lg">{results.tone}</span>
                </div>
              </div>
              
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-2">Your Tone Palette</p>
                <div className="flex space-x-2">
                  {results.colors.map((color, index) => (
                    <div 
                      key={index} 
                      className="w-10 h-10 rounded-full border border-border shadow-inner" 
                      style={{ backgroundColor: color }}
                      title={color}
                    ></div>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1">Description</p>
                <p className="text-foreground/80 text-sm leading-relaxed">{results.description}</p>
              </div>
              
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-2">Recommended Colors</p>
                <div className="flex flex-wrap gap-2">
                  {(results as any).recommendedColors.map((color: string, index: number) => (
                    <div 
                      key={index} 
                      className="w-8 h-8 rounded-full border border-border shadow-inner" 
                      style={{ backgroundColor: color }}
                      title={color}
                    ></div>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1">Your Color Season</p>
                <p className="font-medium text-lg text-primary">{results.season}</p>
              </div>
              
              {results.reportImage && (
                <div className="mt-6 pt-6 border-t border-white/5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-3">Analysis Report</p>
                  <div className="rounded-xl overflow-hidden border border-white/5 bg-foreground/5">
                    <img 
                      src={results.reportImage} 
                      alt="Skin tone analysis report" 
                      className="w-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-background/50 border border-border/50 rounded-2xl border-dashed">
              <Palette className="h-12 w-12 text-foreground/20 mb-4" />
              <h4 className="text-lg font-medium text-foreground/70 mb-2">No Analysis Yet</h4>
              <p className="text-sm text-foreground/50 max-w-xs">
                Upload up to 5 photos and click Analyze to receive your personalized color profile.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkinToneAnalysis;
