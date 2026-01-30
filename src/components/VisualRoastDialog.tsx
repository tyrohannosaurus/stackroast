import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Flame, 
  Eye, 
  Sparkles,
  AlertCircle,
  RefreshCw,
  Share2,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { generateVisualRoastStreaming } from '@/lib/generateRoast';
import { PersonaSelector } from '@/components/PersonaSelector';
import { getRandomPersona, ROAST_PERSONAS, type PersonaKey } from '@/lib/roastPersonas';
import { LoadingFire } from '@/components/LoadingFire';
import { useAuth } from '@/contexts/AuthContext';

interface VisualRoastDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'upload' | 'analyzing' | 'result';

interface RoastResult {
  roastText: string;
  burnScore: number;
  persona: string;
  detectedTech: string[];
  imageAnalysis: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic', 'image/heif'];

export function VisualRoastDialog({ open, onOpenChange }: VisualRoastDialogProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<Step>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [context, setContext] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<PersonaKey | 'random'>('random');
  const [isDragging, setIsDragging] = useState(false);
  
  // Analysis state
  const [streamingText, setStreamingText] = useState('');
  const [result, setResult] = useState<RoastResult | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Please upload a PNG, JPEG, or WebP image');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }

    setStep('analyzing');
    setStreamingText('');
    setResult(null);

    const personaToUse = selectedPersona === 'random' ? getRandomPersona() : selectedPersona;

    try {
      await generateVisualRoastStreaming(
        selectedFile,
        {
          onChunk: (chunk, fullText) => {
            setStreamingText(fullText);
          },
          onComplete: (roastResult) => {
            setResult({
              roastText: roastResult.roastText,
              burnScore: roastResult.burnScore,
              persona: roastResult.persona,
              detectedTech: roastResult.detectedTech,
              imageAnalysis: roastResult.imageAnalysis,
            });
            setStreamingText('');
            setStep('result');
            toast.success('Visual roast complete! 🔥');
          },
          onError: (error) => {
            console.error('Visual roast error:', error);
            toast.error(error.message || 'Failed to analyze image');
            setStep('upload');
          },
        },
        context || undefined,
        personaToUse
      );
    } catch (error) {
      console.error('Error:', error);
      toast.error('Something went wrong. Please try again.');
      setStep('upload');
    }
  };

