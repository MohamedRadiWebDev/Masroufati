import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { startSpeechRecognition, stopSpeechRecognition, isSpeechRecognitionSupported } from "@/lib/speech-recognition";
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
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const createTransaction = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/transactions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      
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

  useEffect(() => {
    if (!isSpeechRecognitionSupported()) {
      setError("متصفحك لا يدعم التعرف على الصوت");
      return;
    }

    if (open && isRecording) {
      console.log('Starting speech recognition...');
      startSpeechRecognition(
        (text: string) => {
          console.log('Speech recognized:', text);
          setRecognizedText(text);
          const parsed = parseArabicTransaction(text, categories);
          console.log('Parsed transaction:', parsed);
          setParsedTransaction(parsed);
        },
        (error: string) => {
          console.error('Speech recognition error:', error);
          setError(error);
          setIsRecording(false);
        }
      );
    } else if (!isRecording) {
      stopSpeechRecognition();
    }

    return () => {
      stopSpeechRecognition();
    };
  }, [open, isRecording, categories]);

  const handleStartRecording = async () => {
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
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    stopSpeechRecognition();
  };

  const handleConfirm = () => {
    if (parsedTransaction) {
      createTransaction.mutate({
        type: parsedTransaction.type,
        amount: parsedTransaction.amount.toString(),
        category: parsedTransaction.category,
        note: parsedTransaction.note || recognizedText,
        date: new Date().toISOString(),
      });
    }
  };

  const handleClose = () => {
    setIsRecording(false);
    setRecognizedText("");
    setParsedTransaction(null);
    setError("");
    stopSpeechRecognition();
    onOpenChange(false);
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('ar-EG')} ج.م`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="text-center">التعرف على الصوت</DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-4">
          {error ? (
            <div className="text-destructive text-sm p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <p className="font-medium">خطأ:</p>
              <p>{error}</p>
              {error.includes('متصفحك') && (
                <p className="text-xs mt-2">جرب استخدام Chrome أو Edge للحصول على أفضل دعم</p>
              )}
            </div>
          ) : (
            <>
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${isRecording ? 'bg-destructive animate-pulse' : 'bg-primary'}`}>
                {isRecording ? (
                  <Mic className="h-8 w-8 text-white" />
                ) : (
                  <MicOff className="h-8 w-8 text-white" />
                )}
              </div>
              
              <p className="text-muted-foreground text-sm">
                {isRecording 
                  ? 'جاري الاستماع... قل شيئاً مثل "صرفت خمسين جنيه أكل"' 
                  : 'اضغط على زر الميكروفون لبدء التسجيل'
                }
              </p>
              
              {recognizedText && (
                <div className="bg-accent p-3 rounded-lg">
                  <p className="text-sm font-medium">النص المُعرّف:</p>
                  <p className="text-sm" data-testid="text-recognized">{recognizedText}</p>
                </div>
              )}
              
              {parsedTransaction && (
                <div className="bg-card border border-border p-3 rounded-lg">
                  <p className="text-sm font-medium mb-2">تم تحليل العملية:</p>
                  <div className="text-right space-y-1 text-sm">
                    <p><span className="font-medium">النوع:</span> {parsedTransaction.type === 'income' ? 'دخل' : 'مصروف'}</p>
                    <p><span className="font-medium">المبلغ:</span> {formatCurrency(parsedTransaction.amount)}</p>
                    <p><span className="font-medium">التصنيف:</span> {parsedTransaction.categoryAr || parsedTransaction.category}</p>
                  </div>
                </div>
              )}
            </>
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
                    className="flex-1 bg-success"
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
