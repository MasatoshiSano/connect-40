import { useState, useEffect, useRef } from 'react';
import { fetchInterestPhotos } from '../utils/interestPhoto';

export function useInterestPhotos(interests: string[]): Map<string, string> {
  const [photos, setPhotos] = useState<Map<string, string>>(new Map());
  const interestsKey = interests.join(',');
  const prevKey = useRef('');

  useEffect(() => {
    if (interestsKey === prevKey.current || interests.length === 0) return;
    prevKey.current = interestsKey;

    let cancelled = false;

    fetchInterestPhotos(interests).then((result) => {
      if (!cancelled) {
        setPhotos(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [interestsKey, interests]);

  return photos;
}
