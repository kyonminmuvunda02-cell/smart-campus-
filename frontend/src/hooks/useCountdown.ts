import { useState, useEffect, useRef } from 'react';

/**
 * Counts down from initialSeconds to 0, then fires onExpire.
 * The interval is cleaned up on unmount — important because the lecturer may
 * navigate away while the QR is still counting down.
 */
export function useCountdown(initialSeconds: number, onExpire: () => void) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpireRef.current();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timer);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  return secondsLeft;
}
