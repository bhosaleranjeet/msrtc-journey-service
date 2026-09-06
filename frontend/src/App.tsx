import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Icon } from './components/Icon'
import { LOCALE_STORAGE_KEY, canonicalStop, localizeService, localizeStop, localizeStopDescription, translate, type Locale } from './i18n'
import { ProductFaq, TesterGuidePage } from './components/TesterGuide'
import maharashtraHero from './assets/maharashtra-journey-hero.jpg'
import msrtcLogo from './assets/msrtc-emblem.png'
import type { ApiError, Booking, CancellationPreview, Complaint, ConnectingJourney, DemoNetwork, Journey, JourneyPass, ParsedIntent, Passenger, StopCandidate, Tracking } from './types'

const API_URL = import.meta.env.VITE_API_URL ?? '/api'
const DEMO_USERNAME = import.meta.env.VITE_DEMO_USERNAME ?? 'demo'
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD ?? 'lalpari2026'
const DEMO_AUTH_KEY = 'msrtc-demo-authenticated'
const LAST_BOOKING_KEY = 'msrtc-demo-last-booking'
const BOOKING_HISTORY_KEY = 'msrtc-demo-booking-history'
const dateInIndia = (daysFromToday = 0) => {
  const date = new Date(Date.now() + daysFromToday * 86_400_000)
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const value = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]))
  return `${value.year}-${value.month}-${value.day}`
}
const DEMO_DATE = dateInIndia(1)
type Stage = 'plan' | 'choose' | 'book' | 'pass' | 'manage' | 'track' | 'complaint' | 'test'
type ComplaintMode = 'ENTRY' | 'BOOKING' | 'MANUAL'
type SearchCriteria = { origin: string; destination: string; journeyDate: string; acOnly: boolean }
type SavedBooking = { id: string; ticketNumber: string; origin: string; destination: string; legCount: number }

const nextIsoDate = (value: string) => {
  const date = new Date(`${value}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}

const isAdvertisedDemoRoute = (origin: string, destination: string) => {
  const from = canonicalStop(origin), to = canonicalStop(destination)
  return (from === 'Pune' && ['Nashik', 'Nashik Mahamarg', 'Nashik CBS', 'Nashik Road', 'Satara', 'Demo Destination'].includes(to))
    || (from === 'Mumbai' && to === 'Pune')
}

function readSavedBookings(): SavedBooking[] {
  try {
    const saved = JSON.parse(localStorage.getItem(BOOKING_HISTORY_KEY) ?? '[]')
    return Array.isArray(saved) ? saved.filter((item): item is SavedBooking => typeof item?.id === 'string' && typeof item?.ticketNumber === 'string').slice(0, 5) : []
  } catch { return [] }
}

const languageTag = (locale: Locale) => locale === 'mr' ? 'mr-IN-u-nu-latn' : 'en-IN'
const formatTime = (value: string, locale: Locale = 'en') => new Intl.DateTimeFormat(languageTag(locale), { hour: 'numeric', minute: '2-digit' }).format(new Date(value))
const formatDate = (value: string, locale: Locale = 'en') => new Intl.DateTimeFormat(languageTag(locale), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`))
const duration = (minutes: number, locale: Locale = 'en') => locale === 'mr' ? `${Math.floor(minutes / 60)} तास ${minutes % 60} मि.` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`
const normaliseVoiceTranscript = (transcript: string, locale: Locale) => {
  if (locale !== 'en' || !/(?:टू|टुमॉरो|टुमारो|मॉर्निंग|इव्हनिंग|ईवनिंग)/.test(transcript)) return transcript
  const phoneticEnglish: Array<[string, string]> = [
    ['महाबळेश्वर', 'Mahabaleshwar'], ['डेमो डेस्टिनेशन', 'Demo Destination'],
    ['टुमॉरो', 'tomorrow'], ['टुमारो', 'tomorrow'], ['मॉर्निंग', 'morning'],
    ['इव्हनिंग', 'evening'], ['ईवनिंग', 'evening'], ['नाईट', 'night'],
    ['नाशीक', 'Nashik'], ['नाशिक', 'Nashik'], ['नासिक', 'Nashik'],
    ['पुणे', 'Pune'], ['पुने', 'Pune'], ['पूणे', 'Pune'], ['मुंबई', 'Mumbai'],
    ['सातारा', 'Satara'], ['सतारा', 'Satara'], ['टू', 'to'], ['एसी', 'AC'],
  ]
  return phoneticEnglish.reduce((value, [spoken, latin]) => value.replaceAll(spoken, latin), transcript)
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem(DEMO_AUTH_KEY) === 'true')
  const [locale, setLocale] = useState<Locale>(() => localStorage.getItem(LOCALE_STORAGE_KEY) === 'mr' ? 'mr' : 'en')

  useEffect(() => { localStorage.setItem(LOCALE_STORAGE_KEY, locale); document.documentElement.lang = locale === 'mr' ? 'mr' : 'en' }, [locale])

  if (!isAuthenticated) {
    return <LoginScreen locale={locale} onLocaleChange={setLocale} onAuthenticated={() => {
      sessionStorage.setItem(DEMO_AUTH_KEY, 'true')
      setIsAuthenticated(true)
    }} />
  }

  return <JourneyApp locale={locale} onLocaleChange={setLocale} onSignOut={() => {
    sessionStorage.removeItem(DEMO_AUTH_KEY)
    setIsAuthenticated(false)
  }} />
}

function LoginScreen({ locale, onLocaleChange, onAuthenticated }: { locale: Locale; onLocaleChange: (locale: Locale) => void; onAuthenticated: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key)

  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
      setLoginError('')
      onAuthenticated()
      return
    }
    setLoginError(t('login.error'))
  }

  return <main className="relative grid min-h-screen place-items-center overflow-x-hidden bg-[#f5f1e9] px-4 py-6 text-[#17201b]">
    <div className="absolute inset-0 bg-cover [background-position:66%_center]" style={{ backgroundImage: `url(${maharashtraHero})` }} aria-hidden="true" />
    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(245,241,233,0.9)_0%,rgba(245,241,233,0.7)_48%,rgba(23,32,27,0.16)_100%)]" aria-hidden="true" />

    <section className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/80 bg-white/94 shadow-[0_24px_64px_rgba(23,31,25,0.2)] backdrop-blur-lg" aria-labelledby="login-title">
      <div className="h-1 bg-[#b63231]" aria-hidden="true" />
      <div className="p-6 sm:p-7">
        <header className="flex items-center justify-between gap-4">
          <img src={msrtcLogo} alt="MSRTC" className="h-12 w-14 object-contain" />
          <div className="flex h-9 items-center rounded-full bg-[#f5f3ee] p-1 text-[11px] font-semibold" aria-label={t('a11y.language')}><button type="button" className={`min-h-7 rounded-full px-2.5 transition-colors ${locale === 'en' ? 'bg-white text-[#155b49] shadow-sm' : 'text-[#737b75]'}`} onClick={() => onLocaleChange('en')} aria-pressed={locale === 'en'}>EN</button><button type="button" className={`min-h-7 rounded-full px-2.5 transition-colors ${locale === 'mr' ? 'bg-white text-[#155b49] shadow-sm' : 'text-[#737b75]'}`} onClick={() => onLocaleChange('mr')} aria-pressed={locale === 'mr'} lang="mr">मराठी</button></div>
        </header>

        <p className="mt-5 mb-1.5 text-[10px] font-bold tracking-[0.18em] text-[#a92f2f] uppercase">{t('login.eyebrow')}</p>
        <h1 id="login-title" className="m-0 text-3xl leading-tight font-semibold tracking-[-0.035em] text-[#101713]">{t('login.title')}</h1>
        <p className="mt-2 mb-0 text-sm leading-6 text-[#68716a]">{t('login.intro')}</p>

        <button type="button" className="mt-4 flex min-h-11 w-full items-center justify-between gap-3 rounded-xl bg-[#f5f1e9] px-3.5 text-left transition-colors hover:bg-[#edf3ee]" onClick={() => { setUsername(DEMO_USERNAME); setPassword(DEMO_PASSWORD); setLoginError('') }}><span className="min-w-0"><span className="block text-[9px] font-bold tracking-[0.12em] text-[#68716a] uppercase">{t('login.credentials')}</span><code className="mt-0.5 block truncate text-xs font-semibold text-[#315348]">{DEMO_USERNAME} · {DEMO_PASSWORD}</code></span><span className="shrink-0 text-xs font-semibold text-[#155b49]">{t('login.useCredentials')}</span></button>

        <form className="mt-4 grid gap-3.5" onSubmit={signIn}>
          <label className="grid gap-1.5 text-sm font-semibold text-[#465149]">{t('login.username')}
            <input className="ui-field text-base font-normal" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" autoFocus required />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-[#465149]">{t('login.password')}
            <input className="ui-field text-base font-normal" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
          </label>

          {loginError && <p className="m-0 rounded-xl border border-[#b63231]/20 bg-[#fff1ee] px-4 py-3 text-sm text-[#703634]" role="alert">{loginError}</p>}

          <button className="ui-button mt-0.5 flex min-h-12 items-center justify-center gap-2 bg-[#b63231] px-5 font-semibold text-white shadow-sm hover:bg-[#922626]">{t('login.submit')} <Icon name="arrow" /></button>
        </form>

        <p className="mt-4 mb-0 border-t border-[#e5e0d7] pt-3 text-[10px] leading-4 text-[#7a827c]">{t('login.disclosure')}</p>
      </div>
    </section>
  </main>
}

type AppHeaderProps = {
  stage: Stage
  working: boolean
  locale: Locale
  onLocaleChange: (locale: Locale) => void
  onStageChange: (stage: Stage) => void
  onMyBooking: () => void
  onReportIssue: () => void
  onSignOut: () => void
}

function AppHeader({ stage, working, locale, onLocaleChange, onStageChange, onMyBooking, onReportIssue, onSignOut }: AppHeaderProps) {
  const t = (key: Parameters<typeof translate>[1], values?: Record<string, string | number>) => translate(locale, key, values)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const navClass = (active: boolean) => `relative flex h-full min-h-11 items-center border-x-0 border-t-0 border-b-2 bg-transparent px-3 text-[13px] font-medium transition-colors duration-180 ${active ? 'border-[#b63231] text-[#17201b]' : 'border-transparent text-[#68716a] hover:text-[#17201b]'}`
  const upgradesClass = (active: boolean) => `group flex min-h-11 items-center gap-2.5 rounded-lg border border-transparent px-2.5 text-[13px] font-semibold transition-colors duration-180 ${active ? 'bg-[#f8ece9] text-[#8f2929]' : 'text-[#39443e] hover:bg-[#faf3ef] hover:text-[#8f2929]'}`
  const bookingActive = stage === 'manage' || stage === 'track'

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMenuOpen(false); triggerRef.current?.focus() }
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => { document.removeEventListener('keydown', onKeyDown); document.removeEventListener('pointerdown', onPointerDown) }
  }, [menuOpen])

  const go = (next: Stage) => { setMenuOpen(false); onStageChange(next) }
  const menuItem = (active: boolean) => `flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-semibold transition-colors ${active ? 'bg-[#eef6f1] text-[#155b49]' : 'text-[#465149] hover:bg-[#faf8f3]'}`

  return (
    <header className="relative z-40 h-[64px] border-b border-[#ded8cc] bg-white lg:h-[72px]">
      <div className="mx-auto flex h-full w-full max-w-6xl items-center px-4 lg:px-6">
        <button className="flex h-[42px] w-12 items-center justify-center border-0 bg-transparent p-0" aria-label={t('a11y.goPlanner')} onClick={() => onStageChange('plan')}>
          <img src={msrtcLogo} alt="" className="h-[42px] w-auto max-w-full object-contain" />
        </button>

        <nav className="ml-5 hidden h-full items-center gap-1 border-l border-[#e5e0d7] pl-4 lg:flex" aria-label={t('a11y.primaryNav')}>
          <button className={upgradesClass(stage === 'test')} aria-current={stage === 'test' ? 'page' : undefined} onClick={() => onStageChange('test')}><span className="grid size-7 shrink-0 place-items-center rounded-md bg-[#b63231] text-[9px] font-bold tracking-[0.08em] text-white shadow-sm" aria-hidden="true">R2</span><span>{t('nav.guide')}</span><span className="text-[#b63231] transition-transform group-hover:translate-x-0.5" aria-hidden="true"><Icon name="chevron" /></span></button>
        </nav>

        <div className="ml-auto hidden h-full items-center gap-2 lg:flex">
          <button className={navClass(stage === 'complaint')} aria-current={stage === 'complaint' ? 'page' : undefined} onClick={onReportIssue}>{t('nav.report')}</button>
          <button className={`ui-button min-h-9 rounded-lg px-3 text-[13px] font-semibold transition-colors ${bookingActive ? 'bg-[#eef6f1] text-[#155b49]' : 'text-[#315348] hover:bg-[#f5f7f4]'}`} aria-current={bookingActive ? 'page' : undefined} onClick={onMyBooking} disabled={working}>{t('nav.booking')}</button>

          <div className="mx-1 h-5 w-px bg-[#e5e0d7]" aria-hidden="true" />

          <div className="flex h-9 items-center rounded-full bg-[#f5f3ee] p-1 text-[11px] font-semibold" aria-label={t('a11y.language')}>
            <button className={`min-h-7 rounded-full px-2.5 transition-colors ${locale === 'en' ? 'bg-white text-[#155b49] shadow-sm' : 'text-[#737b75] hover:text-[#17201b]'}`} onClick={() => onLocaleChange('en')} aria-pressed={locale === 'en'}>EN</button>
            <button className={`min-h-7 rounded-full px-2.5 transition-colors ${locale === 'mr' ? 'bg-white text-[#155b49] shadow-sm' : 'text-[#737b75] hover:text-[#17201b]'}`} onClick={() => onLocaleChange('mr')} aria-pressed={locale === 'mr'} lang="mr">मराठी</button>
          </div>

          <button className="min-h-9 border-0 bg-transparent px-2 text-xs font-medium text-[#7a827c] transition-colors hover:text-[#a92f2f]" onClick={onSignOut}>{t('nav.signOut')}</button>
        </div>

        <div className="ml-auto flex items-center gap-2 lg:hidden" ref={menuRef}>
          <button className="ui-button min-h-11 rounded-xl border border-[#ded8cc] px-3 text-xs font-bold text-[#155b49]" onClick={() => onLocaleChange(locale === 'en' ? 'mr' : 'en')} aria-label={t('a11y.language')}><span aria-hidden="true">{locale === 'en' ? 'मराठी' : 'EN'}</span></button>
          <button ref={triggerRef} className="ui-button grid size-11 place-items-center border border-[#ded8cc] bg-white text-[#17201b]" aria-label={t('nav.menu')} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen((open) => !open)}>
            <span className="grid gap-1" aria-hidden="true"><i className="block h-0.5 w-5 bg-current" /><i className="block h-0.5 w-5 bg-current" /><i className="block h-0.5 w-5 bg-current" /></span>
          </button>
          {menuOpen && <nav id="mobile-navigation" className="ui-dialog absolute top-[calc(100%+8px)] right-4 w-[min(280px,calc(100vw-32px))] rounded-2xl border border-[#ded8cc] bg-white p-2 shadow-[var(--shadow-modal)]" aria-label={t('a11y.primaryNav')}>
            <button className={`group flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-colors ${stage === 'test' ? 'bg-[#f8ece9] text-[#8f2929]' : 'text-[#39443e] hover:bg-[#faf3ef]'}`} onClick={() => go('test')}><span className="grid size-7 shrink-0 place-items-center rounded-md bg-[#b63231] text-[9px] font-bold tracking-[0.08em] text-white" aria-hidden="true">R2</span><span className="flex-1">{t('nav.guide')}</span><span className="text-[#b63231]" aria-hidden="true"><Icon name="chevron" /></span></button>
            <button className={menuItem(stage === 'complaint')} onClick={() => { setMenuOpen(false); onReportIssue() }}>{t('nav.report')}<span aria-hidden="true">→</span></button>
            <button className={menuItem(stage === 'manage')} onClick={() => { setMenuOpen(false); void onMyBooking() }} disabled={working}>{t('nav.booking')}<span aria-hidden="true">→</span></button>
            <div className="my-2 h-px bg-[#ded8cc]" />
            <div className="flex min-h-11 items-center justify-between px-3 text-xs text-[#68716a]"><span>{t('nav.status')}</span><span className="rounded-full border border-[#c99a43] bg-[#fff9e9] px-2.5 py-1 font-semibold text-[#755419]">{t('nav.prototype')}</span></div>
            <button className={`${menuItem(false)} text-[#a92f2f]`} onClick={onSignOut}>{t('nav.signOut')}</button>
          </nav>}
        </div>
      </div>
    </header>
  )
}

