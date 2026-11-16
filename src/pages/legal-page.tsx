import { Link, useLocation } from 'react-router-dom';
import { Card } from '../components/ui';

const documents = {
  '/terms': {
    title: 'Terms and Conditions',
    url: import.meta.env.VITE_TERMS_URL ?? 'https://pepsabas.pepsa.co/terms',
  },
  '/privacy': {
    title: 'Privacy Policy',
    url: import.meta.env.VITE_PRIVACY_URL ?? 'https://pepsabas.pepsa.co/privacy',
  },
  '/indemnity': {
    title: 'Indemnity Agreement',
    url: import.meta.env.VITE_INDEMNITY_URL ?? 'https://pepsabas.pepsa.co/indemnity',
  },
} as const;

export function Component() {
  const { pathname } = useLocation();
  const document = documents[pathname as keyof typeof documents] ?? documents['/terms'];
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Card className="p-5 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Pepsa legal</p>
        <h1 className="mt-2 text-3xl font-semibold">{document.title}</h1>
        <p className="mt-3 text-muted">This is the canonical Pepsa document used across Customer and Business accounts.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a className="inline-flex min-h-12 items-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground" href={document.url} target="_blank" rel="noreferrer">Open full document</a>
          <Link className="inline-flex min-h-12 items-center rounded-xl border bg-surface px-5 py-3 text-sm font-semibold" to="/auth/sign-up">Return to sign up</Link>
        </div>
        <iframe className="mt-6 min-h-[70vh] w-full rounded-xl border" src={document.url} title={document.title} />
      </Card>
    </main>
  );
}
