import { useRouter } from 'next/navigation';
import NProgress from 'nprogress';
import { useCallback, useTransition } from 'react';

export function useRouterWithProgress() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const push = useCallback(
    (href: string, options?: any) => {
      NProgress.start();
      startTransition(() => {
        router.push(href, options);
      });
      // NProgress.done() will be called when the transition completes
      setTimeout(() => {
        NProgress.done();
      }, 100);
    },
    [router],
  );

  const replace = useCallback(
    (href: string, options?: any) => {
      NProgress.start();
      startTransition(() => {
        router.replace(href, options);
      });
      setTimeout(() => {
        NProgress.done();
      }, 100);
    },
    [router],
  );

  const back = useCallback(() => {
    NProgress.start();
    startTransition(() => {
      router.back();
    });
    setTimeout(() => {
      NProgress.done();
    }, 100);
  }, [router]);

  const forward = useCallback(() => {
    NProgress.start();
    startTransition(() => {
      router.forward();
    });
    setTimeout(() => {
      NProgress.done();
    }, 100);
  }, [router]);

  const refresh = useCallback(() => {
    NProgress.start();
    startTransition(() => {
      router.refresh();
    });
    setTimeout(() => {
      NProgress.done();
    }, 100);
  }, [router]);

  return {
    push,
    replace,
    back,
    forward,
    refresh,
    prefetch: router.prefetch,
    isPending,
  };
}
