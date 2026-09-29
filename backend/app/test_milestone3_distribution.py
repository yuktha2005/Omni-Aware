import pytest
import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from database.connection import Base, get_db
from models.admin import Admin
from models.recipient import Recipient
from models.master import Language, Occupation, State
from models.segment import AudienceSegment, AudienceSegmentRule
from models.campaign import Campaign, CampaignContent, CampaignDelivery, DeliveryAttempt, EngagementEvent, CampaignFeedback, WebBroadcast
from api.auth import create_access_token
from services.auth_service import hash_password
from services.distribution.channel_manager import channel_manager
from services.distribution.channels.email_provider import EmailChannelProvider
from services.distribution.channels.sms_provider import SMSChannelProvider
from services.distribution.channels.whatsapp_provider import WhatsAppChannelProvider
from services.distribution.channels.push_provider import PushNotificationProvider
from services.distribution.channels.web_provider import WebBroadcastProvider
from services.distribution.distribution_engine import distribution_engine
from services.analytics.analytics_service import analytics_service

client = TestClient(app)


@pytest.fixture(scope="module")
def test_setup():
    import os
    os.environ["EMAIL_FORCE_MOCK"] = "true"
    os.environ["SMS_FORCE_MOCK"] = "true"
    os.environ["WHATSAPP_FORCE_MOCK"] = "true"
    channel_manager.register_provider("email", EmailChannelProvider())
    channel_manager.register_provider("sms", SMSChannelProvider())
    channel_manager.register_provider("whatsapp", WhatsAppChannelProvider())

    from database.connection import SessionLocal
    db = SessionLocal()

    # Ensure admin user
    admin = db.query(Admin).filter(Admin.email == "dist_admin@example.com").first()
    if not admin:
        admin = Admin(
            full_name="Distribution Admin",
            email="dist_admin@example.com",
            password_hash=hash_password("AdminPass123!"),
            is_active=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

    token = create_access_token(admin_id=admin.id, email=admin.email, full_name=admin.full_name)
    headers = {"Authorization": f"Bearer {token}"}

    # Ensure Languages
    lang_en = db.query(Language).filter(Language.code == "en").first()
    if not lang_en:
        lang_en = Language(name="English", code="en", native_name="English", is_active=True)
        db.add(lang_en)
    lang_ta = db.query(Language).filter(Language.code == "ta").first()
    if not lang_ta:
        lang_ta = Language(name="Tamil", code="ta", native_name="தமிழ்", is_active=True)
        db.add(lang_ta)
    lang_hi = db.query(Language).filter(Language.code == "hi").first()
    if not lang_hi:
        lang_hi = Language(name="Hindi", code="hi", native_name="हिन्दी", is_active=True)
        db.add(lang_hi)
    db.commit()

    # Ensure Occupation
    occ_student = db.query(Occupation).filter(Occupation.name == "Student").first()
    if not occ_student:
        occ_student = Occupation(name="Student", description="College/University Students", is_active=True)
        db.add(occ_student)
    occ_teacher = db.query(Occupation).filter(Occupation.name == "Teacher").first()
    if not occ_teacher:
        occ_teacher = Occupation(name="Teacher", description="Educators", is_active=True)
        db.add(occ_teacher)
    db.commit()

    # Create Sample Test Recipients
    r1 = db.query(Recipient).filter(Recipient.email == "student1_dist@example.com").first()
    if not r1:
        r1 = Recipient(
            external_reference_id="REC_DIST_001",
            first_name="Ananya",
            last_name="Rao",
            email="student1_dist@example.com",
            phone_number="9876543210",
            occupation_id=occ_student.id,
            preferred_language_id=lang_en.id,
            city="Chennai",
            status="active",
            consent_status="consented"
        )
        db.add(r1)

    r2 = db.query(Recipient).filter(Recipient.email == "student2_dist@example.com").first()
    if not r2:
        r2 = Recipient(
            external_reference_id="REC_DIST_002",
            first_name="Karthik",
            last_name="Selvam",
            email="student2_dist@example.com",
            phone_number="9876543211",
            occupation_id=occ_student.id,
            preferred_language_id=lang_ta.id,
            city="Madurai",
            status="active",
            consent_status="consented"
        )
        db.add(r2)

    r3_optout = db.query(Recipient).filter(Recipient.email == "optout_dist@example.com").first()
    if not r3_optout:
        r3_optout = Recipient(
            external_reference_id="REC_DIST_003",
            first_name="Rohan",
            last_name="Sharma",
            email="optout_dist@example.com",
            phone_number="9876543212",
            occupation_id=occ_student.id,
            preferred_language_id=lang_hi.id,
            city="Delhi",
            status="active",
            consent_status="opted_out"
        )
        db.add(r3_optout)

    db.commit()
    db.refresh(r1)
    db.refresh(r2)
    db.refresh(r3_optout)

    yield {
        "headers": headers,
        "admin": admin,
        "recipients": [r1, r2, r3_optout],
        "languages": {"en": lang_en, "ta": lang_ta, "hi": lang_hi},
        "occupations": {"student": occ_student, "teacher": occ_teacher}
    }
    db.close()


# =========================================================
# 1. CHANNEL UNIT TESTS
# =========================================================
def test_email_provider_eligibility_and_send(test_setup):
    provider = EmailChannelProvider()
    r_valid = test_setup["recipients"][0]
    r_optout = test_setup["recipients"][2]

    # Valid recipient
    eligible, reason, email = provider.check_eligibility(r_valid)
    assert eligible is True
    assert email == "student1_dist@example.com"

    # Opted-out recipient
    eligible_opt, reason_opt, _ = provider.check_eligibility(r_optout)
    assert eligible_opt is False
    assert "consent" in reason_opt.lower() or "opted_out" in reason_opt.lower()

    # Mock send
    class DummyContent:
        message_title = "Health Checkup Camp"
        message_body = "Free general health screening this Saturday."
        call_to_action = "Register Now"

    class DummyCampaign:
        id = 101

    res = provider.send(r_valid, DummyContent(), DummyCampaign())
    assert res.success is True
    assert res.status in ["SENT", "DELIVERED"]
    assert "email-" in res.message_id


def test_sms_provider_eligibility_and_send(test_setup):
    provider = SMSChannelProvider()
    r_valid = test_setup["recipients"][0]

    eligible, reason, phone = provider.check_eligibility(r_valid)
    assert eligible is True
    assert phone == "9876543210"

    class DummyContent:
        message_title = "Water Alert"
        message_body = "Scheduled maintenance from 10 AM to 2 PM."
        short_version = "Water supply maintenance 10AM-2PM."
        call_to_action = "Call Helpline"

    class DummyCampaign:
        id = 102

    res = provider.send(r_valid, DummyContent(), DummyCampaign())
    assert res.success is True
    assert res.status == "DELIVERED"
    assert "sms-" in res.message_id


def test_whatsapp_provider_simulation(test_setup):
    provider = WhatsAppChannelProvider()
    r_valid = test_setup["recipients"][1]

    eligible, reason, phone = provider.check_eligibility(r_valid)
    assert eligible is True
    assert "9876543211" in phone

    class DummyContent:
        message_title = "Vaccination Drive"
        message_body = "Free booster doses available."
        call_to_action = "Locate Center"
        language_code = "ta"

    class DummyCampaign:
        id = 103

    res = provider.send(r_valid, DummyContent(), DummyCampaign())
    assert res.success is True
    assert res.status == "DELIVERED"
    assert "wamid." in res.message_id
    assert "Simulated" in res.provider or "Mock" in res.provider


def test_push_and_web_providers(test_setup):
    push_provider = PushNotificationProvider()
    web_provider = WebBroadcastProvider()
    r_valid = test_setup["recipients"][0]

    class DummyContent:
        message_title = "Weather Advisory"
        message_body = "Heavy rainfall anticipated in coastal regions."
        short_version = "Heavy rain expected."
        call_to_action = "Read Advisory"

    class DummyCampaign:
        id = 104

    push_res = push_provider.send(r_valid, DummyContent(), DummyCampaign())
    assert push_res.success is True
    assert push_res.status == "DELIVERED"

    web_res = web_provider.send(r_valid, DummyContent(), DummyCampaign())
    assert web_res.success is True
    assert web_res.status == "DELIVERED"


# =========================================================
# 2. CAMPAIGN SCHEDULING & LIFECYCLE APIS
# =========================================================
def test_campaign_scheduling_and_cancellation(test_setup):
    headers = test_setup["headers"]

    # 1. Create campaign
    create_res = client.post(
        "/ai/campaigns",
        json={
            "title": "College Cleanliness & Wellness Drive",
            "purpose": "Campus Health Awareness",
            "target_audience": "Students",
            "key_information": "Cleanliness drive in all college blocks this Friday morning.",
            "desired_language": "English",
            "desired_tone": "Informative",
            "communication_channel": "Email, SMS, Web"
        },
        headers=headers
    )
    assert create_res.status_code == 200
    camp_id = create_res.json()["id"]

    # 2. Schedule campaign
    future_time = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=2)).isoformat()
    sched_res = client.post(
        f"/campaigns/{camp_id}/schedule",
        json={
            "scheduled_at": future_time,
            "scheduled_timezone": "Asia/Kolkata",
            "selected_channels": ["email", "sms", "web"]
        },
        headers=headers
    )
    assert sched_res.status_code == 200
    assert sched_res.json()["status"] == "scheduled"

    # 3. Cancel scheduled campaign
    cancel_res = client.post(f"/campaigns/{camp_id}/cancel", headers=headers)
    assert cancel_res.status_code == 200
    assert "cancelled" in cancel_res.json()["message"].lower()


