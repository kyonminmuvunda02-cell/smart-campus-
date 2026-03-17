import qrcode
import io
import base64
import json
from datetime import datetime


class QRCodeService:

    @staticmethod
    def generate_qr_image(session_id: int, qr_uuid: str, expiry: datetime) -> str:
        """Generate a time-limited QR code and return it as a base64-encoded PNG.

        The QR encodes a JSON payload so the frontend can display expiry info
        and the backend can validate the session_id + UUID pair on check-in.

        Args:
            session_id: The AttendanceSession.session_id.
            qr_uuid: UUID string from AttendanceSession.qr_code.
            expiry: When this QR code becomes invalid.

        Returns:
            Base64-encoded PNG string.
            Frontend displays it as: <img src="data:image/png;base64,{result}" />
        """
        payload = json.dumps({
            "session_id": session_id,
            "qr_code": qr_uuid,
            "expires_at": expiry.isoformat(),
        })

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=4,
        )
        qr.add_data(payload)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")

        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        return base64.b64encode(buffer.read()).decode("utf-8")
