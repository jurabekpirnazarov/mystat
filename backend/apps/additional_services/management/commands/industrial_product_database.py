from django.core.management.base import BaseCommand, CommandError
from django.db import connections, DEFAULT_DB_ALIAS, transaction
import os

class Command(BaseCommand):
    help = "SQL fayldan database ni to'ldiradi. Misol: python manage.py loadsql /path/to/dump.sql"

    def add_arguments(self, parser):
        parser.add_argument('sql_file', type=str, help='Yuklanadigan .sql fayl manzili')
        parser.add_argument('--database', '-d', default=DEFAULT_DB_ALIAS, help='DB alias (default: default)')
        parser.add_argument('--encoding', '-e', default='utf-8', help='Fayl encoding (default: utf-8)')
        parser.add_argument('--ignore-errors', action='store_true', help='Xatolarni e\'tiborsiz qoldirish')
        parser.add_argument('--no-transaction', action='store_true', help='Butun fayl uchun transaction ishlatilmasin')
        parser.add_argument('--show-progress', action='store_true', help='Progress ko\'rsatilsin')

    def handle(self, *args, **options):
        sql_path = options['sql_file']
        db_alias = options['database']
        encoding = options['encoding']
        ignore_errors = options['ignore_errors']
        no_transaction = options['no_transaction']
        show_progress = options['show_progress']

        if not os.path.isfile(sql_path):
            raise CommandError(f"Fayl topilmadi: {sql_path}")

        self.stdout.write(self.style.NOTICE(f"Fayl: {sql_path} -> DB alias: {db_alias}"))
        conn = connections[db_alias]

        try:
            with open(sql_path, 'r', encoding=encoding) as f:
                sql_content = f.read()
        except Exception as exc:
            raise CommandError(f"Faylni o'qishda xato: {exc}")

        if not sql_content.strip():
            self.stdout.write(self.style.WARNING("SQL fayl bo'sh. Hech narsa qilinmayapti."))
            return

        # === TRY TO GET A RAW DB-API CONNECTION IN A BACKEND-AGNOSTIC WAY ===
        raw_conn = None
        cursor_for_raw = None
        try:
            # 1) Agar DatabaseWrapper raw_connection() ni taqdim etsa — foydalanamiz
            if hasattr(conn, 'raw_connection'):
                try:
                    raw_conn = conn.raw_connection()
                except Exception:
                    raw_conn = None

            # 2) Aks holda, cursor orqali underlying DB-API connection olishga harakat qilamiz
            if raw_conn is None:
                try:
                    cursor_for_raw = conn.cursor()
                    # many DB-API cursors have .connection attribute pointing to the DB-API connection
                    raw_conn = getattr(cursor_for_raw, 'connection', None)
                except Exception:
                    raw_conn = None

            # 3) Endi agar raw_conn va uning executescript xossasi bo'lsa — sqlite uchun ishlatamiz
            if raw_conn is not None and hasattr(raw_conn, 'executescript'):
                try:
                    if not no_transaction:
                        # sqlite executescript o'z ichida transactionni boshqaradi
                        raw_conn.executescript(sql_content)
                        try:
                            raw_conn.commit()
                        except Exception:
                            pass
                    else:
                        raw_conn.executescript(sql_content)
                    self.stdout.write(self.style.SUCCESS("SQL fayl muvaffaqiyatli yuklandi (executescript)."))
                    return
                except Exception as exc:
                    # agar executescriptda xato bo'lsa fallbackga tushamiz
                    try:
                        raw_conn.rollback()
                    except Exception:
                        pass
                    if not ignore_errors:
                        raise CommandError(f"executescript bajarishda xato: {exc}")
                    else:
                        self.stdout.write(self.style.WARNING(f"executescript xato e'tiborsiz qoldirildi: {exc}"))
                        # davom etamiz: pastdagi fallbackga tushadi
        finally:
            # cursor_for_raw ni shu yerda yopamiz (agar keyingi qismda boshqa cursor ishlatilsa yangi yaratiladi)
            if cursor_for_raw is not None:
                try:
                    cursor_for_raw.close()
                except Exception:
                    pass
            # raw_conn ni shu yerda yopmaymiz agar u raw_connection() orqali olingan bo'lsa —
            # keyingi qismda ishlamay qolmasligi uchun — ammo biz uni taxminan ishlatib bo'lgach yopamiz.

        # === FALLBACK: statement-by-statement execute via Django cursor ===
        cursor = conn.cursor()
        try:
            # Oddiy ';' bo'yicha split — ko'p holatlarda yetarli.
            raw_statements = sql_content.strip().split(';')
            statements = [s.strip() + ';' for s in raw_statements if s.strip()]
        except Exception as exc:
            raise CommandError(f"SQLni statementlarga ajratishda xato: {exc}")

        total = len(statements)
        self.stdout.write(self.style.NOTICE(f"Topilgan statementlar (approx): {total}"))

        executed = 0
        errors = []
        use_transaction = (not no_transaction)

        try:
            if use_transaction:
                with transaction.atomic(using=db_alias):
                    for idx, stmt in enumerate(statements, start=1):
                        try:
                            if show_progress:
                                self.stdout.write(f"[{idx}/{total}] Executing...")
                            cursor.execute(stmt)
                            executed += 1
                        except Exception as exc:
                            msg = f"Statement #{idx} xato: {exc}"
                            if ignore_errors:
                                errors.append(msg)
                                self.stdout.write(self.style.WARNING(msg))
                                continue
                            else:
                                raise CommandError(msg)
            else:
                for idx, stmt in enumerate(statements, start=1):
                    try:
                        if show_progress:
                            self.stdout.write(f"[{idx}/{total}] Executing (no tx)...")
                        cursor.execute(stmt)
                        conn.commit()
                        executed += 1
                    except Exception as exc:
                        msg = f"Statement #{idx} xato: {exc}"
                        if ignore_errors:
                            errors.append(msg)
                            self.stdout.write(self.style.WARNING(msg))
                            continue
                        else:
                            raise CommandError(msg)
        finally:
            try:
                cursor.close()
            except Exception:
                pass
            # Agar biz oldin raw_connni raw_connection() orqali ochgan bo'lsak, uni bu yerda yopamiz
            try:
                if raw_conn is not None:
                    try:
                        raw_conn.close()
                    except Exception:
                        pass
            except Exception:
                pass

        self.stdout.write(self.style.SUCCESS(f"Yakunlandi. Bajarildi: {executed}/{total} statementlar."))
        if errors:
            self.stdout.write(self.style.WARNING(f"Xatolar soni: {len(errors)}. Bir nechtasi:"))
            for e in errors[:10]:
                self.stdout.write(self.style.WARNING(e))
            if len(errors) > 10:
                self.stdout.write(self.style.WARNING("...va yana boshqalar. --ignore-errors parametrini ishlatib davom ettirish mumkin."))
