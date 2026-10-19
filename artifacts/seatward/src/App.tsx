import { useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Link,
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Brand({ className = '' }: { className?: string }) {
  return (
    <div className={`brand ${className}`} aria-label="Seatward">
      <span className="brand-mark" aria-hidden="true">
        <i /><i /><i /><i />
      </span>
      <span>Seatward<span className="brand-dot">.</span></span>
    </div>
  );
}

function SignalDots() {
  return <span className="signal-dots" aria-hidden="true"><i /><i /><i /></span>;
}

function SessionPage() {
  const [mode, setMode] = useState<'member' | 'voucher'>('member');
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [errors, setErrors] = useState<{ identifier?: string; pin?: string }>({});
  const [message, setMessage] = useState('');

  function changeMode(next: 'member' | 'voucher') {
    setMode(next);
    setIdentifier('');
    setPin('');
    setErrors({});
    setMessage('');
  }

  function submitSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: { identifier?: string; pin?: string } = {};
    if (!identifier.trim()) {
      nextErrors.identifier = mode === 'member' ? 'Enter your member username.' : 'Enter your voucher code.';
    }
    if (!pin.trim()) nextErrors.pin = 'Enter your PIN.';
    else if (!/^\d{4,8}$/.test(pin.trim())) nextErrors.pin = 'Use 4 to 8 digits.';
    setErrors(nextErrors);
    setMessage('');
    if (Object.keys(nextErrors).length === 0) {
      setMessage('Details are ready. This preview does not connect to venue accounts.');
    }
  }

  return (
    <main className="seatward-shell session-shell">
      <Link href="/" className="session-brand brand-link" aria-label="Seatward home" data-testid="link-seatward-home">
        <Brand />
      </Link>
      <div className="session-layout">
        <section className="venue-note" aria-label="Neon District information">
          <div className="welcome-line" data-testid="text-welcome">
            Welcome to Neon District. Sign in or redeem a voucher to begin.
          </div>
          <div className="venue-item">
            <span className="venue-number">/01</span>
            <div>
              <strong>Night tournament</strong>
              <p>Valorant brackets begin at 9 PM. Ask the desk to register your team.</p>
            </div>
          </div>
          <div className="venue-item">
            <span className="venue-number">/02</span>
            <div>
              <strong>Member rates</strong>
              <p>Top up your balance at the counter and keep your member rate on every session.</p>
            </div>
          </div>
          <Link href="/activate" className="back-link" data-testid="link-terminal-activation">Terminal setup <span aria-hidden="true">↗</span></Link>
        </section>

        <section className="panel-card session-card" aria-labelledby="session-title">
          <div className="card-meta"><span>PC-14 · NEON DISTRICT</span><SignalDots /></div>
          <div className="card-content">
            <h1 id="session-title">Start a session</h1>
            <div className="switcher" role="group" aria-label="Sign-in type">
              <button type="button" aria-pressed={mode === 'member'} onClick={() => changeMode('member')} data-testid="button-member-mode">MEMBER</button>
              <button type="button" aria-pressed={mode === 'voucher'} onClick={() => changeMode('voucher')} data-testid="button-voucher-mode">VOUCHER</button>
            </div>
            <form onSubmit={submitSession} noValidate>
              <div className="field">
                <label htmlFor="identity">{mode === 'member' ? 'USERNAME' : 'VOUCHER CODE'}</label>
                <input
                  id="identity"
                  name="identity"
                  autoComplete="username"
                  placeholder={mode === 'member' ? 'ravi.kumar' : 'Enter voucher code'}
                  value={identifier}
                  aria-invalid={Boolean(errors.identifier)}
                  aria-describedby={errors.identifier ? 'identity-error' : undefined}
                  onChange={(event) => { setIdentifier(event.target.value); setErrors((current) => ({ ...current, identifier: undefined })); setMessage(''); }}
                  data-testid="input-identity"
                />
                {errors.identifier && <p className="field-error" id="identity-error" role="alert">{errors.identifier}</p>}
              </div>
              <div className="field">
                <label htmlFor="pin">PIN</label>
                <input
                  id="pin"
                  name="pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="current-password"
                  placeholder="Enter PIN"
                  value={pin}
                  aria-invalid={Boolean(errors.pin)}
                  aria-describedby={errors.pin ? 'pin-error' : undefined}
                  onChange={(event) => { setPin(event.target.value.replace(/\D/g, '').slice(0, 8)); setErrors((current) => ({ ...current, pin: undefined })); setMessage(''); }}
                  data-testid="input-pin"
                />
                {errors.pin && <p className="field-error" id="pin-error" role="alert">{errors.pin}</p>}
              </div>
              <button type="submit" className="submit-button" data-testid="button-start-session">
                {mode === 'member' ? 'LOG IN' : 'REDEEM VOUCHER'} <span aria-hidden="true">→</span>
              </button>
              {message && <p className="local-message" role="status" data-testid="status-session-preview">{message}</p>}
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

function ActivationPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function submitActivation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      setError(code.length === 0 ? 'Enter the six-character administrator code.' : 'Use exactly six letters or numbers.');
      setMessage('');
      return;
    }
    setError('');
    setMessage('Code format accepted. This preview does not verify or pair a terminal.');
  }

  return (
    <main className="seatward-shell activate-layout">
      <aside className="activate-side">
        <Link href="/" className="brand-link" aria-label="Seatward check-in" data-testid="link-seatward-home">
          <Brand />
        </Link>
        <div className="side-index" aria-hidden="true">01</div>
      </aside>
      <section className="activate-main">
        <div className="panel-card activate-card">
          <div className="card-meta"><span>TERMINAL · UNPAIRED</span><SignalDots /></div>
          <div className="card-content">
            <h1>Activate terminal</h1>
            <p className="intro-copy">Enter the six-character code from the admin dashboard.</p>
            <form onSubmit={submitActivation} noValidate>
              <div className="field activation-field">
                <label htmlFor="activation-code">ONE-TIME CODE</label>
                <input
                  id="activation-code"
                  className="activation-input"
                  name="activation-code"
                  autoComplete="one-time-code"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={6}
                  placeholder="N7K4Q2"
                  value={code}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'activation-error' : 'activation-hint'}
                  onChange={(event) => { setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)); setError(''); setMessage(''); }}
                  data-testid="input-activation-code"
                />
                {error && <p className="field-error" id="activation-error" role="alert">{error}</p>}
              </div>
              <button type="submit" className="submit-button" data-testid="button-activate-terminal">
                ACTIVATE TERMINAL <span aria-hidden="true">→</span>
              </button>
              {message ? (
                <p className="local-message" role="status" data-testid="status-activation-preview">{message}</p>
              ) : (
                <p className="helper-copy" id="activation-hint">No code? Ask a floor administrator to generate one for this machine.</p>
              )}
            </form>
            <Link href="/" className="back-link" data-testid="link-back-checkin">← Back to check-in</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function NotFound() {
  return <main className="not-found"><p>That page isn't on this terminal. <Link href="/">Return to check-in</Link></p></main>;
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={SessionPage} />
        <Route path="/activate" component={ActivationPage} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