# =========================================================
# 3. DELIVERY TRACKING, RETRY & MONITORING
# =========================================================
def test_sync_distribution_and_delivery_tracking(test_setup):
    headers = test_setup["headers"]

    # Create and prepare campaign
    camp_res = client.post(
        "/ai/campaigns",
        json={
            "title": "Nutrition & Healthy Eating Workshop",
            "purpose": "Promote student health",
            "target_audience": "Students",
            "key_information": "Join free nutrition session with certified dieticians on campus.",
            "desired_language": "English",
            "desired_tone": "Friendly",
            "communication_channel": "Email, SMS"
        },
        headers=headers
    )
    camp_id = camp_res.json()["id"]

    # Distribute in sync mode
    dist_res = client.post(
        f"/campaigns/{camp_id}/distribute?sync_mode=true&channels=email&channels=sms",
        headers=headers
    )
    assert dist_res.status_code == 200
    data = dist_res.json()
    assert data["status"] == "completed"
    assert data["total_eligible"] > 0

    # Verify Deliveries endpoint
    deliv_res = client.get(f"/campaigns/{camp_id}/deliveries", headers=headers)
    assert deliv_res.status_code == 200
    deliv_data = deliv_res.json()
    assert deliv_data["total"] > 0
    assert len(deliv_data["deliveries"]) > 0

    # Verify Monitoring endpoint
    mon_res = client.get(f"/campaigns/{camp_id}/monitoring", headers=headers)
    assert mon_res.status_code == 200
    mon_data = mon_res.json()
    assert mon_data["campaign_id"] == camp_id
    assert mon_data["progress_percent"] > 0


