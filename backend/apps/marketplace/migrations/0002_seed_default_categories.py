from django.db import migrations


def seed_categories(apps, schema_editor):
    Category = apps.get_model('marketplace', 'Category')
    default_categories = [
        {
            "name": "Academic",
            "slug": "academic",
            "description": "Textbooks, reference manuals, calculators, drawing boards, and academic guides.",
            "icon_name": "BookOpen",
            "display_order": 1,
        },
        {
            "name": "Electronics",
            "slug": "electronics",
            "description": "Laptops, monitors, chargers, graphing devices, power banks, and adapters.",
            "icon_name": "Laptop",
            "display_order": 2,
        },
        {
            "name": "Laboratory",
            "slug": "laboratory",
            "description": "Lab coats, safety goggles, dissecting kits, breadboards, and multimeter gear.",
            "icon_name": "FlaskConical",
            "display_order": 3,
        },
        {
            "name": "Project Equipment",
            "slug": "project-equipment",
            "description": "Microcontrollers, Arduino/Raspberry Pi kits, soldering irons, 3D pens, and sensors.",
            "icon_name": "Wrench",
            "display_order": 4,
        },
        {
            "name": "Daily Essentials",
            "slug": "daily-essentials",
            "description": "Umbrellas, scientific calculators, dorm storage items, study lamps, and organizers.",
            "icon_name": "Package",
            "display_order": 5,
        },
        {
            "name": "Creative & Media",
            "slug": "creative-media",
            "description": "DSLR cameras, tripods, ring lights, microphones, graphic tablets, and lenses.",
            "icon_name": "Camera",
            "display_order": 6,
        },
        {
            "name": "Sports & Fitness",
            "slug": "sports-fitness",
            "description": "Badminton racquets, footballs, resistance bands, cricket bats, and yoga mats.",
            "icon_name": "Dumbbell",
            "display_order": 7,
        },
        {
            "name": "Other",
            "slug": "other",
            "description": "Miscellaneous verified tools and campus utility equipment.",
            "icon_name": "Grid2X2",
            "display_order": 8,
        },
    ]

    for cat_data in default_categories:
        Category.objects.get_or_create(
            slug=cat_data["slug"],
            defaults={
                "name": cat_data["name"],
                "description": cat_data["description"],
                "icon_name": cat_data["icon_name"],
                "display_order": cat_data["display_order"],
                "is_active": True,
            }
        )


def reverse_categories(apps, schema_editor):
    Category = apps.get_model('marketplace', 'Category')
    slugs = [
        "academic", "electronics", "laboratory", "project-equipment",
        "daily-essentials", "creative-media", "sports-fitness", "other"
    ]
    Category.objects.filter(slug__in=slugs).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_categories, reverse_categories),
    ]
