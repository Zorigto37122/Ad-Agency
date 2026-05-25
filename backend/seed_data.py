"""Populate the database with sample data for development."""
import sys
from datetime import datetime, timedelta, date, timezone

sys.path.insert(0, ".")

from database import SessionLocal, create_tables
from models.client import Client
from models.order import Order, OrderStatus, ServiceType, ScopeType
from models.user import User
from core.security import get_password_hash
from utils.pricing import calculate_price


CLIENTS = [
    {"name": "Алексей Громов", "email": "contact@alfa-media.ru", "phone": "+7-495-001-01-01", "company": "ООО «Альфа Медиа»", "notes": "Долгосрочный партнёр"},
    {"name": "Марина Соколова", "email": "hello@gorizont.io", "phone": "+7-495-001-01-02", "company": "ООО «Горизонт»"},
    {"name": "Дмитрий Лебедев", "email": "info@zeleniy-mir.org", "phone": "+7-495-001-01-03", "company": "НКО «Зелёный мир»", "notes": "Некоммерческая организация, скидка на крупные проекты"},
    {"name": "Ольга Карпова", "email": "projects@novatek-group.ru", "phone": "+7-495-001-01-04", "company": "АО «НоваТек Груп»"},
    {"name": "Сергей Быков", "email": "marketing@rassvet-retail.ru", "phone": "+7-495-001-01-05", "company": "ООО «Рассвет Ритейл»"},
]

ORDERS_SPEC = [
    (0, "Редизайн корпоративного сайта", ServiceType.web_design, ScopeType.large, OrderStatus.done, 90, None),
    (0, "SMM-кампания Q1", ServiceType.social_media_campaign, ScopeType.medium, OrderStatus.done, 60, None),
    (0, "Пакет фирменного стиля", ServiceType.graphic_design, ScopeType.large, OrderStatus.done, 45, None),
    (0, "Серия продуктовых видеороликов", ServiceType.video_production, ScopeType.medium, OrderStatus.in_progress, 10, 20),
    (1, "Дизайн лендинга", ServiceType.web_design, ScopeType.small, OrderStatus.done, 80, None),
    (1, "Летняя рекламная кампания", ServiceType.social_media_campaign, ScopeType.large, OrderStatus.done, 50, None),
    (1, "Написание контента для блога", ServiceType.copywriting, ScopeType.medium, OrderStatus.in_progress, 5, 15),
    (2, "Дизайн годового отчёта", ServiceType.graphic_design, ScopeType.medium, OrderStatus.done, 100, None),
    (2, "Кампания по повышению узнаваемости", ServiceType.social_media_campaign, ScopeType.small, OrderStatus.pending, 2, 30),
    (3, "Разработка интернет-магазина", ServiceType.web_design, ScopeType.large, OrderStatus.in_progress, 20, 40),
    (3, "Промо-ролик приложения", ServiceType.video_production, ScopeType.small, OrderStatus.pending, 3, 25),
    (3, "Текст пресс-релиза", ServiceType.copywriting, ScopeType.small, OrderStatus.done, 35, None),
    (4, "Кампания «Чёрная пятница»", ServiceType.social_media_campaign, ScopeType.large, OrderStatus.done, 120, None),
    (4, "Обновление логотипа", ServiceType.graphic_design, ScopeType.small, OrderStatus.done, 70, None),
    (4, "Праздничный рекламный ролик", ServiceType.video_production, ScopeType.medium, OrderStatus.done, 40, None),
    (4, "Обновление сайта к весне", ServiceType.web_design, ScopeType.medium, OrderStatus.overdue, 15, -5),
    (0, "Копирайтинг для рассылки", ServiceType.copywriting, ScopeType.small, OrderStatus.pending, 1, 10),
    (1, "Видео к запуску продукта", ServiceType.video_production, ScopeType.large, OrderStatus.pending, 2, 45),
    (2, "Редизайн сайта", ServiceType.web_design, ScopeType.medium, OrderStatus.pending, 1, 30),
    (3, "Промо-текст к концу года", ServiceType.copywriting, ScopeType.medium, OrderStatus.in_progress, 7, 14),
]


def seed():
    create_tables()
    db = SessionLocal()
    try:
        if not db.query(User).first():
            _seed_base(db)
        else:
            print("Base data already exists, skipping.")

        from models.campaign import Campaign
        if not db.query(Campaign).first():
            _seed_extended(db)
        else:
            print("Extended data already exists, skipping.")

    finally:
        db.close()