# =========================================================
# 4. ENGAGEMENT EVENTS & FEEDBACK SENTIMENT
# =========================================================
def test_engagement_events_and_sentiment_analysis(test_setup):
    headers = test_setup["headers"]

    camp_res = client.post(
        "/ai/campaigns",
        json={
            "title": "Mental Health & Stress Management Seminar",
            "purpose": "Mental Wellness",
            "target_audience": "Students",
            "key_information": "Interactive counseling and stress relief workshops available.",
            "desired_language": "English",
            "desired_tone": "Reassuring",
            "communication_channel": "Email"
        },
        headers=headers
    )
    camp_id = camp_res.json()["id"]

    # Run distribution
    client.post(f"/campaigns/{camp_id}/distribute?sync_mode=true&channels=email", headers=headers)

    # 1. Ingest engagement events
    ev1 = client.post(
        f"/analytics/campaigns/{camp_id}/events",
        json={
            "campaign_id": camp_id,
            "recipient_id": test_setup["recipients"][0].id,
            "channel": "email",
            "event_type": "OPENED"
        }
    )
    assert ev1.status_code == 200

    ev2 = client.post(
        f"/analytics/campaigns/{camp_id}/events",
        json={
            "campaign_id": camp_id,
            "recipient_id": test_setup["recipients"][0].id,
            "channel": "email",
            "event_type": "CLICKED"
        }
    )
    assert ev2.status_code == 200

    # 2. Ingest audience feedback
    fb1 = client.post(
        f"/analytics/campaigns/{camp_id}/feedbacks",
        json={
            "campaign_id": camp_id,
            "recipient_id": test_setup["recipients"][0].id,
            "channel": "email",
            "feedback_text": "This workshop was wonderfully helpful and truly uplifting for our exams!",
            "rating": 5
        }
    )
    assert fb1.status_code == 200
    fb_data = fb1.json()
    assert fb_data["sentiment"] == "positive"
    assert fb_data["sentiment_score"] > 0

    fb2 = client.post(
        f"/analytics/campaigns/{camp_id}/feedbacks",
        json={
            "campaign_id": camp_id,
            "recipient_id": test_setup["recipients"][1].id,
            "channel": "web",
            "feedback_text": "The session timings were inconvenient and the auditorium was crowded.",
            "rating": 2
        }
    )
    assert fb2.status_code == 200
    assert fb2.json()["sentiment"] == "negative"


