// App-level types extending the generated client types.
// DO NOT put these in src/client/ — that folder is overwritten by generate-client.

import type { AttendanceSessionResponse, QrCodeResponse } from '../client/types.gen';

/** A session with its latest QR data attached by the frontend. */
export interface SessionWithQR extends AttendanceSessionResponse {
  qr: QrCodeResponse;
}
