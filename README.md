# جولدن جليز دونات

واجهة متجر عربية مبنية باستخدام Next.js وTypeScript وTailwind CSS. تعرض منتجات الدونات النشطة من Supabase، وتحفظ السلة محليًا عبر Zustand وLocal Storage. يدعم المتجر طلبات الضيوف وتتبعها باستخدام Server Actions وRPCs الموجودة في قاعدة البيانات.

## إعداد Supabase

تأكد من ضبط المتغيرين التاليين في `.env.local` (أو ملف `.env` الموجود):

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

## خريطة التوصيل

تستخدم الخريطة OpenStreetMap مع Leaflet، بدون مفاتيح API أو فواتير أو خدمات مدفوعة. الإعدادات التالية اختيارية ولها قيم افتراضية:

```env
# اختياري: أي مزوّد بلاطات متوافق مع OpenStreetMap
NEXT_PUBLIC_OSM_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
# اختياري: تظهر دائمًا أسفل الخريطة
NEXT_PUBLIC_OSM_TILE_ATTRIBUTION=© OpenStreetMap contributors
# اختياري: نقطة نهاية بحث Nominatim (يمكن تبديلها دون تعديل الكود)
NEXT_PUBLIC_NOMINATIM_SEARCH_URL=https://nominatim.openstreetmap.org/search
# اختياري: نقطة نهاية تحويل الإحداثيات إلى عنوان مقروء
NEXT_PUBLIC_NOMINATIM_REVERSE_URL=https://nominatim.openstreetmap.org/reverse
```

يبحث العميل عن عنوانه بالعربية من حقل البحث، أو يضغط على الخريطة/يسحب المؤشر/يستخدم زر "استخدم موقعي الحالي". عند اختيار نقطة على الخريطة يُحوِّل Nominatim الموقع إلى عنوان مقروء، ويُجمع مع المنطقة والعنوان التفصيلي الذي كتبه العميل في نص واحد يُرسل عبر `p_address`. لا تُعرض أرقام الإحداثيات في واجهة الطلب، ولا تُحفظ في Supabase؛ يُحفظ النص الناتج في `customers.address` عبر منطق `v_full_address` الموجود في الدالة. لا توجد أعمدة أو ملفات migration جديدة لهذه الميزة.

بحث العناوين والتحويل العكسي يستخدمان Nominatim التابع لـ OpenStreetMap بدون مفاتيح أو فواتير. التزامًا بسياسة الاستخدام العام: الطلبات تُرسل فقط نتيجة تفاعل العميل (لا اقتراحات تلقائية أثناء الكتابة)، والطلبات مُرتَّبة بمعدل لا يتجاوز طلبًا واحدًا في الثانية، مع تخزين النتائج مؤقتًا في الذاكرة وتحديد الهوية عبر Referer الموقع. لا يُنفَّذ أي بحث جماعي أو طلبات دورية. الرجاء مراجعة [سياسة استخدام Nominatim](https://operations.osmfoundation.org/policies/nominatim/) قبل تغيير نقطة النهاية أو رفع عدد الزيارات.

يستخدم المتجر مفتاح Supabase publishable فقط، ولا يحتاج إلى `service_role`. تُقرأ إعدادات الدفع والتوصيل من `get_storefront_settings`، ويُنشأ الطلب وعناصره ذريًا عبر `create_guest_order`، مع إعادة التحقق من المنتجات والأسعار وحالة العميل وإعدادات المتجر داخل قاعدة البيانات. التتبع متاح عبر `track_guest_order` ويتطلب رقم الطلب ورقم الهاتف المسجل.

تُرفع صور InstaPay إلى bucket خاص باسم `payment_proof` بعد إنشاء الطلب، ثم يربطها `mark_guest_payment_proof` بالطلب. يملك الضيف صلاحية الرفع للطلب المعلّق فقط؛ قراءة الإيصالات محصورة بالإدارة. تظهر طرق الدفع ومناطق التوصيل ورسومها بحسب إعدادات الإدارة الحالية؛ لا يظهر InstaPay إلا عند تفعيله من إعدادات المتجر.

يستخدم المتجر عميلًا خادميًا لجلب المنتجات والإعدادات، وعميلًا للمتصفح عند الحاجة. يحدّث `src/proxy.ts` جلسات Supabase باستخدام Proxy في Next.js 16.

## دوناتس النهاردة / الحجز لبكرة

الواجهة تعرض وضعين: «دوناتس النهاردة» و«هحجز بكرة». الانتقال بينهما يفرغ السلة بعد تأكيد العميل، ولا يمكن خلط منتجات اليوم مع الحجز لبكرة في طلب واحد. كل التواريخ تُحسب بتوقيت `Africa/Cairo`.

الأعمدة المطلوبة (يضيفها مالك المشروع يدويًا، لا توجد ملفات migration في هذا المشروع):

```text
donuts.today_stock       numeric   -- الكمية المتاحة اليوم (موجود بالفعل، هو المصدر الوحيد للمخزون)
orders.order_type        text      -- 'today' | 'preorder'
orders.fulfillment_date  date      -- تاريخ الاستلام
```

يجب تحديث `create_guest_order` يدويًا ليقبل معاملًا واحدًا إضافيًا بعد المعاملات الحالية الثمانية:

```text
p_order_mode text   -- 'today' | 'preorder'
```

لا يُرسل تاريخ الاستلام من العميل؛ تحسبه الدالة داخل PostgreSQL:
- `today` → تاريخ اليوم بتوقيت `Africa/Cairo`.
- `preorder` → تاريخ الغد بتوقيت `Africa/Cairo`.

على الدالة أن تقفل صفوف `donuts` (`FOR UPDATE`) وتتحقق من `today_stock` (وأنها ليست `NULL`) وتخصم الكمية ذريًا في وضع `today` فقط، وتحفظ `order_type` و`fulfillment_date`، وترفض أي طلب تتجاوز فيه الكمية المخزون. لا تُخصم أي كمية في وضع `preorder`. لا يعتمد الكود على `stock_date`، ولا يضيف أي أعمدة أو يعدّل قاعدة البيانات.

## التشغيل

```bash
npm install
npm run dev
```
