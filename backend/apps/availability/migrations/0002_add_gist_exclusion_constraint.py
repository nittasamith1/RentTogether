from django.db import migrations


def add_gist_exclusion_constraint(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        with schema_editor.connection.cursor() as cursor:
            # Enable btree_gist extension for combining uuid (scalar) with daterange (GiST)
            cursor.execute("CREATE EXTENSION IF NOT EXISTS btree_gist;")
            # Add exclusion constraint for non-overlapping half-open date intervals [start_date, end_date)
            # Note: expired holds are cleaned up or filtered out; for unexpired holds and active blocks,
            # this prevents concurrent overlapping intervals.
            cursor.execute("""
                ALTER TABLE availability_itemavailabilityblock
                ADD CONSTRAINT exclude_overlapping_item_availability_blocks
                EXCLUDE USING GIST (
                    item_id WITH =,
                    daterange(start_date, end_date, '[)') WITH &&
                );
            """)


def remove_gist_exclusion_constraint(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        with schema_editor.connection.cursor() as cursor:
            cursor.execute("""
                ALTER TABLE availability_itemavailabilityblock
                DROP CONSTRAINT IF EXISTS exclude_overlapping_item_availability_blocks;
            """)


class Migration(migrations.Migration):

    dependencies = [
        ('availability', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(
            add_gist_exclusion_constraint,
            remove_gist_exclusion_constraint,
        ),
    ]

