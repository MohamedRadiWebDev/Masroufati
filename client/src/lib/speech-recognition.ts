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
  
  recognition.lang = 'ar-SA'; // Arabic (Saudi Arabia)
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    console.log('بدأ التسجيل...');
  };

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    const result = finalTranscript || interimTranscript;
    if (result.trim()) {
      onResult(result.trim());
    }
  };

  recognition.onerror = (event: any) => {
    let errorMessage = 'حدث خطأ في التعرف على الصوت';
    
    switch (event.error) {
      case 'no-speech':
        errorMessage = 'لم يتم رصد أي كلام. حاول مرة أخرى';
        break;
      case 'audio-capture':
        errorMessage = 'لا يمكن الوصول للميكروفون';
        break;
      case 'not-allowed':
        errorMessage = 'تم رفض الإذن للوصول للميكروفون';
        break;
      case 'network':
        errorMessage = 'خطأ في الشبكة';
        break;
    }
    
    onError(errorMessage);
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
