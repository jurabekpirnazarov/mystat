import logging
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.db.models import Q
from apps.accounts.models import User
from apps.organizations.models import Organization
from apps.additional_services.models import Ktut, KtutReportList, ReportList
from apps.common.utils import send_message

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Hisobot muddati 10 kundan kam qolgan foydalanuvchilarga Telegram orqali xabar yuborish'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=10,
            help='Necha kundan kam qolganlarni ogohlantirish (default: 10)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Xabar yubormasdan, faqat logga yozish',
        )

    def handle(self, *args, **options):
        days_threshold = options['days']
        dry_run = options['dry_run']

        today = date.today()

        self.stdout.write(f"Hisobot muddati tekshiruvi boshlandi: {today}")
        self.stdout.write(f"Ogohlantirish chegarasi: {days_threshold} kun")

        # Telegram chat_id mavjud bo'lgan userlarni olish
        users_with_telegram = User.objects.filter(
            telegram_chat_id__isnull=False
        ).exclude(telegram_chat_id='')
        print(users_with_telegram)
        sent_count = 0
        error_count = 0

        for user in users_with_telegram:
            try:
                # Userga tegishli organizationni olish
                organization = getattr(user, 'organization', None)
                if not organization:
                    continue

                tin = organization.tin
                if not tin:
                    continue
                print(tin, user, user.telegram_chat_id)

                # Ktut orqali korxonaga tegishli hisobotlarni olish
                try:
                    ktut = Ktut.objects.get(inn=tin)
                except Ktut.DoesNotExist:
                    continue

                # Korxonaga tegishli hisobotlar
                ktut_report_ids = KtutReportList.objects.filter(
                    ktut=ktut
                ).values_list('reportlist_id', flat=True)
                print(ktut_report_ids)
                if not ktut_report_ids:
                    continue

                # Muddati yaqinlashgan hisobotlarni topish
                upcoming_reports = self.get_upcoming_reports(
                    ktut_report_ids, today, days_threshold
                )

                if not upcoming_reports:
                    continue

                # Xabar tayyorlash
                message = self.prepare_message(
                    user, organization, upcoming_reports, today
                )

                if dry_run:
                    self.stdout.write(f"[DRY RUN] {user.full_name}: {len(upcoming_reports)} ta hisobot")
                    logger.info(f"[DRY RUN] Message for {user.full_name}:\n{message}")
                else:
                    # Telegram orqali xabar yuborish
                    result = send_message(user.telegram_chat_id, message)
                    if result.get('ok'):
                        sent_count += 1
                        self.stdout.write(
                            self.style.SUCCESS(f"Xabar yuborildi: {user.full_name}")
                        )
                    else:
                        error_count += 1
                        logger.error(f"Telegram xatosi ({user.full_name}): {result}")

            except Exception as e:
                error_count += 1
                logger.error(f"Xatolik ({user.id}): {str(e)}", exc_info=True)

        self.stdout.write(
            self.style.SUCCESS(
                f"\nNatija: {sent_count} ta xabar yuborildi, {error_count} ta xatolik"
            )
        )

    def get_upcoming_reports(self, report_ids, today, days_threshold):
        """
        report_type bo'yicha muddati yaqinlashgan hisobotlarni topish.
        Yilni e'tiborsiz qoldirib, faqat oy/kunni solishtiradi.
        """
        upcoming = []

        reports = ReportList.objects.filter(
            id__in=report_ids,
            is_active=True,
        )

        for report in reports:
            deadline_this_period = self.calculate_next_deadline(
                report, today
            )

            if deadline_this_period:
                days_left = (deadline_this_period - today).days

                if 0 <= days_left <= days_threshold:
                    upcoming.append({
                        'report': report,
                        'deadline': deadline_this_period,
                        'days_left': days_left
                    })

        # Muddati yaqinlashganlari bo'yicha tartiblash
        upcoming.sort(key=lambda x: x['days_left'])

        return upcoming

    def calculate_next_deadline(self, report, today):
        """Keyingi muddat — HT-01 yagona servisidan."""
        from apps.additional_services.deadlines import next_occurrence
        return next_occurrence(report, today)

    def prepare_message(self, user, organization, upcoming_reports, today):
        """Telegram xabarini tayyorlash"""

        message_lines = [
            f"<b>Hurmatli {user.full_name}!</b>",
            f"",
            f"<b>{organization.name}</b> korxonangiz uchun quyidagi hisobotlar muddati yaqinlashmoqda:",
            f""
        ]

        for i, item in enumerate(upcoming_reports, 1):
            report = item['report']
            deadline = item['deadline']
            days_left = item['days_left']

            # Qolgan kunlar uchun emoji
            if days_left == 0:
                urgency = "BUGUN!"
            elif days_left == 1:
                urgency = "ERTAGA!"
            elif days_left <= 3:
                urgency = f"{days_left} kun qoldi"
            else:
                urgency = f"{days_left} kun qoldi"

            report_name = report.formsname_uz or report.formsname or report.type_uz or report.type

            message_lines.append(
                f"{i}. <b>{report_name}</b>\n"
                f"   Muddat: {deadline.strftime('%d.%m.%Y')} ({urgency})"
            )

        message_lines.extend([
            f"",
            f"Iltimos, hisobotlarni o'z vaqtida topshiring.",
            f"",
            f"<i>my.stat.uz</i>"
        ])

        return "\n".join(message_lines)