function JourneyApp({ locale, onLocaleChange, onSignOut }: { locale: Locale; onLocaleChange: (locale: Locale) => void; onSignOut: () => void }) {
  const [stage, setStage] = useState<Stage>('plan')
  const [origin, setOrigin] = useState('Pune'), [destination, setDestination] = useState('Nashik'), [journeyDate, setJourneyDate] = useState(DEMO_DATE)
  const [natural, setNatural] = useState(''), [showNatural, setShowNatural] = useState(true), [intentMessage, setIntentMessage] = useState(''), [isParsing, setIsParsing] = useState(false)
  const [sortBy, setSortBy] = useState('recommended'), [acOnly, setAcOnly] = useState(false), [results, setResults] = useState<Journey[]>([]), [connections, setConnections] = useState<ConnectingJourney[]>([]), [error, setError] = useState<ApiError | null>(null), [loading, setLoading] = useState(false)
  const [attemptedSearch, setAttemptedSearch] = useState<SearchCriteria | null>(null)
  const [dateAdjustedFrom, setDateAdjustedFrom] = useState('')
  const [resumeAiSearch, setResumeAiSearch] = useState(false)
  const [booking, setBooking] = useState<Booking | null>(null), [journey, setJourney] = useState<Journey | null>(null), [selectedConnection, setSelectedConnection] = useState<ConnectingJourney | null>(null), [passengerName, setPassengerName] = useState(''), [passengerAge, setPassengerAge] = useState(''), [concession, setConcession] = useState<Passenger['concession_type']>('NONE'), [recoveryDemo, setRecoveryDemo] = useState(false), [working, setWorking] = useState(false), [journeyPass, setJourneyPass] = useState<JourneyPass | null>(null), [cancellation, setCancellation] = useState<CancellationPreview | null>(null), [manageId, setManageId] = useState('')
  const [savedBookings, setSavedBookings] = useState<SavedBooking[]>(readSavedBookings)
  const [connectionSeatSelections, setConnectionSeatSelections] = useState<Record<string, string>>({})
  const [network, setNetwork] = useState<DemoNetwork | null>(null), [showNetwork, setShowNetwork] = useState(false)
  const [manageReturnStage, setManageReturnStage] = useState<Stage>('plan')
  const [trackingReturnStage, setTrackingReturnStage] = useState<Stage>('manage')
  const [complaintReturnStage, setComplaintReturnStage] = useState<Stage>('manage')
  const [complaintMode, setComplaintMode] = useState<ComplaintMode>('ENTRY')
  const [tracking, setTracking] = useState<Tracking | null>(null), [complaint, setComplaint] = useState<Complaint | null>(null)
  const [complaintCategory, setComplaintCategory] = useState('BUS CONDITION'), [complaintSubcategory, setComplaintSubcategory] = useState('Broken seat'), [complaintPhoto, setComplaintPhoto] = useState<File | null>(null)
  const [manualOrigin, setManualOrigin] = useState(''), [manualDestination, setManualDestination] = useState(''), [manualJourneyDate, setManualJourneyDate] = useState(DEMO_DATE), [manualTicketNumber, setManualTicketNumber] = useState('')
  const [complaintPhotoPreview, setComplaintPhotoPreview] = useState('')
  const [voiceState, setVoiceState] = useState<'IDLE' | 'REQUESTING_PERMISSION' | 'LISTENING' | 'PROCESSING' | 'TRANSCRIBED' | 'ERROR'>('IDLE')
  const [voiceMessage, setVoiceMessage] = useState('')
  const [voiceNeedsReview, setVoiceNeedsReview] = useState(false)
  const voiceStopRef = useRef<(() => void) | null>(null)
  const modalReturnFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => { window.scrollTo(0, 0); if (stage !== 'plan') voiceStopRef.current?.() }, [stage])
  useEffect(() => () => voiceStopRef.current?.(), [])
  useEffect(() => () => { if (complaintPhotoPreview) URL.revokeObjectURL(complaintPhotoPreview) }, [complaintPhotoPreview])
  useEffect(() => {
    if (!showNetwork && !error && stage !== 'complaint') return
    modalReturnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"]')
    const dialog = dialogs[dialogs.length - 1]
    const focusable = dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
    requestAnimationFrame(() => focusable?.[0]?.focus())
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && focusable?.length) {
        const first = focusable[0], last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
        return
      }
      if (event.key === 'Escape') {
        if (showNetwork) setShowNetwork(false)
        else if (error) {
          setError(null); setLoading(false); setIsParsing(false); setResumeAiSearch(false)
          setIntentMessage(''); setVoiceState('IDLE'); setVoiceMessage('')
          if (stage !== 'complaint') setStage('plan')
        }
        else {
          setComplaint(null); setComplaintMode('ENTRY')
          setStage(complaintReturnStage === 'complaint' ? 'plan' : complaintReturnStage)
        }
      }
    }
    document.addEventListener('keydown', close)
    return () => { document.removeEventListener('keydown', close); modalReturnFocusRef.current?.focus() }
  }, [showNetwork, error, stage, complaintReturnStage, complaintMode, complaint])
  useEffect(() => {
    if (stage !== 'complaint') return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [stage])
  useEffect(() => {
    if (booking?.status === 'CONFIRMED') localStorage.setItem(LAST_BOOKING_KEY, booking.id)
  }, [booking])

  function rememberBooking(pass: JourneyPass, bookingId: string) {
    const firstLeg = pass.legs[0]
    const finalLeg = pass.legs.at(-1)
    const entry: SavedBooking = { id: bookingId, ticketNumber: pass.ticket_number, origin: firstLeg?.boarding_point ?? pass.boarding_point, destination: finalLeg?.destination ?? pass.destination, legCount: pass.legs.length }
    setSavedBookings((current) => {
      const next = [entry, ...current.filter((item) => item.id !== bookingId)].slice(0, 5)
      localStorage.setItem(BOOKING_HISTORY_KEY, JSON.stringify(next))
      return next
    })
  }
  useEffect(() => {
    let active = true
    void fetch(`${API_URL}/demo-network?summary=true`).then(async (response) => {
      if (response.ok && active) {
        const loaded = (await response.json()) as DemoNetwork
        setNetwork(loaded)
        // The API owns the rolling synthetic service window. Align a tab that
        // was left open across midnight before it can submit an unavailable date.
        setJourneyDate((current) => current < loaded.coverage_start || current > loaded.coverage_end ? loaded.coverage_start : current)
      }
    }).catch(() => undefined)
    return () => { active = false }
  }, [])

  async function findBuses(event?: FormEvent<HTMLFormElement>, nextSort = sortBy, criteria?: SearchCriteria, fromAi = false) {
    event?.preventDefault(); setLoading(true); setError(null); setDateAdjustedFrom('')
    const requested = criteria ?? { origin, destination, journeyDate, acOnly }
    const search = { ...requested, origin: canonicalStop(requested.origin), destination: canonicalStop(requested.destination) }
    setAttemptedSearch(search)
    const requestJourney = (candidate: SearchCriteria) => fetch(`${API_URL}/journeys/search`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin: candidate.origin, destination: candidate.destination, journey_date: candidate.journeyDate, air_conditioned: candidate.acOnly || undefined, sort_by: nextSort }),
    })
    try {
      let effectiveSearch = search
      let response = await requestJourney(effectiveSearch)
      let apiError = response.ok ? null : ((await response.json()) as { error: ApiError }).error

      // Confirmed synthetic bookings consume real demo inventory. If an
      // advertised route is full on the selected day, keep the golden path
      // useful by showing its next available seeded date rather than claiming
      // that the route is outside the prototype network.
      if (apiError?.code === 'NO_JOURNEY_FOUND' && network && isAdvertisedDemoRoute(search.origin, search.destination) && !search.acOnly) {
        let candidateDate = nextIsoDate(search.journeyDate)
        while (candidateDate <= network.coverage_end) {
          const candidate = { ...search, journeyDate: candidateDate }
          const candidateResponse = await requestJourney(candidate)
          if (candidateResponse.ok) {
            response = candidateResponse; apiError = null; effectiveSearch = candidate
            setJourneyDate(candidateDate); setDateAdjustedFrom(search.journeyDate); setAttemptedSearch(candidate)
            break
          }
          candidateDate = nextIsoDate(candidateDate)
        }
      }

      if (!response.ok || apiError) {
        const currentError = apiError ?? ((await response.json()) as { error: ApiError }).error
        const canResume = fromAi && currentError.code === 'AMBIGUOUS_STOP'
        setResumeAiSearch(canResume); if (!canResume) setIntentMessage(''); setError(currentError); return
      }
      const data = (await response.json()) as { results: Journey[]; connecting_results: ConnectingJourney[] }
      setResults(data.results); setConnections(data.connecting_results); setIntentMessage(''); setResumeAiSearch(false); setVoiceState('IDLE'); setVoiceMessage(''); setStage('choose')
    } catch {
      setIntentMessage(''); setResumeAiSearch(false); setError({ code: 'SERVICE_UNAVAILABLE', message: 'We could not load buses right now. Your journey details are still here—please try again.', details: {} })
    } finally { setLoading(false) }
  }
  function recognisedVoiceCriteria(query: string): SearchCriteria | null {
    const stopSpokenIn = (words: string) => {
      const normalised = words.toLocaleLowerCase()
      if (normalised.includes('demo destination') || normalised.includes('नमुना गंतव्य')) return 'Demo Destination'
      if (normalised.includes('nashik road') || normalised.includes('नाशिक रोड')) return 'Nashik Road'
      if (normalised.includes('nashik cbs') || normalised.includes('नाशिक सीबीएस')) return 'Nashik CBS'
      if (normalised.includes('nashik') || normalised.includes('nasik') || normalised.includes('नाशिक') || normalised.includes('नाशीक') || normalised.includes('नासिक')) return 'Nashik'
      if (normalised.includes('mumbai') || normalised.includes('bombay') || normalised.includes('मुंबई') || normalised.includes('मुम्बई')) return 'Mumbai'
      if (normalised.includes('pune') || normalised.includes('poona') || normalised.includes('पुणे') || normalised.includes('पुण्या') || normalised.includes('पुने') || normalised.includes('पूणे')) return 'Pune'
      if (normalised.includes('satara') || normalised.includes('सातारा') || normalised.includes('साताऱ्या') || normalised.includes('सतारा')) return 'Satara'
      return undefined
    }
    const [spokenOrigin, ...spokenDestination] = query.split(/\s+(?:to|ते|टू)\s+/i)
    let origin = spokenDestination.length ? stopSpokenIn(spokenOrigin) : undefined
    let destination = spokenDestination.length ? stopSpokenIn(spokenDestination.join(' ')) : undefined
    if (!origin || !destination) {
      const orderedStops = [
        { value: 'Pune', aliases: ['pune', 'poona', 'पुणे', 'पुण्या', 'पुने', 'पूणे'] }, { value: 'Mumbai', aliases: ['mumbai', 'bombay', 'मुंबई', 'मुम्बई'] },
        { value: 'Nashik', aliases: ['nashik', 'nasik', 'नाशिक', 'नाशीक', 'नासिक'] }, { value: 'Satara', aliases: ['satara', 'सातारा', 'साताऱ्या', 'सतारा'] },
        { value: 'Demo Destination', aliases: ['demo destination', 'नमुना गंतव्य'] },
      ].map((stop) => ({ ...stop, index: Math.min(...stop.aliases.map((alias) => query.toLocaleLowerCase().indexOf(alias)).filter((index) => index >= 0)) })).filter((stop) => Number.isFinite(stop.index)).sort((a, b) => a.index - b.index)
      origin = orderedStops[0]?.value
      destination = orderedStops[1]?.value
    }
    if (!origin || !destination || origin.toLocaleLowerCase() === destination.toLocaleLowerCase()) return null
    return {
      // Send the spoken stop term, rather than guessing between e.g. Nashik
      // CBS, Mahamarg, and Road. The server's stop resolver can then ask.
      origin,
      destination,
      journeyDate: /\btomorrow\b/i.test(query) || query.includes('उद्या') || query.includes('टुमॉरो') || query.includes('टुमारो') ? network?.coverage_start ?? dateInIndia(1) : journeyDate,
      acOnly: /\b(?:ac|air[- ]?conditioned)\b/i.test(query) || query.includes('एसी'),
    }
  }
  async function searchRecognisedVoiceRequest(query: string) {
    const criteria = recognisedVoiceCriteria(query)
    if (!criteria) return false
    setOrigin(stopName(criteria.origin)); setDestination(stopName(criteria.destination)); setJourneyDate(criteria.journeyDate); setAcOnly(criteria.acOnly); setResumeAiSearch(true)
    setVoiceMessage(t('voice.fallback'))
    await findBuses(undefined, sortBy, criteria, true)
    return true
  }
  async function parseIntent(query = natural, fromVoice = false) { setIsParsing(true); setIntentMessage(''); try { const response = await fetch(`${API_URL}/intent/parse`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) }); if (!response.ok) { if (fromVoice) { if (await searchRecognisedVoiceRequest(query)) return; setVoiceState('ERROR'); setVoiceMessage(t('voice.needsDetails')); return }; setIntentMessage(t('search.unavailable')); return }; const intent = (await response.json()) as ParsedIntent; const saysTomorrow = /\b(?:tomorrow|उद्या)\b/i.test(query) || query.includes('टुमॉरो') || query.includes('टुमारो'); const criteria = { origin: canonicalStop(intent.origin), destination: canonicalStop(intent.destination), journeyDate: fromVoice && saysTomorrow ? network?.coverage_start ?? dateInIndia(1) : intent.travel_date, acOnly: intent.preferences.air_conditioned === true }; setOrigin(stopName(criteria.origin)); setDestination(stopName(criteria.destination)); setJourneyDate(criteria.journeyDate); setAcOnly(criteria.acOnly); setResumeAiSearch(true); setIntentMessage(t('search.understood')); await findBuses(undefined, sortBy, criteria, true) } catch { if (fromVoice && await searchRecognisedVoiceRequest(query)) return; setResumeAiSearch(false); setIntentMessage(t('search.unavailable')); if (fromVoice) { setVoiceState('ERROR'); setVoiceMessage(t('voice.parserUnavailable')) } } finally { setIsParsing(false) } }
  function selectStop(candidate: StopCandidate) {
    const field = error?.details.field
    const criteria = { origin: field === 'origin' ? candidate.name : origin, destination: field === 'origin' ? destination : candidate.name, journeyDate, acOnly }
    setOrigin(stopName(criteria.origin)); setDestination(stopName(criteria.destination)); setError(null)
    void findBuses(undefined, sortBy, criteria, resumeAiSearch)
  }
  async function selectJourney(nextJourney: Journey) { setWorking(true); setError(null); try { const response = await fetch(`${API_URL}/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trip_id: nextJourney.trip_id }) }); if (!response.ok) { setError(((await response.json()) as { error: ApiError }).error); return }; setJourney(nextJourney); setSelectedConnection(null); setConnectionSeatSelections({}); setBooking((await response.json()) as Booking); setJourneyPass(null); setTracking(null); setComplaint(null); setCancellation(null); setStage('book') } catch { setError({ code: 'SERVICE_UNAVAILABLE', message: 'We could not start this booking. Please try again.', details: {} }) } finally { setWorking(false) } }
  async function selectConnection(connection: ConnectingJourney) { setWorking(true); setError(null); try { const response = await fetch(`${API_URL}/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trip_ids: connection.segments.map((segment) => segment.trip_id) }) }); if (!response.ok) { setError(((await response.json()) as { error: ApiError }).error); return }; setJourney(null); setSelectedConnection(connection); setConnectionSeatSelections({}); setBooking((await response.json()) as Booking); setJourneyPass(null); setTracking(null); setComplaint(null); setCancellation(null); setStage('book') } catch { setError({ code: 'SERVICE_UNAVAILABLE', message: 'We could not start this connected booking. Please try again.', details: {} }) } finally { setWorking(false) } }
  async function bookingRequest(path: string, options?: RequestInit) { if (!booking) return null; setWorking(true); setError(null); try { const response = await fetch(`${API_URL}/bookings/${booking.id}${path}`, options); if (!response.ok) { setError(((await response.json()) as { error: ApiError }).error); return null }; return response } catch { setError({ code: 'SERVICE_UNAVAILABLE', message: 'We could not update your booking. Please try again.', details: {} }); return null } finally { setWorking(false) } }
  async function holdSeat(number: string) { const response = await bookingRequest('/seats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seat_numbers: [number] }) }); if (response) setBooking((await response.json()) as Booking) }
  async function holdConnectionSeats() { if (!booking || Object.keys(connectionSeatSelections).length !== booking.trip_ids.length) return; const response = await bookingRequest('/seats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seat_selections: booking.trip_ids.map((tripId) => ({ trip_id: tripId, seat_number: connectionSeatSelections[tripId] })) }) }); if (response) setBooking((await response.json()) as Booking) }
  async function savePassenger(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const response = await bookingRequest('/passengers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: passengerName, age: Number(passengerAge), concession_type: concession }) }); if (response) setBooking((await response.json()) as Booking) }
  async function pay() { const response = await bookingRequest('/payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmation_failure_demo: recoveryDemo }) }); if (response) setBooking((await response.json()) as Booking) }
  async function confirm() {
    const response = await bookingRequest('/confirm', { method: 'POST' })
    if (!response) return
    const confirmed = (await response.json()) as Booking
    setBooking(confirmed)
    if (confirmed.status === 'CONFIRMED') {
      try {
        const ticketResponse = await fetch(`${API_URL}/bookings/${confirmed.id}/ticket`)
        if (ticketResponse.ok) {
          const pass = (await ticketResponse.json()) as JourneyPass
          setJourneyPass(pass)
          rememberBooking(pass, confirmed.id)
        }
      } catch { /* The confirmed booking remains valid even if its pass needs to be retried. */ }
    }
  }
  async function showPass() { if (!booking) return; const response = await bookingRequest('/ticket'); if (response) { const pass = (await response.json()) as JourneyPass; setJourneyPass(pass); rememberBooking(pass, booking.id); setStage('pass') } }
  async function openManage(current = booking?.id, returnStage: Stage = stage) { if (!current) { setManageReturnStage('plan'); setStage('manage'); return } setWorking(true); setError(null); try { const response = await fetch(`${API_URL}/bookings/${current}/cancellation-preview`); if (!response.ok) { setError(((await response.json()) as { error: ApiError }).error); return }; setCancellation((await response.json()) as CancellationPreview); setManageReturnStage(returnStage === 'pass' ? 'pass' : 'plan'); setStage('manage') } catch { setError({ code: 'SERVICE_UNAVAILABLE', message: 'We could not open booking management. Please try again.', details: {} }) } finally { setWorking(false) } }
  async function loadBooking(current: string) {
    setWorking(true); setError(null)
    try {
      const response = await fetch(`${API_URL}/bookings/${current}`)
      if (!response.ok) {
        const apiError = ((await response.json()) as { error: ApiError }).error
        if (apiError.code === 'BOOKING_NOT_FOUND') { localStorage.removeItem(LAST_BOOKING_KEY); setBooking(null); setJourney(null); setJourneyPass(null); setCancellation(null); setStage('manage') }
        setError(apiError); return
      }
      const loadedBooking = (await response.json()) as Booking
      let loadedPass: JourneyPass | null = null
      if (loadedBooking.status === 'CONFIRMED' || loadedBooking.status === 'CANCELLED') {
        const ticketResponse = await fetch(`${API_URL}/bookings/${current}/ticket`)
        if (ticketResponse.ok) loadedPass = (await ticketResponse.json()) as JourneyPass
      }
      const cancellationResponse = await fetch(`${API_URL}/bookings/${current}/cancellation-preview`)
      if (!cancellationResponse.ok) { setError(((await cancellationResponse.json()) as { error: ApiError }).error); return }
      setBooking(loadedBooking); setJourney(null); setJourneyPass(loadedPass); setTracking(null); setComplaint(null); if (loadedPass) rememberBooking(loadedPass, current); setCancellation((await cancellationResponse.json()) as CancellationPreview); setManageId(current); setManageReturnStage('plan'); setStage('manage')
    } catch { setError({ code: 'SERVICE_UNAVAILABLE', message: 'We could not find that booking. Please try again.', details: {} }) } finally { setWorking(false) }
  }
  async function findBooking(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (manageId.trim()) await loadBooking(manageId.trim()) }
  async function openMyBooking() {
    setBooking(null); setJourney(null); setJourneyPass(null); setCancellation(null); setManageReturnStage('plan'); setStage('manage')
  }
  async function cancel() { const response = await bookingRequest('/cancel', { method: 'POST' }); if (response) setBooking((await response.json()) as Booking) }
  async function advanceRefund() { const response = await bookingRequest('/refund/advance', { method: 'POST' }); if (response) setBooking((await response.json()) as Booking) }
  async function openTracking(demoState?: Tracking['state']) { if (!booking) return; setWorking(true); try { const response = await fetch(`${API_URL}/bookings/${booking.id}/tracking${demoState ? `?demo_state=${demoState}` : ''}`); if (!response.ok) throw new Error(); setTracking((await response.json()) as Tracking); if (stage !== 'track') setTrackingReturnStage('manage'); setStage('track') } catch { setError({ code: 'SERVICE_UNAVAILABLE', message: 'Tracking is unavailable right now. Your journey pass is still available.', details: {} }) } finally { setWorking(false) } }
  async function openComplaint() {
    if (!booking) return
    setWorking(true); setError(null); setComplaint(null); setComplaintMode('BOOKING'); setComplaintReturnStage(stage === 'pass' ? 'pass' : 'manage')
    try {
      let pass = journeyPass
      if (!pass) {
        const ticketResponse = await fetch(`${API_URL}/bookings/${booking.id}/ticket`)
        if (!ticketResponse.ok) { setError(((await ticketResponse.json()) as { error: ApiError }).error); return }
        pass = (await ticketResponse.json()) as JourneyPass
        setJourneyPass(pass)
      }
      if (booking.status === 'CONFIRMED') {
        try {
          const trackingResponse = await fetch(`${API_URL}/bookings/${booking.id}/tracking?demo_state=BUS_ASSIGNED`)
          setTracking(trackingResponse.ok ? (await trackingResponse.json()) as Tracking : null)
        } catch { setTracking(null) }
      } else setTracking(null)
      setStage('complaint')
    } finally { setWorking(false) }
  }
  function openComplaintHub() {
    setError(null); setComplaint(null); setComplaintMode('ENTRY'); setComplaintReturnStage(stage === 'complaint' ? complaintReturnStage : stage); setStage('complaint')
  }
  function closeComplaint() { setError(null); setComplaint(null); setComplaintMode('ENTRY'); setStage(complaintReturnStage === 'complaint' ? 'plan' : complaintReturnStage) }
  function returnToComplaintOptions() { setComplaint(null); setComplaintMode('ENTRY'); setStage('complaint') }
  async function openSavedComplaint(current: string) {
    setWorking(true); setError(null); setComplaint(null)
    try {
      const [bookingResponse, ticketResponse] = await Promise.all([fetch(`${API_URL}/bookings/${current}`), fetch(`${API_URL}/bookings/${current}/ticket`)])
      if (!bookingResponse.ok || !ticketResponse.ok) throw new Error()
      const loadedBooking = (await bookingResponse.json()) as Booking
      const loadedPass = (await ticketResponse.json()) as JourneyPass
      setBooking(loadedBooking); setJourneyPass(loadedPass); setJourney(null); setTracking(null); setComplaintMode('BOOKING'); setStage('complaint')
    } catch { setError({ code: 'SERVICE_UNAVAILABLE', message: 'We could not open that journey for reporting. Please try again.', details: {} }) } finally { setWorking(false) }
  }
  function chooseComplaintPhoto(next: File | null) {
    setError(null)
    if (next && !next.type.startsWith('image/')) { setError({ code: 'PHOTO_INVALID_TYPE', message: t('complaint.invalidType'), details: {} }); return }
    if (next && next.size > 5_000_000) { setError({ code: 'PHOTO_TOO_LARGE', message: t('complaint.tooLarge'), details: {} }); return }
    setComplaintPhoto(next); setComplaintPhotoPreview(next ? URL.createObjectURL(next) : '')
  }
  async function submitComplaint(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (complaintMode === 'BOOKING' && !booking) return; setWorking(true); try { const photo = { photo_name: complaintPhoto?.name, photo_content_type: complaintPhoto?.type, photo_size_bytes: complaintPhoto?.size }; const response = await fetch(complaintMode === 'MANUAL' ? `${API_URL}/complaints` : `${API_URL}/bookings/${booking!.id}/complaints`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(complaintMode === 'MANUAL' ? { ...photo, category: complaintCategory, subcategory: complaintSubcategory, origin: manualOrigin, destination: manualDestination, journey_date: manualJourneyDate, ticket_number: manualTicketNumber.trim() || null } : { ...photo, category: complaintCategory, subcategory: complaintSubcategory }) }); if (!response.ok) throw new Error(); setComplaint((await response.json()) as Complaint) } catch { setError({ code: 'SERVICE_UNAVAILABLE', message: 'We could not submit this simulated complaint. Please try again.', details: {} }) } finally { setWorking(false) } }
  const bookStep = !booking || booking.status === 'DRAFT' ? 'seat' : booking.status === 'SEATS_HELD' && !booking.passenger ? 'passenger' : booking.status === 'SEATS_HELD' ? 'payment' : booking.status === 'PAYMENT_RECEIVED' ? 'confirm' : booking.status === 'CONFIRMED' ? 'confirmed' : 'failed'

  const t = (key: Parameters<typeof translate>[1], values?: Record<string, string | number>) => translate(locale, key, values)
  const stopName = (value: string | null | undefined) => localizeStop(locale, value)
  const apiErrorMessage = (current: ApiError | null) => {
    if (!current) return ''
    if (current.code === 'DATE_OUT_OF_RANGE' || current.code === 'DATE_OUTSIDE_DEMO_WINDOW') return t(`api.${current.code}`, { start: current.details.start_date ?? '', end: current.details.end_date ?? '' })
    const translated = t(`api.${current.code}`)
    return translated === `api.${current.code}` ? (locale === 'en' ? current.message : t('api.default')) : translated
  }
  async function startVoiceSearch() {
    voiceStopRef.current?.()
    setVoiceNeedsReview(false)
    setVoiceState('REQUESTING_PERMISSION'); setVoiceMessage(t('voice.permission'))
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setVoiceState('ERROR'); setVoiceMessage(t('voice.unsupported')); return }
    let stream: MediaStream
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }) } catch { setVoiceState('ERROR'); setVoiceMessage(t('voice.denied')); return }
    const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((type) => MediaRecorder.isTypeSupported(type))
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
    const chunks: Blob[] = []
    const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition
    const voice = SpeechRecognition ? new SpeechRecognition() : null
    let silenceTimeout: number | undefined
    let shouldListen = true
    let hasStarted = false
    let heardSpeech = false
    let discardRecording = false
    const release = (discard = false) => {
      discardRecording = discard
      if (silenceTimeout) window.clearTimeout(silenceTimeout)
      shouldListen = false
      voice?.stop()
      if (recorder.state !== 'inactive') recorder.stop()
      stream.getTracks().forEach((track) => track.stop())
      voiceStopRef.current = null
    }
    const finishAndTranscribe = () => {
      if (!shouldListen) return
      setVoiceState('PROCESSING')
      setVoiceMessage(t('voice.transcribing'))
      release()
    }
    const armSilenceTimer = (delay = heardSpeech ? 3_500 : 10_000) => {
      if (silenceTimeout) window.clearTimeout(silenceTimeout)
      silenceTimeout = window.setTimeout(() => {
        finishAndTranscribe()
      }, delay)
    }
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
    recorder.onerror = () => { release(true); setVoiceState('ERROR'); setVoiceMessage(t('voice.recordingError')) }
    recorder.onstop = async () => {
      if (discardRecording) return
      const recording = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
      if (!recording.size) { setVoiceState('ERROR'); setVoiceMessage(t('voice.noSpeech')); return }
      try {
        const response = await fetch(`${API_URL}/voice/transcribe`, { method: 'POST', headers: { 'Content-Type': recording.type, 'X-Voice-Locale': locale }, body: recording })
        if (!response.ok) { const payload = (await response.json()) as { error?: ApiError }; throw new Error(payload.error?.message) }
        const rawTranscript = ((await response.json()) as { transcript: string }).transcript.trim()
        if (!rawTranscript) throw new Error(t('voice.noSpeech'))
        const transcript = normaliseVoiceTranscript(rawTranscript, locale)
        setNatural(transcript)
        setVoiceMessage('')
        void parseIntent(transcript, true)
      } catch (error) {
        setVoiceState('ERROR')
        setVoiceMessage(error instanceof Error && error.message && locale === 'en' ? error.message : t('voice.transcriptionError'))
      }
    }
    recorder.start()
    if (voice) {
      voice.lang = languageTag(locale); voice.interimResults = true; voice.continuous = true; voice.maxAlternatives = 1
      voice.onstart = () => {
        setVoiceState('LISTENING')
        setVoiceMessage(t('voice.listening'))
        // Recognition is only a local end-of-speech signal. The server uses
        // the same selected locale as a transcription hint and still permits
        // ordinary English/Marathi code-switching.
        if (!hasStarted) { hasStarted = true; armSilenceTimer() }
      }
      voice.onresult = () => { heardSpeech = true; setVoiceMessage(t('voice.listening')); armSilenceTimer() }
      voice.onerror = () => { if (!hasStarted) { setVoiceState('LISTENING'); setVoiceMessage(t('voice.listening')); armSilenceTimer() } }
      voice.onend = () => {
        if (shouldListen && silenceTimeout) { try { voice.start(); return } catch { /* recording remains active until its deadline */ } }
      }
      try { voice.start() } catch { setVoiceState('LISTENING'); setVoiceMessage(t('voice.listening')); armSilenceTimer() }
    } else {
      setVoiceState('LISTENING')
      setVoiceMessage(t('voice.listening'))
      armSilenceTimer()
    }
    voiceStopRef.current = () => release(true)
  }
  function stopVoiceSearch() { voiceStopRef.current?.(); setVoiceState('IDLE'); setVoiceMessage(t('voice.stopped')) }
  function returnToPlanner() { setError(null); setLoading(false); setIsParsing(false); setResumeAiSearch(false); setIntentMessage(''); setVoiceState('IDLE'); setVoiceMessage(''); setStage('plan') }
  function changeLocale(nextLocale: Locale) {
    setOrigin((current) => localizeStop(nextLocale, canonicalStop(current)))
    setDestination((current) => localizeStop(nextLocale, canonicalStop(current)))
    onLocaleChange(nextLocale)
  }

  const visibleStage = stage === 'complaint' ? (complaintReturnStage === 'complaint' ? 'plan' : complaintReturnStage) : stage
  return <div className="min-h-screen bg-[#f5f1e9] font-sans text-[#17201b]"><AppHeader stage={stage} working={working} locale={locale} onLocaleChange={changeLocale} onStageChange={setStage} onMyBooking={() => void openMyBooking()} onReportIssue={openComplaintHub} onSignOut={onSignOut} /><main>{visibleStage === 'plan' && PlanScreen()}{visibleStage === 'choose' && ChooseScreen()}{visibleStage === 'book' && BookScreen()}{visibleStage === 'pass' && PassScreen()}{visibleStage === 'manage' && ManageScreen()}{visibleStage === 'track' && TrackingScreen()}{visibleStage === 'test' && <TesterGuidePage locale={locale} onBack={() => setStage('plan')} />}{stage === 'complaint' && ComplaintScreen()}</main></div>

  function PlanScreen() {
    const aiWorking = voiceState === 'PROCESSING' || isParsing || (loading && resumeAiSearch)
    const demoJourneys = [
      { from: 'Pune', to: 'Nashik', label: t('prototype.puneNashik'), hint: t('search.puneNashikHint') },
      { from: 'Mumbai', to: 'Pune', label: t('prototype.mumbaiPune'), hint: t('search.mumbaiPuneHint') },
      { from: 'Pune', to: 'Satara', label: t('prototype.puneSatara'), hint: t('search.directService') },
      { from: 'Pune', to: 'Demo Destination', label: t('prototype.puneDemo'), hint: t('search.connectionHint') },
    ]
    const setQuickJourney = (from: string, to: string) => {
      setOrigin(stopName(from))
      setDestination(stopName(to))
      setAcOnly(false)
      setDateAdjustedFrom('')
      setNatural(locale === 'mr' ? `${stopName(from)} ते ${stopName(to)} उद्या सकाळी` : `${from} to ${to} tomorrow morning`)
      setShowNatural(true)
    }

    return <div className="ui-page overflow-x-hidden">
      <section className="relative h-[400px] min-h-[360px] bg-cover [background-position:66%_68%] sm:h-[500px] sm:[background-position:center_66%]" style={{ backgroundImage: `url(${maharashtraHero})` }}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#f5f1e9]/5 via-transparent to-[#f5f1e9]/55" aria-hidden="true" />
        <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col items-center justify-start px-4 pt-16 pb-16 text-center sm:justify-center sm:pt-0 sm:pb-20 lg:px-6">
          <div className="mb-3 flex items-center justify-center gap-3 text-[#747a74]">
            <span className="hidden h-px w-8 bg-[#b9a98e] sm:block" aria-hidden="true" />
            <p className="text-[10px] font-semibold tracking-[0.18em] uppercase">{t('search.corporation')}</p>
            <span className="hidden h-px w-8 bg-[#b9a98e] sm:block" aria-hidden="true" />
          </div>
          <h1 className="max-w-3xl font-['Kohinoor_Devanagari','Noto_Sans_Devanagari','Mangal',sans-serif] text-[36px] leading-[1.16] font-bold text-[#a92f2f] drop-shadow-[0_1px_0_rgba(255,255,255,0.35)] sm:text-[50px] lg:text-[54px]" lang="mr"><span className="block">जनसामान्यांसाठी</span><span className="mt-1 block">रस्ता तिथे एस.टी</span></h1>
          <span className="mt-3 block h-0.5 w-12 rounded-full bg-[#c99a43]" aria-hidden="true" />
          <p className="mt-3 max-w-xl text-sm leading-6 font-medium text-[#4f5b54] sm:text-base sm:leading-7">{t('search.hero')}</p>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-14 w-full max-w-6xl px-4 sm:-mt-20 lg:px-6" aria-label={t('a11y.journeyPlanner')}>
        <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/72 p-3 shadow-[0_18px_50px_rgba(20,28,22,0.16)] backdrop-blur-xl">
          {showNatural && <div className={`group relative grid grid-cols-[minmax(0,1fr)_44px_44px] items-center gap-2 overflow-hidden rounded-xl border bg-white/90 px-3 py-3 shadow-sm transition focus-within:ring-2 sm:gap-3 sm:px-4 ${aiWorking ? 'ai-search-surface border-[#c99a43] ring-[#c99a43]/12' : 'border-white/80 focus-within:border-[#155b49]/35 focus-within:ring-[#155b49]/8'}`} aria-busy={aiWorking}>
            {aiWorking && <span className="ai-search-progress" aria-hidden="true" />}
            <div className="min-w-0">
              <label className="mb-1 flex items-center gap-2 text-xs font-bold text-[#155b49]" htmlFor="journey-description"><span className={`grid size-5 place-items-center rounded-md bg-[#eaf4ef] ${aiWorking ? 'text-[#b17d22]' : 'text-[#155b49]'}`}><Icon name="sparkle" /></span>{aiWorking ? t('voice.planningLabel') : t('search.ai')}</label>
              <input id="journey-description" className="w-full border-0 bg-transparent p-0 text-base font-medium text-[#101713] outline-none placeholder:font-normal placeholder:text-[#858c87] focus:outline-none" value={natural} onChange={(event) => setNatural(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !aiWorking && natural.trim()) { event.preventDefault(); void parseIntent() } }} placeholder={t('search.placeholder')} readOnly={aiWorking} />
            </div>
            <button type="button" className={`grid size-11 place-items-center rounded-xl border transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#c99a43] ${voiceState === 'LISTENING' ? 'border-[#b63231] bg-[#fff1ee] text-[#b63231] motion-safe:animate-pulse' : 'border-[#cbc7bd] bg-white text-[#68716a] hover:border-[#155b49] hover:text-[#155b49]'}`} aria-label={voiceState === 'LISTENING' ? t('voice.cancel') : t('voice.start')} aria-pressed={voiceState === 'LISTENING'} onClick={voiceState === 'LISTENING' ? stopVoiceSearch : () => void startVoiceSearch()} disabled={aiWorking}><Icon name="microphone" /></button>
            {aiWorking ? <span className="grid size-11 place-items-center rounded-xl bg-[#155b49] text-white shadow-sm" aria-label={t('a11y.planning')}><span className="ai-search-spinner" aria-hidden="true" /></span> : <button type="button" className="grid size-11 place-items-center rounded-xl bg-[#155b49] text-white shadow-sm transition hover:bg-[#104838] disabled:cursor-not-allowed disabled:bg-[#b17d22]" aria-label={t('voice.plan')} onClick={() => void parseIntent()} disabled={!natural.trim()}><Icon name="arrow" /></button>}
            {(intentMessage || voiceMessage) && <p className={voiceState === 'TRANSCRIBED' && !voiceNeedsReview ? 'sr-only' : 'col-span-3 text-sm text-[#0f4b3c]'} aria-live="polite">{voiceMessage || intentMessage}</p>}
            {voiceState !== 'IDLE' && voiceState !== 'TRANSCRIBED' && !aiWorking && <p className="col-span-3 text-xs text-[#68716a]">{t('voice.help')}</p>}
          </div>}

          <div className="flex items-center gap-3 px-2 py-2" aria-hidden="true"><span className="h-px flex-1 bg-black/10" /><span className="text-[10px] font-bold tracking-[0.14em] text-[#747c76] uppercase">{t('search.manual')}</span><span className="h-px flex-1 bg-black/10" /></div>
          <form className="grid overflow-hidden rounded-2xl border border-white/80 bg-white/72 shadow-sm md:grid-cols-[1fr_44px_1fr_1fr_auto]" onSubmit={(event) => void findBuses(event)}>
            <label className="grid gap-1 border-b border-black/10 px-5 py-3 md:border-r md:border-b-0 [@media_(min-width:1024px)_and_(max-height:900px)]:py-2"><span className="text-[10px] font-bold tracking-[0.16em] text-[#6b746e] uppercase">{t('search.from')}</span><input className="min-w-0 border-0 bg-transparent p-0 text-lg font-semibold tracking-[-0.01em] outline-none focus:outline-none [@media_(min-width:1024px)_and_(max-height:900px)]:text-base" value={origin} onChange={(event) => setOrigin(event.target.value)} list="supported-stops" autoComplete="off" required /></label>
            <span className="hidden place-items-center text-[#b63231] md:grid"><span className="grid size-8 place-items-center rounded-full bg-[#fff0ec]"><Icon name="arrow" /></span></span>
            <label className="grid gap-1 border-b border-black/10 px-5 py-3 md:border-r md:border-b-0 [@media_(min-width:1024px)_and_(max-height:900px)]:py-2"><span className="text-[10px] font-bold tracking-[0.16em] text-[#6b746e] uppercase">{t('search.to')}</span><input className="min-w-0 border-0 bg-transparent p-0 text-lg font-semibold tracking-[-0.01em] outline-none focus:outline-none [@media_(min-width:1024px)_and_(max-height:900px)]:text-base" value={destination} onChange={(event) => setDestination(event.target.value)} list="supported-stops" autoComplete="off" required /></label>
            <label className="grid gap-1 border-b border-black/10 px-5 py-3 md:border-r md:border-b-0 [@media_(min-width:1024px)_and_(max-height:900px)]:py-2"><span className="text-[10px] font-bold tracking-[0.16em] text-[#6b746e] uppercase">{t('search.date')}</span><input className="min-w-0 border-0 bg-transparent p-0 text-lg font-semibold tracking-[-0.01em] outline-none focus:outline-none [@media_(min-width:1024px)_and_(max-height:900px)]:text-base" type="date" value={journeyDate} min={network?.coverage_start} max={network?.coverage_end} onChange={(event) => setJourneyDate(event.target.value)} required /></label>
            <button className="flex min-h-16 items-center justify-center gap-3 bg-[#b63231] px-7 font-semibold text-white transition hover:bg-[#902525] focus-visible:outline-3 focus-visible:outline-offset-[-4px] focus-visible:outline-[#f0c775] disabled:opacity-60 [@media_(min-width:1024px)_and_(max-height:900px)]:min-h-14" disabled={loading}>{loading ? t('search.finding') : <>{t('search.submit')} <Icon name="arrow" /></>}</button>
          </form>
          <datalist id="supported-stops">{network?.stops.map((stop) => <option key={stop.id} value={stopName(stop.name)}>{stopName(stop.city)}</option>)}</datalist>
        </div>
      </section>

      <section className="mx-auto mt-7 w-full max-w-6xl px-4 lg:px-6" aria-labelledby="popular-journeys">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="popular-journeys" className="m-0 text-base font-semibold text-[#263029]">{t('search.demoJourneyCount', { count: demoJourneys.length })}</h2>
          <button className="min-h-11 border-0 bg-transparent px-1 text-xs font-semibold text-[#0f4b3c] underline decoration-[#0f4b3c]/25 underline-offset-4 transition hover:text-[#a92f2f]" onClick={() => setShowNetwork(true)}>{t('search.aboutDemo')}</button>
        </header>
        <div className="grid gap-3 sm:grid-cols-2">
          {demoJourneys.map((example) => <button key={`${example.from}-${example.to}`} className="group flex min-h-18 items-center justify-between rounded-xl border border-[#ded8cc] bg-white px-5 text-left transition hover:border-[#155b49]/45 hover:shadow-sm" onClick={() => setQuickJourney(example.from, example.to)}><span><strong className="block text-base font-semibold text-[#17201b]">{example.label}</strong><small className="mt-1 block text-[#6b746e]">{example.hint}</small></span><span className="text-[#b63231]"><Icon name="arrow" /></span></button>)}
        </div>
      </section>

      <ProductFaq locale={locale} />

      <footer className="w-full border-t border-[#ded8cc]"><div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-[#727a74] lg:px-6"><span>{t('search.syntheticFooter')}</span><span>{t('search.noPaymentFooter')}</span></div></footer>
      {showNetwork && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#17201b]/65 p-4" role="dialog" aria-modal="true" aria-labelledby="network-title"><section className="w-full max-w-3xl rounded-2xl border border-[#ded8cc] bg-white p-5 shadow-[0_24px_72px_rgba(8,23,17,0.3)] sm:p-7"><div className="flex items-start justify-between gap-5"><div><p className="mb-2 text-[10px] font-bold tracking-[0.18em] text-[#a92f2f] uppercase">{t('network.eyebrow')}</p><h2 id="network-title" className="m-0 text-3xl font-semibold tracking-[-0.03em]">{t('network.title')}</h2><p className="mt-2 text-sm leading-6 text-[#68716a]">{t('network.range', { start: network ? formatDate(network.coverage_start, locale) : t('network.tomorrow'), end: network ? formatDate(network.coverage_end, locale) : t('network.nextDays') })}</p></div><button className="rounded-xl border border-[#ded8cc] px-4 py-2 text-sm font-semibold text-[#59645e] hover:bg-[#f5f1e9]" onClick={() => setShowNetwork(false)}>{t('common.close')}</button></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-[#ded8cc] bg-[#faf8f3] p-4"><strong className="block text-sm">{t('prototype.puneNashik')}</strong><span className="mt-1 block text-xs leading-5 text-[#68716a]">{t('network.puneNashik')}</span></div><div className="rounded-xl border border-[#ded8cc] bg-[#faf8f3] p-4"><strong className="block text-sm">{t('prototype.mumbaiPune')}</strong><span className="mt-1 block text-xs leading-5 text-[#68716a]">{t('network.mumbaiPune')}</span></div><div className="rounded-xl border border-[#ded8cc] bg-[#faf8f3] p-4"><strong className="block text-sm">{t('prototype.puneSatara')}</strong><span className="mt-1 block text-xs leading-5 text-[#68716a]">{t('network.puneSatara')}</span></div><div className="rounded-xl border border-[#ded8cc] bg-[#faf8f3] p-4"><strong className="block text-sm">{t('prototype.puneDemo')}</strong><span className="mt-1 block text-xs leading-5 text-[#68716a]">{t('network.puneDemo')}</span></div></div><p className="mt-5 mb-0 text-xs text-[#68716a]">{t('network.disclaimer')}</p></section></div>}
      {error && ErrorView()}
    </div>
  }
  function ChooseScreen() {
    const sorts = ['recommended', 'fastest', 'cheapest', 'earliest']
    const hasDirectServices = results.length > 0

    return <section className="min-h-[calc(100svh-72px)] bg-[#f5f1e9] py-7 lg:py-9">
      <div className="mx-auto w-full max-w-6xl px-4 lg:px-6">
        <section className="grid gap-5 rounded-2xl border border-[#ded8cc] bg-white p-5 shadow-[0_8px_24px_rgba(23,31,25,0.06)] sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6" aria-label={t('a11y.currentSearch')}>
          <button className="flex items-center gap-1.5 text-sm font-semibold text-[#0f4b3c] transition hover:text-[#b63231] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#e4bd73]" onClick={() => setStage('plan')}><span className="rotate-180"><Icon name="chevron" /></span> {t('search.change')}</button>
          <div className="sm:border-l sm:border-black/10 sm:pl-6">
            <p className="mb-1 text-[10px] font-bold tracking-[0.17em] text-[#a92f2f] uppercase">{t('search.journey')}</p>
            <div className="flex flex-wrap items-center gap-2 text-xl font-semibold tracking-[-0.025em] text-[#101713] sm:text-2xl"><span>{stopName(origin)}</span><span className="text-[#b63231]"><Icon name="arrow" /></span><span>{stopName(destination)}</span></div>
            <p className="mt-1.5 mb-0 text-sm text-[#68716a]">{formatDate(journeyDate, locale)} · {t('search.passengers')}</p>
            {dateAdjustedFrom && <p className="mt-2 mb-0 text-xs font-medium text-[#755419]">{t('search.nextAvailable', { date: formatDate(journeyDate, locale) })}</p>}
          </div>
          <label className="flex w-fit cursor-pointer items-center gap-2 rounded-full border border-[#ded8cc] bg-[#faf8f3] px-3 py-2 text-sm font-medium text-[#59645e]"><input className="size-4 accent-[#b63231]" type="checkbox" checked={acOnly} onChange={(event) => setAcOnly(event.target.checked)} /> {t('search.acOnly')}</label>
        </section>

        <div className="mt-8 flex flex-col gap-5 lg:mt-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-bold tracking-[0.2em] text-[#a92f2f] uppercase">{t('results.available')}</p>
            <h1 className="m-0 text-3xl leading-tight font-semibold tracking-[-0.035em] text-[#101713] sm:text-4xl">{t('results.choose')}</h1>
          </div>
          {hasDirectServices && <nav className="grid w-full grid-cols-4 gap-1 rounded-xl border border-[#ded8cc] bg-white p-1.5 lg:w-auto" aria-label={t('a11y.sort')}>
            {sorts.map((value) => <button key={value} className={`min-w-0 rounded-lg px-1.5 py-2 text-xs font-semibold transition sm:px-3.5 sm:text-sm ${sortBy === value ? 'bg-[#b63231] text-white' : 'text-[#68716a] hover:bg-[#f5f1e9] hover:text-[#101713]'}`} onClick={() => { setSortBy(value); void findBuses(undefined, value) }}>{t(`results.${value}`)}</button>)}
          </nav>}
        </div>

        {results.length > 0 && <div className="mt-6 grid gap-4">
          {results.map((service, index) => {
            const recommended = index === 0 && sortBy === 'recommended'
            return <article className={`group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-[0_8px_24px_rgba(23,31,25,0.06)] transition hover:border-[#b8b1a5] sm:p-6 ${recommended ? 'border-[#b63231]/45' : 'border-[#ded8cc]'}`} key={service.id}>
              {recommended && <span className="absolute inset-y-0 left-0 w-1 bg-[#b63231]" aria-hidden="true" />}
              <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(210px,1.15fr)_minmax(360px,1.8fr)_auto] lg:items-center lg:gap-8">
                <div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] uppercase ${recommended ? 'bg-[#f9e8e3] text-[#a92f2f]' : 'bg-[#eaf3ee] text-[#0f4b3c]'}`}>{recommended ? t('results.recommended') : localizeService(locale, service.service_type)}</span>
                  <h2 className="mt-3 mb-1 text-xl font-semibold tracking-[-0.02em] text-[#101713]">{localizeService(locale, service.service_name)}</h2>
                  <p className="m-0 text-sm text-[#68716a]">{service.is_air_conditioned ? t('results.airConditioned') : t('results.nonAc')} · <span className="font-medium text-[#0f4b3c]">{t('results.seatsLeft', { count: service.available_seats })}</span></p>
                </div>

                <div className="grid grid-cols-[auto_minmax(70px,1fr)_auto] items-center gap-4">
                  <div>
                    <strong className="block text-2xl font-semibold tracking-[-0.025em] text-[#101713]">{formatTime(service.departure_at, locale)}</strong>
                    <small className="mt-1 block text-sm text-[#68716a]">{stopName(service.origin.name)}</small>
                  </div>
                  <div className="grid gap-2 text-center text-xs text-[#737b75]">
                    <span>{duration(service.duration_minutes, locale)}</span>
                    <span className="relative h-px bg-[#9fa69f] after:absolute after:-top-[3px] after:right-0 after:size-1.5 after:rotate-45 after:border-t after:border-r after:border-[#9fa69f]" />
                  </div>
                  <div className="text-right">
                    <strong className="block text-2xl font-semibold tracking-[-0.025em] text-[#101713]">{formatTime(service.arrival_at, locale)}</strong>
                    <small className="mt-1 block text-sm text-[#68716a]">{stopName(service.destination.name)}</small>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-5 border-t border-black/10 pt-4 lg:min-w-44 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-7">
                  <div><small className="block text-[10px] font-bold tracking-[0.14em] text-[#737b75] uppercase">{t('results.fare')}</small><strong className="mt-1 block text-2xl font-semibold text-[#101713]">₹{service.fare_inr}</strong></div>
                  <button className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#b63231] px-5 font-semibold text-white shadow-sm transition hover:bg-[#922626] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#e4bd73] disabled:cursor-wait disabled:opacity-60" disabled={working} onClick={() => void selectJourney(service)}>{t('results.select')} <Icon name="arrow" /></button>
                </div>
              </div>
            </article>
          })}
        </div>}

        {connections.map((connection) => <article className="relative mt-6 overflow-hidden rounded-2xl border border-[#ded8cc] bg-white p-6 text-[#17201b] shadow-[0_8px_24px_rgba(23,31,25,0.06)] sm:p-7" key={connection.id}>
          <span className="absolute inset-y-0 left-0 w-1 bg-[#b63231]" aria-hidden="true" />
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="mb-2 text-[10px] font-bold tracking-[0.18em] text-[#b63231] uppercase">{t('connection.eyebrow')}</p><h2 className="m-0 text-2xl font-semibold tracking-[-0.025em]">{t('connection.changeOnce', { stop: stopName(connection.transfer_stop.name) })}</h2></div>
            <div className="flex flex-wrap items-center gap-4 text-sm"><span className="text-[#68716a]">{t('connection.total', { duration: duration(connection.total_duration_minutes, locale) })}</span><strong className="text-xl text-[#17201b]">₹{connection.total_fare_inr}</strong></div>
          </div>
          <div className="mt-5 grid gap-0 border-y border-[#ded8cc] sm:grid-cols-2">
            {connection.segments.map((segment, index) => <div className="border-b border-[#ded8cc] py-4 last:border-b-0 sm:border-r sm:border-b-0 sm:px-5 sm:first:pl-0 sm:last:border-r-0 sm:last:pr-0" key={segment.trip_id}><strong className="block">{formatTime(segment.departure_at, locale)} · {stopName(segment.origin.name)}</strong><span className="mt-1 block text-sm text-[#68716a]">{localizeService(locale, segment.service_name)} · {duration(segment.duration_minutes, locale)}</span>{index === 0 && <em className="mt-3 inline-flex rounded-full border border-[#c99a43]/35 bg-[#fff5dc] px-2.5 py-1 text-xs font-medium not-italic text-[#755419]">{t('connection.transfer', { stop: stopName(connection.transfer_stop.name), duration: duration(connection.transfer_minutes, locale) })}</em>}</div>)}
          </div>
          <footer className="mt-6 flex flex-col gap-4 border-t border-[#ded8cc] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div><strong className="block text-sm">{t('connection.summary', { stop: stopName(connection.transfer_stop.name) })}</strong><p className="mt-1 mb-0 max-w-2xl text-sm leading-5 text-[#68716a]">{t('connection.help')}</p></div>
            <button className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#b63231] px-4 text-sm font-semibold text-white transition hover:bg-[#922626] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#c99a43] disabled:opacity-60" disabled={working} onClick={() => void selectConnection(connection)}>{t('connection.choose')} <Icon name="arrow" /></button>
          </footer>
        </article>)}
      </div>
      {error && ErrorView()}
    </section>
  }
  function BookScreen() {
    if (!booking) return null
    const steps = [t('booking.seat'), t('booking.passenger'), t('booking.payment'), t('booking.confirm')]
    const currentStep = bookStep === 'seat' ? 0 : bookStep === 'passenger' ? 1 : bookStep === 'payment' ? 2 : 3
    const primaryButton = 'flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#b63231] px-5 font-semibold text-white shadow-sm transition hover:bg-[#922626] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#e4bd73] disabled:cursor-wait disabled:opacity-60'

    return <section className="min-h-[calc(100svh-72px)] bg-[#f5f1e9] py-6 lg:py-8">
      <div className="mx-auto w-full max-w-6xl px-4 lg:px-6">
        <header className="flex flex-col gap-5 rounded-2xl border border-[#ded8cc] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(23,31,25,0.06)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <button className="flex items-center gap-1.5 text-sm font-semibold text-[#0f4b3c] transition hover:text-[#b63231] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#e4bd73]" onClick={() => setStage('choose')}><span className="rotate-180"><Icon name="chevron" /></span> {t('booking.back')}</button>
          <ol className="grid grid-cols-4 gap-1 sm:min-w-[500px]" aria-label={t('a11y.bookingProgress')}>
            {steps.map((label, index) => <li className="relative flex flex-col items-center gap-1.5 text-center" key={label} aria-current={currentStep === index ? 'step' : undefined}>
              {index > 0 && <span className={`absolute top-4 right-1/2 h-px w-full ${currentStep >= index ? 'bg-[#b63231]/55' : 'bg-black/10'}`} aria-hidden="true" />}
              <span className={`relative z-10 grid size-8 place-items-center rounded-full text-xs font-bold transition ${currentStep >= index ? 'bg-[#b63231] text-white shadow-sm' : 'bg-[#e8e7e1] text-[#858c87]'}`}>{index + 1}</span>
              <span className={`text-[10px] font-semibold sm:text-xs ${currentStep >= index ? 'text-[#a92f2f]' : 'text-[#8c938e]'}`}>{label}</span>
            </li>)}
          </ol>
        </header>

        <CompactJourneyReceipt booking={booking} journeyPass={journeyPass} locale={locale} />

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <section className="rounded-2xl border border-[#ded8cc] bg-white p-5 shadow-[0_8px_24px_rgba(23,31,25,0.06)] sm:p-7 lg:p-8">
            {bookStep === 'seat' && <>
              <p className="mb-2 text-[10px] font-bold tracking-[0.2em] text-[#a92f2f] uppercase">{t('booking.selectSeat')}</p>
              <h1 className="m-0 text-3xl leading-tight font-semibold tracking-[-0.035em] text-[#101713] sm:text-4xl">{t('booking.place')}</h1>
              <p className="mt-3 mb-0 text-base leading-6 text-[#68716a]">{t('booking.hold')}</p>

              {booking.trip_ids.length > 1 && <section className="mt-6 max-w-2xl rounded-2xl border border-[#c7ded3] bg-[#eef6f1] p-4" aria-label={t('booking.connectedItinerary')}>
                <p className="m-0 text-[10px] font-bold tracking-[0.16em] text-[#155b49] uppercase">{t('booking.connectedItinerary')}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {selectedConnection?.segments.map((segment, index) => <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 border-b border-[#c7ded3] py-3 text-sm text-[#263029] last:border-b-0 sm:block sm:border-b-0 sm:border-r sm:px-4 sm:py-0 sm:first:pl-0 sm:last:border-r-0" key={segment.trip_id}><span className="text-xs font-bold text-[#155b49]">{t('booking.busNumber', { count: index + 1 })}</span><strong className="min-w-0 text-sm sm:mt-1 sm:block">{stopName(segment.origin.name)} → {stopName(segment.destination.name)}</strong><span className="col-span-2 mt-1 block text-xs text-[#68716a]">{formatTime(segment.departure_at, locale)} · {localizeService(locale, segment.service_name)}</span></div>) ?? <p className="m-0 text-sm text-[#465149]">{t('booking.twoBuses')}</p>}</div>
                <p className="mb-0 mt-3 text-sm leading-5 text-[#465149]">{t('booking.connectedSeatNote')}</p>
              </section>}

              {booking.trip_ids.length > 1 ? <div className="mt-7 grid max-w-2xl gap-4">
                {(booking.seat_groups.length ? booking.seat_groups : [{ trip_id: booking.trip_id, seats: booking.seats }]).map((group, groupIndex) => <section className="rounded-2xl border border-[#d4cfc3] bg-[#faf8f3] p-4 sm:p-5" key={group.trip_id}>
                  <header className="flex items-center justify-between border-b border-black/10 pb-3 text-sm text-[#465149]"><span className="flex items-center gap-2"><Icon name="bus" /> <strong>{t('booking.busNumber', { count: groupIndex + 1 })}</strong></span><span className="text-xs text-[#68716a]">{selectedConnection?.segments[groupIndex] ? `${stopName(selectedConnection.segments[groupIndex].origin.name)} → ${stopName(selectedConnection.segments[groupIndex].destination.name)}` : t('booking.selectSeat')}</span></header>
                  <div className="relative mx-auto mt-5 grid max-w-lg grid-cols-[1fr_34px_1fr] gap-y-3">
                    <span className="pointer-events-none absolute inset-y-0 left-1/2 flex -translate-x-1/2 items-center text-[10px] font-bold tracking-[0.16em] text-[#a1a6a1] uppercase [writing-mode:vertical-rl]" aria-hidden="true">{t('booking.aisle')}</span>
                    {group.seats.map((seat, index) => { const available = seat.status === 'AVAILABLE'; const selected = connectionSeatSelections[group.trip_id] === seat.number; const label = selected ? t('booking.selected') : available ? t(seat.seat_type === 'WINDOW' ? 'booking.window' : 'booking.aisle') : t(`booking.${seat.status.toLowerCase()}`); const seatStyle = selected ? 'border-[#155b49] bg-[#cfe8da] text-[#153d31] ring-2 ring-[#155b49]/25' : available ? 'border-[#247151] bg-[#edf6f0] text-[#153d31] hover:bg-[#e2f1e8]' : seat.status === 'HELD' ? 'border-[#755da6] bg-[#f1edfc] text-[#4b386e]' : 'border-[#bd625a] bg-[#fff1ee] text-[#703634]'; return <button key={seat.id} className={`grid min-h-18 gap-1 rounded-2xl border-2 p-3 text-left transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#e4bd73] disabled:cursor-not-allowed disabled:opacity-85 ${index % 2 === 0 ? 'col-start-1' : 'col-start-3'} ${seatStyle}`} disabled={!available} onClick={() => setConnectionSeatSelections((current) => ({ ...current, [group.trip_id]: seat.number }))} aria-pressed={selected} aria-label={`${t('booking.busNumber', { count: groupIndex + 1 })}, ${seat.number}, ${label}`}><b className="text-lg">{seat.number}</b><span className="text-xs font-medium">{label}</span></button> })}
                  </div>
                </section>)}
                <button className={primaryButton} disabled={working || Object.keys(connectionSeatSelections).length !== booking.trip_ids.length} onClick={() => void holdConnectionSeats()}>{t('booking.reserveBoth')} <Icon name="arrow" /></button>
              </div> : <div className="mt-7 max-w-2xl rounded-2xl border border-[#d4cfc3] bg-[#faf8f3] p-4 sm:p-5">
                <header className="flex items-center justify-between border-b border-black/10 pb-3 text-sm text-[#68716a]"><span className="flex items-center gap-2"><Icon name="bus" /> {t('booking.front')}</span><span className="rounded-full bg-[#f3eee4] px-3 py-1 text-xs">{t('booking.driver')}</span></header>
                <div className="relative mx-auto mt-5 grid max-w-lg grid-cols-[1fr_34px_1fr] gap-y-3">
                  <span className="pointer-events-none absolute inset-y-0 left-1/2 flex -translate-x-1/2 items-center text-[10px] font-bold tracking-[0.16em] text-[#a1a6a1] uppercase [writing-mode:vertical-rl]" aria-hidden="true">{t('booking.aisle')}</span>
                  {booking.seats.map((seat, index) => {
                    const available = seat.status === 'AVAILABLE'
                    const held = seat.status === 'HELD'
                    const seatStyle = available ? 'border-[#247151] bg-[#edf6f0] text-[#153d31] hover:bg-[#e2f1e8]' : held ? 'border-[#755da6] bg-[#f1edfc] text-[#4b386e]' : 'border-[#bd625a] bg-[#fff1ee] text-[#703634]'
                    const label = available ? t(seat.seat_type === 'WINDOW' ? 'booking.window' : 'booking.aisle') : t(`booking.${seat.status.toLowerCase()}`)
                    return <button key={seat.id} className={`grid min-h-20 gap-1 rounded-2xl border-2 p-3 text-left transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#e4bd73] disabled:cursor-not-allowed disabled:opacity-85 ${index % 2 === 0 ? 'col-start-1' : 'col-start-3'} ${seatStyle}`} disabled={!available} onClick={() => void holdSeat(seat.number)} aria-label={`${t('booking.seat')} ${seat.number}, ${label}`}><b className="text-lg">{seat.number}</b><span className="text-xs font-medium">{label}</span></button>
                  })}
                </div>
                <footer className="mt-5 flex flex-wrap gap-4 border-t border-black/10 pt-4 text-xs text-[#68716a]">
                  <span className="flex items-center gap-1.5"><i className="size-3 rounded-sm border-2 border-[#247151] bg-[#edf6f0]" /> {t('booking.available')}</span>
                  <span className="flex items-center gap-1.5"><i className="size-3 rounded-sm border-2 border-[#755da6] bg-[#f1edfc]" /> {t('booking.held')}</span>
                  <span className="flex items-center gap-1.5"><i className="size-3 rounded-sm border-2 border-[#bd625a] bg-[#fff1ee]" /> {t('booking.booked')}</span>
                </footer>
              </div>}
            </>}

            {bookStep === 'passenger' && <form className="max-w-2xl" onSubmit={(event) => void savePassenger(event)}>
              <p className="mb-2 text-[10px] font-bold tracking-[0.2em] text-[#a92f2f] uppercase">{t('booking.details')}</p>
              <h1 className="m-0 text-3xl leading-tight font-semibold tracking-[-0.035em] text-[#101713] sm:text-4xl">{t('booking.who')}</h1>
              <p className="mt-3 mb-0 text-sm leading-6 text-[#68716a]"><strong className="text-[#703634]">{t('booking.prototypeOnly')}</strong> {t('booking.fakeDetails')}</p>
              <div className="mt-7 grid gap-5 sm:grid-cols-[1fr_150px]">
                <label className="grid gap-2 text-sm font-semibold text-[#465149]">{t('booking.name')}<input className="min-h-13 rounded-xl border border-[#cbc7bd] bg-white px-4 text-base font-normal text-[#101713] outline-none transition focus:border-[#155b49] focus:ring-4 focus:ring-[#155b49]/10" value={passengerName} onChange={(event) => setPassengerName(event.target.value)} required /></label>
                <label className="grid gap-2 text-sm font-semibold text-[#465149]">{t('booking.age')}<input className="min-h-13 rounded-xl border border-[#cbc7bd] bg-white px-4 text-base font-normal text-[#101713] outline-none transition focus:border-[#155b49] focus:ring-4 focus:ring-[#155b49]/10" type="number" value={passengerAge} min="1" max="120" onChange={(event) => setPassengerAge(event.target.value)} required /></label>
              </div>
              <fieldset className="mt-6 border-0 p-0"><legend className="mb-3 text-sm font-semibold text-[#465149]">{t('booking.concession')}</legend><div className="grid gap-2 sm:grid-cols-3">{(['NONE','STUDENT','SENIOR'] as const).map((item) => <label className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 text-sm transition ${concession === item ? 'border-[#155b49] bg-[#eaf3ee] text-[#153d31]' : 'border-[#d4cfc3] bg-white text-[#68716a] hover:bg-[#faf8f3]'}`} key={item}><input className="accent-[#155b49]" type="radio" checked={concession === item} onChange={() => setConcession(item)} /> {item === 'NONE' ? t('booking.none') : item === 'STUDENT' ? t('booking.student') : t('booking.senior')}</label>)}</div></fieldset>
              <p className="my-5 rounded-xl border border-[#dfc584]/55 bg-[#fff5dc] p-4 text-sm leading-6 text-[#72501c]">{t('booking.eligibility')}</p>
              <button className={primaryButton} disabled={working}>{t('booking.continue')} <Icon name="arrow" /></button>
            </form>}

            {bookStep === 'payment' && <section className="max-w-2xl">
              <p className="mb-2 text-[10px] font-bold tracking-[0.2em] text-[#a92f2f] uppercase">{t('booking.mockPayment')}</p>
              <h1 className="m-0 text-3xl leading-tight font-semibold tracking-[-0.035em] text-[#101713] sm:text-4xl">{t('booking.review')}</h1>
              <Fare booking={booking} locale={locale} />
              <label className="my-5 flex cursor-pointer items-start gap-3 rounded-xl border border-[#d4cfc3] bg-[#faf8f3] p-4 text-sm leading-5 text-[#59645e]"><input className="mt-0.5 size-4 accent-[#b63231]" type="checkbox" checked={recoveryDemo} onChange={(event) => setRecoveryDemo(event.target.checked)} /><span><strong className="block text-[#101713]">{t('booking.recovery')}</strong>{t('booking.recoveryHelp')}</span></label>
              <p className="mb-5 rounded-xl border border-[#dfc584]/55 bg-[#fff5dc] p-4 text-sm leading-6 text-[#72501c]">{t('booking.paymentNotice')}</p>
              <button className={primaryButton} onClick={() => void pay()} disabled={working}>{t('booking.payMock', { amount: booking.total_fare_inr })} <Icon name="arrow" /></button>
            </section>}

            {bookStep === 'confirm' && <section className="max-w-2xl py-4">
              <span className="grid size-12 place-items-center rounded-2xl bg-[#eaf3ee] text-[#0f4b3c]"><Icon name="check" /></span>
              <p className="mt-6 mb-2 text-[10px] font-bold tracking-[0.2em] text-[#a92f2f] uppercase">{t('booking.paymentReceived')}</p>
              <h1 className="m-0 text-3xl leading-tight font-semibold tracking-[-0.035em] text-[#101713] sm:text-4xl">{t('booking.confirmReservation')}</h1>
              <p className="mt-4 mb-6 text-base leading-6 text-[#68716a]">{t('booking.confirmHelp')}</p>
              <button className={primaryButton} onClick={() => void confirm()} disabled={working}>{t('booking.confirmSeats')} <Icon name="arrow" /></button>
            </section>}

            {bookStep === 'confirmed' && <section className="max-w-2xl py-4">
              <span className="grid size-14 place-items-center rounded-2xl bg-[#eaf3ee] text-[#0f4b3c]"><Icon name="check" /></span>
              <p className="mt-6 mb-2 text-[10px] font-bold tracking-[0.2em] text-[#a92f2f] uppercase">{t('booking.journeyBooked')}</p>
              <h1 className="m-0 text-3xl leading-tight font-semibold tracking-[-0.035em] text-[#101713] sm:text-4xl">{t('booking.ready')}</h1>
              <p className="mt-4 mb-6 break-all text-sm text-[#68716a]">{t('booking.reference', { id: booking.id })}</p>
              <button className={primaryButton} onClick={() => void showPass()} disabled={working}>{t('booking.openPass')} <Icon name="ticket" /></button>
            </section>}

            {bookStep === 'failed' && <section className="max-w-2xl py-4">
              <span className="grid size-14 place-items-center rounded-2xl bg-[#fff1ee] text-[#b63231]"><Icon name="ticket" /></span>
              <p className="mt-6 mb-2 text-[10px] font-bold tracking-[0.2em] text-[#a92f2f] uppercase">{t('booking.paymentProtected')}</p>
              <h1 className="m-0 text-3xl leading-tight font-semibold tracking-[-0.035em] text-[#101713] sm:text-4xl">{t('booking.notConfirmed')}</h1>
              <p className="mt-4 mb-0 text-base leading-7 text-[#68716a]">{t('booking.refundPending', { status: t(`status.${booking.refund_status}`) })}</p>
            </section>}
          </section>

          <JourneyReceipt className="hidden lg:block" booking={booking} journeyPass={journeyPass} locale={locale} />
        </div>
      </div>
      {error && ErrorView()}
    </section>
  }
  function PassScreen() {
    if (!journeyPass || !booking) return null
    const isConnected = journeyPass.legs.length > 1
    const firstLeg = journeyPass.legs[0]
    const finalLeg = journeyPass.legs.at(-1)
    const transferStop = isConnected ? firstLeg.destination : ''
    const overallBoarding = firstLeg?.boarding_point ?? journeyPass.boarding_point
    const overallDestination = finalLeg?.destination ?? journeyPass.destination
    const overallDeparture = firstLeg?.departure_at ?? journeyPass.departure_at
    const overallArrival = finalLeg?.arrival_at ?? journeyPass.arrival_at
    return <section className="min-h-[calc(100svh-72px)] bg-[#f5f1e9] px-4 py-6 sm:px-6 lg:py-8">
      <div className="mx-auto w-full max-w-5xl">
        <header className="flex items-center justify-between rounded-2xl border border-[#ded8cc] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(23,31,25,0.06)] sm:px-6">
          <button className="flex items-center gap-1.5 text-sm font-semibold text-[#0f4b3c] transition hover:text-[#b63231] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#e4bd73]" onClick={() => setStage('book')}><span className="rotate-180"><Icon name="chevron" /></span> {t('pass.back')}</button>
          <span className="rounded-full border border-[#d6b878] bg-[#fff9e9] px-3 py-1.5 text-xs font-semibold text-[#755419]">{t('pass.label')}</span>
        </header>

        <article className="relative mt-5 overflow-hidden rounded-2xl bg-[#155b49] text-white shadow-[0_12px_32px_rgba(10,53,42,0.18)]">
          <div className="h-1 bg-[#c99a43]" aria-hidden="true" />
          <div className="p-6 sm:p-7">
            <header className="flex flex-col items-start gap-4 border-b border-white/16 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-[#f3d99d]"><Icon name="check" /> {t('pass.confirmed')}</span>
              <div className="sm:text-right"><small className="block text-[10px] tracking-[0.15em] text-[#a9c2b7] uppercase">{t('pass.ticket')}</small><strong className="mt-1 block text-sm tracking-[0.04em] text-white">{journeyPass.ticket_number}</strong></div>
            </header>

            <div className="mt-6 grid grid-cols-[minmax(0,1fr)_64px_minmax(0,1fr)] items-center gap-3">
              <div className="min-w-0 self-start"><small className="block text-[10px] font-bold tracking-[0.16em] text-[#a9c2b7] uppercase">{t('pass.boarding')}</small><h1 className="mt-2 mb-0 text-2xl leading-tight font-semibold tracking-[-0.035em] sm:text-4xl">{stopName(overallBoarding)}</h1></div>
              <div className="grid w-16 place-items-center"><span className="grid size-11 place-items-center rounded-full border border-[#f3d99d]/40 bg-white/8 text-[#f3d99d]" aria-hidden="true"><Icon name="arrow" /></span></div>
              <div className="min-w-0 self-start text-right"><small className="block text-[10px] font-bold tracking-[0.16em] text-[#a9c2b7] uppercase">{t('pass.destination')}</small><h1 className="mt-2 mb-0 text-2xl leading-tight font-semibold tracking-[-0.035em] sm:text-4xl">{stopName(overallDestination)}</h1></div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-y border-white/16 py-4 text-sm text-[#d4e1db]">
              <strong className="text-base text-white">{formatTime(overallDeparture, locale)} → {formatTime(overallArrival, locale)}</strong><span className="hidden size-1 rounded-full bg-[#e4bd73] sm:block" /><span>{isConnected ? t('pass.twoBuses', { stop: stopName(transferStop) }) : localizeService(locale, journeyPass.service_name)}</span>
            </div>
            {isConnected && <section className="mt-6" aria-label={t('pass.connected')}>
              <div className="flex flex-wrap items-baseline justify-between gap-3"><p className="m-0 text-[10px] font-bold tracking-[0.16em] text-[#f3d99d] uppercase">{t('pass.connected')}</p><p className="m-0 text-sm text-[#f3d99d]">{t('pass.changeAt', { stop: stopName(transferStop) })}</p></div>
              <ol className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                <li className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 text-sm sm:pr-4"><div className="min-w-0"><p className="m-0 font-semibold">{t('pass.busNumber', { count: 1 })} · {stopName(firstLeg.boarding_point)} → {stopName(firstLeg.destination)}</p><p className="mt-1 mb-0 text-xs text-[#d4e1db]">{formatTime(firstLeg.departure_at, locale)}–{formatTime(firstLeg.arrival_at, locale)} · {localizeService(locale, firstLeg.service_name)}</p></div><span className="justify-self-end text-xs font-semibold text-[#f3d99d]">{t('pass.seat')} {firstLeg.seat_numbers.join(', ')}</span></li>
                <span className="hidden self-stretch border-l border-white/16 sm:block" aria-hidden="true" />
                <li className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-t border-white/16 pt-4 text-sm sm:border-t-0 sm:pt-0 sm:pl-4"><div className="min-w-0"><p className="m-0 font-semibold">{t('pass.busNumber', { count: 2 })} · {stopName(finalLeg?.boarding_point)} → {stopName(finalLeg?.destination)}</p><p className="mt-1 mb-0 text-xs text-[#d4e1db]">{formatTime(finalLeg!.departure_at, locale)}–{formatTime(finalLeg!.arrival_at, locale)} · {localizeService(locale, finalLeg?.service_name)}</p></div><span className="justify-self-end text-xs font-semibold text-[#f3d99d]">{t('pass.seat')} {finalLeg?.seat_numbers.join(', ')}</span></li>
              </ol>
            </section>}

            <dl className={`mt-6 grid ${isConnected ? 'grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)]' : 'grid-cols-2 gap-5 sm:grid-cols-4'}`}>
              {!isConnected && <><div><dt className="text-[10px] tracking-[0.14em] text-[#a9c2b7] uppercase">{t('pass.boarding')}</dt><dd className="mt-2 ml-0 text-sm font-semibold text-white">{stopName(overallBoarding)}</dd></div><div><dt className="text-[10px] tracking-[0.14em] text-[#a9c2b7] uppercase">{t('pass.seat')}</dt><dd className="mt-2 ml-0 text-sm font-semibold text-white">{journeyPass.seat_numbers.join(', ')}</dd></div></>}
              {isConnected ? <><div className="sm:pr-4"><dt className="text-[10px] tracking-[0.14em] text-[#a9c2b7] uppercase">{t('booking.passenger')}</dt><dd className="mt-2 ml-0 text-sm font-semibold text-white">{journeyPass.passenger_name}</dd></div><span className="hidden self-stretch border-l border-white/16 sm:block" aria-hidden="true" /><div className="border-t border-white/16 pt-4 sm:border-t-0 sm:pt-0 sm:pl-4 sm:text-right"><dt className="text-[10px] tracking-[0.14em] text-[#a9c2b7] uppercase">{t('pass.paid')}</dt><dd className="mt-2 ml-0 text-sm font-semibold text-[#f3d99d]">₹{journeyPass.paid_amount_inr}</dd></div></> : <><div><dt className="text-[10px] tracking-[0.14em] text-[#a9c2b7] uppercase">{t('booking.passenger')}</dt><dd className="mt-2 ml-0 text-sm font-semibold text-white">{journeyPass.passenger_name}</dd></div><div><dt className="text-[10px] tracking-[0.14em] text-[#a9c2b7] uppercase">{t('pass.paid')}</dt><dd className="mt-2 ml-0 text-sm font-semibold text-[#f3d99d]">₹{journeyPass.paid_amount_inr}</dd></div></>}
            </dl>

            <footer className="mt-6 grid items-stretch gap-3 border-t border-white/16 pt-6 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
              <div className="flex h-14 min-w-0 flex-col justify-center rounded-xl bg-[#fffdf8] px-4 text-[#101713]"><small className="block text-[10px] tracking-[0.13em] text-[#68716a] uppercase">{t('pass.qr')}</small><code className="mt-1 block overflow-hidden text-ellipsis whitespace-nowrap text-xs sm:text-sm">{journeyPass.qr_payload}</code></div>
              <button className="flex h-14 items-center justify-center gap-2 rounded-xl border border-white/30 px-4 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white" onClick={() => void openTracking()}>{t('tracking.title')} <Icon name="location" /></button><button className="flex h-14 items-center justify-center gap-2 rounded-xl bg-[#f1d28d] px-5 font-semibold text-[#153d31] transition hover:bg-[#ffe3a2] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white" onClick={() => void openManage()}>{t('booking.manage')} <Icon name="arrow" /></button>
            </footer>
          </div>
        </article>

        <p className="mt-4 text-center text-xs leading-5 text-[#727a74]">{t('pass.keep')}</p>
      </div>
      {error && ErrorView()}
    </section>
  }
  function ManageScreen() {
    const backStage = manageReturnStage
    const routeName = journey ? `${stopName(journey.origin.name)} → ${stopName(journey.destination.name)}` : journeyPass ? `${stopName(journeyPass.boarding_point)} → ${stopName(journeyPass.destination)}` : t('manage.yourBooking')

    return <section className="min-h-[calc(100svh-72px)] bg-[#f5f1e9] py-6 lg:py-8">
      <div className="mx-auto w-full max-w-6xl px-4 lg:px-6">
        {!booking && <section>
          <header className="grid gap-5 border-b border-[#d8d1c5] pb-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end"><div><p className="m-0 text-[10px] font-bold tracking-[0.18em] text-[#a92f2f] uppercase">{t('manage.saved')}</p><h1 className="mt-2 mb-0 text-[30px] leading-tight font-semibold tracking-[-0.03em] text-[#101713] sm:text-[36px]">{t('nav.booking')}</h1><p className="mt-2 mb-0 text-sm text-[#68716a]">{t('manage.browserOnly')}</p></div><form onSubmit={(event) => void findBooking(event)}><label className="mb-1.5 block text-[11px] font-semibold text-[#55615a]">{t('manage.id')}</label><div className="grid grid-cols-[minmax(0,1fr)_44px] gap-2"><input className="h-11 min-w-0 rounded-lg border border-[#cbc7bd] bg-white px-3 text-sm font-normal text-[#101713] outline-none transition placeholder:text-[#949a95] focus:border-[#155b49] focus:ring-3 focus:ring-[#155b49]/10" value={manageId} onChange={(event) => setManageId(event.target.value)} placeholder="booking_…" /><button className="grid size-11 place-items-center rounded-lg bg-[#155b49] text-white shadow-sm transition hover:bg-[#104838] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#7eb5a5] disabled:cursor-wait disabled:opacity-60" disabled={working} aria-label={t('manage.openAction')} title={t('manage.openAction')}><Icon name="arrow" /></button></div></form></header>
          {savedBookings.length > 0 && <div className="border-t border-[#d8d1c5]">{savedBookings.map((item) => <button className="group grid min-h-24 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 border-x-0 border-t-0 border-b border-[#d8d1c5] bg-transparent px-0 py-5 text-left transition-colors hover:bg-white/45 focus-visible:bg-white/60 sm:grid-cols-[minmax(0,1fr)_180px_150px_auto] sm:px-3" key={item.id} onClick={() => void loadBooking(item.id)}><span className="min-w-0"><strong className="block text-base leading-6 text-[#17201b]">{stopName(item.origin)} → {stopName(item.destination)}</strong><span className="mt-1 block text-xs text-[#68716a] sm:hidden">{item.ticketNumber} · {item.legCount > 1 ? t('manage.twoBus') : t('manage.direct')}</span></span><span className="hidden text-sm text-[#68716a] sm:block">{item.ticketNumber}</span><span className="hidden text-sm font-semibold text-[#315348] sm:block">{item.legCount > 1 ? t('manage.twoBus') : t('manage.direct')}</span><span className="text-[#b63231] transition-transform group-hover:translate-x-0.5"><Icon name="arrow" /></span></button>)}</div>}
        </section>}

        {booking && <button className="mb-5 flex items-center gap-1.5 text-sm font-semibold text-[#0f4b3c] transition hover:text-[#b63231] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#e4bd73]" onClick={() => backStage === 'pass' ? setStage('pass') : void openMyBooking()}><span className="rotate-180"><Icon name="chevron" /></span> {t('common.back')}</button>}

        {booking && <CompactJourneyReceipt booking={booking} journeyPass={journeyPass} locale={locale} />}
        {booking && <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <section className="rounded-2xl border border-[#ded8cc] bg-white p-5 shadow-[0_8px_24px_rgba(23,31,25,0.06)] sm:p-7 lg:p-8">
            <p className="mb-2 text-[10px] font-bold tracking-[0.2em] text-[#a92f2f] uppercase">{t('manage.title')}</p>
            <h1 className="m-0 max-w-3xl text-3xl leading-tight font-semibold tracking-[-0.035em] text-[#101713] sm:text-4xl">{routeName}</h1>
            <p className="mt-3 mb-0 break-all text-sm text-[#68716a]">{t('manage.bookingId', { id: booking.id })}</p>

            <div className="mt-7 flex flex-wrap gap-3 border-t border-black/10 pt-6">{booking.status === 'CONFIRMED' && <button className="rounded-xl bg-[#155b49] px-4 py-3 text-sm font-semibold text-white" onClick={() => void openTracking()}>{t('tracking.title')}</button>}{journeyPass && <button className="rounded-xl border border-[#b63231] px-4 py-3 text-sm font-semibold text-[#a92f2f]" onClick={() => void openComplaint()}>{t('complaint.title')}</button>}</div>
            {cancellation && <div className="mt-7 border-t border-black/10 pt-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-1 text-[10px] font-bold tracking-[0.17em] text-[#a92f2f] uppercase">{t('manage.cancel')}</p><h2 className="m-0 text-2xl font-semibold tracking-[-0.025em] text-[#101713] sm:text-3xl">{booking.status === 'CANCELLED' ? t('manage.cancelled') : t('manage.cancelQuestion')}</h2></div>{cancellation.deadline && <span className="text-sm text-[#68716a]">{t('manage.deadline', { time: formatTime(cancellation.deadline, locale) })}</span>}</div>
              <Fare cancellation={cancellation} locale={locale} />

              {booking.status === 'CANCELLED' ? <div className="mt-5 rounded-xl border border-[#155b49]/20 bg-[#eaf3ee] p-4">
                <div className="flex items-start gap-3"><span className="mt-0.5 text-[#0f4b3c]"><Icon name="check" /></span><div><strong className="block text-[#153d31]">{t('manage.refund', { status: t(`status.${booking.refund_status}`) })}</strong><p className="mt-1 mb-0 text-sm leading-5 text-[#59645e]">{t('manage.refundHelp')}</p></div></div>
                {booking.refund_status !== 'COMPLETED' && <button className="mt-4 rounded-xl bg-[#0f4b3c] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#14624e]" onClick={() => void advanceRefund()}>{t('manage.advanceRefund')}</button>}
              </div> : cancellation.can_cancel ? <div className="mt-5 flex flex-col gap-4 rounded-xl border border-[#e4bd73]/45 bg-[#fff5dc] p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="m-0 text-sm leading-5 text-[#72501c]">{t('manage.reviewRefund')}</p>
                <button className="shrink-0 rounded-xl border border-[#b63231] bg-white px-5 py-3 text-sm font-semibold text-[#a92f2f] transition hover:bg-[#b63231] hover:text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#e4bd73] disabled:cursor-wait disabled:opacity-60" onClick={() => void cancel()} disabled={working}>{t('manage.cancelAction')}</button>
              </div> : <div className="mt-5 rounded-xl border border-[#b63231]/20 bg-[#fff1ee] p-4 text-sm leading-6 text-[#703634]">{locale === 'en' && cancellation.reason ? cancellation.reason : t('manage.cannotCancel')}</div>}
            </div>}
          </section>
          <JourneyReceipt className="hidden lg:block" booking={booking} journeyPass={journeyPass} locale={locale} />
        </div>}
      </div>
      {error && ErrorView()}
    </section>
  }
  function TrackingScreen() {
    if (!tracking) return null
    const states: Tracking['state'][] = ['BUS_NOT_ASSIGNED', 'BUS_ASSIGNED', 'TRACKING_AVAILABLE', 'TRIP_STARTED', 'LOCATION_STALE', 'TRIP_COMPLETED']
    const showsMapPosition = tracking.state === 'TRIP_STARTED' || tracking.state === 'LOCATION_STALE'
    const progressPercent = Math.max(0, Math.min(100, tracking.progress_percent ?? (tracking.state === 'TRIP_COMPLETED' ? 100 : showsMapPosition ? 52 : 0)))
    const currentPosition = tracking.state === 'TRIP_COMPLETED' ? stopName(tracking.destination) : showsMapPosition ? t('tracking.enRoute', { stop: stopName(tracking.next_stop ?? tracking.destination) }) : t(`tracking.message.${tracking.state}`)
    return <section className="min-h-[calc(100svh-72px)] bg-[#f5f1e9] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <button className="min-h-11 text-sm font-semibold text-[#0f4b3c]" onClick={() => setStage(trackingReturnStage)}>← {t('tracking.back')}</button>
        <article className="mt-3 overflow-hidden rounded-2xl border border-[#ded8cc] bg-white shadow-[0_8px_24px_rgba(23,31,25,0.06)]">
          <div className="h-1 bg-[#b63231]" />
          <div className="p-5 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="m-0 text-[10px] font-bold tracking-[0.18em] text-[#a92f2f] uppercase">{t('tracking.mock')}</p><h1 className="mt-2 mb-0 text-3xl font-semibold tracking-[-0.04em] text-[#101713] sm:text-4xl">{t('tracking.title')}</h1></div>
              <label className="grid gap-1 text-xs font-semibold text-[#59645e]">{t('tracking.demoState')}<select className="min-h-11 rounded-xl border border-[#cbc7bd] bg-white px-3 text-sm" value={tracking.state} onChange={(event) => void openTracking(event.target.value as Tracking['state'])}>{states.map((state) => <option key={state} value={state}>{t(`tracking.state.${state}`)}</option>)}</select></label>
            </div>
            <div className="mt-6 grid border-y border-[#ded8cc] sm:grid-cols-2">
              <div className="py-4 sm:pr-6"><small className="text-[#68716a] uppercase">{t('tracking.busNumber')}</small><strong className="mt-1 block text-xl text-[#101713] sm:text-2xl">{tracking.bus_number ?? t('tracking.awaiting')}</strong><p className="mt-1 mb-0 text-sm text-[#68716a]">{localizeService(locale, tracking.service_name)}</p></div>
              <div className="border-t border-[#ded8cc] py-4 sm:border-t-0 sm:border-l sm:pl-6"><small className="text-[#68716a] uppercase">{t('tracking.status')}</small><strong className="mt-1 flex items-center gap-2 text-[#101713]"><span className="text-[#155b49]"><Icon name={tracking.state === 'TRIP_COMPLETED' ? 'check' : 'bus'} /></span>{t(`tracking.state.${tracking.state}`)}</strong><p className="mt-1 mb-0 text-sm text-[#59645e]">{t(`tracking.message.${tracking.state}`)}</p></div>
            </div>
            <section className="mt-5 overflow-hidden rounded-xl border border-[#d8d1c5]" aria-labelledby="journey-progress-title">
              <div className="bg-[linear-gradient(135deg,#eff5ee_0%,#faf3df_52%,#eff5ee_100%)] px-5 py-5 sm:px-7 sm:py-6">
                <div className="flex items-center justify-between gap-4"><h2 id="journey-progress-title" className="m-0 text-xs font-bold tracking-[0.14em] text-[#315348] uppercase">{t('tracking.progress')}</h2><strong className="text-sm text-[#155b49]">{t('tracking.progressValue', { value: progressPercent })}</strong></div>
                <div className="relative mt-8 h-8" aria-hidden="true">
                  <span className="absolute top-1/2 right-1 left-1 h-1 -translate-y-1/2 rounded-full bg-[#d5d8d1]" />
                  <span className="absolute top-1/2 left-1 h-1 -translate-y-1/2 rounded-full bg-[#c99a43] transition-[width] duration-240" style={{ width: `calc(${progressPercent}% - ${progressPercent === 0 ? 0 : 4}px)` }} />
                  <span className="absolute top-1/2 left-0 size-3 -translate-y-1/2 rounded-full border-2 border-[#155b49] bg-white" />
                  <span className="absolute top-1/2 right-0 size-3 -translate-y-1/2 rounded-full border-2 border-[#155b49] bg-white" />
                  {progressPercent > 0 && progressPercent < 100 && <span className="absolute top-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-3 border-white bg-[#b63231] text-white shadow-md transition-[left] duration-240" style={{ left: `${progressPercent}%` }}><Icon name="bus" /></span>}
                  {progressPercent === 100 && <span className="absolute top-1/2 right-0 grid size-8 translate-x-2 -translate-y-1/2 place-items-center rounded-full border-3 border-white bg-[#155b49] text-white shadow-md"><Icon name="check" /></span>}
                </div>
                <div className="mt-2 flex justify-between gap-6 text-sm font-semibold text-[#153d31]"><span className="max-w-[45%]">{stopName(tracking.origin)}</span><span className="max-w-[45%] text-right">{stopName(tracking.destination)}</span></div>
              </div>
              <dl className="grid divide-y divide-[#ded8cc] bg-white text-sm sm:grid-cols-4 sm:divide-x sm:divide-y-0">
                <div className="p-4"><dt className="text-[10px] font-bold tracking-[0.12em] text-[#7a827c] uppercase">{t('tracking.currentPosition')}</dt><dd className="mt-1.5 ml-0 font-semibold text-[#17201b]">{currentPosition}</dd></div>
                <div className="p-4"><dt className="text-[10px] font-bold tracking-[0.12em] text-[#7a827c] uppercase">{t('tracking.lastUpdated')}</dt><dd className="mt-1.5 ml-0 font-semibold text-[#17201b]">{tracking.updated_at ? formatTime(tracking.updated_at, locale) : '—'}</dd></div>
                <div className="p-4"><dt className="text-[10px] font-bold tracking-[0.12em] text-[#7a827c] uppercase">{t('tracking.nextMilestone')}</dt><dd className="mt-1.5 ml-0 font-semibold text-[#17201b]">{tracking.state === 'TRIP_COMPLETED' ? '—' : stopName(tracking.next_stop ?? tracking.destination)}</dd></div>
                <div className="p-4"><dt className="text-[10px] font-bold tracking-[0.12em] text-[#7a827c] uppercase">{t('tracking.scheduled')}</dt><dd className="mt-1.5 ml-0 font-semibold text-[#17201b]">{formatTime(tracking.scheduled_departure, locale)}</dd></div>
              </dl>
            </section>
            <p className="mt-4 mb-0 text-xs leading-5 text-[#68716a]">{t('tracking.simulation')}</p>
          </div>
        </article>
      </div>
    </section>
  }
  function ComplaintScreen() {
    const groups: Record<string, string[]> = {
      'BUS CONDITION': ['Broken seat', 'AC not working', 'Window issue', 'Charging point not working', 'Cleanliness issue', 'Other bus-condition issue'],
      STAFF: ['Conductor behaviour', 'Driver behaviour', 'Ticketing issue', 'Other staff issue'],
      JOURNEY: ['Bus delayed', 'Bus did not arrive', 'Wrong boarding information', 'Unscheduled stop', 'Other journey issue'],
      SAFETY: ['Unsafe driving', 'Safety concern'], CLEANLINESS: ['Bus cleanliness'], FACILITIES: ['Waiting-area issue'], OTHER: ['Other issue'],
    }
    if (complaintMode === 'ENTRY') return <div className="ui-dialog-backdrop fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#17201b]/65 p-4 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) closeComplaint() }}><section className="ui-dialog relative max-h-[calc(100svh-32px)] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#ded8cc] bg-[#f8f5ee] p-5 shadow-[var(--shadow-modal)] sm:p-7" role="dialog" aria-modal="true" aria-labelledby="complaint-entry-title"><div className="absolute inset-x-0 top-0 h-1 bg-[#b63231]" aria-hidden="true" /><button type="button" className="absolute top-3 right-3 grid size-11 place-items-center rounded-xl text-xl text-[#68716a] transition hover:bg-white hover:text-[#17201b]" onClick={closeComplaint} aria-label={t('common.close')}>×</button><header className="max-w-2xl pr-10"><p className="ui-eyebrow">{t('complaint.entryEyebrow')}</p><h1 id="complaint-entry-title" className="mt-2 mb-0 text-3xl font-semibold tracking-[-0.035em] text-[#101713] sm:text-4xl">{t('complaint.entryTitle')}</h1><p className="mt-3 mb-0 text-sm leading-6 text-[#68716a] sm:text-base">{t('complaint.entryIntro')}</p></header><section className="mt-8" aria-labelledby="complaint-journey-heading"><div className="flex items-center justify-between gap-4 border-b border-[#cfc8bb] pb-3"><h2 id="complaint-journey-heading" className="m-0 text-sm font-semibold text-[#315348]">{t('complaint.savedTitle')}</h2><span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-[#68716a]">{savedBookings.length}</span></div><div>{savedBookings.map((item) => <button className="group grid min-h-24 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 border-x-0 border-t-0 border-b border-[#d8d1c5] bg-transparent px-0 py-5 text-left transition-colors hover:bg-white/45 focus-visible:bg-white/60 sm:grid-cols-[minmax(0,1fr)_180px_auto] sm:px-3" key={item.id} onClick={() => void openSavedComplaint(item.id)}><span><strong className="block text-base leading-6 text-[#17201b]">{stopName(item.origin)} → {stopName(item.destination)}</strong><span className="mt-1 block text-xs text-[#68716a] sm:hidden">{item.ticketNumber}</span></span><span className="hidden text-sm text-[#68716a] sm:block">{item.ticketNumber}</span><span className="flex items-center gap-3 text-sm font-semibold text-[#155b49]"><span className="hidden md:inline">{t('complaint.useBooking')}</span><span className="text-[#b63231] transition-transform group-hover:translate-x-0.5"><Icon name="arrow" /></span></span></button>)}</div></section><section className="mt-8 flex flex-col gap-4 rounded-xl border border-[#155b49]/18 bg-[#eaf3ee] px-5 py-4 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="offline-complaint-heading"><div className="flex min-w-0 items-start gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#155b49]" aria-hidden="true"><Icon name="ticket" /></span><div><p className="m-0 text-[10px] font-bold tracking-[0.14em] text-[#527065] uppercase">{t('complaint.offlineSource')}</p><h2 id="offline-complaint-heading" className="mt-1 mb-0 text-base font-semibold text-[#153d31]">{t('complaint.manualTitle')}</h2><p className="mt-1 mb-0 text-xs leading-5 text-[#68716a]">{t('complaint.manualIntro')}</p></div></div><button className="flex min-h-11 shrink-0 items-center justify-center gap-3 rounded-xl border border-[#155b49]/35 bg-white px-4 text-sm font-semibold text-[#155b49] transition hover:border-[#155b49] hover:bg-[#f8fbf9]" onClick={() => { setBooking(null); setJourneyPass(null); setComplaintMode('MANUAL') }}>{t('complaint.manualAction')} <span className="text-[#b63231]"><Icon name="arrow" /></span></button></section><aside className="mt-7 grid gap-1 border-l-2 border-[#c99a43] pl-4 sm:grid-cols-[180px_1fr] sm:items-baseline"><strong className="text-xs tracking-[0.08em] text-[#315348] uppercase">{t('complaint.scopeTitle')}</strong><span className="text-sm leading-6 text-[#68716a]">{t('complaint.scopeText')}</span></aside></section>{error && ErrorView()}</div>
    if (complaintMode === 'BOOKING' && !booking) return null
    if (complaint) return <div className="ui-dialog-backdrop fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#17201b]/65 p-4 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) closeComplaint() }}><section className="ui-dialog relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#ded8cc] bg-white p-6 shadow-[var(--shadow-modal)] sm:p-7" role="dialog" aria-modal="true" aria-labelledby="complaint-success-title"><div className="absolute inset-x-0 top-0 h-1 bg-[#155b49]" aria-hidden="true" /><button type="button" className="absolute top-3 right-3 grid size-11 place-items-center rounded-xl text-xl text-[#68716a] transition hover:bg-[#f5f1e9] hover:text-[#17201b]" onClick={closeComplaint} aria-label={t('common.close')}>×</button><span className="grid size-12 place-items-center rounded-2xl bg-[#eaf3ee] text-[#155b49]"><Icon name="check" /></span><p className="mt-6 text-[10px] font-bold tracking-[0.18em] text-[#a92f2f] uppercase">{t('complaint.submitted')}</p><h1 id="complaint-success-title" className="mt-2 text-3xl font-semibold">{t('complaint.thanks')}</h1><dl className="mt-5 grid gap-3 rounded-xl bg-[#faf8f3] p-4 text-sm"><div><dt>{t('complaint.reference')}</dt><dd className="m-0 font-semibold">{complaint.reference}</dd></div><div><dt>{t('complaint.journey')}</dt><dd className="m-0 font-semibold">{complaint.journey.split(' → ').map(stopName).join(' → ')}</dd></div><div><dt>{t('complaint.category')}</dt><dd className="m-0 font-semibold">{t(`complaint.category.${complaint.category}`)} → {t(`complaint.issue.${complaint.subcategory}`)}</dd></div>{complaint.photo_name && <div><dt>{t('complaint.evidence')}</dt><dd className="m-0 font-semibold">{complaint.photo_name}</dd></div>}<div><dt>{t('complaint.status')}</dt><dd className="m-0 font-semibold">{t(`status.${complaint.status}`)}</dd></div></dl><p className="mt-5 text-sm text-[#68716a]">{t('complaint.mock')}</p><button className="mt-5 min-h-11 rounded-xl bg-[#155b49] px-5 font-semibold text-white" onClick={closeComplaint}>{t('common.close')}</button></section>{error && ErrorView()}</div>
    const isManualComplaint = complaintMode === 'MANUAL'
    const pass = isManualComplaint ? null : journeyPass
    const journeySummary = isManualComplaint ? `${manualOrigin || '—'} → ${manualDestination || '—'}` : pass ? `${stopName(pass.boarding_point)} → ${stopName(pass.destination)} · ${pass.ticket_number}` : booking ? t('complaint.booking', { id: booking.id }) : ''
    const seatSummary = pass?.legs.map((leg, index) => `${t('pass.busNumber', { count: index + 1 })}: ${t('pass.seat')} ${leg.seat_numbers.join(', ')}`).join(' · ')
    const journeyDetails = pass && <dl className="grid grid-cols-2 gap-x-5 gap-y-4 py-4 text-sm sm:grid-cols-3"><div><dt className="text-xs text-[#68716a]">{t('complaint.passenger')}</dt><dd className="mt-1 ml-0 font-semibold">{booking?.passenger?.name}</dd></div><div><dt className="text-xs text-[#68716a]">{t('complaint.date')}</dt><dd className="mt-1 ml-0 font-semibold">{formatDate(pass.departure_at.slice(0, 10), locale)}</dd></div><div><dt className="text-xs text-[#68716a]">{t('complaint.service')}</dt><dd className="mt-1 ml-0 font-semibold">{pass.legs.map((leg) => localizeService(locale, leg.service_name)).join(' · ')}</dd></div><div><dt className="text-xs text-[#68716a]">{t('complaint.boarding')}</dt><dd className="mt-1 ml-0 font-semibold">{stopName(pass.boarding_point)}</dd></div><div><dt className="text-xs text-[#68716a]">{t('complaint.destination')}</dt><dd className="mt-1 ml-0 font-semibold">{stopName(pass.destination)}</dd></div><div><dt className="text-xs text-[#68716a]">{t('complaint.seats')}</dt><dd className="mt-1 ml-0 font-semibold">{seatSummary}</dd></div>{tracking?.bus_number && <div><dt className="text-xs text-[#68716a]">{t('complaint.bus')}</dt><dd className="mt-1 ml-0 font-semibold">{tracking.bus_number}</dd></div>}</dl>
    return <div className="ui-dialog-backdrop fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#17201b]/65 p-4 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) closeComplaint() }}><form className="ui-dialog relative max-h-[calc(100svh-32px)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#ded8cc] bg-white p-5 shadow-[var(--shadow-modal)] sm:max-h-[calc(100svh-48px)] sm:p-7" role="dialog" aria-modal="true" aria-labelledby="complaint-form-title" onSubmit={(event) => void submitComplaint(event)}><div className="flex min-h-11 items-center justify-between gap-4"><button type="button" className="min-h-11 text-sm font-semibold text-[#155b49]" onClick={returnToComplaintOptions}>← {t('complaint.backChoices')}</button><button type="button" className="grid size-11 shrink-0 place-items-center rounded-xl text-xl text-[#68716a] transition hover:bg-[#f5f1e9] hover:text-[#17201b]" onClick={closeComplaint} aria-label={t('common.close')}>×</button></div><p className="mt-5 text-[10px] font-bold tracking-[0.18em] text-[#a92f2f] uppercase">{t('complaint.feedback')}</p><h1 id="complaint-form-title" className="m-0 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{t('complaint.title')}</h1><p className="mt-3 text-sm leading-6 text-[#68716a]">{pass ? t('complaint.prefilled', { journey: journeySummary }) : isManualComplaint ? t('complaint.manualIntro') : journeySummary}</p>
      {pass && <><details className="mt-5 rounded-xl border border-[#ded8cc] sm:hidden"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-4 text-sm font-semibold text-[#155b49] marker:hidden [&::-webkit-details-marker]:hidden">{t('complaint.journeyDetails')} <span aria-hidden="true">⌄</span></summary><div className="border-t border-[#ded8cc] px-4">{journeyDetails}</div></details><div className="mt-5 hidden border-y border-[#ded8cc] sm:block">{journeyDetails}</div></>}
      {isManualComplaint && <fieldset className="mt-6 grid gap-4 border-0 p-0 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">{t('complaint.manualOrigin')}<input className="ui-field font-normal" value={manualOrigin} onChange={(event) => setManualOrigin(event.target.value)} required /></label><label className="grid gap-2 text-sm font-semibold">{t('complaint.manualDestination')}<input className="ui-field font-normal" value={manualDestination} onChange={(event) => setManualDestination(event.target.value)} required /></label><label className="grid gap-2 text-sm font-semibold">{t('complaint.manualDate')}<input className="ui-field font-normal" type="date" value={manualJourneyDate} onChange={(event) => setManualJourneyDate(event.target.value)} required /></label><label className="grid gap-2 text-sm font-semibold">{t('complaint.offlineTicket')} <span className="sr-only">({t('complaint.ticketOptional')})</span><input className="ui-field font-normal" value={manualTicketNumber} onChange={(event) => setManualTicketNumber(event.target.value)} placeholder={t('complaint.ticketOptional')} /></label></fieldset>}
      <label className="mt-6 grid gap-2 text-sm font-semibold">{t('complaint.what')}<select className="min-h-12 rounded-xl border border-[#cbc7bd] bg-white px-3" value={complaintCategory} onChange={(event) => { setComplaintCategory(event.target.value); setComplaintSubcategory(groups[event.target.value][0]) }}>{Object.keys(groups).map((item) => <option key={item} value={item}>{t(`complaint.category.${item}`)}</option>)}</select></label><label className="mt-5 grid gap-2 text-sm font-semibold">{t('complaint.choose')}<select className="min-h-12 rounded-xl border border-[#cbc7bd] bg-white px-3" value={complaintSubcategory} onChange={(event) => setComplaintSubcategory(event.target.value)}>{groups[complaintCategory].map((item) => <option key={item} value={item}>{t(`complaint.issue.${item}`)}</option>)}</select></label><div className="mt-5"><p className="m-0 text-sm font-semibold">{t('complaint.photo')} <span className="font-normal text-[#68716a]">({t('complaint.optional')})</span></p>{complaintPhotoPreview && <img className="mt-3 h-36 w-full rounded-xl border border-[#ded8cc] object-cover" src={complaintPhotoPreview} alt={t('complaint.photoPreview')} />}<label className="mt-3 flex min-h-20 cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#155b49]/35 bg-[#eef6f1] px-4 text-center text-sm font-semibold text-[#155b49] transition hover:border-[#155b49] hover:bg-[#e4f1e8]"><Icon name="ticket" /><span>{complaintPhoto ? t('complaint.replacePhoto') : t('complaint.addPhoto')}</span><input className="sr-only" type="file" accept="image/*" capture="environment" onChange={(event) => chooseComplaintPhoto(event.target.files?.[0] ?? null)} /></label></div>{complaintPhoto && <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-[#faf8f3] p-3 text-sm"><span className="min-w-0 truncate">{t('complaint.selected', { name: complaintPhoto.name })}</span><button type="button" className="min-h-11 px-2 font-semibold text-[#a92f2f]" onClick={() => chooseComplaintPhoto(null)}>{t('complaint.remove')}</button></div>}<p className="mt-5 text-xs text-[#68716a]">{t('complaint.mock')}</p><button className="mt-4 min-h-12 rounded-xl bg-[#b63231] px-5 font-semibold text-white disabled:opacity-60" disabled={working}>{t('complaint.submit')}</button></form>{error && ErrorView()}</div>
  }
  function ErrorView() {
    const isAmbiguousStop = error?.code === 'AMBIGUOUS_STOP'
    const isPrototypeBoundary = error?.code === 'STOP_NOT_FOUND' || error?.code === 'NO_JOURNEY_FOUND'
    const candidates = error?.details.candidates ?? []
    const requestedOrigin = attemptedSearch?.origin || (error?.details.field === 'origin' ? error.details.query : origin) || origin
    const requestedDestination = attemptedSearch?.destination || (error?.details.field === 'destination' ? error.details.query : destination) || destination

    return <div className="ui-dialog-backdrop fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#17201b]/65 p-4 sm:p-6">
      <section className={`ui-dialog relative w-full overflow-hidden rounded-2xl border border-[#ded8cc] bg-white p-5 shadow-[var(--shadow-modal)] sm:p-7 ${isPrototypeBoundary ? 'max-w-xl' : 'max-w-2xl'}`} role="dialog" aria-modal="true" aria-live={isPrototypeBoundary ? 'polite' : 'assertive'}>
        <div className={`absolute inset-x-0 top-0 h-1 ${isPrototypeBoundary ? 'bg-[#155b49]' : 'bg-[#b63231]'}`} aria-hidden="true" />
        <header className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#edf5f0] text-[#0f4b3c] shadow-sm" aria-hidden="true"><Icon name={isPrototypeBoundary ? 'check' : isAmbiguousStop ? 'location' : 'sparkle'} /></span>
          <div className="min-w-0 pt-0.5">
            <p className={`mb-1.5 text-[10px] font-bold tracking-[0.18em] uppercase ${isPrototypeBoundary ? 'text-[#155b49]' : 'text-[#a92f2f]'}`}>{isPrototypeBoundary ? t('prototype.requestReceived') : isAmbiguousStop ? t('error.confirmDestination') : t('error.planner')}</p>
            <h2 className="m-0 text-2xl leading-tight font-semibold tracking-[-0.025em] text-[#101713] sm:text-[28px]">{isPrototypeBoundary ? t('prototype.understood') : isAmbiguousStop ? t('error.whichStop') : t('error.wrong')}</h2>
            {isPrototypeBoundary ? <p className="mt-2 mb-0 text-sm leading-6 text-[#68716a] sm:text-base"><span>{t('prototype.requested')} </span><strong className="font-semibold text-[#263029]">{stopName(requestedOrigin)} → {stopName(requestedDestination)}</strong><span className="mt-0.5 block">{t('prototype.limitation')}</span></p> : <p className="mt-2 mb-0 text-sm leading-6 text-[#68716a] sm:text-base">{isAmbiguousStop ? t('error.chooseStop') : apiErrorMessage(error)}</p>}
          </div>
        </header>

        {isPrototypeBoundary && <section className="mt-5 border-y border-[#ded8cc]" aria-label={t('prototype.availableJourneys')}><p className="m-0 pt-3 text-[10px] font-bold tracking-[0.16em] text-[#155b49] uppercase">{t('prototype.availableJourneys')}</p><div className="mt-1 grid gap-x-6 sm:grid-cols-2"><span className="border-t border-[#e6e1d7] py-3 text-sm font-semibold text-[#263029]">{t('prototype.puneNashik')} <small className="block pt-0.5 text-xs font-normal text-[#68716a]">{t('prototype.chooseNashik')}</small></span><span className="border-t border-[#e6e1d7] py-3 text-sm font-semibold text-[#263029]">{t('prototype.mumbaiPune')} <small className="block pt-0.5 text-xs font-normal text-[#68716a]">{t('prototype.direct')}</small></span><span className="border-t border-[#e6e1d7] py-3 text-sm font-semibold text-[#263029]">{t('prototype.puneSatara')} <small className="block pt-0.5 text-xs font-normal text-[#68716a]">{t('prototype.direct')}</small></span><span className="border-t border-[#e6e1d7] py-3 text-sm font-semibold text-[#263029]">{t('prototype.puneDemo')} <small className="block pt-0.5 text-xs font-normal text-[#68716a]">{t('prototype.connection')}</small></span></div></section>}

        {candidates.length > 0 && <div className="mt-6 grid gap-2.5">
          {candidates.map((candidate) => <button className="group grid min-h-18 w-full grid-cols-[40px_minmax(0,1fr)_36px] items-center gap-3 rounded-xl border border-[#d8d3c8] bg-[#faf8f3] px-3 py-3 text-left transition hover:border-[#155b49]/45 hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#e4bd73] sm:px-4" key={candidate.id} onClick={() => selectStop(candidate)}>
            <span className="grid size-10 place-items-center rounded-xl bg-[#f8eee8] text-[#b63231]" aria-hidden="true"><Icon name="location" /></span>
            <span className="min-w-0 sm:grid sm:grid-cols-[minmax(150px,auto)_1fr] sm:items-center sm:gap-4">
              <strong className="block text-base font-semibold tracking-[-0.01em] text-[#101713] sm:text-lg">{stopName(candidate.name)}</strong>
              <small className="mt-1 block text-sm leading-5 text-[#6b746e] sm:mt-0">{localizeStopDescription(locale, candidate.description)}</small>
            </span>
            <span className="grid size-9 place-items-center rounded-full bg-[#f1eee7] text-[#0f4b3c] transition group-hover:bg-[#0f4b3c] group-hover:text-white" aria-hidden="true"><Icon name="chevron" /></span>
          </button>)}
        </div>}

        {isAmbiguousStop && <button className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#155b49]/30 px-4 text-sm font-semibold text-[#155b49] transition hover:border-[#155b49] hover:bg-[#eef6f1]" onClick={returnToPlanner}>← {t('error.editJourney')}</button>}

        {isPrototypeBoundary && <button className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#155b49] px-5 text-sm font-semibold text-white transition hover:bg-[#104838] sm:w-auto" onClick={returnToPlanner}>{t('prototype.choose')} <span className="ml-2" aria-hidden="true">→</span></button>}

        {!isAmbiguousStop && !isPrototypeBoundary && <button className="mt-6 rounded-xl bg-[#0f4b3c] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#14624e]" onClick={() => stage === 'complaint' ? setError(null) : returnToPlanner()}>{stage === 'complaint' ? t('common.close') : t('error.return')}</button>}
      </section>
    </div>
  }
}

function Fare({ booking, cancellation, locale }: { booking?: Booking; cancellation?: CancellationPreview; locale: Locale }) {
  const t = (key: string) => translate(locale, key)
  const row = 'contents [&>dd]:text-right [&>dd]:font-semibold'
  const total = 'contents [&>dt]:border-t [&>dt]:border-black/10 [&>dt]:pt-4 [&>dt]:font-semibold [&>dt]:text-[#101713] [&>dd]:border-t [&>dd]:border-black/10 [&>dd]:pt-4 [&>dd]:text-right [&>dd]:text-xl [&>dd]:font-semibold'
  return <dl className="mt-7 grid grid-cols-[1fr_auto] gap-x-5 gap-y-3 rounded-xl border border-[#ded8cc] bg-[#faf8f3] p-5 text-sm text-[#68716a]">
    {booking ? <>
      <div className={row}><dt>{t('fare.standard')}</dt><dd className="text-[#101713]">₹{booking.base_fare_inr}</dd></div>
      <div className={row}><dt>{t('fare.concession')}</dt><dd className="text-[#0f4b3c]">−₹{booking.concession_discount_inr}</dd></div>
      <div className={total}><dt>{t('fare.pay')}</dt><dd className="text-[#101713]">₹{booking.total_fare_inr}</dd></div>
    </> : cancellation && <>
      <div className={row}><dt>{t('fare.paid')}</dt><dd className="text-[#101713]">₹{cancellation.paid_amount_inr}</dd></div>
      <div className={row}><dt>{t('fare.deduction')}</dt><dd className="text-[#a92f2f]">−₹{cancellation.deduction_inr}</dd></div>
      <div className={row}><dt>{t('fare.nonRefundable')}</dt><dd className="text-[#a92f2f]">−₹{cancellation.non_refundable_charges_inr}</dd></div>
      <div className={total}><dt>{t('fare.receive')}</dt><dd className="text-[#101713]">₹{cancellation.refund_amount_inr}</dd></div>
    </>}
  </dl>
}

function CompactJourneyReceipt({ booking, journeyPass, locale }: { booking: Booking; journeyPass?: JourneyPass | null; locale: Locale }) {
  const t = (key: string) => translate(locale, key)
  const firstLeg = journeyPass?.legs[0]
  const lastLeg = journeyPass?.legs.at(-1)
  const seats = journeyPass?.legs.length
    ? journeyPass.legs.map((leg, index) => `${translate(locale, 'booking.busNumber', { count: index + 1 })}: ${leg.seat_numbers.join(', ')}`).join(' · ')
    : booking.seats.find((seat) => seat.held_by_current_booking)?.number ?? t('status.notSelected')
  return <details className="mt-4 overflow-hidden rounded-xl border border-[#d3cdc1] bg-white shadow-sm lg:hidden">
    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-semibold text-[#155b49] marker:hidden [&::-webkit-details-marker]:hidden"><span>{t('receipt.glance')}</span><span className="text-xs text-[#68716a]">₹{booking.total_fare_inr || booking.base_fare_inr} <span aria-hidden="true">⌄</span></span></summary>
    <div className="grid gap-3 border-t border-[#ded8cc] px-4 py-3 text-xs text-[#68716a]">
      {firstLeg && lastLeg && <strong className="text-sm text-[#17201b]">{localizeStop(locale, firstLeg.boarding_point)} → {localizeStop(locale, lastLeg.destination)}</strong>}
      <div className="flex flex-wrap justify-between gap-2"><span>{seats}</span><span>{t(`status.${booking.status}`)}</span></div>
    </div>
  </details>
}

function JourneyReceipt({ booking, journeyPass, locale, className = '' }: { booking: Booking; journeyPass?: JourneyPass | null; locale: Locale; className?: string }) {
  const t = (key: string, values?: Record<string, string | number>) => translate(locale, key, values)
  const seat = journeyPass?.seat_numbers.join(', ') ?? booking.seats.find((item) => item.held_by_current_booking)?.number ?? (booking.status === 'CONFIRMED' ? t('status.confirmed') : t('status.notSelected'))
  const legs = journeyPass?.legs ?? []
  const isConnected = legs.length > 1
  return <aside className={`${className} overflow-hidden rounded-2xl bg-[#155b49] text-white shadow-[0_8px_24px_rgba(10,53,42,0.14)] lg:sticky lg:top-5`}>
    <div className="h-1 bg-[#c99a43]" aria-hidden="true" />
    <div className="p-6">
      <p className="m-0 text-[10px] font-bold tracking-[0.18em] text-[#e4bd73] uppercase">{t('receipt.glance')}</p>
      <strong className="mt-5 block text-xl leading-tight font-semibold tracking-[-0.02em]">{booking.passenger?.name ?? t('receipt.passengerNext')}</strong>
      {isConnected ? <div className="mt-5 border-y border-white/18 py-4"><small className="block text-[10px] font-bold tracking-[0.12em] text-[#c7d8d0] uppercase">{t('receipt.twoTickets')}</small><div className="mt-3 grid gap-3">{legs.map((leg, index) => <div className="grid grid-cols-[1fr_auto] items-start gap-3" key={leg.sequence}><span className="min-w-0 text-[#c7d8d0]"><small className="block text-[10px] tracking-[0.1em] uppercase">{t('booking.busNumber', { count: index + 1 })}</small><b className="mt-1 block text-sm text-white">{localizeStop(locale, leg.boarding_point)} → {localizeStop(locale, leg.destination)}</b></span><span className="text-right"><small className="block text-[10px] text-[#c7d8d0] uppercase">{t('pass.seat')}</small><b className="mt-1 block text-base text-[#f3d99d]">{leg.seat_numbers.join(', ')}</b></span></div>)}</div></div> : <div className="mt-5 grid grid-cols-2 gap-3 border-y border-white/18 py-4 text-sm"><span className="text-[#c7d8d0]"><small className="block text-[10px] tracking-[0.12em] uppercase">{t('pass.seat')}</small><b className="mt-1 block text-base text-white">{seat}</b></span><span className="border-l border-white/18 pl-3 text-[#c7d8d0]"><small className="block text-[10px] tracking-[0.12em] uppercase">{t('receipt.status')}</small><b className="mt-1 block text-base text-white">{t(`status.${booking.status}`)}</b></span></div>}
      <div className="mt-5 flex items-end justify-between"><span className="text-sm text-[#c7d8d0]">{t('receipt.total')}</span><b className="text-2xl text-[#f3d99d]">₹{booking.total_fare_inr || booking.base_fare_inr}</b></div>
      <p className="mt-4 mb-0 text-xs leading-5 text-[#a9c2b7]">{t('common.prototype')}</p>
    </div>
  </aside>
}
