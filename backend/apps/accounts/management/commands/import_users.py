import os
import pandas as pd

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

from apps.common.models import District


User = get_user_model()


class Command(BaseCommand):
    help = "Bir nechta Excel fayldan userlarni import qilish"

    from django.conf import settings
    import os
    EXCEL_DIR = os.path.join(
    settings.BASE_DIR,
    "datas",
    "Hudud_kontaktlari"
)

    def handle(self, *args, **options):
        created = 0
        skipped = 0
        errors = 0

        excel_files = [
            f for f in os.listdir(self.EXCEL_DIR)
            if f.endswith(".xlsx")
        ]

        if not excel_files:
            self.stdout.write(self.style.ERROR("Excel fayllar topilmadi"))
            return

        for excel_file in excel_files:
            file_path = os.path.join(self.EXCEL_DIR, excel_file)
            self.stdout.write(f"\n📂 O‘qilmoqda: {excel_file}")

            df = pd.read_excel(file_path)

            for index, row in df.iterrows():
                try:
                    # =========================
                    # 1. Excel ma'lumotlari
                    # =========================
                    username = str(row.get("username", "")).strip()
                    password = str(row.get("password", "")).strip()
                    phone = str(row.get("Телефон рақами (сотка)", "")).strip()
                    full_name = str(row.get("Ф.И.Ш.", "")).strip()
                    soatoo_raw = row.get("SOATOO")
                    print(type(soatoo_raw))

                    if not username or not password:
                        skipped += 1
                        continue

                    if User.objects.filter(username=username).exists():
                        skipped += 1
                        continue

                    # =========================
                    # 2. F.I.Sh
                    # =========================
                    parts = full_name.split()
                    last_name = parts[0] if len(parts) > 0 else ""
                    first_name = parts[1] if len(parts) > 1 else ""
                    middle_name = " ".join(parts[2:]) if len(parts) > 2 else ""

                    # =========================
                    # 3. Telefon
                    # =========================
                    phone = phone.replace(" ", "").replace("-", "")
                    if phone.startswith("+"):
                        phone = phone[1:]

                    # =========================
                    # 4. District aniqlash
                    # =========================
                    district = None
                    if soatoo_raw:
                        soatoo_str = str(int(float(soatoo_raw)))

                        district = District.objects.filter(code=soatoo_str).first()

                        if not district and len(soatoo_str) > 3:
                            district = District.objects.filter(
                                code=soatoo_str[-3:],
                                region__code=soatoo_str[:-3]
                            ).first()

                    if not district:
                        errors += 1
                        self.stdout.write(
                            self.style.ERROR(
                                f"[ERROR] District topilmadi "
                                f"(soatoo={soatoo_raw}) — {username}"
                            )
                        )
                        continue

                    # =========================
                    # 5. User yaratish
                    # =========================
                    with transaction.atomic():
                        user = User(
                            username=username,
                            first_name=first_name,
                            last_name=last_name,
                            middle_name=middle_name,
                            phone_number=phone,
                            location=district,
                        )
                        user.set_password(password)
                        user.save()

                    created += 1

                except Exception as e:
                    errors += 1
                    self.stdout.write(
                        self.style.ERROR(
                            f"[EXCEPTION] {excel_file} row={index + 2} → {e}"
                        )
                    )

        # =========================
        # HISOBOT
        # =========================
        self.stdout.write("\n========== HISOBOT ==========")
        self.stdout.write(self.style.SUCCESS(f"Yaratildi: {created}"))
        self.stdout.write(self.style.WARNING(f"O‘tkazildi: {skipped}"))
        self.stdout.write(self.style.ERROR(f"Xatolar: {errors}"))
