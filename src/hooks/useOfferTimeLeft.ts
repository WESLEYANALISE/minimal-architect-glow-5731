import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const OFFER_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const LAUNCH_DATE = new Date('2026-02-20T00:00:00Z');

export const useOfferTimeLeft = () => {
  const { user } = useAuth();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!user) return { offerActive: false, msLeft: 0 };

  const createdAt = new Date(user.created_at);
  const effectiveStart = new Date(Math.max(createdAt.getTime(), LAUNCH_DATE.getTime()));
  const offerEnd = effectiveStart.getTime() + OFFER_DURATION_MS;
  const msLeft = Math.max(0, offerEnd - now);
  return { offerActive: msLeft > 0, msLeft };
};