def _seed_base(db):
    now = datetime.now(timezone.utc)

    admin = User(
        email="admin@adagency.com",
        full_name="Администратор",
        hashed_password=get_password_hash("admin123"),
        is_admin=True,
    )
    db.add(admin)
    db.flush()

    client_objs = []
    for c in CLIENTS:
        client = Client(**c)
        db.add(client)
        client_objs.append(client)
    db.flush()

    for spec in ORDERS_SPEC:
        c_idx, title, service_type, scope, status, days_ago, deadline_days = spec
        client = client_objs[c_idx]
        previous_count = db.query(Order).filter(Order.client_id == client.id).count()
        pricing = calculate_price(service_type, scope, previous_count)
        created_at = now - timedelta(days=days_ago)
        deadline = (now + timedelta(days=deadline_days)) if deadline_days is not None else None

        order = Order(
            client_id=client.id,
            title=title,
            service_type=service_type,
            scope=scope,
            status=status,
            deadline=deadline,
            created_at=created_at,
            created_by_id=admin.id,
            **pricing,
        )
        db.add(order)
        db.flush()

    db.commit()
    print("Seeded: 1 user, 5 clients, 20 orders")
    print("Login: admin@adagency.com / admin123")


def _seed_extended(db):
    from models.campaign import Campaign, MediaChannel, CampaignMetric, CampaignReport, CampaignStatus, ChannelType, ReportPeriod, campaign_media_channels
    from models.audience import AudienceSegment, campaign_audience_segments, Gender, IncomeLevel
    from models.ab_test import CampaignVariant
    from models.payment import Invoice, Payment, InvoiceStatus, PaymentStatus, PaymentMethod, PlanStatus, TaxType, TaxRecord, PaymentPlan
    from models.crm import Task, TimeLog, Lead, Contract, Vendor, ClientContact, TaskStatus, TaskPriority, LeadStatus, LeadSource, ContractStatus
    from sqlalchemy import text

    orders = db.query(Order).all()
    clients = db.query(Client).all()
    admin = db.query(User).filter(User.is_admin == True).first()
    today = date.today()

    # ── Media Channels ─────────────────────────────────────────────────────────
    channels_data = [
        {"name": "ВКонтакте", "channel_type": ChannelType.social_media, "description": "Крупнейшая соцсеть России"},
        {"name": "Telegram", "channel_type": ChannelType.social_media, "description": "Мессенджер с каналами"},
        {"name": "Google Ads", "channel_type": ChannelType.search, "description": "Контекстная и поисковая реклама"},
        {"name": "YouTube", "channel_type": ChannelType.video, "description": "Видеохостинг, pre-roll и баннеры"},
        {"name": "Яндекс.Директ", "channel_type": ChannelType.search, "description": "Поисковая реклама Яндекса"},
        {"name": "MyTarget", "channel_type": ChannelType.display, "description": "Таргетированная реклама Mail.ru Group"},
    ]
    channels = []
    for cd in channels_data:
        ch = MediaChannel(**cd)
        db.add(ch)
        channels.append(ch)
    db.flush()

    # ── Audience Segments ──────────────────────────────────────────────────────
    seg1 = AudienceSegment(name="Молодёжь 18–25", age_min=18, age_max=25, gender=Gender.all, interests="музыка, мода, игры", geography="Москва, СПб", income_level=IncomeLevel.low)
    seg2 = AudienceSegment(name="Бизнес-аудитория 30–45", age_min=30, age_max=45, gender=Gender.all, interests="бизнес, инвестиции, авто", geography="Москва", income_level=IncomeLevel.high)
    seg3 = AudienceSegment(name="Родители 35–50", age_min=35, age_max=50, gender=Gender.female, interests="дети, образование, здоровье", geography="Россия", income_level=IncomeLevel.medium)
    seg4 = AudienceSegment(name="Топ-менеджеры", age_min=40, age_max=60, gender=Gender.male, interests="гольф, путешествия, luxury", geography="Москва", income_level=IncomeLevel.ultra_high)
    for seg in [seg1, seg2, seg3, seg4]:
        db.add(seg)
    db.flush()

    # ── Campaigns ─────────────────────────────────────────────────────────────
    # Campaign 1 — linked to order[1] (SMM Q1, done)
    camp1 = Campaign(
        order_id=orders[1].id,
        name="SMM-кампания Альфа Медиа Q1",
        description="Повышение узнаваемости бренда в соцсетях",
        status=CampaignStatus.completed,
        budget=350000,
        start_date=today - timedelta(days=70),
        end_date=today - timedelta(days=30),
    )
    camp1.media_channels = [channels[0], channels[1]]  # ВКонтакте + Telegram
    db.add(camp1)

    # Campaign 2 — linked to order[5] (Летняя кампания Горизонт, done)
    camp2 = Campaign(
        order_id=orders[5].id,
        name="Летняя кампания Горизонт",
        description="Сезонное продвижение услуг компании",
        status=CampaignStatus.completed,
        budget=520000,
        start_date=today - timedelta(days=60),
        end_date=today - timedelta(days=10),
    )
    camp2.media_channels = [channels[0], channels[2], channels[3]]  # ВК + Google + YouTube
    db.add(camp2)

    # Campaign 3 — linked to order[3] (Видеоролики, in_progress)
    camp3 = Campaign(
        order_id=orders[3].id,
        name="Видео-запуск продуктовой линейки",
        description="Запуск серии рекламных роликов на YouTube и в соцсетях",
        status=CampaignStatus.active,
        budget=280000,
        start_date=today - timedelta(days=8),
        end_date=today + timedelta(days=22),
    )
    camp3.media_channels = [channels[3], channels[5]]  # YouTube + MyTarget
    db.add(camp3)

    # Campaign 4 — linked to order[12] (Чёрная пятница, done)
    camp4 = Campaign(
        order_id=orders[12].id,
        name="Чёрная пятница — Рассвет Ритейл",
        description="Массированная рекламная кампания к распродаже",
        status=CampaignStatus.completed,
        budget=780000,
        start_date=today - timedelta(days=130),
        end_date=today - timedelta(days=100),
    )
    camp4.media_channels = [channels[0], channels[2], channels[4]]
    db.add(camp4)

    db.flush()

    # Assign audience segments to campaigns
    for camp, segs in [(camp1, [seg1, seg2]), (camp2, [seg2, seg3]), (camp3, [seg1]), (camp4, [seg1, seg2, seg3])]:
        for seg in segs:
            db.execute(campaign_audience_segments.insert().values(campaign_id=camp.id, segment_id=seg.id))

    # ── Campaign Metrics ───────────────────────────────────────────────────────
    metrics_data = [
        # (campaign, channel_idx, days_ago, impressions, clicks, conversions, spend)
        (camp1, 0, 60, 42000, 1260, 87, 18500),
        (camp1, 0, 55, 38500, 1155, 74, 16800),
        (camp1, 0, 50, 45200, 1356, 95, 19700),
        (camp1, 1, 60, 22000, 880, 51, 9200),
        (camp1, 1, 50, 28000, 1120, 68, 11600),
        (camp2, 0, 55, 65000, 2275, 156, 28000),
        (camp2, 2, 55, 48000, 1920, 142, 32000),
        (camp2, 3, 55, 35000, 1050, 98, 41000),
        (camp2, 0, 30, 72000, 2520, 188, 31000),
        (camp2, 2, 30, 52000, 2080, 167, 35000),
        (camp3, 3, 7, 18500, 555, 42, 22000),
        (camp3, 5, 7, 12000, 480, 38, 14500),
        (camp3, 3, 4, 21000, 630, 53, 24800),
        (camp4, 0, 120, 110000, 4400, 528, 52000),
        (camp4, 2, 120, 89000, 3560, 427, 61000),
        (camp4, 4, 120, 74000, 2960, 355, 43500),
    ]
    for camp, ch_idx, days_ago, impressions, clicks, conversions, spend in metrics_data:
        ctr = round(clicks / impressions * 100, 4) if impressions else 0
        m = CampaignMetric(
            campaign_id=camp.id,
            channel_id=channels[ch_idx].id,
            date=today - timedelta(days=days_ago),
            impressions=impressions,
            clicks=clicks,
            ctr=ctr,
            conversions=conversions,
            spend=spend,
        )
        db.add(m)

    # ── Campaign Reports ───────────────────────────────────────────────────────
    for camp, total_imp, total_cl, total_conv, total_sp in [
        (camp1, 175700, 5771, 375, 75800),
        (camp2, 272000, 10345, 751, 167000),
        (camp4, 273000, 10920, 1310, 156500),
    ]:
        avg_ctr = round(total_cl / total_imp * 100, 4)
        r = CampaignReport(
            campaign_id=camp.id,
            period=ReportPeriod.monthly,
            period_start=camp.start_date,
            period_end=camp.end_date,
            total_impressions=total_imp,
            total_clicks=total_cl,
            avg_ctr=avg_ctr,
            total_conversions=total_conv,
            total_spend=total_sp,
        )
        db.add(r)

    # ── A/B Variants ───────────────────────────────────────────────────────────
    v1 = CampaignVariant(campaign_id=camp1.id, name="Вариант A — «Профессионалам»", description="Акцент на B2B аудиторию, деловой стиль", impressions=88000, conversions=308, is_winner=False)
    v2 = CampaignVariant(campaign_id=camp1.id, name="Вариант B — «Ярко и дерзко»", description="Яркий дизайн, молодёжная подача", impressions=87700, conversions=367, is_winner=True)
    v3 = CampaignVariant(campaign_id=camp2.id, name="Летний баннер", description="Летние цвета, акция -20%", impressions=120000, conversions=480, is_winner=False)
    v4 = CampaignVariant(campaign_id=camp2.id, name="Видео 15 сек", description="Короткий ролик с оффером", impressions=152000, conversions=683, is_winner=True)
    for v in [v1, v2, v3, v4]:
        db.add(v)

    # ── Invoices & Payments ────────────────────────────────────────────────────
    inv_data = [
        (orders[0].id, today - timedelta(days=80), today - timedelta(days=50), orders[0].final_price, InvoiceStatus.paid),
        (orders[1].id, today - timedelta(days=55), today - timedelta(days=25), orders[1].final_price, InvoiceStatus.paid),
        (orders[5].id, today - timedelta(days=45), today - timedelta(days=15), orders[5].final_price, InvoiceStatus.overdue),
        (orders[3].id, today - timedelta(days=5), today + timedelta(days=25), orders[3].final_price * 0.5, InvoiceStatus.sent),
        (orders[9].id, today - timedelta(days=2), today + timedelta(days=28), orders[9].final_price * 0.3, InvoiceStatus.draft),
    ]
    invoices = []
    for order_id, issue, due, amount, status in inv_data:
        inv = Invoice(order_id=order_id, issue_date=issue, due_date=due, amount=round(amount, 2), status=status)
        db.add(inv)
        invoices.append(inv)
    db.flush()

    # Payments for paid invoices
    p1 = Payment(invoice_id=invoices[0].id, payment_date=datetime.now(timezone.utc) - timedelta(days=48), amount=invoices[0].amount, method=PaymentMethod.bank_transfer, currency="RUB", status=PaymentStatus.completed)
    p2 = Payment(invoice_id=invoices[1].id, payment_date=datetime.now(timezone.utc) - timedelta(days=23), amount=invoices[1].amount * 0.5, method=PaymentMethod.card, currency="RUB", status=PaymentStatus.completed)
    p3 = Payment(invoice_id=invoices[1].id, payment_date=datetime.now(timezone.utc) - timedelta(days=10), amount=invoices[1].amount * 0.5, method=PaymentMethod.card, currency="RUB", status=PaymentStatus.completed)
    p4 = Payment(invoice_id=invoices[3].id, payment_date=datetime.now(timezone.utc) - timedelta(days=1), amount=invoices[3].amount, method=PaymentMethod.bank_transfer, currency="RUB", status=PaymentStatus.pending)
    for p in [p1, p2, p3, p4]:
        db.add(p)
    db.flush()

    # Tax record for invoice 0
    tax = TaxRecord(invoice_id=invoices[0].id, tax_type=TaxType.vat, tax_rate=20.0, tax_amount=round(invoices[0].amount * 0.2, 2))
    db.add(tax)

    # Payment plan for invoice 3
    plan1 = PaymentPlan(invoice_id=invoices[3].id, installment_number=1, due_date=today + timedelta(days=10), amount=round(invoices[3].amount / 2, 2), status=PlanStatus.pending)
    plan2 = PaymentPlan(invoice_id=invoices[3].id, installment_number=2, due_date=today + timedelta(days=40), amount=round(invoices[3].amount / 2, 2), status=PlanStatus.pending)
    db.add(plan1)
    db.add(plan2)

    # ── Vendors ────────────────────────────────────────────────────────────────
    vendors_data = [
        {"name": "Фотостудия «Свет»", "email": "booking@svet-studio.ru", "phone": "+7-495-100-20-30", "specialty": "Коммерческая фотография", "rating": 4.8, "notes": "Проверенный партнёр, скидка 10% при объёме от 3 съёмок"},
        {"name": "Видеопродакшн «Кадр»", "email": "hello@kadr.pro", "phone": "+7-495-200-30-40", "specialty": "Рекламные ролики и корпоративное видео", "rating": 4.5},
        {"name": "Типография «Пресс»", "email": "orders@press-print.ru", "phone": "+7-495-300-40-50", "specialty": "Полиграфия, POS-материалы", "rating": 4.2},
        {"name": "Звуковая студия «Резонанс»", "email": "sound@rezonans.ru", "phone": "+7-495-400-50-60", "specialty": "Запись джинглов и озвучка роликов", "rating": 4.7, "notes": "Минимальный заказ от 25 000 ₽"},
    ]
    for vd in vendors_data:
        db.add(Vendor(**vd))

    # ── Client Contacts ────────────────────────────────────────────────────────
    contacts_data = [
        {"client_id": clients[0].id, "name": "Алексей Громов", "email": clients[0].email, "phone": clients[0].phone, "role": "Генеральный директор", "is_primary": True},
        {"client_id": clients[0].id, "name": "Светлана Миронова", "email": "s.mironova@alfa-media.ru", "phone": "+7-495-001-01-10", "role": "Маркетинг-директор"},
        {"client_id": clients[1].id, "name": "Марина Соколова", "email": clients[1].email, "phone": clients[1].phone, "role": "Руководитель проектов", "is_primary": True},
        {"client_id": clients[3].id, "name": "Ольга Карпова", "email": clients[3].email, "phone": clients[3].phone, "role": "Директор по маркетингу", "is_primary": True},
        {"client_id": clients[3].id, "name": "Игорь Власов", "email": "i.vlasov@novatek-group.ru", "phone": "+7-495-001-04-11", "role": "Технический директор"},
    ]
    for cd in contacts_data:
        db.add(ClientContact(**cd))

    # ── Contracts ─────────────────────────────────────────────────────────────
    contracts_data = [
        {
            "client_id": clients[0].id, "order_id": orders[0].id,
            "title": "Договор №2024-001 — Редизайн корпоративного сайта",
            "content": "Исполнитель обязуется выполнить работы по редизайну корпоративного сайта согласно техническому заданию. Стоимость работ фиксирована.",
            "status": ContractStatus.signed,
            "signed_at": datetime.now(timezone.utc) - timedelta(days=88),
        },
        {
            "client_id": clients[1].id, "order_id": orders[5].id,
            "title": "Договор №2024-006 — Летняя рекламная кампания",
            "content": "Оказание услуг по разработке и реализации рекламной кампании в период с июня по август включительно.",
            "status": ContractStatus.signed,
            "signed_at": datetime.now(timezone.utc) - timedelta(days=49),
        },
        {
            "client_id": clients[3].id, "order_id": orders[9].id,
            "title": "Договор №2024-010 — Разработка интернет-магазина",
            "content": "Разработка и запуск интернет-магазина на платформе Next.js с интеграцией платёжных систем.",
            "status": ContractStatus.pending_signature,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=365),
        },
    ]
    for cd_data in contracts_data:
        db.add(Contract(**cd_data))

    # ── Tasks ─────────────────────────────────────────────────────────────────
    tasks_data = [
        {"order_id": orders[3].id, "assigned_to_id": admin.id, "title": "Написать сценарий для видеоролика №1", "description": "Хронометраж 30 сек, целевая аудитория — B2B", "status": TaskStatus.done, "priority": TaskPriority.high, "due_date": today - timedelta(days=5)},
        {"order_id": orders[3].id, "assigned_to_id": admin.id, "title": "Монтаж и цветокоррекция ролика №1", "status": TaskStatus.in_progress, "priority": TaskPriority.high, "due_date": today + timedelta(days=5)},
        {"order_id": orders[3].id, "assigned_to_id": admin.id, "title": "Съёмка ролика №2", "status": TaskStatus.todo, "priority": TaskPriority.medium, "due_date": today + timedelta(days=12)},
        {"order_id": orders[6].id, "assigned_to_id": admin.id, "title": "Написать 5 статей для блога (план)", "status": TaskStatus.in_progress, "priority": TaskPriority.medium, "due_date": today + timedelta(days=7)},
        {"order_id": orders[6].id, "assigned_to_id": admin.id, "title": "Согласование тем с клиентом", "status": TaskStatus.done, "priority": TaskPriority.low, "due_date": today - timedelta(days=3)},
        {"order_id": orders[9].id, "assigned_to_id": admin.id, "title": "Разработка дизайна главной страницы", "status": TaskStatus.in_progress, "priority": TaskPriority.critical, "due_date": today + timedelta(days=10)},
        {"order_id": orders[9].id, "assigned_to_id": admin.id, "title": "Настройка платёжного шлюза", "status": TaskStatus.todo, "priority": TaskPriority.high, "due_date": today + timedelta(days=25)},
        {"order_id": orders[9].id, "assigned_to_id": admin.id, "title": "Тестирование корзины и оформления заказа", "status": TaskStatus.todo, "priority": TaskPriority.high, "due_date": today + timedelta(days=35)},
    ]
    task_objs = []
    for td in tasks_data:
        t = Task(**td)
        db.add(t)
        task_objs.append(t)
    db.flush()

    # Time logs for done/in-progress tasks
    time_logs = [
        (task_objs[0], 3.5, today - timedelta(days=7), "Первый черновик сценария"),
        (task_objs[0], 1.5, today - timedelta(days=6), "Правки после согласования с клиентом"),
        (task_objs[1], 4.0, today - timedelta(days=2), "Черновой монтаж"),
        (task_objs[1], 2.5, today - timedelta(days=1), "Цветокоррекция"),
        (task_objs[3], 2.0, today - timedelta(days=4), "Подготовка плана статей"),
        (task_objs[5], 5.0, today - timedelta(days=3), "Wireframes и мудборд"),
        (task_objs[5], 6.0, today - timedelta(days=1), "Дизайн в Figma"),
    ]
    for task, hours, logged_at, desc in time_logs:
        db.add(TimeLog(task_id=task.id, user_id=admin.id, hours=hours, logged_at=logged_at, description=desc))

    # ── Leads ─────────────────────────────────────────────────────────────────
    leads_data = [
        {"name": "Павел Рыжов", "email": "pavel@ryjov-tech.ru", "phone": "+7-916-100-20-30", "company": "ООО «РыжовТех»", "source": LeadSource.referral, "status": LeadStatus.qualified, "notes": "Нужен редизайн сайта + SEO. Бюджет 300-500к. Рекомендовал Громов.", "assigned_to_id": admin.id},
        {"name": "Елена Дмитриева", "email": "e.dmitrieva@fashion-brand.ru", "phone": "+7-916-200-30-40", "company": "Fashion Brand", "source": LeadSource.website, "status": LeadStatus.contacted, "notes": "Заполнила форму на сайте. Интересует SMM для Instagram и Telegram.", "assigned_to_id": admin.id},
        {"name": "Андрей Козлов", "email": "akozlov@fitclub.ru", "phone": "+7-916-300-40-50", "company": "FitClub", "source": LeadSource.social, "status": LeadStatus.new, "notes": "Написал в Telegram. Нужна рекламная кампания к открытию нового зала."},
        {"name": "Наталья Фёдорова", "email": "n.fedorova@ecostyle.ru", "phone": "+7-916-400-50-60", "company": "EcoStyle", "source": LeadSource.event, "status": LeadStatus.proposal, "notes": "Познакомились на MarTech Conf. Отправили КП на видеопродакшн.", "assigned_to_id": admin.id},
        {"name": "Виктор Семёнов", "email": "victor@semenovs-bakery.ru", "phone": "+7-916-500-60-70", "company": "Пекарня «Семёновъ»", "source": LeadSource.cold_call, "status": LeadStatus.lost, "notes": "Не устроила стоимость. Выбрали другое агентство."},
    ]
    for ld in leads_data:
        db.add(Lead(**ld))

    db.commit()
    print("Seeded extended data: channels, campaigns, metrics, invoices, payments, tasks, leads, contracts, vendors, contacts")


if __name__ == "__main__":
    seed()
