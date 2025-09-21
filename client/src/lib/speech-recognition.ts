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
    SpeechGrammarList: any;
  }
}

let recognition: any = null;
let preloadedRecognition: any = null;
let isPreloading = false;

// دالة مساعدة لاختيار أفضل بديل عربي
function selectBestArabicAlternative(alternatives: string[], defaultChoice: string): string {
  if (!alternatives || alternatives.length === 0) return defaultChoice;
  
  const arabicScore = (text: string): number => {
    let score = 0;
    
    // إعطاء نقاط للكلمات العربية المالية الشائعة
    const financialKeywords = [
      'صرف', 'دفع', 'اشتري', 'جنيه', 'ريال', 'درهم', 'دولار',
      'أكل', 'مواصلات', 'فاتورة', 'راتب', 'مرتب'
    ];
    
    financialKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 10;
    });
    
    // إعطاء نقاط للأرقام
    const numberMatches = text.match(/\d+/g);
    if (numberMatches) score += numberMatches.length * 5;
    
    // إعطاء نقاط للنص العربي
    const arabicChars = text.match(/[\u0600-\u06FF]/g);
    if (arabicChars) score += arabicChars.length;
    
    return score;
  };
  
  let bestAlternative = defaultChoice;
  let bestScore = arabicScore(defaultChoice);
  
  alternatives.forEach(alt => {
    const score = arabicScore(alt);
    if (score > bestScore) {
      bestScore = score;
      bestAlternative = alt;
    }
  });
  
  return bestAlternative;
}

// دالة لتحويل الأرقام الإنجليزية المنطوقة إلى أرقام ASCII
function convertEnglishToArabicNumerals(text: string): string {
  const englishToNumbers: Record<string, string> = {
    'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
    'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
    'twenty': '20', 'thirty': '30', 'forty': '40', 'fifty': '50',
    'sixty': '60', 'seventy': '70', 'eighty': '80', 'ninety': '90',
    'hundred': '100', 'thousand': '1000'
  };
  
  let result = text.toLowerCase();
  Object.entries(englishToNumbers).forEach(([eng, num]) => {
    result = result.replace(new RegExp(`\\b${eng}\\b`, 'g'), num);
  });
  
  return result;
}

export function isSpeechRecognitionSupported(): boolean {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

// Preload speech recognition for faster startup
export function preloadSpeechRecognition(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!isSpeechRecognitionSupported() || isPreloading || preloadedRecognition) {
      resolve(!!preloadedRecognition);
      return;
    }
    
    isPreloading = true;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    try {
      preloadedRecognition = new SpeechRecognition();
      
      // Pre-configure with optimized settings
      preloadedRecognition.lang = 'ar-EG';
      preloadedRecognition.continuous = true;
      preloadedRecognition.interimResults = true;
      preloadedRecognition.maxAlternatives = 3; // Reduced for better performance
      
      // Advanced audio processing setup if supported
      try {
        if ('noiseSuppression' in preloadedRecognition) {
          preloadedRecognition.noiseSuppression = true;
        }
        if ('echoCancellation' in preloadedRecognition) {
          preloadedRecognition.echoCancellation = true;
        }
        if ('autoGainControl' in preloadedRecognition) {
          preloadedRecognition.autoGainControl = true;
        }
      } catch (error) {
        console.warn('Advanced audio processing not supported:', error);
      }
      
      isPreloading = false;
      resolve(true);
    } catch (error) {
      console.warn('Failed to preload speech recognition:', error);
      preloadedRecognition = null;
      isPreloading = false;
      resolve(false);
    }
  });
}

