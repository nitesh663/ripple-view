import type { PropsWithChildren } from 'react';

export function RippleViewForm({ children }: PropsWithChildren) {
  return <form className="rv-form">{children}</form>;
}
