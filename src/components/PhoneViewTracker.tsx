'use client';

import { useEffect } from 'react';
import { trackPhoneView } from '@/lib/analytics';

export default function PhoneViewTracker({ deviceId }: { deviceId: string }) {
  useEffect(() => {
    trackPhoneView(deviceId);
  }, [deviceId]);

  return null;
}