export function startSpeechRecognition(
  onResult: (transcript: string) => void,
  onError: (error: string) => void
): void {
  if (!isSpeechRecognitionSupported()) {
    onError('متصفحك لا يدعم التعرف على الصوت');
    return;
  }

  // Use preloaded recognition if available for faster startup
  if (preloadedRecognition && !recognition) {
    recognition = preloadedRecognition;
    preloadedRecognition = null; // Transfer ownership
  } else {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    try {
      recognition = new SpeechRecognition();
    } catch (error) {
      console.error('Error creating SpeechRecognition:', error);
      onError('فشل في إنشاء خدمة التعرف على الصوت');
      return;
    }
    
    // Configure recognition if not using preloaded
    const arabicLanguages = ['ar-EG', 'ar-SA', 'ar-AE', 'ar-JO', 'ar-LB', 'ar'];
    recognition.lang = arabicLanguages[0];
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3; // Reduced for better performance
  }
  
  // تحسينات إضافية للأداء والدقة
  if ('grammars' in recognition && window.SpeechGrammarList) {
    try {
      recognition.grammars = new window.SpeechGrammarList();
    } catch (error) {
      console.warn('SpeechGrammarList not supported:', error);
    }
  }
  
  // تحسين معالجة الضوضاء (مع فحص الدعم)
  try {
    if ('noiseSuppression' in recognition) {
      recognition.noiseSuppression = true;
    }
    if ('echoCancellation' in recognition) {
      recognition.echoCancellation = true;
    }
    if ('autoGainControl' in recognition) {
      recognition.autoGainControl = true;
    }
  } catch (error) {
    console.warn('Advanced audio processing not supported:', error);
  }

  recognition.onstart = () => {
    console.log('بدأ التسجيل بنجاح');
  };
  
  recognition.onaudiostart = () => {
    console.log('بدأ التقاط الصوت');
  };
  
  recognition.onaudioend = () => {
    console.log('انتهى التقاط الصوت');
  };
  
  recognition.onsoundstart = () => {
    console.log('تم رصد صوت');
  };
  
  recognition.onsoundend = () => {
    console.log('انتهى رصد الصوت');
  };
  
  recognition.onspeechstart = () => {
    console.log('بدأ رصد الكلام');
  };
  
  recognition.onspeechend = () => {
    console.log('انتهى رصد الكلام');
  };

  let fullTranscript = '';
  let isCollectingResults = false;
  let resultTimer: any = null;
  
  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = 0; i < event.results.length; i++) {
      // نحاول الحصول على أفضل بديل مع تحليل متقدم
      let bestTranscript = '';
      let bestConfidence = 0;
      let allAlternatives: string[] = [];
      
      // جمع جميع البدائل للتحليل
      for (let j = 0; j < event.results[i].length; j++) {
        const alternative = event.results[i][j];
        allAlternatives.push(alternative.transcript);
        if (alternative.confidence > bestConfidence) {
          bestConfidence = alternative.confidence;
          bestTranscript = alternative.transcript;
        }
      }
      
      // معالجة ذكية للبدائل - اختيار الأفضل للغة العربية
      const intelligentChoice = selectBestArabicAlternative(allAlternatives, bestTranscript);
      const transcript = intelligentChoice || event.results[i][0].transcript;
      
      if (event.results[i].isFinal) {
        finalTranscript += (finalTranscript ? ' ' : '') + transcript;
      } else {
        interimTranscript += (interimTranscript ? ' ' : '') + transcript;
      }
    }

    // جمع النتائج النهائية
    if (finalTranscript) {
      fullTranscript += (fullTranscript ? ' ' : '') + finalTranscript;
      isCollectingResults = true;
    }

    // عرض النتائج المؤقتة أو النهائية
    const currentResult = fullTranscript + (interimTranscript ? ' ' + interimTranscript : '');
    
    if (currentResult.trim()) {
      // تحسين متقدم للنص العربي
      const enhancedCleanText = (text: string) => {
        return text
          .replace(/\s+/g, ' ') // إزالة المسافات الزائدة
          .replace(/[A-Za-z]+/g, (match) => convertEnglishToArabicNumerals(match)) // تحويل الأرقام الإنجليزية المنطوقة
          .replace(/[٠-٩]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - '٠'.charCodeAt(0) + '0'.charCodeAt(0))) // تحويل جميع الأرقام العربية للـ ASCII
          .replace(/ه\s*(\d)/g, '$1') // إزالة "ه" قبل الأرقام (مثل "ه 50" -> "50")
          .replace(/\b(\d+)\s*جنيه?\b/g, '$1') // تبسيط عبارات الجنيه
          .trim();
      };

      const result = enhancedCleanText(currentResult);
      if (result.length > 0) {
        onResult(result);
      }
    }

    // إعادة تشغيل الاستماع إذا توقف مؤقتاً
    if (resultTimer) {
      clearTimeout(resultTimer);
    }
    
    resultTimer = setTimeout(() => {
      if (isCollectingResults && fullTranscript.trim()) {
        console.log('Completed collecting speech results');
        isCollectingResults = false;
      }
    }, 1500); // انتظار 1.5 ثانية بعد آخر نتيجة
  };

  recognition.onerror = (event: any) => {
    console.warn('Speech recognition error:', event.error);
    
    // لا نتوقف عند أخطاء معينة، نحاول إعادة التشغيل
    if (event.error === 'aborted' || event.error === 'no-speech') {
      console.log('Attempting to restart speech recognition after error:', event.error);
      
      // إعادة تشغيل بعد توقف قصير
      setTimeout(() => {
        if (recognition) {
          try {
            recognition.start();
            console.log('Speech recognition restarted after error');
          } catch (restartError) {
            console.error('Failed to restart speech recognition:', restartError);
            handleFinalError(event.error);
          }
        }
      }, 100);
      return;
    }
    
    handleFinalError(event.error);
  };
  
  function handleFinalError(errorType: string) {
    let errorMessage = 'حدث خطأ في التعرف على الصوت';
    
    switch (errorType) {
      case 'audio-capture':
        errorMessage = 'لا يمكن الوصول للميكروفون. تأكد من السماح بالوصول للميكروفون في المتصفح';
        break;
      case 'not-allowed':
        errorMessage = 'تم رفض الإذن للوصول للميكروفون. اضغط على أيقونة الميكروفون في شريط العنوان واسمح بالوصول';
        break;
      case 'network':
        errorMessage = 'خطأ في الاتصال بالإنترنت. تحقق من اتصالك وحاول مرة أخرى';
        break;
      case 'language-not-supported':
        errorMessage = 'اللغة العربية غير مدعومة في متصفحك. جرب استخدام Chrome أو Edge';
        break;
      case 'service-not-allowed':
        errorMessage = 'خدمة التعرف على الصوت غير متاحة. تأكد من أنك تستخدم HTTPS';
        break;
      default:
        errorMessage = 'تأكد من السماح بالوصول للميكروفون وحاول مرة أخرى';
    }
    
    onError(errorMessage);
  }

  recognition.onend = () => {
    console.log('انتهى التسجيل - إعادة تشغيل تلقائي');
    
    // إعادة تشغيل تلقائي إذا كان التسجيل ما زال نشطاً
    if (recognition && !recognition._stopped) {
      try {
        setTimeout(() => {
          if (recognition && !recognition._stopped) {
            recognition.start();
            console.log('تم إعادة تشغيل التسجيل تلقائياً');
          }
        }, 100);
      } catch (error) {
        console.error('فشل في إعادة تشغيل التسجيل:', error);
      }
    }
  };

  // Add comprehensive pre-start checks
  console.log('Attempting to start speech recognition...');
  console.log('Current URL protocol:', window.location.protocol);
  console.log('Is secure context:', window.isSecureContext);
  
  try {
    // Check microphone permission first
    if (navigator.permissions) {
      navigator.permissions.query({name: 'microphone' as PermissionName}).then(function(result) {
        console.log('Microphone permission state:', result.state);
        if (result.state === 'denied') {
          onError('تم رفض الإذن للوصول للميكروفون. اضغط على أيقونة القفل في شريط العنوان واسمح بالوصول');
          return;
        }
      }).catch(console.warn);
    }
    
    recognition.start();
    console.log('Speech recognition started successfully');
  } catch (error) {
    console.error('Error starting speech recognition:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    onError(`فشل في بدء التعرف على الصوت: ${errorMsg}. تأكد من السماح بالوصول للميكروفون`);
  }
}

export function stopSpeechRecognition(): void {
  if (recognition) {
    recognition._stopped = true; // علامة للإشارة للتوقف
    recognition.stop();
    recognition = null;
  }
}

// Clean up preloaded recognition
export function cleanupSpeechRecognition(): void {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
  if (preloadedRecognition) {
    preloadedRecognition = null;
  }
  isPreloading = false;
}
