# نشر التطبيق على Vercel

## الخطوات المطلوبة:

### 1. رفع المشروع على GitHub
- أنشئ repository جديد على GitHub
- ارفع الملفات (تأكد من وجود vercel.json)

### 2. نشر على Vercel
- اذهب إلى vercel.com
- اربط حسابك بـ GitHub
- اختر المشروع من قائمة repositories
- Vercel ستكتشف تلقائياً أنه مشروع Vite
- ستستخدم الإعدادات من vercel.json تلقائياً

### 3. إعدادات Build (تلقائية من vercel.json)
- Build Command: `vite build --config vite.frontend.config.ts`
- Output Directory: `dist`
- Install Command: `npm install`

## الميزات الموجودة:
✅ تخزين محلي في المتصفح (localStorage)
✅ واجهة عربية مع RTL
✅ إدارة المعاملات المالية
✅ الرسوم البيانية والإحصائيات
✅ الصوتيات للإدخال
✅ تصدير واستيراد البيانات

## ملاحظات مهمة:
- التطبيق يعمل بالكامل في المتصفح
- البيانات تُحفظ في localStorage المتصفح
- لا يحتاج إلى قاعدة بيانات أو server
- يعمل كـ Single Page Application (SPA)