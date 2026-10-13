# DIDOX Hujjatlari Tekshiruvi va Bildirishnoma Tizimi

Bu tizim DIDOX'dan imzo kutayotgan hujjatlarni avtomatik tekshiradi va tegishli foydalanuvchilarga Telegram orqali bildirishnoma yuboradi.

## O'rnatish

1. **Migration yaratish va qo'llash:**
```bash
python manage.py makemigrations notifications
python manage.py migrate
```

2. **Superuser yaratish (agar yo'q bo'lsa):**
```bash
python manage.py createsuperuser
```

## Foydalanish

### 1. Django Admin orqali

1. Admin panelga kiring: `/admin/`
2. **Contracts > Contracts** bo'limiga o'ting
3. Yuqori o'ng burchakda **"📄 DIDOX Tekshiruvi"** tugmasini bosing
4. Kerakli variantni tanlang:
   - **Oddiy tekshiruv**: Oxirgi tekshiruvdan keyin yangilangan hujjatlar
   - **To'liq tekshiruv**: Barcha hujjatlar (checkbox'ni belgilang)
5. **"Tekshiruvni Boshlash"** tugmasini bosing

### 2. Management Command orqali

```bash
# Oddiy tekshiruv (oxirgi tekshiruv sanasidan keyin)
python manage.py check_didox_documents

# To'liq tekshiruv (barcha hujjatlar)
python manage.py check_didox_documents --force
```

### 3. Admin Action orqali

1. Contracts ro'yxatida bir yoki bir nechta shartnomani tanlang
2. Action dropdown'dan **"📄 DIDOX hujjatlarini tekshirish va ogohlantirish yuborish"** ni tanlang
3. **"Go"** tugmasini bosing

## Tizim Xususiyatlari

### Filterlash
- Faqat **status=1** (imzo kutayotgan) hujjatlar uchun bildirishnoma yuboriladi
- **last_didox_update** (SiteSettings'da) sanasidan keyin yangilangan hujjatlar tekshiriladi
- Har bir foydalanuvchi uchun 24 soat ichida bir xil hujjat bo'yicha faqat bitta bildirishnoma yuboriladi

### Bildirishnoma Tarkibi
```
⏳ Hujjatingiz imzolashni kutmoqda!

📄 Hujjat: [Hujjat nomi]
🆔 Shartnoma: [Shartnoma raqami]
🏢 Hamkor: [Hamkor kompaniya]
📅 Sana: [Hujjat sanasi]
💰 Narxi: [Paket narxi]
💵 Summa: [Hujjat summasi]

🔗 [Hujjatni imzolash linki]

⚠️ Iltimos, hujjatni o'z vaqtida imzolang!
```

### Xatoliklar Boshqaruvi
- Barcha xatoliklar log'lanadi
- Telegram yuborish xatoliklari `Notification` modelida saqlanadi
- Command background thread'da ishlaydi (admin interface block bo'lmaydi)

## Celery Integration (Ixtiyoriy)

Agar Celery o'rnatilgan bo'lsa, task'lardan foydalanish mumkin:

```python
from apps.contracts.tasks import check_didox_documents_task, periodic_didox_check

# Oddiy tekshiruv
check_didox_documents_task.delay()

# To'liq tekshiruv
check_didox_documents_task.delay(force=True)

# Muntazam tekshiruv
periodic_didox_check.delay()
```

### Celery Beat Schedule (settings.py)
```python
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    'check-didox-documents': {
        'task': 'apps.contracts.tasks.periodic_didox_check',
        'schedule': crontab(minute=0, hour='*/2'),  # Har 2 soatda
    },
}
```

## Muhim Sozlamalar

### SiteSettings kerak bo'lgan maydonlar:
- `didox_url`: DIDOX API URL
- `didox_partner_token`: Partner token
- `didox_user_token`: User token (avtomatik yangilanadi)
- `didox_client_url`: Client URL (default: https://web.goodsign.uz)
- `last_didox_update`: Oxirgi tekshiruv sanasi (avtomatik yangilanadi)

### User modeli kerak bo'lgan maydon:
- `telegram_chat_id`: Foydalanuvchining Telegram chat ID'si

## Fayl Tuzilishi

```
apps/contracts/
├── management/
│   └── commands/
│       └── check_didox_documents.py
├── tasks.py (Celery tasks)
├── admin.py (Admin actions va views)
├── utils.py (DIDOX client)
└── models.py

apps/notifications/
└── models.py (Notification model)

templates/admin/contracts/
├── didox_check.html
└── contract/
    └── change_list.html
```

## Test Qilish

```bash
# Kommandni test qilish
python manage.py check_didox_documents --force

# Log'larni kuzatish
tail -f logs/django.log
```

## Monitoring

1. **Admin panelda**: Notifications ro'yxatini tekshiring
2. **Log fayllarda**: Django log'larni kuzatib boring
3. **SiteSettings**: `last_didox_update` sanasini tekshiring