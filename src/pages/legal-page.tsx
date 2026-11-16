import { Link, useLocation } from 'react-router-dom';
import { Brand } from '../components/shared/brand';
import { ResponsiveShell } from '../components/shared/responsive-shell';
import { INDEMNITY_HTML, INDEMNITY_TITLE } from '../content/indemnity';
import { PRIVACY_HTML, PRIVACY_TITLE } from '../content/privacy';
import { TERMS_HTML, TERMS_TITLE } from '../content/terms';

const documents = {
  '/terms': { title: TERMS_TITLE, html: TERMS_HTML },
  '/privacy': { title: PRIVACY_TITLE, html: PRIVACY_HTML },
  '/indemnity': { title: INDEMNITY_TITLE, html: INDEMNITY_HTML },
} as const;

const prose =
  'text-sm leading-7 text-foreground [&_h3]:mt-8 [&_h3]:text-base [&_h3]:font-bold [&_h4]:mt-5 [&_h4]:text-sm [&_h4]:font-semibold [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol_ol]:list-[lower-alpha] [&_ol_ol_ol]:list-[lower-roman] [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5';

export function Component() {
  const { pathname } = useLocation();
  const document =
    documents[pathname as keyof typeof documents] ?? documents['/terms'];

  return (
    <ResponsiveShell>
      <main className="min-h-dvh bg-surface xl:min-h-[calc(100dvh-3rem)]">
        <header className="border-b border-border px-6 py-5 sm:px-8 xl:px-12">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <Link to="/">
              <Brand className="h-7 w-auto" />
            </Link>
            <Link
              className="text-sm font-semibold text-primary"
              to="/auth/sign-up"
            >
              Back to sign up
            </Link>
          </div>
        </header>
        <div className="mx-auto max-w-3xl px-6 py-10 sm:px-8 sm:py-14 xl:px-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Legal
          </p>
          <h1 className="mt-3 text-[1.75rem] font-bold leading-tight tracking-tight sm:text-[2rem]">
            {document.title}
          </h1>
          <p className="mt-3 text-sm text-muted">
            Canonical agreement for Pepsa customer accounts.
          </p>
          <article
            className={`mt-8 max-w-none ${prose}`}
            dangerouslySetInnerHTML={{ __html: document.html }}
          />
          <p className="mt-10 border-t border-border pt-8 text-sm text-muted">
            Continue to{' '}
            <Link className="font-semibold text-primary" to="/auth/sign-up">
              create an account
            </Link>{' '}
            or{' '}
            <Link className="font-semibold text-primary" to="/auth/login">
              sign in
            </Link>
            .
          </p>
        </div>
      </main>
    </ResponsiveShell>
  );
}