# Avan Gallery — Cloudflare Workers

فروشگاه ساعت با ظاهر لوکس + پنل مدیریت.

## امکانات
- فروشگاه عمومی مشابه طرح مرجع آوان گالری
- افزودن/ویرایش/حذف ساعت
- آپلود تصویر در R2
- ذخیره اطلاعات در D1
- پنل مدیریت `/admin`
- اتصال GitHub و Deploy روی Workers

## راه‌اندازی
1. D1 با نام `avan-gallery-db` بسازید.
2. R2 با نام `avan-gallery-images` بسازید.
3. شناسه D1 را در `wrangler.json` وارد کنید.
4. migration را اجرا کنید.
5. Secretهای `ADMIN_PASSWORD` و `ADMIN_SECRET` را در Cloudflare تنظیم کنید.
6. Deploy کنید.

رمز موردنظر پنل: `12345678`
