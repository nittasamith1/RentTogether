import os
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.accounts.models import College, User
from apps.profiles.models import StudentProfile, StudentVerification
from apps.marketplace.models import Category
from apps.listings.models import Item, ItemImage


class Command(BaseCommand):
    help = "Seeds realistic intra-campus marketplace items for Aditya University students"

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding marketplace items..."))

        # Find or use Aditya University
        college = College.objects.filter(name__icontains="Aditya").first()
        if not college:
            college = College.objects.filter(is_active=True).first()
        if not college:
            self.stdout.write(self.style.ERROR("No active college found. Run initial setup first."))
            return

        self.stdout.write(f"Using college: {college.name} ({college.code})")

        # Find student users or create demo students
        samith = User.objects.filter(email__icontains="24b11ai478").first()
        sai = User.objects.filter(email__icontains="sai.reddy").first()
        admin = User.objects.filter(is_staff=True).first()

        if not samith:
            samith = User.objects.create_user(
                email=f"samith@{college.domains_list[0] if college.domains_list else 'adityauniversity.in'}",
                username="samith_owner",
                first_name="Samith",
                last_name="Nitta",
                college=college,
                email_verified=True,
                is_college_verified=True,
            )
            samith.set_password("RentTogether2026!")
            samith.save()

        if not sai:
            sai = User.objects.create_user(
                email=f"sai.reddy@{college.domains_list[0] if college.domains_list else 'adityauniversity.in'}",
                username="sai_student",
                first_name="Sai",
                last_name="Reddy",
                college=college,
                email_verified=True,
                is_college_verified=True,
            )
            sai.set_password("RentTogether2026!")
            sai.save()

        # Ensure profiles exist
        for u, dept, yr in [(samith, "Artificial Intelligence & Data Science", 3), (sai, "Mechanical Engineering", 2)]:
            profile, _ = StudentProfile.objects.get_or_create(user=u)
            profile.department = dept
            profile.year_of_study = yr
            profile.is_verified = True
            profile.reputation_as_owner = Decimal('4.95')
            profile.reputation_as_renter = Decimal('5.00')
            profile.save()

        categories = {cat.slug: cat for cat in Category.objects.all()}

        pickup_spots = [
            "Central Library Entrance",
            "Cotton Bhavan Lobby",
            "Tech Park Cafeteria",
            "Campus Main Gate Waiting Hall",
            "Indoor Sports Complex Desk"
        ]

        sample_items = [
            {
                "title": "Casio fx-991CW ClassWiz Scientific Calculator",
                "category": categories.get("academic"),
                "owner": samith,
                "description": "Essential for engineering midterms and semester exams. Approved for engineering mathematics, physics, and electrical circuits. Comes in protective slide-on hard case with new solar cell.",
                "condition": Item.CONDITION_LIKE_NEW,
                "brand": "Casio",
                "model_name": "fx-991CW",
                "original_purchase_price": Decimal("1595.00"),
                "daily_rental_price": Decimal("35.00"),
                "security_deposit": Decimal("300.00"),
                "min_rental_days": 1,
                "max_rental_days": 14,
                "pickup_locations": [pickup_spots[0], pickup_spots[1]],
                "primary_image_url": "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80",
                "status": Item.STATUS_ACTIVE,
                "is_published": True,
            },
            {
                "title": "Sony Alpha A6400 Mirrorless Camera + 16-50mm OSS Lens",
                "category": categories.get("creative-media"),
                "owner": sai,
                "description": "4K HDR video and ultra-fast autofocus. Perfect for campus fest coverage, student club shoots, short films, and high-res photography. Includes 64GB Extreme SD card, 2 batteries, and neck strap.",
                "condition": Item.CONDITION_LIKE_NEW,
                "brand": "Sony",
                "model_name": "ILCE-6400L",
                "original_purchase_price": Decimal("74990.00"),
                "daily_rental_price": Decimal("350.00"),
                "security_deposit": Decimal("2500.00"),
                "min_rental_days": 1,
                "max_rental_days": 7,
                "pickup_locations": [pickup_spots[2], pickup_spots[0]],
                "primary_image_url": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
                "status": Item.STATUS_ACTIVE,
                "is_published": True,
            },
            {
                "title": "Arduino Uno Rev3 Starter Kit with 35+ Sensors & Jumper Wires",
                "category": categories.get("electronics"),
                "owner": samith,
                "description": "Comprehensive microcontroller kit featuring Arduino Uno R3, breadboards, servo motors, ultrasonic distance sensor, DHT11 humidity, RFID scanner, and 1602 LCD module. Great for IoT lab work.",
                "condition": Item.CONDITION_BRAND_NEW,
                "brand": "Arduino",
                "model_name": "Uno R3 Comprehensive",
                "original_purchase_price": Decimal("2499.00"),
                "daily_rental_price": Decimal("50.00"),
                "security_deposit": Decimal("400.00"),
                "min_rental_days": 2,
                "max_rental_days": 21,
                "pickup_locations": [pickup_spots[1], pickup_spots[2]],
                "primary_image_url": "https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&w=800&q=80",
                "status": Item.STATUS_ACTIVE,
                "is_published": True,
            },
            {
                "title": "Rigol DS1054Z 50MHz/100MHz 4-Channel Digital Oscilloscope",
                "category": categories.get("laboratory"),
                "owner": samith,
                "description": "Industry-standard 4-channel digital storage oscilloscope with 1 GSa/s real-time sample rate. Perfect for electrical machines, signal processing, and electronics hardware testing. Includes 4 BNC probes.",
                "condition": Item.CONDITION_LIKE_NEW,
                "brand": "Rigol",
                "model_name": "DS1054Z",
                "original_purchase_price": Decimal("38500.00"),
                "daily_rental_price": Decimal("180.00"),
                "security_deposit": Decimal("1500.00"),
                "min_rental_days": 1,
                "max_rental_days": 10,
                "pickup_locations": [pickup_spots[1], pickup_spots[0]],
                "primary_image_url": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
                "status": Item.STATUS_ACTIVE,
                "is_published": True,
            },
            {
                "title": "Bosch 12V Cordless Drill & Driver Kit with 33-Piece Bits",
                "category": categories.get("project-equipment"),
                "owner": sai,
                "description": "Compact, high-torque cordless impact drill. Dual speed gearbox with 33 bits for wood, plastic, PCB drilling, and metal chassis fabrication. Includes two lithium-ion batteries and fast charger.",
                "condition": Item.CONDITION_GOOD,
                "brand": "Bosch",
                "model_name": "GSB 120-LI",
                "original_purchase_price": Decimal("5499.00"),
                "daily_rental_price": Decimal("85.00"),
                "security_deposit": Decimal("600.00"),
                "min_rental_days": 1,
                "max_rental_days": 14,
                "pickup_locations": [pickup_spots[2], pickup_spots[3]],
                "primary_image_url": "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80",
                "status": Item.STATUS_ACTIVE,
                "is_published": True,
            },
            {
                "title": "Yonex Nanoray Carbon Fiber Badminton Racket Pair + Mavis 350",
                "category": categories.get("sports-fitness"),
                "owner": sai,
                "description": "High repulsion lightweight isometric head rackets strung at 24 lbs. Includes full zip protective double cover and a tube of 3 Yonex Mavis 350 nylon shuttles. Ready to play immediately.",
                "condition": Item.CONDITION_GOOD,
                "brand": "Yonex",
                "model_name": "Nanoray 7000I",
                "original_purchase_price": Decimal("3200.00"),
                "daily_rental_price": Decimal("40.00"),
                "security_deposit": Decimal("200.00"),
                "min_rental_days": 1,
                "max_rental_days": 7,
                "pickup_locations": [pickup_spots[4], pickup_spots[1]],
                "primary_image_url": "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80",
                "status": Item.STATUS_ACTIVE,
                "is_published": True,
            },
            {
                "title": "ViewSonic M1+ Ultra-Portable LED Projector with Harman Kardon Sound",
                "category": categories.get("electronics"),
                "owner": samith,
                "description": "Compact rechargeable battery projector with 1080p support, HDMI, USB-C, and Bluetooth audio. Smart 360-degree stand allows ceiling projection. Ideal for seminar presentations or hostel movie nights.",
                "condition": Item.CONDITION_LIKE_NEW,
                "brand": "ViewSonic",
                "model_name": "M1+",
                "original_purchase_price": Decimal("32990.00"),
                "daily_rental_price": Decimal("220.00"),
                "security_deposit": Decimal("1800.00"),
                "min_rental_days": 1,
                "max_rental_days": 5,
                "pickup_locations": [pickup_spots[0], pickup_spots[2]],
                "primary_image_url": "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80",
                "status": Item.STATUS_ACTIVE,
                "is_published": True,
            },
            {
                "title": "Omega Engineering Mini Drafter & Rolled Drawing Board Set",
                "category": categories.get("academic"),
                "owner": sai,
                "description": "High precision stainless steel arm mini drafter with unbreakable scale and clamp. Includes water-resistant drafting carrying bag and set squares for Engineering Graphics & CAD labs.",
                "condition": Item.CONDITION_GOOD,
                "brand": "Omega",
                "model_name": "Deluxe Mini Drafter",
                "original_purchase_price": Decimal("1450.00"),
                "daily_rental_price": Decimal("30.00"),
                "security_deposit": Decimal("200.00"),
                "min_rental_days": 1,
                "max_rental_days": 30,
                "pickup_locations": [pickup_spots[0], pickup_spots[1]],
                "primary_image_url": "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80",
                "status": Item.STATUS_ACTIVE,
                "is_published": True,
            },
            {
                "title": "Raspberry Pi 4 Model B (4GB RAM) with 32GB MicroSD & Official Case",
                "category": categories.get("electronics"),
                "owner": samith,
                "description": "Quad-core 64-bit ARM CPU with gigabit Ethernet and dual micro-HDMI ports. Includes 32GB Class 10 SanDisk microSD pre-flashed with Linux, aluminum heatsinks, and official 5V 3A USB-C power supply.",
                "condition": Item.CONDITION_BRAND_NEW,
                "brand": "Raspberry Pi",
                "model_name": "Pi 4 Model B - 4GB",
                "original_purchase_price": Decimal("5999.00"),
                "daily_rental_price": Decimal("75.00"),
                "security_deposit": Decimal("500.00"),
                "min_rental_days": 2,
                "max_rental_days": 21,
                "pickup_locations": [pickup_spots[2], pickup_spots[1]],
                "primary_image_url": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80",
                "status": Item.STATUS_ACTIVE,
                "is_published": True,
            },
            {
                "title": "GoPro HERO10 Black 5.3K Action Camera Bundle",
                "category": categories.get("creative-media"),
                "owner": sai,
                "description": "HyperSmooth 4.0 stabilization, waterproof up to 33ft, 23MP photos and 5.3K60 video. Includes 2 Enduro batteries, dual charger, Shorty mini extension pole, and 128GB SanDisk Extreme micro-SD.",
                "condition": Item.CONDITION_LIKE_NEW,
                "brand": "GoPro",
                "model_name": "HERO10 Black",
                "original_purchase_price": Decimal("38990.00"),
                "daily_rental_price": Decimal("270.00"),
                "security_deposit": Decimal("2000.00"),
                "min_rental_days": 1,
                "max_rental_days": 7,
                "pickup_locations": [pickup_spots[0], pickup_spots[2]],
                "primary_image_url": "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80",
                "status": Item.STATUS_ACTIVE,
                "is_published": True,
            },
            {
                "title": "Multifunctional Folding Bed Desk & Laptop Stand with Cup Holder",
                "category": categories.get("daily-essentials"),
                "owner": samith,
                "description": "Lightweight aluminum curved bed study table with iPad groove, non-slip rubber legs, and spill-proof cup holder. Folds flat in seconds. Ideal for hostel room late night exam revisions.",
                "condition": Item.CONDITION_GOOD,
                "brand": "Callas",
                "model_name": "ErgoFold Bed Desk",
                "original_purchase_price": Decimal("1299.00"),
                "daily_rental_price": Decimal("25.00"),
                "security_deposit": Decimal("150.00"),
                "min_rental_days": 2,
                "max_rental_days": 30,
                "pickup_locations": [pickup_spots[1], pickup_spots[3]],
                "primary_image_url": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
                "status": Item.STATUS_ACTIVE,
                "is_published": True,
            },
            {
                "title": "Stanley 65-Piece Chrome Vanadium Mechanics Hand Tool Kit",
                "category": categories.get("project-equipment"),
                "owner": sai,
                "description": "Professional 65-piece toolbox including quick-release ratchets, metric sockets, screwdriver bits, combination wrenches, and heavy-duty pliers. Crucial for mechanical fabrication & robotics prototyping.",
                "condition": Item.CONDITION_LIKE_NEW,
                "brand": "Stanley",
                "model_name": "STMT73795",
                "original_purchase_price": Decimal("4800.00"),
                "daily_rental_price": Decimal("70.00"),
                "security_deposit": Decimal("450.00"),
                "min_rental_days": 1,
                "max_rental_days": 10,
                "pickup_locations": [pickup_spots[2], pickup_spots[1]],
                "primary_image_url": "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80",
                "status": Item.STATUS_ACTIVE,
                "is_published": True,
            },
        ]

        created_count = 0
        for data in sample_items:
            cat = data.pop("category")
            if not cat:
                continue
            item, created = Item.objects.get_or_create(
                title=data["title"],
                owner=data["owner"],
                defaults={
                    "category": cat,
                    **data
                }
            )
            if created:
                created_count += 1
                # Also add gallery image
                ItemImage.objects.create(
                    item=item,
                    image_url=item.primary_image_url,
                    is_primary=True,
                    display_order=1
                )

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {created_count} marketplace items for {college.name}."))
