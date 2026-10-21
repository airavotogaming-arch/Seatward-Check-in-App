import { useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { CalendarDays, ChartNoAxesColumnIncreasing, ChevronRight, Gamepad2, Headphones, Home, LockKeyhole, LogOut, Monitor, Search, Send, Settings, Utensils, Users } from 'lucide-react';
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
const demoAvatars = Array.from({ length: 50 }, (_, index) => {
  const number = String(index + 1).padStart(2, '0');
  return { id: `avatar-${number}`, name: number, src: `/avatars/airavoto-${number}.webp` };
});
const demoRates = { memberHourly: 6, walkInHourly: 8 };
const dashboardAds = [
  { id: 'night-combo', eyebrow: "TONIGHT'S PICK", title: 'Night Combo', subtitle: 'PC + Snacks + Drink', price: '₹ 499', image: '/airavoto-ad-food.webp', action: 'food' },
  { id: 'snack-break', eyebrow: 'SESSION BREAK', title: 'Snack Break', subtitle: 'Quick bites for your next match', price: '₹ 199', image: '/food-promo.webp', action: 'food' },
  { id: 'gear-up', eyebrow: 'DEMO GEAR OFFER', title: 'Gear Up', subtitle: 'Level up with lounge gaming gear', price: 'From ₹ 799', image: '/airavoto-ad-gear.webp', action: 'promo' },
  { id: 'neon-clash', eyebrow: 'LOUNGE TOURNAMENT', title: 'Neon Clash', subtitle: 'Join this week’s gaming challenge', price: '₹ 99 entry', image: '/airavoto-ad-tournament.webp', action: 'promo' },
  { id: 'play-more', eyebrow: 'MEMBER DEMO OFFER', title: 'Play More', subtitle: 'Ask the counter about session deals', price: 'VIEW OFFER', image: '/lock-pc-art.webp', action: 'promo' },
] as const;
const demoPcSpecs = [
  { label: 'PROCESSOR', value: 'Intel Core i5-12400F · 6 cores / 12 threads' },
  { label: 'GPU', value: 'NVIDIA GeForce RTX 4060 · 8 GB' },
  { label: 'RAM', value: '16 GB DDR4 · 3200 MT/s' },
  { label: 'STORAGE', value: '1 TB NVMe SSD' },
  { label: 'MONITOR', value: '24″ · 1080p · 165 Hz' },
];
function formatPrice(amount: number) {
  return `$${amount.toFixed(2)}`;
}
function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes} min`;
  if (remainingMinutes === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
  return `${hours} hr ${remainingMinutes} min`;
}

function formatElapsedTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return [
    ...(hours > 0 ? [`${hours} hr`] : []),
    ...(minutes > 0 || hours > 0 ? [`${minutes} min`] : []),
    `${seconds} sec`,
  ].join(' ');
}

function Brand({ className = '' }: { className?: string }) {
  return (
    <div className={`brand ${className}`} aria-label="Airavoto Gaming">
      <img className="brand-logo" src="/airavoto-logo.png" alt="" aria-hidden="true" />
      <span>Airavoto<span className="brand-dot">.</span></span>
    </div>
  );
}

function SignalDots() {
  return <span className="signal-dots" aria-hidden="true"><i /><i /><i /></span>;
}

function SessionPage() {
  const [mode, setMode] = useState<'member' | 'voucher' | 'walkin'>('member');
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [walkinDuration, setWalkinDuration] = useState(60);
  const [errors, setErrors] = useState<{ identifier?: string; pin?: string }>({});
  const [message, setMessage] = useState('');
  const [avatarStep, setAvatarStep] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('avatar-01');
  const [, setLocation] = useLocation();

  function changeMode(next: 'member' | 'voucher' | 'walkin') {
    setMode(next);
    setIdentifier('');
    setPin('');
    setErrors({});
    setMessage('');
    setAvatarStep(false);
  }

  function submitSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: { identifier?: string; pin?: string } = {};
    if (!identifier.trim()) {
      nextErrors.identifier = mode === 'member' ? 'Enter your member username.' : mode === 'voucher' ? 'Enter your voucher code.' : 'Enter the player name.';
    }
    if (mode !== 'walkin') {
      if (!pin.trim()) nextErrors.pin = 'Enter your PIN.';
      else if (!/^\d{4,8}$/.test(pin.trim())) nextErrors.pin = 'Use 4 to 8 digits.';
    }
    setErrors(nextErrors);
    setMessage('');
    if (Object.keys(nextErrors).length === 0) {
      setMessage(mode === 'walkin' ? 'Walk-in ready. Choose an avatar to continue.' : 'Demo sign-in accepted. Choose an avatar to continue.');
      setAvatarStep(true);
    }
  }

  function enterLounge() {
    const durationQuery = mode === 'walkin' ? `&duration=${walkinDuration}` : '';
    setLocation(`/player?player=${encodeURIComponent(identifier.trim())}&mode=${mode}&avatar=${selectedAvatar}${durationQuery}`);
  }

  return (
    <main className="seatward-shell session-shell">
      <Link href="/" className="session-brand brand-link" aria-label="Airavoto home" data-testid="link-seatward-home">
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
            <h1 id="session-title">{avatarStep ? 'Choose your avatar' : 'Start a session'}</h1>
            {avatarStep ? (
              <section className="avatar-step" aria-label="Choose your player avatar">
                <p className="avatar-welcome"><span>{mode === 'walkin' ? 'WALK-IN READY' : 'DEMO SIGN-IN ACCEPTED'}</span>Welcome, <strong>{identifier.trim()}</strong>. Choose an avatar for your {mode === 'walkin' ? 'Walk-in ' : ''}session.</p>
                <div className="avatar-choice-grid" role="group" aria-label="Choose an avatar">
                  {demoAvatars.map((avatar) => <button key={avatar.id} type="button" className="avatar-choice" aria-label={`Select avatar ${avatar.name}`} aria-pressed={selectedAvatar === avatar.id} onClick={() => setSelectedAvatar(avatar.id)} data-testid={`button-avatar-${avatar.id}`}><img src={avatar.src} alt="" /><span>{avatar.name}</span></button>)}
                </div>
                <button type="button" className="submit-button avatar-continue" onClick={enterLounge} data-testid="button-enter-lounge">ENTER LOUNGE <span aria-hidden="true">→</span></button>
                <button type="button" className="avatar-back" onClick={() => setAvatarStep(false)}>Back to sign in</button>
              </section>
            ) : <>
            <div className="switcher" role="group" aria-label="Sign-in type">
              <button type="button" aria-pressed={mode === 'member'} onClick={() => changeMode('member')} data-testid="button-member-mode">MEMBER</button>
              <button type="button" aria-pressed={mode === 'voucher'} onClick={() => changeMode('voucher')} data-testid="button-voucher-mode">VOUCHER</button>
              <button type="button" aria-pressed={mode === 'walkin'} onClick={() => changeMode('walkin')} data-testid="button-walkin-mode">WALK IN</button>
            </div>
            <div className="identity-preview" aria-live="polite">
              <img src={demoAvatars.find((avatar) => avatar.id === selectedAvatar)?.src ?? demoAvatars[0].src} alt="" />
              <span><small>PLAYER PREVIEW</small><strong>{identifier.trim() || 'Your name will appear here'}</strong></span>
            </div>
            {mode !== 'voucher' && <div className={`pricing-preview ${mode === 'walkin' ? 'walkin' : 'member'}`} data-testid="pricing-preview">
              <div><span>{mode === 'walkin' ? 'WALK-IN TOTAL · DEMO' : 'MEMBER RATE · DEMO'}</span><strong>{mode === 'walkin' ? formatPrice(walkinDuration / 60 * demoRates.walkInHourly) : `${formatPrice(demoRates.memberHourly)} / hr`}</strong></div>
              <small>{mode === 'walkin' ? `${formatDuration(walkinDuration)} × ${formatPrice(demoRates.walkInHourly)} / hr` : <><del>{formatPrice(demoRates.walkInHourly)} / hr</del> Save {formatPrice(demoRates.walkInHourly - demoRates.memberHourly)} per hour</>}</small>
            </div>}
            <form onSubmit={submitSession} noValidate>
              <div className="field">
                  <label htmlFor="identity">{mode === 'member' ? 'USERNAME' : mode === 'voucher' ? 'VOUCHER CODE' : 'PLAYER NAME'}</label>
                  <input
                    id="identity"
                    name="identity"
                    autoComplete={mode === 'walkin' ? 'name' : 'username'}
                    placeholder={mode === 'member' ? 'ravi.kumar' : mode === 'voucher' ? 'Enter voucher code' : 'Enter player name'}
                  value={identifier}
                  aria-invalid={Boolean(errors.identifier)}
                  aria-describedby={errors.identifier ? 'identity-error' : undefined}
                  onChange={(event) => { setIdentifier(event.target.value); setErrors((current) => ({ ...current, identifier: undefined })); setMessage(''); }}
                  data-testid="input-identity"
                />
                {errors.identifier && <p className="field-error" id="identity-error" role="alert">{errors.identifier}</p>}
              </div>
              {mode === 'walkin' ? <section className="duration-picker" aria-label="Choose walk-in session duration">
                <div className="duration-picker-heading"><span>SESSION DURATION</span></div>
                <div className="duration-stepper">
                  <button type="button" aria-label="Decrease duration by 30 minutes" onClick={() => setWalkinDuration((duration) => Math.max(30, duration - 30))} disabled={walkinDuration <= 30} data-testid="button-duration-minus">−</button>
                  <output aria-live="polite" data-testid="value-walkin-duration">{formatDuration(walkinDuration)}</output>
                  <button type="button" aria-label="Increase duration by 30 minutes" onClick={() => setWalkinDuration((duration) => Math.min(480, duration + 30))} disabled={walkinDuration >= 480} data-testid="button-duration-plus">+</button>
                </div>
                <small>Change in 30-minute steps · up to 8 hours</small>
              </section> : <div className="field">
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
              </div>}
              <button type="submit" className="submit-button" data-testid="button-start-session">
                {mode === 'member' ? 'LOG IN' : mode === 'voucher' ? 'REDEEM VOUCHER' : 'START WALK-IN'} <span aria-hidden="true">→</span>
              </button>
              {message && <p className="local-message" role="status" data-testid="status-session-preview">{message}</p>}
            </form>
            </>}
          </div>
        </section>
      </div>
    </main>
  );
}

function WalkInSummaryPage() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const player = searchParams.get('player')?.trim() || 'Guest player';
  const requestedDuration = Number(searchParams.get('duration'));
  const durationMinutes = Number.isInteger(requestedDuration) && requestedDuration >= 30 && requestedDuration <= 480 && requestedDuration % 30 === 0
    ? requestedDuration
    : 60;
  const requestedUsedSeconds = Number(searchParams.get('used'));
  const usedSeconds = Number.isInteger(requestedUsedSeconds)
    ? Math.min(durationMinutes * 60, Math.max(0, requestedUsedSeconds))
    : 0;
  const avatarId = searchParams.get('avatar');
  const activeAvatar = demoAvatars.find((avatar) => avatar.id === avatarId) ?? demoAvatars[0];
  const amountDue = durationMinutes / 60 * demoRates.walkInHourly;

  return (
    <main className="seatward-shell session-shell walkin-summary-shell">
      <Link href="/" className="session-brand brand-link" aria-label="Airavoto home" data-testid="link-summary-home"><Brand /></Link>
      <div className="session-layout walkin-summary-layout">
        <section className="venue-note walkin-summary-side" aria-label="Airavoto session checkout">
          <div className="welcome-line">WALK-IN SESSION COMPLETE</div>
          <div className="venue-item"><span className="venue-number">/01</span><div><strong>Player</strong><p>{player}</p></div></div>
          <div className="venue-item"><span className="venue-number">/02</span><div><strong>Time used</strong><p>{formatElapsedTime(usedSeconds)}</p></div></div>
          <p className="walkin-summary-side-note">Please show your amount due at the counter before leaving.</p>
        </section>
        <section className="panel-card session-card walkin-summary-card" aria-labelledby="walkin-summary-title" data-testid="walkin-logout-summary">
          <div className="card-meta"><span>SESSION CLOSED · WALK IN</span><SignalDots /></div>
          <div className="card-content">
            <div className="walkin-summary-player"><img src={activeAvatar.src} alt={`${player}'s avatar`} /><span><small>PLAYER NAME</small><strong data-testid="summary-player-name">{player}</strong></span></div>
            <h1 id="walkin-summary-title">Session complete</h1>
            <p className="walkin-summary-intro">Your Walk-in session has been signed out.</p>
            <dl className="walkin-summary-facts">
              <div><dt>Time used</dt><dd data-testid="summary-time-used">{formatElapsedTime(usedSeconds)}</dd></div>
              <div><dt>Selected time</dt><dd>{formatDuration(durationMinutes)}</dd></div>
              <div><dt>Hourly rate</dt><dd>{formatPrice(demoRates.walkInHourly)} / hr</dd></div>
            </dl>
            <div className="walkin-amount-due"><span>AMOUNT TO PAY AT COUNTER</span><strong data-testid="summary-amount-due">{formatPrice(amountDue)}</strong><small>Demo estimate · {formatDuration(durationMinutes)} selected</small></div>
            <p className="walkin-summary-note">Local demo only. No payment has been processed.</p>
            <button type="button" className="submit-button" onClick={() => setLocation('/')} data-testid="button-summary-return">RETURN TO CHECK-IN <span aria-hidden="true">→</span></button>
          </div>
        </section>
      </div>
    </main>
  );
}

