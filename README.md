
# تطبيق إدارة المصاريف الشخصية 💰

## 📋 نظرة عامة

تطبيق إدارة مصاريف شخصية متطور مصمم خصيصاً للمستخدمين العرب، يدعم اللغة العربية بالكامل مع تخطيط من اليمين إلى اليسار (RTL). يتيح التطبيق تتبع الدخل والمصروفات، وضع أهداف مالية، تحليل أنماط الإنفاق، وإدارة المعاملات من خلال الإدخال اليدوي أو الأوامر الصوتية.

## ✨ المميزات الرئيسية

### 🎯 إدارة المعاملات
- **إضافة معاملات سريعة**: إضافة دخل أو مصروفات بنقرة واحدة
- **التسجيل الصوتي**: إدخال المعاملات باستخدام الأوامر الصوتية
- **استيراد البيانات**: دعم استيراد ملفات Excel و CSV
- **تصنيف ذكي**: تصنيفات محددة مسبقاً مع أيقونات وألوان

### 📊 التحليلات والتقارير
- **التحليل الشهري**: عرض توزيع المصروفات حسب التصنيفات
- **الرسوم البيانية**: مخططات دائرية تفاعلية
- **تصدير البيانات**: تصدير التقارير بصيغة CSV
- **ملخص الرصيد**: عرض الدخل الإجمالي والمصروفات والرصيد الحالي

### 🔍 البحث والتصفية
- **البحث المتقدم**: البحث في أوصاف المعاملات
- **التصفية المتعددة**: حسب التصنيف، النوع، والتاريخ
- **عرض مرن**: إمكانية عرض آخر المعاملات أو جميع المعاملات

### 📱 تصميم متجاوب
- **محسن للجوال**: تصميم Mobile-First مع واجهة سهلة الاستخدام
- **دعم RTL**: دعم كامل للغة العربية واتجاه النص
- **ثيم داكن/فاتح**: إمكانية التبديل بين الأوضاع
- **تنقل سهل**: شريط تنقل سفلي وأزرار عائمة

## 🛠 التقنيات المستخدمة

### Frontend
- **React 18** مع TypeScript - إطار العمل الرئيسي
- **Tailwind CSS** - تصميم الواجهات
- **Radix UI + shadcn/ui** - مكونات الواجهة
- **Wouter** - التنقل بين الصفحات
- **TanStack Query** - إدارة حالة الخادم
- **React Hook Form + Zod** - إدارة النماذج والتحقق
- **Recharts** - الرسوم البيانية
- **Lucide React** - الأيقونات

### Backend
- **Express.js** - خادم Node.js
- **Drizzle ORM** - إدارة قاعدة البيانات
- **PostgreSQL** (Neon Serverless) - قاعدة البيانات الرئيسية
- **Zod** - التحقق من البيانات

### أدوات التطوير
- **Vite** - أداة البناء والتطوير
- **TypeScript** - لغة البرمجة المطورة
- **Vitest** - اختبار الوحدات
- **Playwright** - اختبار التكامل
- **ESBuild** - تجميع الخادم

## 📁 هيكل المشروع

```
├── client/                 # تطبيق Frontend
│   ├── src/
│   │   ├── components/     # مكونات الواجهة
│   │   ├── pages/         # صفحات التطبيق
│   │   ├── hooks/         # React Hooks مخصصة
│   │   ├── lib/           # وظائف مساعدة
│   │   └── __tests__/     # اختبارات Frontend
├── server/                # تطبيق Backend
│   ├── routes.ts         # نقاط النهاية للAPI
│   ├── storage.ts        # طبقة قاعدة البيانات
│   └── __tests__/        # اختبارات Backend
├── shared/               # الكود المشترك
│   └── schema.ts         # مخططات قاعدة البيانات
└── package.json          # إعدادات المشروع
```

## 🚀 تشغيل المشروع

### 1. استنساخ المشروع
```bash
git clone <repository-url>
cd expense-tracker
```

### 2. تثبيت المتطلبات
```bash
npm install
```

### 3. إعداد قاعدة البيانات
```bash
# إعداد متغيرات البيئة
DATABASE_URL=your_neon_database_url

# تشغيل المايجريشن
npm run db:push
```

### 4. تشغيل المشروع
```bash
# للتطوير
npm run dev

# للإنتاج
npm run build
npm start
```

## 🗃 قاعدة البيانات

### جداول قاعدة البيانات
- **transactions**: معاملات المصروفات والدخل
- **categories**: تصنيفات المعاملات
- **users**: بيانات المستخدمين (للاستخدام المستقبلي)

