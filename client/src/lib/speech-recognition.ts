interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

let recognition: any = null;

export function isSpeechRecognitionSupported(): boolean {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

export function startSpeechRecognition(
  onResult: (transcript: string) => void,
  onError: (error: string) => void
): void {
  if (!isSpeechRecognitionSupported()) {
    onError('متصفحك لا يدعم التعرف على الصوت');
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  
  // محاولة أفضل اللغات العربية المدعومة
  const arabicLanguages = ['ar-SA', 'ar-EG', 'ar-AE', 'ar-JO', 'ar-LB', 'ar'];
  recognition.lang = arabicLanguages[0]; // نبدأ بالسعودية
  
  recognition.continuous = true; // استمرار في الاستماع
  recognition.interimResults = true; // عرض النتائج المؤقتة
  recognition.maxAlternatives = 3; // زيادة البدائل للدقة أكثر
  
  // تحسين الاستقرار
  recognition.grammars = null;
  recognition.serviceURI = null;

  recognition.onstart = () => {
    console.log('بدأ التسجيل...');
  };

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      // نحاول الحصول على أفضل بديل
      let bestTranscript = '';
      let bestConfidence = 0;
      
      // فحص جميع البدائل
      for (let j = 0; j < event.results[i].length; j++) {
        const alternative = event.results[i][j];
        if (alternative.confidence > bestConfidence) {
          bestConfidence = alternative.confidence;
          bestTranscript = alternative.transcript;
        }
      }
      
      // إذا لم نجد بديل جيد، نأخذ الأول
      const transcript = bestTranscript || event.results[i][0].transcript;
      
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    // تحسين النص العربي
    const cleanText = (text: string) => {
      return text
        .replace(/\s+/g, ' ') // إزالة المسافات الزائدة
        .replace(/[٠-٩]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - '٠'.charCodeAt(0) + '0'.charCodeAt(0))) // تحويل الأرقام العربية
        .trim();
    };

    const result = cleanText(finalTranscript || interimTranscript);
    if (result.length > 0) {
      onResult(result);
    }
  };

  recognition.onerror = (event: any) => {
    let errorMessage = 'حدث خطأ في التعرف على الصوت';
    let shouldRetry = false;
    
    switch (event.error) {
      case 'no-speech':
        errorMessage = 'لم يتم رصد أي كلام. حاول التحدث بوضوح أكثر';
        shouldRetry = true;
        break;
      case 'audio-capture':
        errorMessage = 'لا يمكن الوصول للميكروفون. تأكد من أن الميكروفون متصل';
        break;
      case 'not-allowed':
        errorMessage = 'تم رفض الإذن للوصول للميكروفون. اسمح بالوصول وأعد المحاولة';
        break;
      case 'network':
        errorMessage = 'خطأ في الاتصال بالإنترنت. تحقق من اتصالك';
        shouldRetry = true;
        break;
      case 'language-not-supported':
        errorMessage = 'اللغة العربية غير مدعومة في متصفحك';
        break;
      case 'service-not-allowed':
        errorMessage = 'خدمة التعرف على الصوت غير متاحة';
        break;
      default:
        errorMessage = `خطأ غير متوقع: ${event.error}`;
        shouldRetry = true;
    }
    
    console.warn('Speech recognition error:', event.error, errorMessage);
    onError(errorMessage);
    
    // إعادة محاولة تلقائية للأخطاء القابلة للإصلاح
    if (shouldRetry) {
      setTimeout(() => {
        console.log('محاولة إعادة تشغيل التعرف على الصوت...');
        // يمكن إضافة منطق إعادة المحاولة هنا إذا لزم الأمر
      }, 2000);
    }
  };

  recognition.onend = () => {
    console.log('انتهى التسجيل');
  };

  recognition.start();
}

export function stopSpeechRecognition(): void {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
}
