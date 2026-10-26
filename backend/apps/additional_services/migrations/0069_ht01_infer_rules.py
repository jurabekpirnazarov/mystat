from django.db import migrations


def infer(apps, schema_editor):
    """Eski `deadline` + `report_type` dan qoida chiqaradi; ishonchli bo'lmaganlari bo'sh qoladi (admin to'ldiradi)."""
    from apps.additional_services.deadlines import infer_rule
    ReportList = apps.get_model("additional_services", "ReportList")
    for r in ReportList.objects.filter(deadline_rule="", deadline__isnull=False):
        rule = infer_rule(r.report_type, r.deadline)
        if rule:
            ReportList.objects.filter(pk=r.pk).update(deadline_rule=rule)


class Migration(migrations.Migration):
    dependencies = [("additional_services", "0068_ht01_deadline_rule")]
    operations = [migrations.RunPython(infer, migrations.RunPython.noop)]
