from django.db import migrations


def update_gist_constraint(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        with schema_editor.connection.cursor() as cursor:
            # 1. Backfill start_datetime and end_datetime for existing blocks
            cursor.execute("""
                UPDATE availability_itemavailabilityblock
                SET start_datetime = (start_date::text || ' 00:00:00+05:30')::timestamptz
                WHERE start_datetime IS NULL AND start_date IS NOT NULL;
            """)
            cursor.execute("""
                UPDATE availability_itemavailabilityblock
                SET end_datetime = (end_date::text || ' 00:00:00+05:30')::timestamptz
                WHERE end_datetime IS NULL AND end_date IS NOT NULL;
            """)
            # 2. Drop the old date-based GiST constraint
            cursor.execute("""
                ALTER TABLE availability_itemavailabilityblock
                DROP CONSTRAINT IF EXISTS exclude_overlapping_item_availability_blocks;
            """)
            # 3. Add the datetime-based GiST constraint
            cursor.execute("""
                ALTER TABLE availability_itemavailabilityblock
                ADD CONSTRAINT exclude_overlapping_item_availability_blocks
                EXCLUDE USING GIST (
                    item_id WITH =,
                    tstzrange(start_datetime, end_datetime, '[)') WITH &&
                );
            """)


def reverse_gist_constraint(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        with schema_editor.connection.cursor() as cursor:
            cursor.execute("""
                ALTER TABLE availability_itemavailabilityblock
                DROP CONSTRAINT IF EXISTS exclude_overlapping_item_availability_blocks;
            """)
            cursor.execute("""
                ALTER TABLE availability_itemavailabilityblock
                ADD CONSTRAINT exclude_overlapping_item_availability_blocks
                EXCLUDE USING GIST (
                    item_id WITH =,
                    daterange(start_date, end_date, '[)') WITH &&
                );
            """)


class Migration(migrations.Migration):

    dependencies = [
        ('availability', '0003_itemavailabilityblock_end_datetime_and_more'),
    ]

    operations = [
        migrations.RunPython(
            update_gist_constraint,
            reverse_gist_constraint,
        ),
    ]

