# خطة تطوير: لوحة الأدمن المتقدمة + بوابة المعلم Enterprise

هذا التحديث ضخم جدًا (3 محاور × عدة ميزات). لضمان جودة التنفيذ والاختبار، سأقسمه لـ **3 مراحل** تُنفذ تباعًا. تخبرني بعد كل مرحلة إن كنت تريد المتابعة أم إجراء تعديلات.

---

## المرحلة 1 — لوحة الأدمن الآمنة ومحرك الأكواد
**الملفات المضافة/المعدلة:**
- `/admin-dashboard` route جديدة (`src/routes/admin-dashboard.tsx`) محمية بكلمة سر رئيسية `ADMIN-HAMZA-2026` مع bypass للتطوير عبر localStorage
- ترقية جدول `teacher_codes`:
  - عمود `max_uses` (int, افتراضي 1) و `use_count`
  - عمود `expires_at` (موجود مسبقًا) + `revoked_at`
- تحديث RPC `generate_teacher_code(_expires_at, _max_uses)` + RPC جديدة `revoke_teacher_code(_code)`
- لوحة عرض:
  - بطاقات إحصائيات (المعلمين النشطين، الطلاب، الويدجت، نسبة البريميوم)
  - جدول الأكواد مع الحالة (Active/Expired/Used/Revoked) + زر Revoke
  - نموذج توليد كود بصيغة `TCH-XXXX` مع خيارات (صلاحية، استخدام واحد أو متعدد)

## المرحلة 2 — منشئ الويدجت بأسلوب BookWidgets
**الملفات:**
- ترقية `src/routes/_authenticated/teach.builder.tsx`:
  - تقسيم الشاشة: يمين = المحرر، يسار = **معاينة حية تفاعلية** (يعيد استخدام `exercise-player.tsx`)
  - **Auto-save** كل 2 ثانية إلى `localStorage` (مفتاح لكل مسودة) مع مؤشر "تم الحفظ"
  - تبديل **Public/Private** (عمود جديد `visibility` في `exercises`)
  - **Targeted Distribution**: modal لاختيار الجمهور (Kids: Grade+Module+Term / Adults: Language+Level) مع كتابة في `exercise_assignments` أو حقول جديدة `target_track, target_grade, target_language, target_level`

## المرحلة 3 — التحليلات + المراسلة + الإشعارات
**الملفات:**
- `src/routes/_authenticated/teach.analytics.$id.tsx`: قائمة الطلاب المكملين لكل ويدجت (الاسم، التاريخ، النتيجة، الوقت، ملخص الأخطاء)
- زر **تصدير PDF** (عبر `jsPDF` الموجود) و **Excel** (عبر `xlsxwriter`… للويب سنستخدم `xlsx` npm)
- عمود `teacher_feedback` في `exercise_submissions` + واجهة كتابة تعليق للمعلم
- جدول جديد `notifications` (user_id, type, payload, read_at) + realtime subscription في header بوابة المعلم مع أيقونة جرس
- Trigger على `exercise_submissions` insert → ينشئ إشعارًا للمعلم صاحب التمرين
- إضافة عمود `time_taken_seconds` في `exercise_submissions` وتحديث RPC `submit_exercise`

---

## ملاحظات مهمة
- **الأمن:** كلمة السر `ADMIN-HAMZA-2026` تُستخدم فقط كطبقة إضافية أمام واجهة `/admin-dashboard`؛ العمليات الحساسة تظل محمية بـ RLS + `has_role('admin')` في قاعدة البيانات (لا يمكن الالتفاف عليها من الواجهة).
- **التعدد اللغوي (AR/EN/FR):** حاليًا الواجهة عربية بالكامل. إضافة toggle حقيقي متعدد اللغات = عمل i18n منفصل كبير (استخراج كل النصوص، ملفات ترجمة، RTL/LTR ديناميكي). **أقترح تأجيلها كمرحلة 4 مستقلة** بدل حشرها هنا. أخبرني إن كنت توافق.
- كل مرحلة تتضمن ترحيل قاعدة بيانات واحد يحتاج موافقتك قبل التنفيذ.

---

**هل أبدأ بالمرحلة 1 الآن؟** أو تفضّل تعديل النطاق (مثلاً دمج مرحلتين، أو إسقاط i18n نهائيًا، أو إضافة ميزة أخرى)؟
