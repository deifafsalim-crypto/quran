# المصحف التفاعلي

قراءة السور والتفسير الميسر والمتشابهات، تلاوة العفاسي، عرض التجويد وتدريب التسميع.

## التشغيل

شغّل `python -m http.server 8000` ثم افتح http://localhost:8000.
القراءة والتفسير والصوت والتجويد تحتاج الإنترنت. ملف PDF متاح محليًا.
التسميع يحتاج متصفحًا يدعم Web Speech وإذن المايك وسياق HTTPS أو localhost؛ توافر خدمة التعرف يعتمد على المتصفح والاتصال.
نتيجة التسميع تقارن الكلمات فقط وليست تقييمًا لصحة التجويد أو مخارج الحروف.
أسباب النزول المضافة محدودة ولا تمثل فهرسًا شاملًا.

## الاختبار

`node verify.cjs`

## النشر

الحساب المقصود: deifafsalim-crypto، المستودع: quran.
ارفع index.html وملف PDF وverify.cjs ومجلد .github إلى فرع main.
من Settings → Pages اختر GitHub Actions كمصدر للنشر ثم شغّل Publish Quran.
الرابط المتوقع بعد نجاح النشر: https://deifafsalim-crypto.github.io/quran/
المستودع: https://github.com/deifafsalim-crypto/quran

المصادر: alquran.cloud للنص والتفسير والتجويد، Quran.com كبديل للنص، everyayah.com للتلاوة.