# =========================================================
# 5. COMPREHENSIVE ANALYTICS APIS
# =========================================================
def test_analytics_drilldown_endpoints(test_setup):
    headers = test_setup["headers"]

    # Overview endpoint
    overview_res = client.get("/analytics/overview")
    assert overview_res.status_code == 200
    ov_data = overview_res.json()
    assert "total_campaigns" in ov_data
    assert "overall_delivery_rate" in ov_data

    # Find an active campaign
    c_list = client.get("/ai/campaigns").json()
    assert len(c_list) > 0
    camp_id = c_list[0]["id"]

    # Full campaign analytics
    camp_analytics = client.get(f"/analytics/campaigns/{camp_id}")
    assert camp_analytics.status_code == 200
    a_data = camp_analytics.json()
    assert a_data["campaign_id"] == camp_id
    assert "summary" in a_data
    assert "channels" in a_data
    assert "languages" in a_data
    assert "audiences" in a_data
    assert "feedback" in a_data

    # Granular drilldown
    assert client.get(f"/analytics/campaigns/{camp_id}/delivery").status_code == 200
    assert client.get(f"/analytics/campaigns/{camp_id}/engagement").status_code == 200
    assert client.get(f"/analytics/campaigns/{camp_id}/channels").status_code == 200
    assert client.get(f"/analytics/campaigns/{camp_id}/languages").status_code == 200
    assert client.get(f"/analytics/campaigns/{camp_id}/audiences").status_code == 200
    assert client.get(f"/analytics/campaigns/{camp_id}/feedbacks").status_code == 200