type PlayerAction = 'games' | 'food' | 'staff' | 'terminal' | 'promo' | 'open' | 'lock' | 'settings' | 'players' | null;
type SupportChatMessage = { id: string; sender: 'player' | 'assistant'; text: string; time: string };

function PlayerPage() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const player = searchParams.get('player') || 'Guest player';
  const activeAvatar = demoAvatars.find((avatar) => avatar.id === searchParams.get('avatar')) ?? demoAvatars[0];
  const sessionMode = searchParams.get('mode') || 'member';
  const isWalkIn = sessionMode === 'walkin';
  const requestedDuration = Number(searchParams.get('duration'));
  const validDuration = Number.isInteger(requestedDuration) && requestedDuration >= 30 && requestedDuration <= 480 && requestedDuration % 30 === 0
    ? requestedDuration
    : null;
  const initialSeconds = (isWalkIn ? (validDuration ?? 60) : 60) * 60;
  const [seconds, setSeconds] = useState(initialSeconds);
  const [terminal, setTerminal] = useState(() => typeof window === 'undefined' ? 'PC-14' : window.localStorage.getItem('airavoto.active-terminal') || 'PC-14');
  const [selection, setSelection] = useState(() => typeof window === 'undefined' ? 'PC-14' : window.localStorage.getItem('airavoto.active-terminal') || 'PC-14');
  const [action, setAction] = useState<PlayerAction>(null);
  const [notice, setNotice] = useState('');
  const [order, setOrder] = useState<string[]>([]);
  const [orderReceipt, setOrderReceipt] = useState('');
  const [foodSearch, setFoodSearch] = useState('');
  const [supportIssue, setSupportIssue] = useState('Terminal assistance');
  const [supportDetails, setSupportDetails] = useState('');
  const [supportTicket, setSupportTicket] = useState('');
  const chatStorageKey = `airavoto.support-chat.${player.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const [chatMessages, setChatMessages] = useState<SupportChatMessage[]>(() => {
    try {
      const saved = window.localStorage.getItem(chatStorageKey);
      const parsed: unknown = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed) && parsed.every((item) => item && typeof item.id === 'string' && (item.sender === 'player' || item.sender === 'assistant') && typeof item.text === 'string' && typeof item.time === 'string')) return parsed as SupportChatMessage[];
    } catch { /* Start a fresh local demo conversation if saved data is unavailable. */ }
    return [{ id: 'welcome', sender: 'assistant', text: `Hi ${player}, how can I help with your session? This is a local demo chat; staff are not connected.`, time: 'NOW' }];
  });
  const [chatDraft, setChatDraft] = useState('');
  const [friendRequests, setFriendRequests] = useState<string[]>([]);
  const [selectedGame, setSelectedGame] = useState('');
  const [eventInterestSaved, setEventInterestSaved] = useState(false);
  const [compactCards, setCompactCards] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [adSlide, setAdSlide] = useState(0);
  const [dashboardTab, setDashboardTab] = useState<'home' | 'games' | 'terminals' | 'events' | 'food' | 'support-chat' | 'settings'>('home');
  const [panelOffset, setPanelOffset] = useState({ x: 0, y: 0 });
  const [panelExpanded, setPanelExpanded] = useState(true);
  const dragStart = useRef<{ pointerId: number; x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const chatLogRef = useRef<HTMLDivElement>(null);

  function startPanelDrag(event: ReactPointerEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest('button')) return;
    dragStart.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, offsetX: panelOffset.x, offsetY: panelOffset.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function movePanel(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragStart.current;
    const panel = panelRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !panel) return;
    const bounds = panel.getBoundingClientRect();
    const baseLeft = bounds.left - panelOffset.x;
    const baseRight = bounds.right - panelOffset.x;
    const baseTop = bounds.top - panelOffset.y;
    const baseBottom = bounds.bottom - panelOffset.y;
    const nextX = drag.offsetX + event.clientX - drag.x;
    const nextY = drag.offsetY + event.clientY - drag.y;
    setPanelOffset({ x: Math.max(-baseLeft, Math.min(window.innerWidth - baseRight, nextX)), y: Math.max(-baseTop, Math.min(window.innerHeight - baseBottom, nextY)) });
  }

  function endPanelDrag(event: ReactPointerEvent<HTMLElement>) {
    if (dragStart.current?.pointerId === event.pointerId) dragStart.current = null;
  }

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((remaining) => Math.max(0, remaining - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (reducedMotion || dashboardTab !== 'home' || action) return;
    const carouselTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') setAdSlide((current) => (current + 1) % dashboardAds.length);
    }, 5000);
    return () => window.clearInterval(carouselTimer);
  }, [action, dashboardTab, reducedMotion]);

  useEffect(() => {
    setSelection(terminal); try { window.localStorage.setItem('airavoto.active-terminal', terminal); } catch { /* Storage may be disabled by the browser. */ }
  }, [terminal]);

  useEffect(() => {
    try { window.localStorage.setItem(chatStorageKey, JSON.stringify(chatMessages)); } catch { /* Keep the chat usable if storage is disabled. */ }
  }, [chatMessages, chatStorageKey]);

  useEffect(() => {
    const log = chatLogRef.current;
    if (dashboardTab === 'support-chat' && log) log.scrollTop = log.scrollHeight;
  }, [chatMessages, dashboardTab]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape' && action) dismiss(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [action]);

  const activeAd = dashboardAds[adSlide % dashboardAds.length];
  const hoursRemaining = Math.floor(seconds / 3600);
  const minutesRemaining = Math.floor((seconds % 3600) / 60);
  const secondsRemaining = seconds % 60;
  const timeUnits: { value: number; label: string }[] = hoursRemaining > 0
    ? [{ value: hoursRemaining, label: 'hr' }, { value: minutesRemaining, label: 'min' }, { value: secondsRemaining, label: 'sec' }]
    : minutesRemaining > 0
      ? [{ value: minutesRemaining, label: 'min' }, { value: secondsRemaining, label: 'sec' }]
      : [{ value: secondsRemaining, label: 'sec' }];
  const dismiss = () => { setAction(null); setNotice(''); };
  const handleLogout = () => {
    if (!isWalkIn) { setLocation('/'); return; }
    const durationMinutes = validDuration ?? 60;
    const usedSeconds = Math.max(0, initialSeconds - seconds);
    setLocation(`/session-summary?player=${encodeURIComponent(player)}&avatar=${encodeURIComponent(activeAvatar.id)}&duration=${durationMinutes}&used=${usedSeconds}`);
  };
  const menu = [
    { name: 'District fries', detail: 'Crisp shoestring fries · demo item', price: '$4.50' },
    { name: 'Midnight cola', detail: 'Chilled glass bottle · demo item', price: '$3.00' },
    { name: 'Spicy chicken wrap', detail: 'Grilled, house sauce · demo item', price: '$8.25' },
    { name: 'Loaded nachos', detail: 'Cheese, salsa, jalapeños · demo item', price: '$6.50' },
    { name: 'Iced mocha', detail: 'Cold brew, chocolate, milk · demo item', price: '$4.00' },
    { name: 'Airavoto smash burger', detail: 'Double patty, cheddar, fries · demo item', price: '$9.25' },
  ];
  const filteredMenu = menu.filter((item) => `${item.name} ${item.detail}`.toLowerCase().includes(foodSearch.trim().toLowerCase()));
  const orderTotal = menu.reduce((total, item) => total + Number(item.price.replace('$', '')) * order.filter((name) => name === item.name).length, 0);
  const saveLocalRecord = (key: string, value: unknown) => {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* Keep the flow usable if browser storage is disabled. */ }
  };
  const addOrderItem = (name: string) => { setOrder((items) => [...items, name]); setOrderReceipt(''); };
  const removeOrderItem = (name: string) => setOrder((items) => { const index = items.indexOf(name); return index < 0 ? items : [...items.slice(0, index), ...items.slice(index + 1)]; });
  const saveOrder = () => {
    if (!order.length) return;
    const receipt = `AO-${Date.now().toString(36).toUpperCase()}`;
    saveLocalRecord(`airavoto.order.${receipt}`, { receipt, items: order, total: orderTotal, savedAt: new Date().toISOString(), status: 'Saved on this device' });
    setOrderReceipt(receipt);
    setOrder([]);
  };
  const submitSupportRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const ticket = `HELP-${Date.now().toString(36).toUpperCase()}`;
    saveLocalRecord(`airavoto.support.${ticket}`, { ticket, issue: supportIssue, details: supportDetails.trim(), createdAt: new Date().toISOString(), status: 'Saved on this device' });
    setSupportTicket(ticket);
  };
  const sendSupportChat = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = chatDraft.trim();
    if (!text) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const id = now.getTime().toString(36);
    setChatMessages((current) => [...current,
      { id: `player-${id}`, sender: 'player', text, time },
      { id: `assistant-${id}`, sender: 'assistant', text: 'Demo reply: your message is saved on this device only. For live help, please speak with the lounge front desk.', time },
    ]);
    setChatDraft('');
  };
  const applyTerminal = () => {
    if (selection === terminal) { setNotice(`${terminal} is already active. Choose another PC to switch terminals.`); return; }
    setTerminal(selection);
    setNotice(`${selection} is now active for this session in the app.`);
  };
  const players = [
    { name: player, game: 'Playing Valorant', avatar: activeAvatar.id, status: 'online', badge: 'V', tone: 'valorant' },
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
  const promoCards = [
    { image: '/airavoto-ad-tournament.webp', eyebrow: 'LOUNGE EVENT', title: 'Neon Clash · 9 PM', detail: 'Valorant 5v5 tournament · Ask to join' },
    { image: '/airavoto-ad-food.webp', eyebrow: 'FUEL YOUR SESSION', title: 'Game night combo', detail: 'Fresh snacks delivered to your desk' },
    { image: '/airavoto-ad-gear.webp', eyebrow: 'PLAY IN COMFORT', title: 'Your next match starts here', detail: 'Explore the lounge gaming setup' },
  ];
  const tabTitles = { games: 'Games library', terminals: 'Your PC', events: 'Events & offers', food: 'Food & Drinks', 'support-chat': 'Support Chat', settings: 'Preferences' };
  const renderDashboardPage = () => {
    if (dashboardTab === 'food') return <section className="dashboard-tab-page dashboard-food-page" aria-label="Food and drinks menu"><label className="dashboard-food-search"><Search size={15} aria-hidden="true"/><input type="search" value={foodSearch} onChange={(event) => setFoodSearch(event.target.value)} placeholder="Search food and drinks" aria-label="Search food and drinks" data-testid="input-food-search"/><span>{filteredMenu.length}</span></label><div className="dashboard-food-list" aria-label="Menu items" data-testid="dashboard-food-list">{filteredMenu.map((item) => <article className="dashboard-food-item" key={item.name}><div className="dashboard-food-card-head"><span className="dashboard-food-icon"><Utensils size={15}/></span><b>{item.price}</b></div><div className="dashboard-food-copy"><strong>{item.name}</strong><small>{item.detail.replace(' · demo item', '')}</small></div><div className="dashboard-food-purchase"><button type="button" onClick={() => addOrderItem(item.name)} data-testid={`button-add-food-tab-${item.name.toLowerCase().replaceAll(' ', '-')}`}>Add to order</button></div></article>)}{filteredMenu.length === 0 && <p className="dashboard-food-no-results" role="status">No menu items match “{foodSearch}”.</p>}</div><section className="dashboard-food-summary" aria-label="Your order"><header><strong>Your order</strong><span>{order.length} {order.length === 1 ? 'item' : 'items'}</span></header>{order.length ? <div className="dashboard-food-order-list">{[...new Set(order)].map((name) => { const item = menu.find((entry) => entry.name === name)!; const quantity = order.filter((entry) => entry === name).length; return <div className="dashboard-food-order-row" key={name}><span>{name}<small> × {quantity}</small></span><b>{formatPrice(Number(item.price.replace('$', '')) * quantity)}</b><button type="button" aria-label={`Remove one ${name}`} onClick={() => removeOrderItem(name)}>−</button></div>; })}</div> : <p>Add an item to build your session order.</p>}{orderReceipt ? <div className="dashboard-food-receipt" role="status" data-testid="status-food-receipt">Order saved locally · {orderReceipt}</div> : <><div className="dashboard-food-total"><span>Subtotal</span><strong>{formatPrice(orderTotal)}</strong></div><button className="dashboard-food-save" type="button" disabled={!order.length} onClick={saveOrder} data-testid="button-save-food-order-page">Save order locally</button></>}</section><p className="dashboard-local-note">Demo only: orders are saved on this device and are not sent to the kitchen.</p></section>;
    if (dashboardTab === 'support-chat') return <section className="dashboard-tab-page dashboard-chat-page" aria-label="Support chat"><div className="support-chat-local-notice"><Headphones size={18}/><span><strong>Local demo chat</strong><small>No lounge staff are connected; messages stay on this device.</small></span></div><div className="support-chat-log" role="log" aria-live="polite" aria-label="Chat messages" ref={chatLogRef} data-testid="support-chat-log">{chatMessages.map((message) => <article className={`support-chat-message ${message.sender}`} key={message.id}><small>{message.sender === 'player' ? 'YOU' : 'AIRAVOTO DEMO'} · {message.time}</small><p>{message.text}</p></article>)}</div><form className="support-chat-form" onSubmit={sendSupportChat}><label className="sr-only" htmlFor="support-chat-input">Your message</label><input id="support-chat-input" type="text" maxLength={280} placeholder="Type a message…" value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} data-testid="input-support-chat"/><button type="submit" disabled={!chatDraft.trim()} data-testid="button-send-support-chat"><Send size={14}/><span>Send</span></button></form><p className="support-chat-footnote">Demo replies are local only; for live help, contact the front desk.</p></section>;
    if (dashboardTab === 'games') return <section className="dashboard-tab-page"><span className="tab-eyebrow">READY TO PLAY</span><h2>Games library</h2><p>Popular games around the lounge right now.</p><div className="tab-game-grid">{[['VALORANT','Tactical · 5v5','V'],['GTA V','Open world','GTA'],['FC 24','Sports · 1v1','FC'],['Minecraft','Sandbox','M'],['Counter-Strike 2','Tactical · 5v5','CS2'],['Apex Legends','Battle royale','AP']].map(([name,detail,badge]) => <article className="tab-game-card" key={name}><span>{badge}</span><strong>{name}</strong><small>{detail}</small><i>AVAILABLE</i></article>)}</div></section>;
    if (dashboardTab === 'terminals') {
      return (
        <section className="dashboard-tab-page" aria-label="Current PC configuration">
          <span className="tab-eyebrow">YOUR CURRENT PC · DEMO</span>
          <h2>Hardware configuration</h2>
          <p>Configuration for the PC assigned to your session.</p>
          <article className="terminal-spec-card" aria-label={`Demo configuration for ${terminal}`} data-testid="current-pc-configuration">
            <header className="terminal-spec-header"><div><span>CURRENT PC</span><h3>{terminal}</h3></div><b>DEMO SPECS</b></header>
            <div className="terminal-spec-grid">{demoPcSpecs.map((spec) => <div className="terminal-spec-item" key={spec.label} data-testid={`pc-spec-${spec.label.toLowerCase()}`}><span>{spec.label}</span><strong>{spec.value}</strong></div>)}</div>
            <p className="terminal-spec-note">Example hardware only · Not connected to this PC or Airavoto POS.</p>
          </article>
        </section>
      );
    }
    if (dashboardTab === 'events') return <section className="dashboard-tab-page"><span className="tab-eyebrow">WHAT'S ON</span><h2>Events &amp; offers</h2><p>Discover what's happening at Airavoto.</p><div className="tab-event-list">{promoCards.map((card,index) => <article className="tab-event-card" key={card.title}><img src={card.image} alt=""/><div><small>{index === 0 ? 'TONIGHT · 9:00 PM' : index === 1 ? 'LOUNGE OFFER' : 'PLAYER PERK'}</small><strong>{card.title}</strong><span>{card.detail}</span></div></article>)}</div></section>;
    return <section className="dashboard-tab-page"><span className="tab-eyebrow">YOUR ACCOUNT</span><h2>Preferences</h2><p>Manage this local preview experience.</p><div className="tab-settings-list"><article><span><strong>Profile</strong><small>{player} · {isWalkIn ? 'Walk-in' : 'Member'}</small></span><img src={activeAvatar.src} alt=""/></article><article><span><strong>Current terminal</strong><small>{terminal} · Session timer is active</small></span><Monitor size={19}/></article><article><span><strong>Sound effects</strong><small>Interface sounds in this preview</small></span><span className="setting-switch on"/></article><article><span><strong>Reduced motion</strong><small>Respect device accessibility settings</small></span><span className="setting-switch"/></article></div><button type="button" className="settings-logout-button" onClick={handleLogout} data-testid="button-settings-logout"><LogOut size={15}/><span>Log out</span></button></section>;
  };
  const dialogTitle = action === 'food' ? 'Food menu' : action === 'terminal' ? 'Switch terminal' : action === 'staff' ? 'Help desk' : action === 'promo' ? 'Tournament details' : action === 'open' ? 'Open terminal' : action === 'lock' ? 'Lock PC' : action === 'settings' ? 'Settings preview' : action === 'players' ? 'Players in the lounge' : 'Game library';

  return (
    <main className={`player-shell${compactCards ? ' compact-cards' : ''}`}>
      <section className="desktop-area" aria-label="Player desktop">
        <div className="wallpaper-art" aria-hidden="true"><img src="/windows-11-gaming-desktop.webp" alt="" /></div>
      </section>
      {panelExpanded ? <aside ref={panelRef} className="player-panel dashboard-panel" aria-label="Player session panel" style={{ transform: `translate3d(${panelOffset.x}px, ${panelOffset.y}px, 0)` }}>
        <button type="button" className="dashboard-bottom-logout" aria-label="Log out of this session" onClick={handleLogout} data-testid="button-dashboard-logout"><LogOut size={14}/><span>Log out</span></button>
        <nav className="dashboard-rail" aria-label="Dashboard navigation">
          <button className="rail-brand" type="button" aria-label="Collapse Airavoto dashboard" title="Collapse dashboard" onClick={() => setPanelExpanded(false)}><img src="/airavoto-logo.png" alt="" /></button>
          <div className="rail-main-links">
            <button className={`rail-link ${dashboardTab === 'home' ? 'selected' : ''}`} type="button" aria-label="Home" aria-current={dashboardTab === 'home' ? 'page' : undefined} onClick={() => setDashboardTab('home')}><Home size={19} /></button>
            <button className={`rail-link ${dashboardTab === 'games' ? 'selected' : ''}`} type="button" aria-label="Games" aria-current={dashboardTab === 'games' ? 'page' : undefined} onClick={() => setDashboardTab('games')}><Gamepad2 size={19} /></button>
            <button className={`rail-link ${dashboardTab === 'terminals' ? 'selected' : ''}`} type="button" aria-label="Terminals" aria-current={dashboardTab === 'terminals' ? 'page' : undefined} onClick={() => setDashboardTab('terminals')}><Monitor size={19} /></button>
            <button className={`rail-link ${dashboardTab === 'events' ? 'selected' : ''}`} type="button" aria-label="Events" aria-current={dashboardTab === 'events' ? 'page' : undefined} onClick={() => setDashboardTab('events')}><CalendarDays size={19} /></button>
            <button className={`rail-link ${dashboardTab === 'food' ? 'selected' : ''}`} type="button" aria-label="Food & Drinks" aria-current={dashboardTab === 'food' ? 'page' : undefined} onClick={() => setDashboardTab('food')} data-testid="tab-food"><Utensils size={19} /></button>
            <button className={`rail-link ${dashboardTab === 'support-chat' ? 'selected' : ''}`} type="button" aria-label="Support Chat" aria-current={dashboardTab === 'support-chat' ? 'page' : undefined} onClick={() => setDashboardTab('support-chat')} data-testid="tab-support-chat"><Headphones size={19} /></button>
          </div>
          <button className={`rail-link rail-settings ${dashboardTab === 'settings' ? 'selected' : ''}`} type="button" aria-label="Settings" aria-current={dashboardTab === 'settings' ? 'page' : undefined} onClick={() => setDashboardTab('settings')}><Settings size={19} /></button>
        </nav>
        <div className="dashboard-content">
          <header className="dashboard-header" onPointerDown={startPanelDrag} onPointerMove={movePanel} onPointerUp={endPanelDrag} onPointerCancel={endPanelDrag} title="Hold and drag to move this panel">
            <button className="dashboard-wordmark-button" type="button" aria-label="Collapse Airavoto dashboard" title="Collapse dashboard" onClick={() => setPanelExpanded(false)}><span className="dashboard-wordmark"><Brand className="panel-brand" /><small>GAMING LOUNGE</small></span></button>
            <div className="dashboard-user-tools"><span className="online-pill"><i /> Online</span><button className="profile-chip" type="button" aria-label={`Open settings; signed in as ${player}`} onClick={() => setDashboardTab('settings')} data-testid="button-profile-settings"><img src={activeAvatar.src} alt="" /><ChevronRight size={12} /></button></div>
          </header>
          {dashboardTab === 'home' ? <>
          <section className="dashboard-hero">
            <div className="hero-copy"><span>WELCOME TO AIRAVOTO</span><h2>Game. Chill. Repeat.</h2><p>Your local gaming lounge,<br />now at your fingertips.</p><button type="button" aria-label="Explore games" onClick={() => setAction('games')}><ChevronRight size={18} /></button></div>
            <img src="/airavoto-logo.png" alt="" aria-hidden="true" />
          </section>
          <section className="dashboard-availability" aria-label="Lounge availability">
            <article className="availability-card active" aria-label="PC Gaming availability" data-testid="availability-pc"><Monitor size={18} /><strong>PC Gaming</strong><span>{terminal} · Your seat</span><small><b /> 12 / 16</small></article>
            <article className="availability-card" aria-label="PS5 console availability" data-testid="availability-ps5"><Gamepad2 size={18} /><strong>PS5</strong><span>Console bays</span><small><b className="muted-dot" /> 4 / 6</small></article>
            <article className="availability-card" aria-label="VR station availability" data-testid="availability-vr"><Users size={18} /><strong>VR</strong><span>Immersive play</span><small><b className="muted-dot" /> 2 / 4 <ChevronRight size={14} /></small></article>
          </section>
          <section className="dashboard-session-strip" aria-label="Your live session" data-testid="session-price-card">
            <div className="session-strip-avatar"><img src={activeAvatar.src} alt="" /></div><div className="session-strip-copy"><span>YOUR SESSION · {player}</span><strong data-testid="text-active-player">{terminal} <i>·</i> <span role="timer" aria-label={`${hoursRemaining} hours ${minutesRemaining} minutes ${secondsRemaining} seconds remaining`} data-testid="status-countdown">{timeUnits.map(({ value,label }) => `${label === 'sec' ? String(value).padStart(2,'0') : value} ${label}`).join(' ')}</span></strong><small data-testid="status-active-terminal">{isWalkIn ? 'Walk-in session' : 'Member session'} · demo estimate</small></div><span className="session-strip-price">{isWalkIn ? formatPrice((validDuration ?? 60) / 60 * demoRates.walkInHourly) : `${formatPrice(demoRates.memberHourly)}/hr`}<small>DEMO</small></span>
          </section>
          <section className={`dashboard-ad-carousel ${reducedMotion ? 'reduced-motion' : ''}`} role="region" aria-label="Lounge advertisements" aria-roledescription="carousel" data-testid="dashboard-ad-carousel">
            <button type="button" className="dashboard-feature" onClick={() => setAction(activeAd.action)} aria-label={`${activeAd.title}: ${activeAd.subtitle}. Open offer`} data-testid="button-food-promo">
              <span className="feature-image"><img key={activeAd.id} src={activeAd.image} alt="" /></span>
              <span className="feature-copy" key={activeAd.id}><small>{activeAd.eyebrow}</small><strong>{activeAd.title}</strong><span>{activeAd.subtitle}</span><b>{activeAd.price}</b></span>
              <span className="feature-arrow"><ChevronRight size={17} /></span>
            </button>
            <div className="dashboard-ad-pagination" role="group" aria-label="Select an advertisement">
              {dashboardAds.map((ad, index) => <button key={ad.id} type="button" className={adSlide === index ? 'active' : ''} aria-label={`Show ${ad.title} ad (${index + 1} of ${dashboardAds.length})`} aria-pressed={adSlide === index} onClick={() => setAdSlide(index)} data-testid={`button-ad-slide-${index + 1}`} />)}
            </div>
          </section>
          <section className="dashboard-shortcuts" aria-label="Quick actions">
            <button type="button" onClick={() => setAction('terminal')} data-testid="button-book-pc"><span><Monitor size={18} /></span><small>Book PC</small></button>
            <button type="button" onClick={() => setAction('food')} data-testid="button-order-food"><span><Utensils size={18} /></span><small>Food &amp; Drinks</small></button>
            <button type="button" onClick={() => setAction('promo')}><span><CalendarDays size={18} /></span><small>Events</small></button>
            <button type="button" onClick={() => setAction('terminal')}><span><ChartNoAxesColumnIncreasing size={18} /></span><small>Live Availability</small></button>
          </section>
          <section className="dashboard-action-section" aria-label="Lounge quick actions">
            <header className="dashboard-action-heading"><span>Quick Access</span><small>LOUNGE SERVICES</small></header>
            <div className="dashboard-action-grid">
              <button className="dashboard-action-card" type="button" onClick={() => setAction('food')} data-testid="button-order-food-card"><img src="/airavoto-ad-food.webp" alt="" /><span className="action-card-shade"/><strong>Order Food</strong><ChevronRight size={16}/></button>
              <button className="dashboard-action-card" type="button" onClick={() => setAction('players')} data-testid="button-view-players-card"><img src="/view-players-art.webp" alt="" /><span className="action-card-shade"/><strong>View Players</strong><ChevronRight size={16}/></button>
              <button className="dashboard-action-card" type="button" onClick={() => setAction('terminal')} data-testid="button-switch-terminal-card"><img src="/switch-terminal-art.webp" alt="" /><span className="action-card-shade"/><strong>Switch Terminal</strong><ChevronRight size={16}/></button>
              <button className="dashboard-action-card" type="button" onClick={() => setAction('staff')} data-testid="button-support-card"><img src="/support-card.jpg" alt="" /><span className="action-card-shade"/><strong>Support</strong><ChevronRight size={16}/></button>
            </div>
          </section>
          </> : <><section className="dashboard-page-heading"><h1>{tabTitles[dashboardTab]}</h1><p>{dashboardTab === 'food' ? 'Build an order for your current session.' : dashboardTab === 'support-chat' ? 'A local demo conversation saved on this device.' : 'Your gaming activity, services, and preferences.'}</p></section>{renderDashboardPage()}</>}
        </div>
      </aside> : <button className="dashboard-collapsed-tab" type="button" aria-label="Expand Airavoto dashboard" title="Expand Airavoto dashboard" onClick={() => setPanelExpanded(true)}><img src="/airavoto-logo.png" alt="" /></button>}
      {action && <div className="player-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) dismiss(); }}>
        <section className="action-window" role="dialog" aria-modal="true" aria-labelledby="action-title" data-testid={`dialog-${action}`}>
          <header className="window-titlebar"><div><img className="window-brand-logo" src="/airavoto-logo.png" alt="" aria-hidden="true" /><span>Airavoto · {dialogTitle}</span></div><button type="button" title="Close popup" onClick={(event)=>{event.preventDefault();event.stopPropagation();dismiss();}} aria-label="Close popup" data-testid="button-close-dialog">×</button></header>
          <div className="window-content">
            {action === 'games' && <><span className="eyebrow">GAME LIBRARY</span><h2 id="action-title">Choose your next game.</h2><p className="window-intro">Select a game to set it as your active game in this lounge session.</p><div className="game-list">{[['VALORANT','Tactical · 5v5'],['Counter-Strike 2','Competitive · 5v5'],['Apex Legends','Squad · Battle royale'],['GTA V','Open world'],['FC 24','Sports · 1v1'],['Minecraft','Sandbox · build']].map(([name,kind],index)=><div className="game-row" key={name}><span className="game-number">0{index+1}</span><div><strong>{name}</strong><small>{kind}</small></div><button className="popup-inline-button" type="button" onClick={()=>setSelectedGame(name)}>{selectedGame===name?'Selected':'Select'}</button></div>)}</div>{selectedGame&&<p className="inline-confirm" role="status" data-testid="status-selected-game">{selectedGame} is selected for this session. This browser cannot launch desktop games.</p>}</>}
            {action === 'players' && <><span className="eyebrow">LOUNGE ROSTER</span><h2 id="action-title">Players in the lounge</h2><p className="window-intro">Add players from this local demo roster. Friend requests stay on this device; nothing is sent.</p><div className="players-dialog-list" role="list" aria-label="Other players">{players.slice(1).map((person)=><div className={`players-dialog-row ${person.status}`} role="listitem" key={person.name}><img src={`/avatars/${person.avatar}.webp`} alt=""/><div className="roster-copy"><strong>{person.name}</strong><span><i/>{person.game}</span></div><span className={`game-badge ${person.tone}`} aria-label={person.game}>{person.badge}</span><button className={`friend-request-button ${friendRequests.includes(person.name)?'requested':''}`} type="button" disabled={friendRequests.includes(person.name)} onClick={()=>setFriendRequests((current)=>current.includes(person.name)?current:[...current,person.name])} aria-label={friendRequests.includes(person.name)?`Friend request sent to ${person.name}`:`Add ${person.name} as a friend`} data-testid={`button-add-friend-${person.name.toLowerCase().replaceAll(' ','-')}`}>{friendRequests.includes(person.name)?'Request sent':'Add friend'}</button></div>)}</div>{friendRequests.length>0&&<p className="inline-confirm" role="status">Friend requests saved locally for {friendRequests.join(', ')}. Nothing was sent to the lounge.</p>}</>}
            {action === 'food' && <><span className="eyebrow">FOOD &amp; DRINKS</span><h2 id="action-title">Build your order.</h2><p className="window-intro">Add items and save an order record on this device. It will not be sent to the venue kitchen.</p><div className="food-list">{menu.map((item)=><div className="food-row" key={item.name}><div><strong>{item.name}</strong><small>{item.detail.replace(' · demo item','')}</small></div><div className="food-buy"><b>{item.price}</b><button type="button" onClick={()=>addOrderItem(item.name)} data-testid={`button-add-${item.name.toLowerCase().replaceAll(' ','-')}`}>Add</button></div></div>)}</div><div className="sample-order"><strong>Order summary <span>{order.length} {order.length===1?'item':'items'}</span></strong>{order.length>0?<div className="order-summary-list">{[...new Set(order)].map((name)=>{const item=menu.find((entry)=>entry.name===name)!;const quantity=order.filter((entry)=>entry===name).length;return <div className="order-summary-row" key={name}><span>{name}<small> × {quantity}</small></span><b>{formatPrice(Number(item.price.replace('$',''))*quantity)}</b><button className="remove-order-item" type="button" aria-label={`Remove one ${name}`} onClick={()=>removeOrderItem(name)}>−</button></div>})}</div>:<p>No items yet. Add an item to build your order.</p>}{orderReceipt?<div className="order-receipt" role="status" data-testid="status-order-receipt"><strong>Order saved</strong><span>Receipt {orderReceipt} · stored on this device only.</span></div>:<><div className="order-total"><span>Subtotal</span><strong>{formatPrice(orderTotal)}</strong></div><button className="window-primary" type="button" disabled={!order.length} onClick={saveOrder} data-testid="button-save-order">Save order locally</button></>}</div></>}
            {action === 'staff' && <><span className="eyebrow">SUPPORT</span><h2 id="action-title">How can we help?</h2><p className="window-intro">Create a support note saved on this device. The venue team will not receive it without a connected service.</p>{supportTicket?<div className="confirmation-box" role="status" data-testid="status-support-ticket"><span className="confirmation-symbol">✓</span><div><strong>Support note saved</strong><p>Reference {supportTicket}<br/>{supportIssue}{supportDetails.trim()?` · ${supportDetails.trim()}`:''}</p><small>Saved locally only; no staff member was notified.</small></div><button className="popup-inline-button" type="button" onClick={()=>{setSupportTicket('');setSupportDetails('');}}>Create another note</button></div>:<form className="support-form" onSubmit={submitSupportRequest}><label htmlFor="support-issue">WHAT DO YOU NEED?</label><select id="support-issue" value={supportIssue} onChange={(event)=>setSupportIssue(event.target.value)}><option>Terminal assistance</option><option>Session or billing question</option><option>Food and drinks</option><option>Something else</option></select><label htmlFor="support-details">DETAILS <span>OPTIONAL</span></label><textarea id="support-details" rows={3} maxLength={240} placeholder="Add a short note for the floor team…" value={supportDetails} onChange={(event)=>setSupportDetails(event.target.value)}/><button className="window-primary" type="submit" data-testid="button-submit-support">Save support note</button></form>}</>}
            {action === 'terminal' && <><span className="eyebrow">SESSION SETTINGS</span><h2 id="action-title">Switch terminal.</h2><p className="window-intro">Choose a different PC and press Apply terminal. The active PC label and local session display will update; this preview is not connected to venue hardware.</p><label className="terminal-select-label" htmlFor="terminal-choice">AVAILABLE TERMINALS</label><select id="terminal-choice" value={selection} onChange={(event)=>setSelection(event.target.value)} data-testid="select-terminal"><option>PC-08</option><option>PC-11</option><option>PC-14</option><option>PC-22</option></select><div className="terminal-current"><span>Current terminal</span><strong>{terminal}</strong></div><button className="window-primary" type="button" onClick={applyTerminal} data-testid="button-apply-terminal">Apply terminal</button>{notice&&<p className="inline-confirm" role="status" data-testid="status-terminal-demo">{notice}</p>}</>}
            {action === 'promo' && <><span className="eyebrow">LOUNGE EVENTS</span><h2 id="action-title">Neon Clash.</h2><p className="window-intro">Valorant 5v5 · Tonight at 9:00 PM</p><div className="promo-detail"><span>FORMAT</span><strong>5v5 · Double elimination</strong><span>ENTRY</span><strong>Check with the venue desk</strong></div>{eventInterestSaved?<p className="inline-confirm" role="status">Your interest is saved on this device. It has not registered you with the venue.</p>:<button className="window-primary" type="button" onClick={()=>{setEventInterestSaved(true);saveLocalRecord('airavoto.event-interest',{event:'Neon Clash',savedAt:new Date().toISOString()});}}>Save my interest</button>}</>}
            {(action === 'open' || action === 'lock') && <><span className="eyebrow">DESKTOP CONTROL</span><h2 id="action-title">{action==='open'?'Open terminal':'Lock session'}</h2><p className="window-intro">This browser preview has no Windows/Tauri control bridge, so it cannot open apps or lock the PC.</p><div className="confirmation-box"><span className="confirmation-symbol">i</span><div><strong>No desktop command was run</strong><p>{action==='open'?`The selected session terminal is ${terminal}.`: 'Your PC and session remain unchanged.'}</p></div></div><button className="window-primary" type="button" onClick={dismiss}>Close</button></>}
            {action === 'settings' && <><span className="eyebrow">APP PREFERENCES</span><h2 id="action-title">Your preferences.</h2><p className="window-intro">These controls update this app view only.</p><div className="settings-preview"><span>Active terminal</span><strong>{terminal}</strong><span>Compact action cards</span><button className="preference-toggle" type="button" role="switch" aria-checked={compactCards} onClick={()=>setCompactCards((value)=>!value)}>{compactCards?'On':'Off'}</button><span>Reduced motion</span><button className="preference-toggle" type="button" role="switch" aria-checked={reducedMotion} onClick={()=>{const next=!reducedMotion;setReducedMotion(next);document.documentElement.classList.toggle('reduce-motion',next);}}>{reducedMotion?'On':'Off'}</button></div><button className="window-primary" type="button" onClick={dismiss}>Done</button></>}

          </div>
        </section>
      </div>}
    </main>
  );
}

function ActivationPage() {
  const [cafeName, setCafeName] = useState('');
  const [cafeError, setCafeError] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function submitActivation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cafeName.trim()) {
      setCafeError('Enter the cafe name used in Airavoto POS.');
      setError('');
      setMessage('');
      return;
    }
    setCafeError('');
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      setError(code.length === 0 ? 'Enter the six-character administrator code.' : 'Use exactly six letters or numbers.');
      setMessage('');
      return;
    }
    setError('');
    setMessage(`Cafe name and code format accepted for ${cafeName.trim()}. This preview does not verify Airavoto POS or pair a terminal.`);
  }

  return (
    <main className="seatward-shell activate-layout">
      <aside className="activate-side">
        <Link href="/" className="brand-link" aria-label="Airavoto check-in" data-testid="link-seatward-home">
          <Brand />
        </Link>
        <div className="side-index" aria-hidden="true">01</div>
      </aside>
      <section className="activate-main">
        <div className="panel-card activate-card">
          <div className="card-meta"><span>TERMINAL · UNPAIRED</span><SignalDots /></div>
          <div className="card-content">
            <h1>Activate terminal</h1>
            <p className="intro-copy">Enter the cafe name used in Airavoto POS, then the six-character one-time code from your administrator.</p>
            <form onSubmit={submitActivation} noValidate>
              <div className="field cafe-name-field">
                <label htmlFor="cafe-name">CAFE NAME</label>
                <input
                  id="cafe-name"
                  name="cafe-name"
                  autoComplete="organization"
                  maxLength={80}
                  placeholder="Airavoto Gaming Lounge"
                  value={cafeName}
                  aria-invalid={Boolean(cafeError)}
                  aria-describedby={cafeError ? 'cafe-name-error' : 'cafe-name-hint'}
                  onChange={(event) => { setCafeName(event.target.value); setCafeError(''); setMessage(''); }}
                  data-testid="input-cafe-name"
                />
                {cafeError && <p className="field-error" id="cafe-name-error" role="alert">{cafeError}</p>}
                <p className="activation-note" id="cafe-name-hint">Use the exact cafe name configured in Airavoto POS.</p>
              </div>
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
                <p className="helper-copy" id="activation-hint">No code? Ask an Airavoto POS administrator to generate a one-time code for this terminal.</p>
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
        <Route path="/session-summary" component={WalkInSummaryPage} />
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
