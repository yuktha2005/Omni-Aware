import logging
from typing import Dict, Any, Optional
from services.ai.qr_service import qr_code_service

logger = logging.getLogger(__name__)


class PosterGeneratorService:
    def __init__(self):
        pass

    def generate_poster(
        self,
        campaign_title: str,
        purpose: str,
        message_body: str,
        call_to_action: str,
        language: str = "English",
        audience_role: str = "General Public",
        campaign_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generates a responsive visual SVG/HTML awareness poster layout for digital displays and print.
        """
        qr_data = qr_code_service.generate_campaign_qr(
            campaign_id=campaign_id,
            campaign_title=campaign_title
        )

        # Truncate and clean points for poster layout
        body_lines = [l.strip() for l in message_body.split("\n") if l.strip() and not l.startswith("Dear") and not l.startswith("Purpose:")]
        bullets = body_lines[:4] if body_lines else [message_body[:150]]

        svg_poster = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1050" width="100%" height="100%" style="font-family: Arial, sans-serif;">
  <defs>
    <linearGradient id="gradHeader" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1E3A8A;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3B82F6;stop-opacity:1" />
    </linearGradient>
    <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-opacity="0.15"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="800" height="1050" fill="#F8FAFC"/>

  <!-- Top Decorative Header Banner -->
  <rect width="800" height="240" fill="url(#gradHeader)"/>
  <circle cx="720" cy="60" r="100" fill="#FFFFFF" fill-opacity="0.08"/>
  <circle cx="80" cy="180" r="60" fill="#FFFFFF" fill-opacity="0.08"/>

  <!-- Official Badge -->
  <rect x="50" y="30" width="220" height="34" rx="17" fill="#FFFFFF" fill-opacity="0.2"/>
  <text x="160" y="52" fill="#FFFFFF" font-size="13" font-weight="bold" text-anchor="middle" letter-spacing="1">PUBLIC AWARENESS</text>

  <!-- Language Badge -->
  <rect x="620" y="30" width="130" height="34" rx="17" fill="#10B981"/>
  <text x="685" y="52" fill="#FFFFFF" font-size="13" font-weight="bold" text-anchor="middle">{language.upper()}</text>

  <!-- Title -->
  <text x="50" y="125" fill="#FFFFFF" font-size="30" font-weight="bold">{campaign_title[:38]}</text>
  <text x="50" y="165" fill="#E2E8F0" font-size="18">Category: {purpose} | Target: {audience_role}</text>

  <!-- Main Content Card -->
  <rect x="50" y="270" width="700" height="490" rx="16" fill="#FFFFFF" filter="url(#cardShadow)"/>
  
  <text x="90" y="325" fill="#1E3A8A" font-size="22" font-weight="bold">📌 Key Advisories &amp; Guidance</text>
  <line x1="90" y1="345" x2="710" y2="345" stroke="#E2E8F0" stroke-width="2"/>

  <!-- Bullet points -->
  <g fill="#334155" font-size="16">
    {''.join([f'<circle cx="100" cy="{400 + i*60}" r="6" fill="#3B82F6"/><text x="120" y="{405 + i*60}" font-weight="500">{b[:65]}</text>' for i, b in enumerate(bullets)])}
  </g>

  <!-- Call to Action Banner -->
  <rect x="90" y="650" width="620" height="80" rx="12" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="2"/>
  <text x="110" y="685" fill="#1E3A8A" font-size="15" font-weight="bold">👉 ACTION REQUIRED:</text>
  <text x="110" y="710" fill="#1E40AF" font-size="15">{call_to_action[:70]}</text>

  <!-- Bottom QR & Helpdesk Section -->
  <rect x="50" y="790" width="700" height="200" rx="16" fill="#1E293B"/>
  
  <!-- Embedded QR Code -->
  <image href="{qr_data['qr_data_uri']}" x="80" y="815" width="150" height="150"/>
  
  <text x="260" y="855" fill="#FFFFFF" font-size="20" font-weight="bold">Scan to Read on Mobile</text>
  <text x="260" y="885" fill="#94A3B8" font-size="15">Open in your preferred regional language</text>
  <text x="260" y="935" fill="#38BDF8" font-size="14" font-weight="bold">Issued in public interest for mass community safety.</text>
</svg>"""

        return {
            "campaign_title": campaign_title,
            "language": language,
            "audience_role": audience_role,
            "format": "image/svg+xml",
            "svg_content": svg_poster,
            "qr_data_uri": qr_data["qr_data_uri"]
        }


poster_generator_service = PosterGeneratorService()
