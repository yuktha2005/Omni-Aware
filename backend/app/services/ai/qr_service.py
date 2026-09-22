import io
import base64
import logging
from typing import Dict, Any, Optional
import qrcode
from qrcode.image.pil import PilImage

logger = logging.getLogger(__name__)


class QRCodeService:
    def __init__(self):
        pass

    def generate_campaign_qr(
        self,
        campaign_id: Optional[int] = None,
        campaign_title: str = "Public Awareness",
        portal_url: Optional[str] = None,
        info_payload: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generates dynamic high-res QR code PNG as base64 for offline community notice boards and pamphlets.
        """
        target_payload = portal_url or info_payload or f"https://publicawareness.gov.in/campaign/{campaign_id or 1}"
        
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=4,
        )
        qr.add_data(target_payload)
        qr.make(fit=True)

        img: PilImage = qr.make_image(fill_color="#1E3A8A", back_color="#FFFFFF")
        
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        
        png_bytes = buffer.read()
        base64_str = base64.b64encode(png_bytes).decode("utf-8")

        return {
            "campaign_id": campaign_id,
            "campaign_title": campaign_title,
            "payload": target_payload,
            "image_format": "image/png",
            "qr_base64": base64_str,
            "qr_data_uri": f"data:image/png;base64,{base64_str}"
        }


qr_code_service = QRCodeService()
