# جولدن جليز دونات

واجهة متجر عربية مبنية باستخدام Next.js وTypeScript وTailwind CSS. تعرض منتجات الدونات النشطة من Supabase، وتحفظ السلة محليًا عبر Zustand وLocal Storage. يدعم المتجر طلبات الضيوف وتتبعها باستخدام Server Actions وRPCs الموجودة في قاعدة البيانات.

## إعداد Supabase

تأكد من ضبط المتغيرين التاليين في `.env.local` (أو ملف `.env` الموجود):

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

يستخدم المتجر مفتاح Supabase publishable فقط، ولا يحتاج إلى `service_role`. تُقرأ إعدادات الدفع والتوصيل من `get_storefront_settings`، ويُنشأ الطلب وعناصره ذريًا عبر `create_guest_order`، مع إعادة التحقق من المنتجات والأسعار وحالة العميل وإعدادات المتجر داخل قاعدة البيانات. التتبع متاح عبر `track_guest_order` ويتطلب رقم الطلب ورقم الهاتف المسجل.

تُرفع صور InstaPay إلى bucket خاص باسم `payment_proof` بعد إنشاء الطلب، ثم يربطها `mark_guest_payment_proof` بالطلب. يملك الضيف صلاحية الرفع للطلب المعلّق فقط؛ قراءة الإيصالات محصورة بالإدارة. تظهر طرق الدفع ومناطق التوصيل ورسومها بحسب إعدادات الإدارة الحالية؛ لا يظهر InstaPay إلا عند تفعيله من إعدادات المتجر.

يستخدم المتجر عميلًا خادميًا لجلب المنتجات والإعدادات، وعميلًا للمتصفح عند الحاجة. يحدّث `src/proxy.ts` جلسات Supabase باستخدام Proxy في Next.js 16.

## التشغيل

```bash
npm install
npm run dev
```
