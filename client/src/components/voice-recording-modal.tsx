import { useState, useEffect, useMemo, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { startSpeechRecognition, stopSpeechRecognition, isSpeechRecognitionSupported, preloadSpeechRecognition, cleanupSpeechRecognition } from "@/lib/speech-recognition";
import { parseArabicTransaction } from "@/lib/arabic-text-processor";
import { type Category } from "@shared/schema";
import { Mic, MicOff } from "lucide-react";

interface VoiceRecordingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VoiceRecordingModal({ open, onOpenChange }: VoiceRecordingModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [parsedTransaction, setParsedTransaction] = useState<any>(null);
  const [error, setError] = useState("");
  const [processingTimeout, setProcessingTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Preload speech recognition when modal opens for faster startup
  useEffect(() => {
    if (open && isSpeechRecognitionSupported()) {
      preloadSpeechRecognition().then((success) => {
        if (success) {
          console.log('Speech recognition preloaded successfully');
        }
      }).catch(console.error);
    }
  }, [open]);

  // Lazy load categories only when modal is open
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: open, // Only fetch when modal is open
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in garbage collection for 10 minutes
  });

  const createTransaction = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/transactions", data);
    },
    onSuccess: () => {
      // Optimized query invalidation - only invalidate what's needed
      const invalidationPromises = [
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/balance"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/analytics"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/analytics/monthly-trends"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/analytics/spending-patterns"] })
      ];
      
      // Run invalidations in parallel
      Promise.all(invalidationPromises).catch(console.error);
      
      toast({
        title: "تم بنجاح!",
        description: "تم إضافة العملية بنجاح من خلال الصوت",
      });
      
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "خطأ!",
        description: "فشل في إضافة العملية. حاول مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  // Debounced parsing to avoid excessive processing
  const debouncedParseText = useCallback(
    (text: string) => {
      // Clear existing timeout
      if (processingTimeout) {
        clearTimeout(processingTimeout);
      }
      
      // Set new timeout for parsing
      const timeout = setTimeout(() => {
        if (categories.length > 0) {
          const parsed = parseArabicTransaction(text, categories);
          console.log('Parsed transaction:', parsed);
          setParsedTransaction(parsed);
        }
      }, 300); // 300ms debounce
      
      setProcessingTimeout(timeout);
    },
    [categories, processingTimeout]
  );
  
  // Memoized speech recognition result handler
  const handleSpeechResult = useCallback(
    (text: string) => {
      console.log('Speech recognized:', text);
      setRecognizedText(text);
      debouncedParseText(text);
    },
    [debouncedParseText]
  );
  
  // Memoized error handler with retry logic
  const handleSpeechError = useCallback(
    (error: string) => {
      console.error('Speech recognition error:', error);
      setError(error);
      setIsRecording(false);
      
      // Auto-retry for specific errors after a short delay
      if (error.includes('خطأ مؤقت') || error.includes('حاول مرة أخرى')) {
        setTimeout(() => {
          setError('');
        }, 3000); // Clear error after 3 seconds to allow retry
      }
    },
    []
  );

  useEffect(() => {
    if (!isSpeechRecognitionSupported()) {
      setError("متصفحك لا يدعم التعرف على الصوت");
      return;
    }

    if (open && isRecording) {
      console.log('Starting speech recognition...');
      startSpeechRecognition(
        handleSpeechResult,
        handleSpeechError
      );
    } else if (!isRecording) {
      stopSpeechRecognition();
    }

    return () => {
      stopSpeechRecognition();
      // Clear any pending processing timeout
      if (processingTimeout) {
        clearTimeout(processingTimeout);
        setProcessingTimeout(null);
      }
    };
  }, [open, isRecording, handleSpeechResult, handleSpeechError, processingTimeout]);

  // Memoized start recording handler
  const handleStartRecording = useCallback(async () => {
    if (!isSpeechRecognitionSupported()) {
      setError("متصفحك لا يدعم التعرف على الصوت");
      return;
    }
    
    // Check if we're in a secure context (required for microphone access)
    if (!window.isSecureContext) {
      setError("يجب استخدام اتصال آمن (HTTPS) للوصول للميكروفون");
      return;
    }
    
    // Check for media devices availability (optional check)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("متصفحك لا يدعم الوصول للميكروفون");
      return;
    }
    
    setError("");
    setRecognizedText("");
    setParsedTransaction(null);
    
    // Clear any pending processing
    if (processingTimeout) {
      clearTimeout(processingTimeout);
      setProcessingTimeout(null);
    }
    
    setIsRecording(true);
  }, [processingTimeout]);

  // Memoized stop recording handler
  const handleStopRecording = useCallback(() => {
    setIsRecording(false);
    stopSpeechRecognition();
    
    // Clear any pending processing timeout
    if (processingTimeout) {
      clearTimeout(processingTimeout);
      setProcessingTimeout(null);
    }
  }, [processingTimeout]);

  // Memoized confirm handler
  const handleConfirm = useCallback(() => {
    if (parsedTransaction) {
      createTransaction.mutate({
        type: parsedTransaction.type,
        amount: parsedTransaction.amount.toString(),
        category: parsedTransaction.category,
        note: parsedTransaction.note || recognizedText,
        date: new Date().toISOString(),
      });
    }
  }, [parsedTransaction, recognizedText, createTransaction]);

  // Memoized close handler with cleanup
  const handleClose = useCallback(() => {
    setIsRecording(false);
    setRecognizedText("");
    setParsedTransaction(null);
    setError("");
    
    // Clear any pending processing
    if (processingTimeout) {
      clearTimeout(processingTimeout);
      setProcessingTimeout(null);
    }
    
    // Cleanup speech recognition resources
    cleanupSpeechRecognition();
    
    onOpenChange(false);
  }, [processingTimeout, onOpenChange]);

  // Memoized currency formatter
  const formatCurrency = useMemo(() => {
    return (amount: number) => {
      return `${amount.toLocaleString('ar-EG')} ج.م`;
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="text-center">التعرف على الصوت</DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-4 min-h-[200px] flex flex-col justify-center">
          {error ? (
            <div className="text-destructive text-sm p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <p className="font-medium">خطأ:</p>
              <p>{error}</p>
              {error.includes('متصفحك') && (
                <p className="text-xs mt-2">جرب استخدام Chrome أو Edge للحصول على أفضل دعم</p>
              )}
              {error.includes('حاول مرة أخرى') && (
                <div className="mt-3">
                  <Button 
                    onClick={() => {
                      setError('');
                      if (!isRecording) {
                        handleStartRecording();
                      }
                    }}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                  >
                    حاول الآن
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}>
                {isRecording ? (
                  <Mic className="h-8 w-8 text-white" />
                ) : (
                  <MicOff className="h-8 w-8 text-white" />
                )}
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {isRecording 
                  ? 'جاري الاستماع... قل شيئاً مثل "صرفت خمسين جنيه أكل"' 
                  : 'اضغط على زر الميكروفون لبدء التسجيل'
                }
              </p>
              
              {recognizedText && (
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">النص المُعرّف:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300" data-testid="text-recognized">{recognizedText}</p>
                </div>
              )}
              
              {parsedTransaction && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">تم تحليل العملية:</p>
                  <div className="text-right space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <p><span className="font-medium">النوع:</span> {parsedTransaction.type === 'income' ? 'دخل' : 'مصروف'}</p>
                    <p><span className="font-medium">المبلغ:</span> {formatCurrency(parsedTransaction.amount)}</p>
                    <p><span className="font-medium">التصنيف:</span> {parsedTransaction.categoryAr || parsedTransaction.category}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              data-testid="button-cancel-voice"
            >
              إلغاء
            </Button>
            
            {!error && (
              <>
                {!isRecording ? (
                  <Button
                    className="flex-1 bg-primary"
                    onClick={handleStartRecording}
                    data-testid="button-start-recording"
                  >
                    <Mic className="ml-2 h-4 w-4" />
                    بدء التسجيل
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleStopRecording}
                    data-testid="button-stop-recording"
                  >
                    <MicOff className="ml-2 h-4 w-4" />
                    إيقاف
                  </Button>
                )}
                
                {parsedTransaction && !isRecording && (
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleConfirm}
                    disabled={createTransaction.isPending}
                    data-testid="button-confirm-transaction"
                  >
                    {createTransaction.isPending ? 'جاري الحفظ...' : 'تأكيد'}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
