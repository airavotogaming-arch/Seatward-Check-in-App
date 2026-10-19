import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { ChevronRight, Gamepad2, Headphones, LockKeyhole, LogOut, Monitor, Settings, Utensils, Users } from 'lucide-react';
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

type PlayerAction = 'games' | 'food' | 'staff' | 'terminal' | 'promo' | 'open' | 'lock' | 'settings' | null;

function PlayerPage() {
  const [, setLocation] = useLocation();
  const player = new URLSearchParams(window.location.search).get('player') || 'Guest player';
  const [seconds, setSeconds] = useState(53 * 60 + 18);
  const [terminal, setTerminal] = useState('PC-14');
  const [selection, setSelection] = useState('PC-08');
  const [action, setAction] = useState<PlayerAction>(null);
  const [notice, setNotice] = useState('');
  const [order, setOrder] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);

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
  const players = [
    { name: player, game: 'Playing Valorant', avatar: 'rohan', status: 'online', badge: 'V', tone: 'valorant' },
    { name: 'Sahil_xD', game: 'Playing FIFA 24', avatar: 'sahil', status: 'online', badge: 'EA', tone: 'fifa' },
    { name: 'AyanPlayz', game: 'Playing GTA V', avatar: 'ayan', status: 'online', badge: 'GTA', tone: 'gta' },
    { name: 'PriyaGaming', game: 'Idle', avatar: 'priya', status: 'idle', badge: 'D', tone: 'discord' },
    { name: 'Devil_king', game: 'Playing CS2', avatar: 'devil', status: 'online', badge: 'CS2', tone: 'cs' },
    { name: 'Kartik_12', game: 'Offline', avatar: 'kartik', status: 'offline', badge: 'S', tone: 'steam' },
    { name: 'Neel.exe', game: 'Playing Valorant', avatar: 'rohan', status: 'online', badge: 'V', tone: 'valorant' },
    { name: 'MiraV', game: 'Playing FIFA 24', avatar: 'priya', status: 'online', badge: 'EA', tone: 'fifa' },
    { name: 'ArjunRush', game: 'Idle', avatar: 'ayan', status: 'idle', badge: 'G', tone: 'discord' },
    { name: 'Zenith_3', game: 'Playing CS2', avatar: 'sahil', status: 'online', badge: 'CS', tone: 'cs' },
  ];
  const dialogTitle = action === 'food' ? 'Food menu' : action === 'terminal' ? 'Switch terminal' : action === 'staff' ? 'Help desk' : action === 'promo' ? 'Tournament details' : action === 'open' ? 'Open terminal' : action === 'lock' ? 'Lock PC' : action === 'settings' ? 'Settings preview' : 'Game library';

  return (
    <main className="player-shell">
      <section className="desktop-area" aria-label="Player desktop">
        <div className="wallpaper-art" aria-hidden="true"><img src="/windows-11-gaming-desktop.webp" alt="" /></div>
      </section>
      <aside className="player-panel" aria-label="Player session panel">
        <header className="player-panel-head">
          <div className="seatward-lockup"><span className="gamepad-mark" aria-hidden="true"><Gamepad2 size={22} strokeWidth={2.4} /></span><div><Brand className="panel-brand" /><small>GAMING LOUNGE</small></div></div>
          <div className="window-controls"><button type="button" aria-label="Minimize panel" onClick={() => setNotice('Seatward stays open in this local preview.')}>−</button><button type="button" aria-label="Close panel" onClick={() => setNotice('Use Logout to end your local demo session.')}>×</button></div>
        </header>
        <div className="session-summary">
          <section className="active-player-card" aria-label="Active player">
            <img src="/avatars/rohan.webp" alt="" />
            <div className="active-copy"><strong data-testid="text-active-player">{player}</strong><span><i /> Online</span></div>
            <div className="terminal-chip"><Monitor size={14} strokeWidth={1.8} aria-hidden="true" /><span data-testid="status-active-terminal">{terminal}<small>In Use</small></span></div>
          </section>
          <div className="session-clock"><span>SESSION TIME</span><strong role="timer" aria-label={`${Math.floor(seconds / 60)} minutes ${seconds % 60} seconds remaining`} data-testid="status-countdown">{clock}</strong><small>remaining</small></div>
        </div>
        <section className="roster-section">
          <div className="roster-heading"><h2><Users className="people-icon" size={14} strokeWidth={2} aria-hidden="true" /> Players <small>(6/10)</small></h2><button type="button" onClick={() => setShowAll((value) => !value)} aria-expanded={showAll} data-testid="button-view-all">{showAll ? 'Show Less' : 'View All'}</button></div>
          <div className="roster-list">
            {players.slice(0, showAll ? 10 : 6).map((person) => <div className={`roster-row ${person.status}`} key={person.name} data-testid={`player-row-${person.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
              <img src={`/avatars/${person.avatar}.webp`} alt="" />
              <div className="roster-copy"><strong>{person.name}</strong><span><i />{person.game}</span></div>
              <span className={`game-badge ${person.tone}`} aria-label={person.game}>{person.badge}</span>
            </div>)}
          </div>
        </section>
        <section className="action-grid" aria-label="Quick actions">
          <button type="button" className="action-tile" onClick={() => setAction('food')} data-testid="button-order-food"><span className="tile-icon"><Utensils size={18} strokeWidth={2} /></span><strong>Order Food</strong><small>Snacks · Drinks · Meals</small><b aria-hidden="true"><ChevronRight size={15} /></b></button>
          <button type="button" className="action-tile" onClick={() => setAction('terminal')} data-testid="button-switch-terminal"><span className="tile-icon"><Gamepad2 size={18} strokeWidth={2} /></span><strong>Switch Terminal</strong><small>Change PC / PS5</small><b aria-hidden="true"><ChevronRight size={15} /></b></button>
          <button type="button" className="action-tile" onClick={() => { setAction('open'); setNotice('This local preview cannot open or control applications on the host PC.'); }} data-testid="button-open-terminal"><span className="tile-icon"><Monitor size={18} strokeWidth={2} /></span><strong>Open Terminal</strong><small>Access your PC</small><b aria-hidden="true"><ChevronRight size={15} /></b></button>
          <button type="button" className="action-tile" onClick={() => { setAction('lock'); setNotice('Your demo session remains unlocked. Host controls are never changed.'); }} data-testid="button-lock-pc"><span className="tile-icon"><LockKeyhole size={18} strokeWidth={2} /></span><strong>Lock PC</strong><small>Secure your session</small><b aria-hidden="true"><ChevronRight size={15} /></b></button>
        </section>
        <button type="button" className="food-promo" onClick={() => setAction('food')} data-testid="button-food-promo" aria-label="Hungry? Order food now and get it at your desk">
          <span className="food-promo-copy"><strong>Hungry?</strong><small>Order food now and get it<br />at your desk!</small></span><img src="/food-promo.webp" alt="" /><span className="food-arrow" aria-hidden="true"><ChevronRight size={18} /></span>
        </button>
        <nav className="quick-links" aria-label="Quick links">
          <span className="quick-links-label">Quick Links</span>
          <div>
            <button type="button" onClick={() => setAction('games')} data-testid="button-games"><span aria-hidden="true"><Gamepad2 size={16} /></span>Games</button>
            <button type="button" onClick={() => setAction('settings')} data-testid="button-settings"><span aria-hidden="true"><Settings size={16} /></span>Settings</button>
            <button type="button" onClick={() => { setAction('staff'); setNotice('Demo only: a staff call has not been sent. Please speak to the venue team for real assistance.'); }} data-testid="button-support"><span aria-hidden="true"><Headphones size={16} /></span>Support</button>
            <button type="button" onClick={() => setLocation('/')} data-testid="button-logout"><span aria-hidden="true"><LogOut size={16} /></span>Logout</button>
          </div>
        </nav>
      </aside>
      {action && <div className="player-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) dismiss(); }}>
        <section className="action-window" role="dialog" aria-modal="true" aria-labelledby="action-title" data-testid={`dialog-${action}`}>
          <header className="window-titlebar"><div><span className="window-mark"><i /><i /><i /><i /></span><span>Seatward · {dialogTitle}</span></div><button type="button" onClick={dismiss} aria-label="Close window" data-testid="button-close-dialog">×</button></header>
          <div className="window-content">
            {action === 'games' && <><span className="eyebrow">AVAILABLE IN THIS DEMO</span><h2 id="action-title">Game library</h2><p className="window-intro">A local launcher preview. Selecting a game will not launch software on this device.</p><div className="game-list">{[['VALORANT','Tactical · 5v5'],['Counter-Strike 2','Competitive · 5v5'],['Apex Legends','Squad · Battle royale']].map(([name, kind], index) => <div className="game-row" key={name}><span className="game-number">0{index + 1}</span><div><strong>{name}</strong><small>{kind}</small></div><span className="demo-label">DEMO LIST</span></div>)}</div><p className="inline-confirm" role="status">Games are listed for preview only; no game has been launched.</p></>}
            {action === 'food' && <><span className="eyebrow">DEMO MENU · NO REAL ORDER</span><h2 id="action-title">A little fuel.</h2><p className="window-intro">Add items to a sample order. Nothing will be sent to the venue.</p><div className="food-list">{menu.map((item) => <div className="food-row" key={item.name}><div><strong>{item.name}</strong><small>{item.detail}</small></div><div className="food-buy"><b>{item.price}</b><button type="button" onClick={() => setOrder((items) => [...items, item.name])} data-testid={`button-add-${item.name.toLowerCase().replaceAll(' ', '-')}`}>Add</button></div></div>)}</div><div className="sample-order"><strong>Demo order <span>{order.length} {order.length === 1 ? 'item' : 'items'}</span></strong>{order.length ? <p role="status" data-testid="status-demo-order">{order.join(' · ')}</p> : <p>No items yet. Add one to see it here.</p>}<small>Local sample only · not submitted</small></div></>}
            {action === 'staff' && <><span className="eyebrow">HELP DESK · PREVIEW</span><h2 id="action-title">Need a hand?</h2><p className="window-intro">This control cannot notify venue staff. For real assistance, speak with the venue team on site.</p><div className="confirmation-box" role="status" data-testid="status-staff-demo"><span className="confirmation-symbol">i</span><div><strong>Local demo confirmation</strong><p>{notice || 'No staff notification has been sent.'}</p></div></div><button className="window-primary" type="button" onClick={() => setNotice('Thanks for checking in. This confirmation exists only in this preview; no staff member was contacted.')} data-testid="button-confirm-staff">Show demo confirmation</button></>}
            {action === 'terminal' && <><span className="eyebrow">SESSION CONTROLS · LOCAL ONLY</span><h2 id="action-title">Choose a terminal</h2><p className="window-intro">Preview a terminal change. This does not provision or move a real session.</p><label className="terminal-select-label" htmlFor="terminal-choice">AVAILABLE DEMO TERMINALS</label><select id="terminal-choice" value={selection} onChange={(event) => setSelection(event.target.value)} data-testid="select-terminal"><option>PC-08</option><option>PC-11</option><option>PC-14</option><option>PC-22</option></select><button className="window-primary" type="button" onClick={() => { setTerminal(selection); setNotice(`Demo terminal set to ${selection}. No hardware or session was changed.`); }} data-testid="button-apply-terminal">Apply demo terminal</button>{notice && <p className="inline-confirm" role="status" data-testid="status-terminal-demo">{notice}</p>}</>}
            {action === 'promo' && <><span className="eyebrow">LOUNGE · THIS WEEK</span><h2 id="action-title">Night tournament</h2><p className="window-intro">Valorant brackets are open to teams of five, with a place for solo players looking to join a squad.</p><div className="promo-detail"><span>STARTS</span><strong>Tonight · 9:00 PM</strong><span>FORMAT</span><strong>5v5 · Double elimination</strong><span>ENTRY</span><strong>Ask at the venue desk</strong></div></>}
            {(action === 'open' || action === 'lock') && <><span className="eyebrow">LOCAL SESSION CONTROL</span><h2 id="action-title">{action === 'open' ? 'Terminal access' : 'Session security'}</h2><p className="window-intro">{notice}</p><div className="confirmation-box" role="status"><span className="confirmation-symbol">i</span><div><strong>{action === 'open' ? 'Local preview only' : 'No device changes'}</strong><p>{action === 'open' ? `Your active terminal is ${terminal}. Seatward will not launch applications or control the host machine.` : 'The lock action is simulated here. Your session remains available and your PC is untouched.'}</p></div></div><button className="window-primary" type="button" onClick={dismiss}>Got it</button></>}
            {action === 'settings' && <><span className="eyebrow">LOCAL PREVIEW SETTINGS</span><h2 id="action-title">Your session</h2><p className="window-intro">A quick look at the preferences available in the lounge demo.</p><div className="settings-preview"><span>Interface theme</span><strong>Midnight blue</strong><span>Session notifications</span><strong>On · local only</strong><span>Active terminal</span><strong>{terminal}</strong></div><button className="window-primary" type="button" onClick={dismiss}>Done</button></>}
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