  const handleReset = () => {
    setStep('upload');
    setSelectedFile(null);
    setPreviewUrl(null);
    setContext('');
    setStreamingText('');
    setResult(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation
    setTimeout(handleReset, 300);
  };

  const handleDownloadResult = () => {
    if (!result) return;

    const content = `
Visual Roast Analysis
=====================

Burn Score: ${result.burnScore}/100
Persona: ${result.persona}

Detected Technologies:
${result.detectedTech.map(t => `- ${t}`).join('\n')}

Analysis:
${result.imageAnalysis}

The Roast:
${result.roastText}

---
Generated by StackRoast
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'visual-roast.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Roast downloaded!');
  };

  const getIntensityLabel = (score: number) => {
    if (score >= 80) return { label: '🔥🔥🔥 SAVAGE', color: 'text-red-500' };
    if (score >= 60) return { label: '🔥🔥 SPICY', color: 'text-orange-500' };
    if (score >= 40) return { label: '🔥 WARM', color: 'text-yellow-500' };
    return { label: '❄️ MILD', color: 'text-green-500' };
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Eye className="w-6 h-6 text-orange-500" />
            Visual Stack Analysis
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Upload a screenshot, architecture diagram, or code image for AI analysis'}
            {step === 'analyzing' && 'Analyzing your image...'}
            {step === 'result' && 'Your visual roast is ready!'}
          </DialogDescription>
        </DialogHeader>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-4 pt-2">
            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !selectedFile && fileInputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                ${isDragging 
                  ? 'border-orange-500 bg-orange-500/10' 
                  : selectedFile 
                    ? 'border-green-500/50 bg-green-500/5' 
                    : 'border-border hover:border-orange-500/50 hover:bg-orange-500/5'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                onChange={handleFileInputChange}
                className="hidden"
              />

              {selectedFile && previewUrl ? (
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-48 rounded-lg mx-auto border border-border"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 w-6 h-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-orange-400" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      Drop your image here or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      PNG, JPEG, WebP up to 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Supported formats hint */}
            <Card className="p-4 bg-muted/30 border-muted">
              <div className="flex items-start gap-3">
                <ImageIcon className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">What can you upload?</p>
                  <ul className="space-y-1">
                    <li>• Architecture diagrams (AWS, system design, etc.)</li>
                    <li>• Code screenshots (IDE, terminal, etc.)</li>
                    <li>• Tech stack visualizations</li>
                    <li>• Dashboard or UI screenshots</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Context input */}
            <div className="space-y-2">
              <Label htmlFor="context">Additional context (optional)</Label>
              <Textarea
                id="context"
                placeholder="e.g., 'This is my startup's architecture' or 'My personal project setup'"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            {/* Persona selector */}
            <div className="space-y-2">
              <Label>Roast Persona</Label>
              <PersonaSelector
                selectedPersona={selectedPersona}
                onSelect={setSelectedPersona}
              />
            </div>

            {/* Analyze button */}
            <Button
              onClick={handleAnalyze}
              disabled={!selectedFile}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              size="lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Analyze & Roast
            </Button>
          </div>
        )}

        {/* Analyzing Step */}
        {step === 'analyzing' && (
          <div className="py-8 space-y-6">
            <div className="flex justify-center">
              <LoadingFire size="lg" text="Analyzing your image..." />
            </div>

            {/* Streaming preview */}
            {streamingText && (
              <Card className="p-4 bg-muted/30 max-h-48 overflow-y-auto">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {streamingText}
                  <span className="animate-pulse">▊</span>
                </p>
              </Card>
            )}

            {/* Preview of image being analyzed */}
            {previewUrl && (
              <div className="flex justify-center">
                <img
                  src={previewUrl}
                  alt="Analyzing"
                  className="max-h-32 rounded-lg opacity-50"
                />
              </div>
            )}
          </div>
        )}

        {/* Result Step */}
        {step === 'result' && result && (
          <div className="space-y-4 pt-2">
            {/* Burn Score */}
            <Card className="p-6 text-center bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30">
              <div 
                className="text-6xl font-bold mb-2"
                style={{ 
                  color: result.burnScore >= 80 ? '#ef4444' : 
                         result.burnScore >= 60 ? '#f97316' : 
                         result.burnScore >= 40 ? '#eab308' : '#22c55e'
                }}
              >
                {result.burnScore}
              </div>
              <p className="text-muted-foreground">/100 Burn Score</p>
              <Badge className={`mt-2 ${getIntensityLabel(result.burnScore).color}`}>
                {getIntensityLabel(result.burnScore).label}
              </Badge>
            </Card>

            {/* Detected Technologies */}
            {result.detectedTech.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Detected Technologies</Label>
                <div className="flex flex-wrap gap-2">
                  {result.detectedTech.map((tech, i) => (
                    <Badge key={i} variant="secondary" className="bg-orange-500/10 text-orange-400">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Image Analysis */}
            {result.imageAnalysis && (
              <Card className="p-4 bg-muted/30">
                <Label className="text-sm text-muted-foreground mb-2 block">What the AI Saw</Label>
                <p className="text-sm text-foreground">{result.imageAnalysis}</p>
              </Card>
            )}

            {/* The Roast */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary">{result.persona}</Badge>
                <span className="text-muted-foreground text-sm">says:</span>
              </div>
              <p className="text-lg italic text-foreground leading-relaxed">
                "{result.roastText}"
              </p>
            </Card>

            {/* Analyzed Image Preview */}
            {previewUrl && (
              <div className="flex justify-center">
                <img
                  src={previewUrl}
                  alt="Analyzed"
                  className="max-h-32 rounded-lg border border-border"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={handleReset} variant="outline" className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                Analyze Another
              </Button>
              <Button onClick={handleDownloadResult} variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