### مخطط المعاملات
```sql
CREATE TABLE transactions (
  id VARCHAR PRIMARY KEY,
  type VARCHAR(10) NOT NULL,        -- 'income' أو 'expense'
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  note TEXT,
  date TIMESTAMP NOT NULL,
  receipt_image TEXT,               -- صورة الإيصال (اختياري)
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 الوظائف المتقدمة

### التسجيل الصوتي
- استخدام Web Speech API
- معالجة النص العربي
- استخراج المبالغ والتصنيفات تلقائياً

### استيراد البيانات
- دعم ملفات Excel (.xlsx, .xls)
- دعم ملفات CSV
- معالجة البيانات العربية
- التحقق من صحة البيانات

### التخزين المحلي
- نسخ احتياطية محلية
- العمل بدون اتصال إنترنت
- مزامنة البيانات مع الخادم

## 🧪 الاختبارات

```bash
# تشغيل اختبارات الوحدات
npm run test

# تشغيل اختبارات التكامل
npm run test:e2e

# فحص الأنواع
npm run check
```

## 📦 النشر

### النشر على Replit
1. استيراد المشروع إلى Replit
2. إعداد متغيرات البيئة في Secrets
3. تشغيل `npm run build`
4. استخدام أداة Deployments في Replit

### متغيرات البيئة المطلوبة
```env
DATABASE_URL=your_neon_database_url
NODE_ENV=production
PORT=5000
```

## 🎨 تخصيص الواجهة

### الألوان والثيمات
يمكن تخصيص الألوان من خلال ملف `client/src/index.css`:

```css
:root {
  --primary: hsl(210, 100%, 40%);
  --secondary: hsl(174, 100%, 25%);
  --success: hsl(122, 39%, 49%);
  --destructive: hsl(0, 84%, 60%);
  --warning: hsl(36, 100%, 50%);
}
```

### إضافة تصنيفات جديدة
يمكن إضافة تصنيفات جديدة من خلال واجهة التطبيق أو مباشرة في قاعدة البيانات.

## 🔒 الأمان

- التحقق من صحة البيانات باستخدام Zod
- حماية من XSS وCSRF
- تشفير كلمات المرور (للاستخدام المستقبلي)
- التحقق من الصلاحيات

## 🐛 استكشاف الأخطاء

### مشاكل شائعة
1. **خطأ في قاعدة البيانات**: تأكد من صحة `DATABASE_URL`
2. **مشاكل التسجيل الصوتي**: تأكد من أذونات الميكروفون
3. **مشاكل استيراد الملفات**: تحقق من تنسيق الملف

### سجلات النظام
```bash
# عرض سجلات الخادم
npm run dev

# فحص اتصال قاعدة البيانات
npm run db:push
```

## 📱 دعم المتصفحات

- Chrome/Chromium 88+
- Firefox 85+
- Safari 14+
- Edge 88+

**ملاحظة**: التسجيل الصوتي يتطلب متصفحات حديثة تدعم Web Speech API.

## 🤝 المساهمة

### خطوات المساهمة
1. إنشاء fork للمشروع
2. إنشاء branch جديد للميزة
3. إضافة الاختبارات اللازمة
4. إرسال Pull Request

### معايير الكود
- استخدام TypeScript
- كتابة اختبارات للميزات الجديدة
- اتباع أسلوب التنسيق المعتمد
- إضافة التوثيق اللازم

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT - انظر ملف [LICENSE](LICENSE) للتفاصيل.

## 📞 الدعم والتواصل

- **الإبلاغ عن الأخطاء**: استخدم Issues في GitHub
- **طلب الميزات**: أنشئ Feature Request
- **الاستفسارات العامة**: تواصل عبر البريد الإلكتروني

---

## English Summary

### Personal Finance Management App

A comprehensive Arabic-first personal finance management application with RTL support, featuring:

**Key Features:**
- Transaction management with voice input
- File import (Excel/CSV)
- Real-time analytics and charts
- Advanced filtering and search
- Mobile-responsive design
- Offline capability

**Tech Stack:**
- Frontend: React 18, TypeScript, Tailwind CSS, Radix UI
- Backend: Express.js, Drizzle ORM, PostgreSQL
- Tools: Vite, Vitest, Playwright

**Getting Started:**
```bash
npm install
npm run dev
```

**Deployment:**
Ready for deployment on Replit with built-in PostgreSQL support.

---

*بناء تطبيق إدارة المصاريف المثالي للمستخدمين العرب* 🚀