# =========================================================
# 6. COMPLETE END-TO-END WORKFLOW SCENARIO (PHASE 26)
# Campaign: "College Health Awareness Program"
# Audience: Students
# Languages: English + Tamil
# Channels: Email + SMS
# =========================================================
def test_end_to_end_college_health_awareness_campaign(test_setup):
    headers = test_setup["headers"]

    # 1. Create campaign
    create_res = client.post(
        "/ai/campaigns",
        json={
            "title": "College Health Awareness Program",
            "purpose": "Student Health & Preventive Care Awareness",
            "target_audience": "Students",
            "key_information": "Annual student wellness camp with general checkup, dental check, and nutrition consultation on campus this Saturday.",
            "desired_language": "English",
            "desired_tone": "Reassuring",
            "communication_channel": "Email, SMS",
            "optional_instructions": "Focus on student well-being and free registration."
        },
        headers=headers
    )
    assert create_res.status_code == 200
    campaign_id = create_res.json()["id"]

    # 2. Run Milestone 2 AI Multilingual Pipeline (English + Tamil)
    pipeline_res = client.post(
        "/ai/process",
        json={
            "campaign_title": "College Health Awareness Program",
            "purpose": "Student Health & Preventive Care Awareness",
            "target_audience": "Students",
            "key_information": "Annual student wellness camp with general checkup, dental check, and nutrition consultation on campus this Saturday.",
            "desired_language": "English",
            "target_languages": ["English", "Tamil"],
            "audience_roles": ["Student"],
            "desired_tone": "Reassuring",
            "save_to_db": True
        },
        headers=headers
    )
    assert pipeline_res.status_code == 200
    pipeline_data = pipeline_res.json()
    assert pipeline_data["total_generated"] >= 2  # English + Tamil
    target_campaign_id = pipeline_data.get("campaign_id") or campaign_id

    # 3. Schedule Campaign
    schedule_res = client.post(
        f"/campaigns/{target_campaign_id}/schedule",
        json={
            "scheduled_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "scheduled_timezone": "Asia/Kolkata",
            "selected_channels": ["email", "sms"]
        },
        headers=headers
    )
    assert schedule_res.status_code == 200
    assert schedule_res.json()["status"] in ["scheduled", "queued"]

    # 4. Dispatch Campaign across Email & SMS
    dist_res = client.post(
        f"/campaigns/{target_campaign_id}/distribute?sync_mode=true&channels=email&channels=sms",
        headers=headers
    )
    assert dist_res.status_code == 200
    assert dist_res.json()["status"] == "completed"

    # 5. Verify Deliveries were created & matched language
    deliv_res = client.get(f"/campaigns/{target_campaign_id}/deliveries", headers=headers)
    assert deliv_res.status_code == 200
    deliveries = deliv_res.json()["deliveries"]
    assert len(deliveries) > 0

    # 6. Simulate Student Engagement
    client.post(
        f"/analytics/campaigns/{target_campaign_id}/events",
        json={
            "campaign_id": target_campaign_id,
            "recipient_id": test_setup["recipients"][0].id,
            "channel": "email",
            "event_type": "OPENED"
        }
    )
    client.post(
        f"/analytics/campaigns/{target_campaign_id}/events",
        json={
            "campaign_id": target_campaign_id,
            "recipient_id": test_setup["recipients"][0].id,
            "channel": "email",
            "event_type": "CLICKED"
        }
    )

    # 7. Collect and evaluate Student Feedback
    fb_res = client.post(
        f"/analytics/campaigns/{target_campaign_id}/feedbacks",
        json={
            "campaign_id": target_campaign_id,
            "recipient_id": test_setup["recipients"][0].id,
            "channel": "email",
            "feedback_text": "Extremely valuable initiative for student wellness. Doctors were very attentive!",
            "rating": 5
        }
    )
    assert fb_res.status_code == 200
    assert fb_res.json()["sentiment"] == "positive"

    # 8. Retrieve Complete Campaign Analytics
    analytics_res = client.get(f"/analytics/campaigns/{target_campaign_id}")
    assert analytics_res.status_code == 200
    analytics = analytics_res.json()

    assert analytics["campaign_title"] == "College Health Awareness Program"
    assert analytics["summary"]["total_delivered"] > 0
    assert analytics["summary"]["total_opened"] >= 1
    assert analytics["summary"]["total_clicked"] >= 1
    assert analytics["feedback"]["total_feedbacks"] >= 1
    assert analytics["feedback"]["positive_percentage"] > 0
    assert len(analytics["channels"]) >= 2
    assert any(l["language"] in ["English", "Tamil"] for l in analytics["languages"])
    assert any(a["segment_name"] in ["Student", "Students", "General Public"] for a in analytics["audiences"])
