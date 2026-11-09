from django.db import migrations


def backfill_booking_datetimes(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        with schema_editor.connection.cursor() as cursor:
            cursor.execute("""
                UPDATE bookings_booking
                SET start_datetime = (start_date::text || ' 00:00:00+05:30')::timestamptz
                WHERE start_datetime IS NULL AND start_date IS NOT NULL;
            """)
            cursor.execute("""
                UPDATE bookings_booking
                SET end_datetime = (end_date::text || ' 00:00:00+05:30')::timestamptz
                WHERE end_datetime IS NULL AND end_date IS NOT NULL;
            """)
            cursor.execute("""
                UPDATE bookings_booking
                SET hourly_rate = ROUND(daily_rate / 24.0, 2)
                WHERE (hourly_rate = 0 OR hourly_rate IS NULL) AND daily_rate > 0;
            """)
            cursor.execute("""
                UPDATE bookings_booking
                SET total_duration_hours = total_days * 24.0
                WHERE (total_duration_hours = 24.0 OR total_duration_hours IS NULL) AND total_days > 1;
            """)


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0008_booking_end_datetime_booking_hourly_rate_and_more'),
    ]

    operations = [
        migrations.RunPython(
            backfill_booking_datetimes,
            migrations.RunPython.noop,
        ),
    ]

