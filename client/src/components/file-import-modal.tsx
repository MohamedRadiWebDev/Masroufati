import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  readExcelFile, 
  readCSVFile, 
  parseImportedData, 
  validateFileType,
  getFileTypeDisplayName,
  type ImportResult,
  type ValidationError 
} from "@/lib/file-import-processor";
import { localStorageManager } from "@/lib/localStorage-storage";
import { queryClient } from "@/lib/queryClient";

interface FileImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCategories: string[];
}

type ImportStep = 'upload' | 'processing' | 'validation' | 'results';

export default function FileImportModal({ isOpen, onClose, availableCategories }: FileImportModalProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const resetModal = () => {
    setStep('upload');
    setSelectedFile(null);
    setImportResult(null);
    setProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    if (!validateFileType(file)) {
      toast({
        title: "نوع ملف غير مدعوم",
        description: "يجب أن يكون الملف من نوع Excel (.xlsx, .xls) أو CSV (.csv)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "حجم الملف كبير جداً",
        description: "يجب أن يكون حجم الملف أقل من 10 ميجابايت",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setStep('upload');
  };

  const processFile = async () => {
    if (!selectedFile) return;

    setProcessing(true);
    setStep('processing');

    try {
      // Read file based on type
      let importedData;
      const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));
      
      if (fileExtension === '.csv') {
        importedData = await readCSVFile(selectedFile);
      } else {
        importedData = await readExcelFile(selectedFile);
      }

      if (importedData.length === 0) {
        throw new Error('الملف فارغ أو لا يحتوي على بيانات صحيحة');
      }

      setStep('validation');

      // Parse and validate data
      const result = parseImportedData(importedData, availableCategories);
      setImportResult(result);
      setStep('results');

    } catch (error) {
      toast({
        title: "خطأ في معالجة الملف",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
      setStep('upload');
    } finally {
      setProcessing(false);
    }
  };

  const confirmImport = async () => {
    if (!importResult || importResult.validTransactions.length === 0) return;

    setProcessing(true);

    try {
      // Add all valid transactions
      for (const transaction of importResult.validTransactions) {
        await localStorageManager.createTransaction(transaction);
      }

      // Invalidate cache to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });

      toast({
        title: "تم الاستيراد بنجاح!",
        description: `تم استيراد ${importResult.validTransactions.length} عملية بنجاح`,
      });

      handleClose();
    } catch (error) {
      toast({
        title: "خطأ في الاستيراد",
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const downloadSampleFile = () => {
    const sampleData = [
      ['نوع العملية', 'المبلغ', 'التصنيف', 'الملاحظة', 'التاريخ'],
      ['مصروف', '50', 'food', 'غداء في المطعم', '2024-01-15'],
      ['دخل', '1000', 'salary', 'راتب شهري', '2024-01-01'],
      ['مصروف', '20', 'transport', 'أجرة تاكسي', '2024-01-10']
    ];

    const csvContent = sampleData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sample_transactions.csv';
    link.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl" dir="rtl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              استيراد العمليات من ملف
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadSampleFile}
              className="text-xs"
              data-testid="button-download-sample"
            >
              <Download className="h-3 w-3 ml-1" />
              تحميل نموذج
            </Button>
          </div>
          <DialogDescription>
            اختر ملف Excel أو CSV لاستيراد العمليات المالية إلى التطبيق. تأكد من أن الملف يحتوي على الأعمدة المطلوبة بالترتيب الصحيح.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-4 space-x-reverse">
            {(['upload', 'processing', 'validation', 'results'] as ImportStep[]).map((stepName, index) => (
              <div key={stepName} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === stepName
                      ? 'bg-primary text-primary-foreground'
                      : index < (['upload', 'processing', 'validation', 'results'] as ImportStep[]).indexOf(step)
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index + 1}
                </div>
                {index < 3 && (
                  <div className={`w-12 h-0.5 ${
                    index < (['upload', 'processing', 'validation', 'results'] as ImportStep[]).indexOf(step)
                      ? 'bg-green-500'
                      : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Upload Step */}
          {step === 'upload' && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  تأكد من أن الملف يحتوي على الأعمدة التالية بالترتيب:
                  <br />
                  <strong>نوع العملية - المبلغ - التصنيف - الملاحظة - التاريخ</strong>
                </AlertDescription>
              </Alert>

              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                data-testid="file-drop-zone"
              >
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                
                {selectedFile ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getFileTypeDisplayName(selectedFile.name)} • {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button
                        onClick={processFile}
                        disabled={processing}
                        data-testid="button-process-file"
                      >
                        {processing ? "جاري المعالجة..." : "معالجة الملف"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedFile(null)}
                        data-testid="button-remove-file"
                      >
                        إزالة
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      اسحب الملف هنا أو انقر لاختيار الملف
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="button-select-file"
                    >
                      اختيار ملف
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      يدعم ملفات Excel (.xlsx, .xls) و CSV (.csv)
                    </p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => e.target.files?.[0] && handleFileSelection(e.target.files[0])}
                className="hidden"
                data-testid="file-input"
              />
            </div>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">جاري قراءة الملف...</p>
            </div>
          )}

          {/* Validation Step */}
          {step === 'validation' && (
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">جاري التحقق من صحة البيانات...</p>
            </div>
          )}

          {/* Results Step */}
          {step === 'results' && importResult && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">{importResult.totalRows}</div>
                      <div className="text-xs text-muted-foreground">إجمالي الصفوف</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{importResult.processedRows}</div>
                      <div className="text-xs text-muted-foreground">صفوف صحيحة</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{importResult.errors.length}</div>
                      <div className="text-xs text-muted-foreground">أخطاء</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    الأخطاء الموجودة ({importResult.errors.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importResult.errors.map((error, index) => (
                      <Alert key={index} variant="destructive" className="p-2">
                        <AlertDescription className="text-xs">
                          <strong>الصف {error.row}:</strong> {error.field} - {error.message}
                          {error.value && <span className="block mt-1 font-mono">القيمة: "{error.value}"</span>}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}

              {importResult.success && importResult.validTransactions.length > 0 && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    جميع البيانات صحيحة! يمكنك المتابعة لاستيراد {importResult.validTransactions.length} عملية.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  data-testid="button-cancel-import"
                >
                  إلغاء
                </Button>
                {importResult.validTransactions.length > 0 && (
                  <Button
                    onClick={confirmImport}
                    disabled={processing}
                    className="flex-1"
                    data-testid="button-confirm-import"
                  >
                    {processing ? "جاري الاستيراد..." : `استيراد ${importResult.validTransactions.length} عملية`}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}