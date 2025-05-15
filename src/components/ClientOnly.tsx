
'use client';

import { useState, useEffect, type ReactNode } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
}

export function ClientOnly({ children }: ClientOnlyProps): ReactNode | null {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null; // Or a loading spinner, or fallback UI
  }

  return <>{children}</>;
}
