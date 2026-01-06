'use client';

import { useEffect } from 'react';
import NProgress from 'nprogress';

export function NProgressConfig() {
  useEffect(() => {
    NProgress.configure({
      showSpinner: true,
      minimum: 0.08,
      easing: 'ease',
      speed: 500,
    });
  }, []);

  return null;
}
