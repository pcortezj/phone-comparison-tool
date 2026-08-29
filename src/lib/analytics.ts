'use client';

import { track } from '@vercel/analytics';

export const trackPhoneView = (deviceId: string) => track('phone_view', { deviceId });

export const trackCompareClicked = (deviceId: string) => track('compare_clicked', { deviceId });

export const trackAffiliateClick = (deviceId: string, retailer: string) =>
  track('affiliate_click', { deviceId, retailer });

export const trackPhoneAiRequest = (deviceId: string) => track('phone_ai_request', { deviceId });
