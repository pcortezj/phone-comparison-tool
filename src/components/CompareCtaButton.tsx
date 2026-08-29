'use client';

import Link from 'next/link';
import { trackCompareClicked } from '@/lib/analytics';

export default function CompareCtaButton({
  deviceId,
  href,
  className,
  children,
}: {
  deviceId: string;
  href: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={className} onClick={() => trackCompareClicked(deviceId)}>
      {children}
    </Link>
  );
}
