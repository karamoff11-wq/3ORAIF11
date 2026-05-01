# 🚀 خطوات رفع تطبيق "أبو العارف" على الإنترنت

اتبع هذه الخطوات للحصول على رابط (Link) عام لمشاركته:

## 1. تثبيت Vercel CLI
افتح Terminal في مشروعك وقم بتشغيل الأمر التالي:
```bash
npm install -g vercel
```

## 2. تسجيل الدخول
قم بتسجيل الدخول إلى حسابك (أو إنشاء حساب جديد):
```bash
vercel login
```

## 3. الرفع (Deployment)
قم بتشغيل هذا الأمر لبدء عملية الرفع:
```bash
vercel
```
- سيسألك: `Set up and deploy?` اضغط `Y`.
- سيسألك عن اسم المشروع، يمكنك تركه كما هو.
- سيسألك عن المجلد، اضغط `Enter` (للمجلد الحالي).

## 4. إعداد المتغيرات البيئية (Environment Variables)
بما أن تطبيقك يستخدم Supabase، يجب إضافة الروابط في لوحة تحكم Vercel:
1. اذهب إلى مشروعك في [vercel.com](https://vercel.com).
2. انتقل إلى **Settings** > **Environment Variables**.
3. أضف القيم الموجودة في ملف `.env.local` لديك:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 5. الرفع النهائي
بعد إضافة المتغيرات، قم بتشغيل:
```bash
vercel --prod
```

سيظهر لك رابط في النهاية ينتهي بـ `.vercel.app`. هذا هو الرابط الذي يمكنك مشاركته!
