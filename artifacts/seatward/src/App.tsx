import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
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
  const [, setLocation] = useLocation();

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
      setLocation(`/player?player=${encodeURIComponent(identifier.trim())}&mode=${mode}`);
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

type PlayerAction = 'games' | 'food' | 'staff' | 'terminal' | 'promo' | null;

function PlayerPage() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const player = params.get('player') || 'Guest player';
  const [seconds, setSeconds] = useState(53 * 60 + 18);
  const [terminal, setTerminal] = useState('PC-14');
  const [selection, setSelection] = useState('PC-08');
  const [action, setAction] = useState<PlayerAction>(null);
  const [notice, setNotice] = useState('');
  const [order, setOrder] = useState<string[]>([]);

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((remaining) => Math.max(0, remaining - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const clock = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const dismiss = () => { setAction(null); setNotice(''); };
  const menu = [
    { name: 'District fries', detail: 'Crisp shoestring fries · demo item', price: '$4.50' },
    { name: 'Midnight cola', detail: 'Chilled glass bottle · demo item', price: '$3.00' },
    { name: 'Spicy chicken wrap', detail: 'Grilled, house sauce · demo item', price: '$8.25' },
  ];

  return (
    <main className="player-shell">
      <section className="desktop-area" aria-label="Player desktop">
        <div className="wallpaper-art" aria-hidden="true">
          <img src="/windows-11-wallpaper.png" alt="" />
        </div>
        <div className="desktop-topline"><span className="desktop-seatward"><span className="seatward-mini"><i /><i /><i /><i /></span> Seatward preview</span><span className="desktop-demo-tag">LOCAL DEMO</span></div>
        <nav className="desktop-icons" aria-label="Desktop shortcuts">
          <button type="button" className="desktop-shortcut" onClick={() => setAction('games')} data-testid="button-games">
            <span className="desktop-app-icon icon-games" aria-hidden="true"><i /></span><span>Games</span>
          </button>
          <button type="button" className="desktop-shortcut" onClick={() => setAction('food')} data-testid="button-order-food">
            <span className="desktop-app-icon icon-food" aria-hidden="true"><i /></span><span>Order food</span>
          </button>
          <button type="button" className="desktop-shortcut" onClick={() => { setAction('staff'); setNotice('Demo only: a staff call has not been sent. Please speak to the venue team for real assistance.'); }} data-testid="button-call-staff">
            <span className="desktop-app-icon icon-help" aria-hidden="true"><i /></span><span>Call staff</span>
          </button>
          <button type="button" className="desktop-shortcut" onClick={() => setAction('terminal')} data-testid="button-switch-terminal">
            <span className="desktop-app-icon icon-terminal" aria-hidden="true"><i /></span><span>This PC</span>
          </button>
        </nav>
        <div className="desktop-taskbar">
          <div className="taskbar-dock" aria-label="Desktop taskbar">
            <span className="taskbar-start" aria-label="Start menu"><i /><i /><i /><i /></span>
            <span className="taskbar-search"><i aria-hidden="true" /> Search</span>
            <span className="taskbar-pin pin-files" aria-label="Files"><i /></span>
            <span className="taskbar-pin pin-browser" aria-label="Browser"><i /></span>
            <span className="taskbar-pin pin-store" aria-label="Apps"><i /></span>
            <span className="taskbar-pin pin-seatward" aria-label="Seatward"><i /><i /><i /><i /></span>
          </div>
          <div className="taskbar-clock"><strong>09:41</strong><span>Wednesday, 21 May</span></div>
        </div>
      </section>

      <aside className="player-panel" aria-label="Player session panel">
        <header className="player-panel-head">
          <Brand className="panel-brand" />
          <span className="live-indicator"><i /> SESSION LIVE</span>
        </header>
        <section className="session-status" aria-label="Session status">
          <div className="status-label">REMAINING SESSION</div>
          <div className="countdown" role="timer" aria-label={`${Math.floor(seconds / 60)} minutes ${seconds % 60} seconds remaining`} data-testid="status-countdown">{clock}</div>
          <div className="session-progress"><i style={{ transform: `scaleX(${seconds / (53 * 60 + 18)})` }} /></div>
          <p className="session-caption">Preview session · time updates locally</p>
        </section>
        <section className="player-identity">
          <span className="identity-label">ACTIVE PLAYER</span>
          <strong data-testid="text-active-player">{player}</strong>
          <span className="identity-terminal">TERMINAL <b data-testid="status-active-terminal">{terminal}</b></span>
        </section>

        <section className="quick-actions">
          <div className="section-heading"><span>QUICK ACCESS</span><span className="small-count">04</span></div>
          <button type="button" className="panel-action" onClick={() => setAction('games')} data-testid="panel-action-games"><span className="action-mark">01</span><span>Browse games</span><b aria-hidden="true">↗</b></button>
          <button type="button" className="panel-action" onClick={() => setAction('food')} data-testid="panel-action-food"><span className="action-mark">02</span><span>Order food</span><b aria-hidden="true">↗</b></button>
          <button type="button" className="panel-action" onClick={() => { setAction('staff'); setNotice('Demo only: a staff call has not been sent. Please speak to the venue team for real assistance.'); }} data-testid="panel-action-staff"><span className="action-mark">03</span><span>Call staff</span><b aria-hidden="true">↗</b></button>
          <button type="button" className="panel-action" onClick={() => setAction('terminal')} data-testid="panel-action-terminal"><span className="action-mark">04</span><span>Switch terminal</span><b aria-hidden="true">↗</b></button>
        </section>

        <section className="promo-card" aria-labelledby="promo-title">
          <div className="promo-art" aria-hidden="true"><span>ND</span><i /><b /></div>
          <div className="promo-copy"><span className="promo-kicker">THIS WEEK · PROMOTION</span><h2 id="promo-title">Night tournament</h2><p>Valorant brackets begin at 9 PM. Build your squad.</p>
            <button type="button" className="promo-cta" onClick={() => { setAction('promo'); setNotice('Demo interest noted locally. No registration was submitted.'); }} data-testid="button-promo-cta">View tournament details <span aria-hidden="true">→</span></button>
          </div>
        </section>
        <div className="player-footer">
          <span>LOCAL-ONLY DEMO · NO VENUE SERVICES</span>
          <button type="button" className="end-session" onClick={() => setLocation('/')} data-testid="button-end-session">End demo session <span aria-hidden="true">↗</span></button>
        </div>
      </aside>

      {action && <div className="player-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) dismiss(); }}>
        <section className="action-window" role="dialog" aria-modal="true" aria-labelledby="action-title" data-testid={`dialog-${action}`}>
          <header className="window-titlebar"><div><span className="window-mark"><i /><i /><i /><i /></span><span>Seatward · {action === 'food' ? 'Food menu' : action === 'terminal' ? 'Terminal settings' : action === 'staff' ? 'Help desk' : action === 'promo' ? 'Tournament details' : 'Game library'}</span></div><button type="button" onClick={dismiss} aria-label="Close window" data-testid="button-close-dialog">×</button></header>
          <div className="window-content">
            {action === 'games' && <><span className="eyebrow">AVAILABLE IN THIS DEMO</span><h2 id="action-title">Game library</h2><p className="window-intro">A local launcher preview. Selecting a game will not launch software on this device.</p><div className="game-list">{[['VALORANT','Tactical · 5v5'],['Counter-Strike 2','Competitive · 5v5'],['Apex Legends','Squad · Battle royale']].map(([name, kind], index) => <div className="game-row" key={name}><span className="game-number">0{index + 1}</span><div><strong>{name}</strong><small>{kind}</small></div><span className="demo-label">DEMO LIST</span></div>)}</div><p className="inline-confirm" role="status">Games are listed for preview only; no game has been launched.</p></>}
            {action === 'food' && <><span className="eyebrow">DEMO MENU · NO REAL ORDER</span><h2 id="action-title">A little fuel.</h2><p className="window-intro">Add items to a sample order. Nothing will be sent to the venue.</p><div className="food-list">{menu.map((item) => <div className="food-row" key={item.name}><div><strong>{item.name}</strong><small>{item.detail}</small></div><div className="food-buy"><b>{item.price}</b><button type="button" onClick={() => setOrder((items) => [...items, item.name])} data-testid={`button-add-${item.name.toLowerCase().replaceAll(' ', '-')}`}>Add</button></div></div>)}</div><div className="sample-order"><strong>Demo order <span>{order.length} {order.length === 1 ? 'item' : 'items'}</span></strong>{order.length ? <p role="status" data-testid="status-demo-order">{order.join(' · ')}</p> : <p>No items yet. Add one to see it here.</p>}<small>Local sample only · not submitted</small></div></>}
            {action === 'staff' && <><span className="eyebrow">HELP DESK · PREVIEW</span><h2 id="action-title">Need a hand?</h2><p className="window-intro">This control cannot notify venue staff. For real assistance, speak with the Neon District team on site.</p><div className="confirmation-box" role="status" data-testid="status-staff-demo"><span className="confirmation-symbol">i</span><div><strong>Local demo confirmation</strong><p>{notice || 'No staff notification has been sent.'}</p></div></div><button className="window-primary" type="button" onClick={() => setNotice('Thanks for checking in. This confirmation exists only in this preview; no staff member was contacted.')} data-testid="button-confirm-staff">Show demo confirmation</button></>}
            {action === 'terminal' && <><span className="eyebrow">SESSION CONTROLS · LOCAL ONLY</span><h2 id="action-title">Choose a terminal</h2><p className="window-intro">Preview a terminal change. This does not provision or move a real session.</p><label className="terminal-select-label" htmlFor="terminal-choice">AVAILABLE DEMO TERMINALS</label><select id="terminal-choice" value={selection} onChange={(event) => setSelection(event.target.value)} data-testid="select-terminal"><option>PC-08</option><option>PC-11</option><option>PC-14</option><option>PC-22</option></select><button className="window-primary" type="button" onClick={() => { setTerminal(selection); setNotice(`Demo terminal set to ${selection}. No hardware or session was changed.`); }} data-testid="button-apply-terminal">Apply demo terminal</button>{notice && <p className="inline-confirm" role="status" data-testid="status-terminal-demo">{notice}</p>}</>}
            {action === 'promo' && <><span className="eyebrow">NEON DISTRICT · THIS WEEK</span><h2 id="action-title">Night tournament</h2><p className="window-intro">The lights go down at 9 PM. Valorant brackets are open to teams of five, with a place for solo players looking to join a squad.</p><div className="promo-detail"><span>STARTS</span><strong>Tonight · 9:00 PM</strong><span>FORMAT</span><strong>5v5 · Double elimination</strong><span>ENTRY</span><strong>Ask at the venue desk</strong></div><div className="confirmation-box" role="status" data-testid="status-promo-demo"><span className="confirmation-symbol">i</span><div><strong>Demo interest noted</strong><p>{notice || 'This CTA is local-only. No registration was submitted.'}</p></div></div></>}
          </div>
        </section>
      </div>}
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
        <Route path="/player" component={PlayerPage} />
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
