import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Icon } from './components/Icon'
import { ProductFaq, TesterGuidePage } from './components/TesterGuide'
import maharashtraHero from './assets/maharashtra-journey-hero.jpg'
import msrtcLogo from './assets/msrtc-emblem.png'
import type { ApiError, Booking, CancellationPreview, ConnectingJourney, DemoNetwork, Journey, JourneyPass, ParsedIntent, Passenger, StopCandidate } from './types'

const API_URL = import.meta.env.VITE_API_URL ?? '/api'
const DEMO_USERNAME = import.meta.env.VITE_DEMO_USERNAME ?? 'demo'
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD ?? 'lalpari2026'
const DEMO_AUTH_KEY = 'msrtc-demo-authenticated'
const LAST_BOOKING_KEY = 'msrtc-demo-last-booking'
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
type Stage = 'plan' | 'choose' | 'book' | 'pass' | 'manage' | 'test'
type SearchCriteria = { origin: string; destination: string; journeyDate: string; acOnly: boolean }

const formatTime = (value: string) => new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date(value))
const formatDate = (value: string) => new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`))
const duration = (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem(DEMO_AUTH_KEY) === 'true')

  if (!isAuthenticated) {
    return <LoginScreen onAuthenticated={() => {
      sessionStorage.setItem(DEMO_AUTH_KEY, 'true')
      setIsAuthenticated(true)
    }} />
  }

  return <JourneyApp onSignOut={() => {
    sessionStorage.removeItem(DEMO_AUTH_KEY)
    setIsAuthenticated(false)
  }} />
}

function LoginScreen({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
      setLoginError('')
      onAuthenticated()
      return
    }
    setLoginError('That username or password does not match the demo account.')
  }

  return <main className="relative grid min-h-screen place-items-center overflow-x-hidden bg-[#f5f1e9] px-4 py-8 text-[#17201b]">
    <div className="absolute inset-0 bg-cover [background-position:64%_center]" style={{ backgroundImage: `url(${maharashtraHero})` }} aria-hidden="true" />
    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(245,241,233,0.96)_0%,rgba(245,241,233,0.84)_45%,rgba(245,241,233,0.48)_100%)]" aria-hidden="true" />

    <section className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/80 bg-white/82 shadow-[0_24px_72px_rgba(23,31,25,0.18)] backdrop-blur-xl" aria-labelledby="login-title">
      <div className="h-1 bg-[#b63231]" aria-hidden="true" />
      <div className="p-6 sm:p-8">
        <header className="flex items-start justify-between gap-5">
          <img src={msrtcLogo} alt="MSRTC" className="h-14 w-16 object-contain" />
          <span className="rounded-full border border-[#c99a43] bg-[#fff9e9]/90 px-3 py-1.5 text-xs font-semibold text-[#755419]">Prototype</span>
        </header>

        <p className="mt-7 mb-2 text-[10px] font-bold tracking-[0.2em] text-[#a92f2f] uppercase">Demo access</p>
        <h1 id="login-title" className="m-0 text-4xl leading-tight font-semibold tracking-[-0.04em] text-[#101713]">Welcome aboard.</h1>
        <p className="mt-3 mb-0 text-sm leading-6 text-[#68716a]">Sign in with the prototype account to explore journey planning and booking.</p>

        <form className="mt-7 grid gap-5" onSubmit={signIn}>
          <label className="grid gap-2 text-sm font-semibold text-[#465149]">Username
            <input className="min-h-13 rounded-xl border border-[#cbc7bd] bg-white/90 px-4 text-base font-normal text-[#101713] outline-none transition focus:border-[#155b49] focus:ring-4 focus:ring-[#155b49]/10" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" autoFocus required />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#465149]">Password
            <input className="min-h-13 rounded-xl border border-[#cbc7bd] bg-white/90 px-4 text-base font-normal text-[#101713] outline-none transition focus:border-[#155b49] focus:ring-4 focus:ring-[#155b49]/10" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
          </label>

          {loginError && <p className="m-0 rounded-xl border border-[#b63231]/20 bg-[#fff1ee] px-4 py-3 text-sm text-[#703634]" role="alert">{loginError}</p>}

          <button className="flex min-h-13 items-center justify-center gap-2 rounded-xl bg-[#b63231] px-5 font-semibold text-white shadow-sm transition hover:bg-[#922626] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#e4bd73]">Enter prototype <Icon name="arrow" /></button>
        </form>

        <aside className="mt-6 rounded-xl border border-[#ded8cc] bg-[#faf8f3]/90 p-4 text-sm text-[#59645e]" aria-label="Demo credentials">
          <strong className="block text-[#263029]">Demo credentials</strong>
          <div className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1"><span>Username</span><code className="font-semibold text-[#0f4b3c]">{DEMO_USERNAME}</code><span>Password</span><code className="font-semibold text-[#0f4b3c]">{DEMO_PASSWORD}</code></div>
        </aside>

        <p className="mt-5 mb-0 text-xs leading-5 text-[#737b75]">Frontend-only access for demonstration purposes. This is not secure authentication and does not protect backend data.</p>
      </div>
    </section>
  </main>
}

type AppHeaderProps = {
  stage: Stage
  working: boolean
  onStageChange: (stage: Stage) => void
  onMyBooking: () => void
  onSignOut: () => void
}

function AppHeader({ stage, working, onStageChange, onMyBooking, onSignOut }: AppHeaderProps) {
  const navClass = (active: boolean, accent = false) => `relative flex h-full items-center border-x-0 border-t-0 border-b-2 bg-transparent px-2 text-xs font-semibold transition focus-visible:outline-3 focus-visible:outline-offset-[-5px] focus-visible:outline-[#e4bd73] sm:px-3 sm:text-sm ${active ? 'border-[#b63231] text-[#17201b]' : `border-transparent ${accent ? 'text-[#a92f2f]' : 'text-[#59645e]'} hover:text-[#17201b]`}`

  return (
    <header className="h-[72px] border-b border-[#ded8cc] bg-white">
      <div className="mx-auto flex h-full w-full max-w-6xl items-center px-4 sm:px-6">
        <button className="flex h-[42px] w-12 items-center justify-center border-0 bg-transparent p-0" aria-label="Go to journey planner" onClick={() => onStageChange('plan')}>
          <img src={msrtcLogo} alt="" className="h-[42px] w-auto max-w-full object-contain" />
        </button>

        <nav className="ml-2 flex h-full items-center border-l border-[#ded8cc] pl-2 sm:ml-5 sm:pl-3" aria-label="Primary navigation">
          <button className={`${navClass(stage === 'plan')} hidden sm:flex`} onClick={() => onStageChange('plan')}>Plan journey</button>
          <button className={navClass(stage === 'test', true)} onClick={() => onStageChange('test')}>What works</button>
        </nav>

        <div className="ml-auto flex h-full items-center gap-0.5 sm:gap-1">
          <button className="px-2 py-2 text-xs font-semibold text-[#0f4b3c] transition hover:text-[#a92f2f] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#e4bd73] sm:px-3 sm:text-sm" onClick={onMyBooking} disabled={working}><span className="sm:hidden">Booking</span><span className="hidden sm:inline">My booking</span></button>
          <span className="mx-1 hidden rounded-full border border-[#c99a43] px-2.5 py-1 text-[10px] font-semibold text-[#755419] lg:inline-flex">Prototype</span>
          <button className="px-2 py-2 text-xs font-medium text-[#68716a] transition hover:text-[#a92f2f] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#e4bd73] sm:px-3 sm:text-sm" onClick={onSignOut}>Sign out</button>
        </div>
      </div>
    </header>
  )
}

function JourneyApp({ onSignOut }: { onSignOut: () => void }) {
  const [stage, setStage] = useState<Stage>('plan')
  const [origin, setOrigin] = useState('Pune'), [destination, setDestination] = useState('Nashik'), [journeyDate, setJourneyDate] = useState(DEMO_DATE)
  const [natural, setNatural] = useState(''), [showNatural, setShowNatural] = useState(true), [intentMessage, setIntentMessage] = useState(''), [isParsing, setIsParsing] = useState(false)
  const [sortBy, setSortBy] = useState('recommended'), [acOnly, setAcOnly] = useState(false), [results, setResults] = useState<Journey[]>([]), [connections, setConnections] = useState<ConnectingJourney[]>([]), [error, setError] = useState<ApiError | null>(null), [loading, setLoading] = useState(false)
  const [resumeAiSearch, setResumeAiSearch] = useState(false)
  const [booking, setBooking] = useState<Booking | null>(null), [journey, setJourney] = useState<Journey | null>(null), [passengerName, setPassengerName] = useState(''), [passengerAge, setPassengerAge] = useState(''), [concession, setConcession] = useState<Passenger['concession_type']>('NONE'), [recoveryDemo, setRecoveryDemo] = useState(false), [working, setWorking] = useState(false), [journeyPass, setJourneyPass] = useState<JourneyPass | null>(null), [cancellation, setCancellation] = useState<CancellationPreview | null>(null), [manageId, setManageId] = useState('')
  const [network, setNetwork] = useState<DemoNetwork | null>(null), [showNetwork, setShowNetwork] = useState(false)

  useEffect(() => { window.scrollTo(0, 0) }, [stage])
  useEffect(() => {
    if (booking?.status === 'CONFIRMED') localStorage.setItem(LAST_BOOKING_KEY, booking.id)
  }, [booking])
  useEffect(() => {
    let active = true
    void fetch(`${API_URL}/demo-network?summary=true`).then(async (response) => {
      if (response.ok && active) setNetwork((await response.json()) as DemoNetwork)
    }).catch(() => undefined)
    return () => { active = false }
  }, [])

  async function findBuses(event?: FormEvent<HTMLFormElement>, nextSort = sortBy, criteria?: SearchCriteria, fromAi = false) {
    event?.preventDefault(); setLoading(true); setError(null)
    const search = criteria ?? { origin, destination, journeyDate, acOnly }
    try { const response = await fetch(`${API_URL}/journeys/search`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ origin: search.origin, destination: search.destination, journey_date: search.journeyDate, air_conditioned: search.acOnly || undefined, sort_by: nextSort }) }); if (!response.ok) { const apiError = ((await response.json()) as { error: ApiError }).error; const canResume = fromAi && apiError.code === 'AMBIGUOUS_STOP'; setResumeAiSearch(canResume); if (!canResume) setIntentMessage(''); setError(apiError); return }; const data = (await response.json()) as { results: Journey[]; connecting_results: ConnectingJourney[] }; setResults(data.results); setConnections(data.connecting_results); setIntentMessage(''); setResumeAiSearch(false); setStage('choose') } catch { setIntentMessage(''); setResumeAiSearch(false); setError({ code: 'SERVICE_UNAVAILABLE', message: 'We could not load buses right now. Your journey details are still here—please try again.', details: {} }) } finally { setLoading(false) }
  }
  async function parseIntent() { setIsParsing(true); setIntentMessage(''); try { const response = await fetch(`${API_URL}/intent/parse`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: natural }) }); if (!response.ok) { setIntentMessage(((await response.json()) as { error: ApiError }).error.message); return }; const intent = (await response.json()) as ParsedIntent; const criteria = { origin: intent.origin, destination: intent.destination, journeyDate: intent.travel_date, acOnly: intent.preferences.air_conditioned === true }; setOrigin(criteria.origin); setDestination(criteria.destination); setJourneyDate(criteria.journeyDate); setAcOnly(criteria.acOnly); setResumeAiSearch(true); setIntentMessage('Journey understood. Finding buses…'); await findBuses(undefined, sortBy, criteria, true) } catch { setResumeAiSearch(false); setIntentMessage('Natural-language search is unavailable. Use the journey fields instead.') } finally { setIsParsing(false) } }
  function selectStop(candidate: StopCandidate) {
    const field = error?.details.field
    const criteria = { origin: field === 'origin' ? candidate.name : origin, destination: field === 'origin' ? destination : candidate.name, journeyDate, acOnly }
    setOrigin(criteria.origin); setDestination(criteria.destination); setError(null)
    void findBuses(undefined, sortBy, criteria, resumeAiSearch)
  }
  async function selectJourney(nextJourney: Journey) { setWorking(true); setError(null); try { const response = await fetch(`${API_URL}/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trip_id: nextJourney.trip_id }) }); if (!response.ok) { setError(((await response.json()) as { error: ApiError }).error); return }; setJourney(nextJourney); setBooking((await response.json()) as Booking); setJourneyPass(null); setCancellation(null); setStage('book') } catch { setError({ code: 'SERVICE_UNAVAILABLE', message: 'We could not start this booking. Please try again.', details: {} }) } finally { setWorking(false) } }
  async function bookingRequest(path: string, options?: RequestInit) { if (!booking) return null; setWorking(true); setError(null); try { const response = await fetch(`${API_URL}/bookings/${booking.id}${path}`, options); if (!response.ok) { setError(((await response.json()) as { error: ApiError }).error); return null }; return response } catch { setError({ code: 'SERVICE_UNAVAILABLE', message: 'We could not update your booking. Please try again.', details: {} }); return null } finally { setWorking(false) } }
  async function holdSeat(number: string) { const response = await bookingRequest('/seats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seat_numbers: [number] }) }); if (response) setBooking((await response.json()) as Booking) }
  async function savePassenger(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const response = await bookingRequest('/passengers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: passengerName, age: Number(passengerAge), concession_type: concession }) }); if (response) setBooking((await response.json()) as Booking) }
  async function pay() { const response = await bookingRequest('/payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmation_failure_demo: recoveryDemo }) }); if (response) setBooking((await response.json()) as Booking) }
  async function confirm() { const response = await bookingRequest('/confirm', { method: 'POST' }); if (response) setBooking((await response.json()) as Booking) }
  async function showPass() { const response = await bookingRequest('/ticket'); if (response) { setJourneyPass((await response.json()) as JourneyPass); setStage('pass') } }
  async function openManage(current = booking?.id) { if (!current) { setStage('manage'); return } setWorking(true); setError(null); try { const response = await fetch(`${API_URL}/bookings/${current}/cancellation-preview`); if (!response.ok) { setError(((await response.json()) as { error: ApiError }).error); return }; setCancellation((await response.json()) as CancellationPreview); setStage('manage') } catch { setError({ code: 'SERVICE_UNAVAILABLE', message: 'We could not open booking management. Please try again.', details: {} }) } finally { setWorking(false) } }
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
      if (loadedBooking.status === 'CONFIRMED') {
        const ticketResponse = await fetch(`${API_URL}/bookings/${current}/ticket`)
        if (ticketResponse.ok) loadedPass = (await ticketResponse.json()) as JourneyPass
      }
      const cancellationResponse = await fetch(`${API_URL}/bookings/${current}/cancellation-preview`)
      if (!cancellationResponse.ok) { setError(((await cancellationResponse.json()) as { error: ApiError }).error); return }
      setBooking(loadedBooking); setJourney(null); setJourneyPass(loadedPass); setCancellation((await cancellationResponse.json()) as CancellationPreview); setManageId(current); setStage('manage')
    } catch { setError({ code: 'SERVICE_UNAVAILABLE', message: 'We could not find that booking. Please try again.', details: {} }) } finally { setWorking(false) }
  }
  async function findBooking(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (manageId.trim()) await loadBooking(manageId.trim()) }
  async function openMyBooking() {
    const current = booking && (booking.status === 'CONFIRMED' || booking.status === 'CANCELLED') ? booking.id : localStorage.getItem(LAST_BOOKING_KEY)
    if (current) await loadBooking(current)
    else { setBooking(null); setJourney(null); setJourneyPass(null); setCancellation(null); setStage('manage') }
  }
  async function cancel() { const response = await bookingRequest('/cancel', { method: 'POST' }); if (response) setBooking((await response.json()) as Booking) }
  async function advanceRefund() { const response = await bookingRequest('/refund/advance', { method: 'POST' }); if (response) setBooking((await response.json()) as Booking) }
  const bookStep = !booking || booking.status === 'DRAFT' ? 'seat' : booking.status === 'SEATS_HELD' && !booking.passenger ? 'passenger' : booking.status === 'SEATS_HELD' ? 'payment' : booking.status === 'PAYMENT_RECEIVED' ? 'confirm' : booking.status === 'CONFIRMED' ? 'confirmed' : 'failed'

  return <div className="min-h-screen bg-[#f5f1e9] font-sans text-[#17201b]"><AppHeader stage={stage} working={working} onStageChange={setStage} onMyBooking={() => void openMyBooking()} onSignOut={onSignOut} /><main>{stage === 'plan' && PlanScreen()}{stage === 'choose' && ChooseScreen()}{stage === 'book' && BookScreen()}{stage === 'pass' && PassScreen()}{stage === 'manage' && ManageScreen()}{stage === 'test' && <TesterGuidePage network={network} onBack={() => setStage('plan')} />}</main></div>

  function PlanScreen() {
    const aiWorking = isParsing || (loading && resumeAiSearch)
    const setQuickJourney = (from: string, to: string) => {
      setOrigin(from)
      setDestination(to)
      setNatural(`${from} to ${to} tomorrow morning`)
      setShowNatural(true)
    }

    return <div className="min-h-[calc(100svh-72px)] overflow-x-hidden bg-[#f5f1e9]">
      <section className="relative h-[480px] min-h-[410px] bg-cover [background-position:62%_68%] sm:h-[520px] sm:[background-position:center_66%]" style={{ backgroundImage: `url(${maharashtraHero})` }}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#f5f1e9]/5 via-transparent to-[#f5f1e9]/55" aria-hidden="true" />
        <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col items-center justify-center px-4 pb-14 text-center sm:px-6 sm:pb-20">
          <div className="mb-4 flex items-center justify-center gap-3 text-[#747a74]">
            <span className="hidden h-px w-8 bg-[#b9a98e] sm:block" aria-hidden="true" />
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase">Maharashtra State Road Transport Corporation</p>
            <span className="hidden h-px w-8 bg-[#b9a98e] sm:block" aria-hidden="true" />
          </div>
          <h1 className="max-w-3xl font-['Kohinoor_Devanagari','Noto_Sans_Devanagari','Mangal',sans-serif] text-[42px] leading-[1.12] font-bold tracking-[-0.015em] text-[#a92f2f] drop-shadow-[0_1px_0_rgba(255,255,255,0.35)] sm:text-[52px] lg:text-[56px]" lang="mr"><span className="block">जनसामान्यांसाठी</span><span className="mt-1 block">रस्ता तिथे एस.टी</span></h1>
          <span className="mt-4 block h-0.5 w-12 rounded-full bg-[#c99a43]" aria-hidden="true" />
          <p className="mt-3 max-w-xl text-base leading-7 font-medium text-[#4f5b54] sm:text-[17px]">Tell us where you want to go. We’ll find the right ST service.</p>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-20 w-full max-w-6xl px-4 sm:px-6" aria-label="Journey planner">
        <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/72 p-3 shadow-[0_18px_50px_rgba(20,28,22,0.16)] backdrop-blur-xl">
          {showNatural && <div className={`group relative grid grid-cols-[1fr_auto] items-center gap-3 overflow-hidden rounded-xl border bg-white/85 px-4 py-3 shadow-sm transition focus-within:ring-2 ${aiWorking ? 'border-[#c99a43] ring-[#c99a43]/12' : 'border-white/80 focus-within:border-[#155b49]/35 focus-within:ring-[#155b49]/8'}`} aria-busy={aiWorking}>
            {aiWorking && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-[#b63231] via-[#c99a43] to-[#155b49] motion-safe:animate-pulse" aria-hidden="true" />}
            <div className="min-w-0">
              <label className="mb-1 flex items-center gap-2 text-xs font-bold text-[#155b49]" htmlFor="journey-description"><span className={`grid size-5 place-items-center rounded-md bg-[#eaf4ef] ${aiWorking ? 'text-[#b17d22]' : 'text-[#155b49]'}`}><Icon name="sparkle" /></span>{aiWorking ? 'AI is planning your journey' : 'AI journey planner'}</label>
              <input id="journey-description" className="w-full border-0 bg-transparent p-0 text-base font-medium text-[#101713] outline-none placeholder:font-normal placeholder:text-[#858c87] focus:outline-none" value={natural} onChange={(event) => setNatural(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !aiWorking && natural.trim()) { event.preventDefault(); void parseIntent() } }} placeholder="Describe your journey — e.g. Pune to Nashik tomorrow morning, AC" readOnly={aiWorking} />
            </div>
            <button type="button" className="grid size-11 place-items-center rounded-xl bg-[#155b49] text-white shadow-sm transition hover:bg-[#104838] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#c99a43] disabled:cursor-not-allowed disabled:bg-[#b17d22] disabled:text-white" aria-label={aiWorking ? 'Planning journey' : 'Ask AI to plan this journey'} onClick={() => void parseIntent()} disabled={aiWorking || !natural.trim()}>{aiWorking ? <span className="size-5 rounded-full border-2 border-white/35 border-t-white motion-safe:animate-spin" aria-hidden="true" /> : <Icon name="arrow" />}</button>
            {intentMessage && <p className="col-span-2 text-sm text-[#0f4b3c]" aria-live="polite">{intentMessage}</p>}
          </div>}

          <div className="flex items-center gap-3 px-2 py-2" aria-hidden="true"><span className="h-px flex-1 bg-black/10" /><span className="text-[10px] font-bold tracking-[0.14em] text-[#747c76] uppercase">Or search manually</span><span className="h-px flex-1 bg-black/10" /></div>
          <form className="grid overflow-hidden rounded-2xl border border-white/80 bg-white/72 shadow-sm md:grid-cols-[1fr_44px_1fr_1fr_auto]" onSubmit={(event) => void findBuses(event)}>
            <label className="grid gap-1 border-b border-black/10 px-5 py-3 md:border-r md:border-b-0 [@media_(min-width:1024px)_and_(max-height:900px)]:py-2"><span className="text-[10px] font-bold tracking-[0.16em] text-[#6b746e] uppercase">From</span><input className="min-w-0 border-0 bg-transparent p-0 text-lg font-semibold tracking-[-0.01em] outline-none focus:outline-none [@media_(min-width:1024px)_and_(max-height:900px)]:text-base" value={origin} onChange={(event) => setOrigin(event.target.value)} list="supported-stops" autoComplete="off" required /></label>
            <span className="hidden place-items-center text-[#b63231] md:grid"><span className="grid size-8 place-items-center rounded-full bg-[#fff0ec]"><Icon name="arrow" /></span></span>
            <label className="grid gap-1 border-b border-black/10 px-5 py-3 md:border-r md:border-b-0 [@media_(min-width:1024px)_and_(max-height:900px)]:py-2"><span className="text-[10px] font-bold tracking-[0.16em] text-[#6b746e] uppercase">To</span><input className="min-w-0 border-0 bg-transparent p-0 text-lg font-semibold tracking-[-0.01em] outline-none focus:outline-none [@media_(min-width:1024px)_and_(max-height:900px)]:text-base" value={destination} onChange={(event) => setDestination(event.target.value)} list="supported-stops" autoComplete="off" required /></label>
            <label className="grid gap-1 border-b border-black/10 px-5 py-3 md:border-r md:border-b-0 [@media_(min-width:1024px)_and_(max-height:900px)]:py-2"><span className="text-[10px] font-bold tracking-[0.16em] text-[#6b746e] uppercase">Travel date</span><input className="min-w-0 border-0 bg-transparent p-0 text-lg font-semibold tracking-[-0.01em] outline-none focus:outline-none [@media_(min-width:1024px)_and_(max-height:900px)]:text-base" type="date" value={journeyDate} min={network?.coverage_start} max={network?.coverage_end} onChange={(event) => setJourneyDate(event.target.value)} required /></label>
            <button className="flex min-h-16 items-center justify-center gap-3 bg-[#b63231] px-7 font-semibold text-white transition hover:bg-[#902525] focus-visible:outline-3 focus-visible:outline-offset-[-4px] focus-visible:outline-[#f0c775] disabled:opacity-60 [@media_(min-width:1024px)_and_(max-height:900px)]:min-h-14" disabled={loading}>{loading ? 'Finding buses…' : <>Find buses <Icon name="arrow" /></>}</button>
          </form>
          <datalist id="supported-stops">{network?.stops.map((stop) => <option key={stop.id} value={stop.name}>{stop.city}</option>)}</datalist>
        </div>
        <button className="mx-auto mt-3 flex items-center gap-2 rounded-full border border-[#d5cfc3] bg-white/85 px-4 py-2 text-xs font-semibold text-[#0f4b3c] shadow-sm backdrop-blur transition hover:border-[#155b49]/45 hover:bg-white" onClick={() => setShowNetwork(true)}>{network ? `${network.coverage.hub_count} Maharashtra hubs · ${network.coverage.corridor_count} corridors` : 'Supported prototype network'} <span className="text-[#b63231]">View coverage</span></button>
      </section>

      <section className="mx-auto mt-7 grid w-full max-w-6xl gap-3 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-[190px_1fr_1fr] lg:items-stretch" aria-labelledby="popular-journeys">
        <div className="flex flex-col justify-center px-2 sm:col-span-2 lg:row-span-2 lg:col-span-1">
          <p className="text-[10px] font-black tracking-[0.16em] text-[#a92f2f] uppercase">Popular journeys</p>
          <h2 id="popular-journeys" className="mt-1 text-base font-extrabold tracking-tight text-[#263029]">Start with a route</h2>
        </div>
        <button className="group flex min-h-18 items-center justify-between rounded-xl border border-[#ded8cc] bg-white px-5 text-left transition hover:border-[#155b49]/45 hover:shadow-sm" onClick={() => setQuickJourney('Pune', 'Nashik')}><span><strong className="block text-base font-semibold text-[#17201b]">Pune → Nashik</strong><small className="mt-1 block text-[#6b746e]">Morning services</small></span><span className="text-[#b63231]"><Icon name="arrow" /></span></button>
        <button className="group flex min-h-18 items-center justify-between rounded-xl border border-[#ded8cc] bg-white px-5 text-left transition hover:border-[#155b49]/45 hover:shadow-sm" onClick={() => setQuickJourney('Mumbai', 'Pune')}><span><strong className="block text-base font-semibold text-[#17201b]">Mumbai → Pune</strong><small className="mt-1 block text-[#6b746e]">Shivneri and E-Shivai</small></span><span className="text-[#b63231]"><Icon name="arrow" /></span></button>
        <button className="group flex min-h-18 items-center justify-between rounded-xl border border-[#ded8cc] bg-white px-5 text-left transition hover:border-[#155b49]/45 hover:shadow-sm" onClick={() => setQuickJourney('Pune', 'Kolhapur')}><span><strong className="block text-base font-semibold text-[#17201b]">Pune → Kolhapur</strong><small className="mt-1 block text-[#6b746e]">Direct intercity services</small></span><span className="text-[#b63231]"><Icon name="arrow" /></span></button>
        <button className="group flex min-h-18 items-center justify-between rounded-xl border border-[#ded8cc] bg-white px-5 text-left transition hover:border-[#155b49]/45 hover:shadow-sm" onClick={() => setQuickJourney('Nagpur', 'Amravati')}><span><strong className="block text-base font-semibold text-[#17201b]">Nagpur → Amravati</strong><small className="mt-1 block text-[#6b746e]">Vidarbha services</small></span><span className="text-[#b63231]"><Icon name="arrow" /></span></button>
      </section>

      <ProductFaq />

      <footer className="w-full border-t border-[#ded8cc] bg-white"><div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-[#727a74] sm:px-6"><span>Prototype journey service using synthetic schedules</span><span>No real booking or payment is made</span></div></footer>
      {showNetwork && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#17201b]/65 p-4" role="dialog" aria-modal="true" aria-labelledby="network-title"><section className="w-full max-w-3xl rounded-2xl border border-[#ded8cc] bg-white p-5 shadow-[0_24px_72px_rgba(8,23,17,0.3)] sm:p-7"><div className="flex items-start justify-between gap-5"><div><p className="mb-2 text-[10px] font-bold tracking-[0.18em] text-[#a92f2f] uppercase">Illustrative synthetic data</p><h2 id="network-title" className="m-0 text-3xl font-semibold tracking-[-0.03em]">Supported prototype network</h2><p className="mt-2 text-sm leading-6 text-[#68716a]">Search travel from {network ? formatDate(network.coverage_start) : 'tomorrow'} through {network ? formatDate(network.coverage_end) : 'the next 14 days'}. Schedules and fares are not official MSRTC data.</p></div><button className="rounded-xl border border-[#ded8cc] px-4 py-2 text-sm font-semibold text-[#59645e] hover:bg-[#f5f1e9]" onClick={() => setShowNetwork(false)}>Close</button></div><div className="mt-5 grid max-h-[50vh] gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">{network?.stops.filter((stop) => stop.id !== 'stop_demo_destination').map((stop) => <div key={stop.id} className="rounded-xl border border-[#ded8cc] bg-[#faf8f3] p-3"><strong className="block text-sm">{stop.city}</strong><span className="mt-1 block text-xs text-[#68716a]">{stop.name}</span></div>)}</div></section></div>}
      {error && ErrorView()}
    </div>
  }
  function ChooseScreen() {
    const sorts = ['recommended', 'fastest', 'cheapest', 'earliest']
    const hasDirectServices = results.length > 0

    return <section className="min-h-[calc(100svh-72px)] bg-[#f5f1e9] px-4 py-7 sm:px-6 lg:py-9">
      <div className="mx-auto w-full max-w-6xl">
        <section className="grid gap-5 rounded-2xl border border-[#ded8cc] bg-white p-5 shadow-[0_8px_24px_rgba(23,31,25,0.06)] sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6" aria-label="Current search">
          <button className="flex items-center gap-1.5 text-sm font-semibold text-[#0f4b3c] transition hover:text-[#b63231] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#e4bd73]" onClick={() => setStage('plan')}><span className="rotate-180"><Icon name="chevron" /></span> Change search</button>
          <div className="sm:border-l sm:border-black/10 sm:pl-6">
            <p className="mb-1 text-[10px] font-bold tracking-[0.17em] text-[#a92f2f] uppercase">Your journey</p>
            <div className="flex flex-wrap items-center gap-2 text-xl font-semibold tracking-[-0.025em] text-[#101713] sm:text-2xl"><span>{origin}</span><span className="text-[#b63231]"><Icon name="arrow" /></span><span>{destination}</span></div>
            <p className="mt-1.5 mb-0 text-sm text-[#68716a]">{formatDate(journeyDate)} · 1 passenger</p>
          </div>
          <label className="flex w-fit cursor-pointer items-center gap-2 rounded-full border border-[#ded8cc] bg-[#faf8f3] px-3 py-2 text-sm font-medium text-[#59645e]"><input className="size-4 accent-[#b63231]" type="checkbox" checked={acOnly} onChange={(event) => setAcOnly(event.target.checked)} /> AC only</label>
        </section>

        <div className="mt-8 flex flex-col gap-5 lg:mt-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-bold tracking-[0.2em] text-[#a92f2f] uppercase">{hasDirectServices ? 'Available services' : 'Suggested itinerary'}</p>
            <h1 className="m-0 text-4xl leading-none font-semibold tracking-[-0.04em] text-[#101713] sm:text-5xl">{hasDirectServices ? 'Choose how you travel.' : 'One change can get you there.'}</h1>
          </div>
          {hasDirectServices && <nav className="flex w-full gap-1 overflow-x-auto rounded-xl border border-[#ded8cc] bg-white p-1.5 lg:w-auto" aria-label="Sort services">
            {sorts.map((value) => <button key={value} className={`shrink-0 rounded-lg px-3.5 py-2 text-sm font-semibold capitalize transition focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-[#c99a43] ${sortBy === value ? 'bg-[#b63231] text-white' : 'text-[#68716a] hover:bg-[#f5f1e9] hover:text-[#101713]'}`} onClick={() => { setSortBy(value); void findBuses(undefined, value) }}>{value}</button>)}
          </nav>}
        </div>

        {results.length > 0 && <div className="mt-6 grid gap-4">
          {results.map((service, index) => {
            const recommended = index === 0 && sortBy === 'recommended'
            return <article className={`group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-[0_8px_24px_rgba(23,31,25,0.06)] transition hover:border-[#b8b1a5] sm:p-6 ${recommended ? 'border-[#b63231]/45' : 'border-[#ded8cc]'}`} key={service.id}>
              {recommended && <span className="absolute inset-y-0 left-0 w-1 bg-[#b63231]" aria-hidden="true" />}
              <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(210px,1.15fr)_minmax(360px,1.8fr)_auto] lg:items-center lg:gap-8">
                <div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] uppercase ${recommended ? 'bg-[#f9e8e3] text-[#a92f2f]' : 'bg-[#eaf3ee] text-[#0f4b3c]'}`}>{recommended ? 'Recommended' : service.service_type}</span>
                  <h2 className="mt-3 mb-1 text-xl font-semibold tracking-[-0.02em] text-[#101713]">{service.service_name}</h2>
                  <p className="m-0 text-sm text-[#68716a]">{service.is_air_conditioned ? 'Air conditioned' : 'Non-AC'} · <span className="font-medium text-[#0f4b3c]">{service.available_seats} seats left</span></p>
                </div>

                <div className="grid grid-cols-[auto_minmax(70px,1fr)_auto] items-center gap-4">
                  <div>
                    <strong className="block text-2xl font-semibold tracking-[-0.025em] text-[#101713]">{formatTime(service.departure_at)}</strong>
                    <small className="mt-1 block text-sm text-[#68716a]">{service.origin.name}</small>
                  </div>
                  <div className="grid gap-2 text-center text-xs text-[#737b75]">
                    <span>{duration(service.duration_minutes)}</span>
                    <span className="relative h-px bg-[#9fa69f] after:absolute after:-top-[3px] after:right-0 after:size-1.5 after:rotate-45 after:border-t after:border-r after:border-[#9fa69f]" />
                  </div>
                  <div className="text-right">
                    <strong className="block text-2xl font-semibold tracking-[-0.025em] text-[#101713]">{formatTime(service.arrival_at)}</strong>
                    <small className="mt-1 block text-sm text-[#68716a]">{service.destination.name}</small>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-5 border-t border-black/10 pt-4 lg:min-w-44 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-7">
                  <div><small className="block text-[10px] font-bold tracking-[0.14em] text-[#737b75] uppercase">Fare</small><strong className="mt-1 block text-2xl font-semibold text-[#101713]">₹{service.fare_inr}</strong></div>
                  <button className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#b63231] px-5 font-semibold text-white shadow-sm transition hover:bg-[#922626] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#e4bd73] disabled:cursor-wait disabled:opacity-60" disabled={working} onClick={() => void selectJourney(service)}>Select <Icon name="arrow" /></button>
                </div>
              </div>
            </article>
          })}
        </div>}

        {connections.map((connection) => <article className="relative mt-6 overflow-hidden rounded-2xl border border-[#ded8cc] bg-white p-6 text-[#17201b] shadow-[0_8px_24px_rgba(23,31,25,0.06)] sm:p-7" key={connection.id}>
          <span className="absolute inset-y-0 left-0 w-1 bg-[#b63231]" aria-hidden="true" />
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="mb-2 text-[10px] font-bold tracking-[0.18em] text-[#b63231] uppercase">Connection preview</p><h2 className="m-0 text-2xl font-semibold tracking-[-0.025em]">Change once at {connection.transfer_stop.name}.</h2></div>
            <div className="flex flex-wrap items-center gap-4 text-sm"><span className="rounded-full border border-[#b63231]/30 bg-[#fff1ee] px-3 py-1 text-xs font-semibold text-[#a92f2f]">Preview only</span><span className="text-[#68716a]">{duration(connection.total_duration_minutes)} total</span><strong className="text-xl text-[#17201b]">₹{connection.total_fare_inr}</strong></div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {connection.segments.map((segment, index) => <div className="rounded-xl border border-[#ded8cc] bg-[#faf8f3] p-4" key={segment.trip_id}><strong className="block">{formatTime(segment.departure_at)} · {segment.origin.name}</strong><span className="mt-1 block text-sm text-[#68716a]">{segment.service_name} · {duration(segment.duration_minutes)}</span>{index === 0 && <em className="mt-3 inline-flex rounded-full border border-[#c99a43]/35 bg-[#fff5dc] px-2.5 py-1 text-xs font-medium not-italic text-[#755419]">Change at {connection.transfer_stop.name} · {duration(connection.transfer_minutes)}</em>}</div>)}
          </div>
          <footer className="mt-6 flex flex-col gap-4 border-t border-[#ded8cc] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div><strong className="block text-sm">This connection cannot be booked together yet.</strong><p className="mt-1 mb-0 max-w-2xl text-sm leading-5 text-[#68716a]">This prototype can book direct buses only. Choose another destination with a direct service to continue to seat selection.</p></div>
            <button className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#b63231] bg-white px-4 text-sm font-semibold text-[#b63231] transition hover:bg-[#fff1ee] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#c99a43]" onClick={() => setStage('plan')}>Change search <Icon name="arrow" /></button>
          </footer>
        </article>)}
      </div>
      {error && ErrorView()}
    </section>
  }
  function BookScreen() {
    if (!booking) return null
    const steps = ['Seat', 'Passenger', 'Payment', 'Confirm']
    const currentStep = bookStep === 'seat' ? 0 : bookStep === 'passenger' ? 1 : bookStep === 'payment' ? 2 : 3
    const primaryButton = 'flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#b63231] px-5 font-semibold text-white shadow-sm transition hover:bg-[#922626] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#e4bd73] disabled:cursor-wait disabled:opacity-60'

    return <section className="min-h-[calc(100svh-72px)] bg-[#f5f1e9] px-4 py-6 sm:px-6 lg:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex flex-col gap-5 rounded-2xl border border-[#ded8cc] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(23,31,25,0.06)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <button className="flex items-center gap-1.5 text-sm font-semibold text-[#0f4b3c] transition hover:text-[#b63231] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#e4bd73]" onClick={() => setStage('choose')}><span className="rotate-180"><Icon name="chevron" /></span> Back to services</button>
          <ol className="grid grid-cols-4 gap-1 sm:min-w-[500px]" aria-label="Booking progress">
            {steps.map((label, index) => <li className="relative flex flex-col items-center gap-1.5 text-center" key={label} aria-current={currentStep === index ? 'step' : undefined}>
              {index > 0 && <span className={`absolute top-4 right-1/2 h-px w-full ${currentStep >= index ? 'bg-[#b63231]/55' : 'bg-black/10'}`} aria-hidden="true" />}
              <span className={`relative z-10 grid size-8 place-items-center rounded-full text-xs font-bold transition ${currentStep >= index ? 'bg-[#b63231] text-white shadow-sm' : 'bg-[#e8e7e1] text-[#858c87]'}`}>{index + 1}</span>
              <span className={`text-[10px] font-semibold sm:text-xs ${currentStep >= index ? 'text-[#a92f2f]' : 'text-[#8c938e]'}`}>{label}</span>
            </li>)}
          </ol>
        </header>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <section className="rounded-2xl border border-[#ded8cc] bg-white p-5 shadow-[0_8px_24px_rgba(23,31,25,0.06)] sm:p-7 lg:p-8">
            {bookStep === 'seat' && <>
              <p className="mb-2 text-[10px] font-bold tracking-[0.2em] text-[#a92f2f] uppercase">Select your seat</p>
              <h1 className="m-0 text-4xl leading-[1.02] font-semibold tracking-[-0.04em] text-[#101713] sm:text-5xl">Choose your place on board.</h1>
              <p className="mt-3 mb-0 text-base leading-6 text-[#68716a]">Your selection is held for 10 minutes while you complete your booking.</p>

              <div className="mt-7 max-w-2xl rounded-2xl border border-[#d4cfc3] bg-[#faf8f3] p-4 sm:p-5">
                <header className="flex items-center justify-between border-b border-black/10 pb-3 text-sm text-[#68716a]"><span className="flex items-center gap-2"><Icon name="bus" /> Front of bus</span><span className="rounded-full bg-[#f3eee4] px-3 py-1 text-xs">Driver</span></header>
                <div className="relative mx-auto mt-5 grid max-w-lg grid-cols-[1fr_34px_1fr] gap-y-3">
                  <span className="pointer-events-none absolute inset-y-0 left-1/2 flex -translate-x-1/2 items-center text-[10px] font-bold tracking-[0.16em] text-[#a1a6a1] uppercase [writing-mode:vertical-rl]" aria-hidden="true">Aisle</span>
                  {booking.seats.map((seat, index) => {
                    const available = seat.status === 'AVAILABLE'
                    const held = seat.status === 'HELD'
                    const seatStyle = available ? 'border-[#247151] bg-[#edf6f0] text-[#153d31] hover:bg-[#e2f1e8]' : held ? 'border-[#755da6] bg-[#f1edfc] text-[#4b386e]' : 'border-[#bd625a] bg-[#fff1ee] text-[#703634]'
                    return <button key={seat.id} className={`grid min-h-20 gap-1 rounded-2xl border-2 p-3 text-left transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#e4bd73] disabled:cursor-not-allowed disabled:opacity-85 ${index % 2 === 0 ? 'col-start-1' : 'col-start-3'} ${seatStyle}`} disabled={!available} onClick={() => void holdSeat(seat.number)} aria-label={`Seat ${seat.number}, ${available ? `${seat.seat_type.toLowerCase()}, available` : seat.status.toLowerCase()}`}><b className="text-lg">{seat.number}</b><span className="text-xs font-medium capitalize">{available ? seat.seat_type.toLowerCase() : seat.status.toLowerCase()}</span></button>
                  })}
                </div>
                <footer className="mt-5 flex flex-wrap gap-4 border-t border-black/10 pt-4 text-xs text-[#68716a]">
                  <span className="flex items-center gap-1.5"><i className="size-3 rounded-sm border-2 border-[#247151] bg-[#edf6f0]" /> Available</span>
                  <span className="flex items-center gap-1.5"><i className="size-3 rounded-sm border-2 border-[#755da6] bg-[#f1edfc]" /> Held</span>
                  <span className="flex items-center gap-1.5"><i className="size-3 rounded-sm border-2 border-[#bd625a] bg-[#fff1ee]" /> Booked</span>
                </footer>
              </div>
            </>}

            {bookStep === 'passenger' && <form className="max-w-2xl" onSubmit={(event) => void savePassenger(event)}>
              <p className="mb-2 text-[10px] font-bold tracking-[0.2em] text-[#a92f2f] uppercase">Passenger details</p>
              <h1 className="m-0 text-4xl leading-none font-semibold tracking-[-0.04em] text-[#101713] sm:text-5xl">Who is travelling?</h1>
              <p className="mt-3 mb-0 text-sm leading-6 text-[#68716a]"><strong className="text-[#703634]">Prototype only:</strong> use a made-up name and do not enter real personal information.</p>
              <div className="mt-7 grid gap-5 sm:grid-cols-[1fr_150px]">
                <label className="grid gap-2 text-sm font-semibold text-[#465149]">Full name<input className="min-h-13 rounded-xl border border-[#cbc7bd] bg-white px-4 text-base font-normal text-[#101713] outline-none transition focus:border-[#155b49] focus:ring-4 focus:ring-[#155b49]/10" value={passengerName} onChange={(event) => setPassengerName(event.target.value)} required /></label>
                <label className="grid gap-2 text-sm font-semibold text-[#465149]">Age<input className="min-h-13 rounded-xl border border-[#cbc7bd] bg-white px-4 text-base font-normal text-[#101713] outline-none transition focus:border-[#155b49] focus:ring-4 focus:ring-[#155b49]/10" type="number" value={passengerAge} min="1" max="120" onChange={(event) => setPassengerAge(event.target.value)} required /></label>
              </div>
              <fieldset className="mt-6 border-0 p-0"><legend className="mb-3 text-sm font-semibold text-[#465149]">Concession</legend><div className="grid gap-2 sm:grid-cols-3">{(['NONE','STUDENT','SENIOR'] as const).map((item) => <label className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 text-sm transition ${concession === item ? 'border-[#155b49] bg-[#eaf3ee] text-[#153d31]' : 'border-[#d4cfc3] bg-white text-[#68716a] hover:bg-[#faf8f3]'}`} key={item}><input className="accent-[#155b49]" type="radio" checked={concession === item} onChange={() => setConcession(item)} /> {item === 'NONE' ? 'No concession' : item === 'STUDENT' ? 'Student' : 'Senior citizen'}</label>)}</div></fieldset>
              <p className="my-5 rounded-xl border border-[#dfc584]/55 bg-[#fff5dc] p-4 text-sm leading-6 text-[#72501c]">Eligibility is simulated for this prototype. Students aged 25 or under receive 10%; seniors aged 60+ receive 20%.</p>
              <button className={primaryButton} disabled={working}>Continue to payment <Icon name="arrow" /></button>
            </form>}

            {bookStep === 'payment' && <section className="max-w-2xl">
              <p className="mb-2 text-[10px] font-bold tracking-[0.2em] text-[#a92f2f] uppercase">Mock payment</p>
              <h1 className="m-0 text-4xl leading-none font-semibold tracking-[-0.04em] text-[#101713] sm:text-5xl">Review and pay.</h1>
              <Fare booking={booking} />
              <label className="my-5 flex cursor-pointer items-start gap-3 rounded-xl border border-[#d4cfc3] bg-[#faf8f3] p-4 text-sm leading-5 text-[#59645e]"><input className="mt-0.5 size-4 accent-[#b63231]" type="checkbox" checked={recoveryDemo} onChange={(event) => setRecoveryDemo(event.target.checked)} /><span><strong className="block text-[#101713]">Demonstrate payment recovery</strong>Simulate a successful payment followed by a reservation failure.</span></label>
              <p className="mb-5 rounded-xl border border-[#dfc584]/55 bg-[#fff5dc] p-4 text-sm leading-6 text-[#72501c]">This is a simulated payment; no money is transferred.</p>
              <button className={primaryButton} onClick={() => void pay()} disabled={working}>Pay ₹{booking.total_fare_inr} (mock) <Icon name="arrow" /></button>
            </section>}

            {bookStep === 'confirm' && <section className="max-w-2xl py-4">
              <span className="grid size-12 place-items-center rounded-2xl bg-[#eaf3ee] text-[#0f4b3c]"><Icon name="check" /></span>
              <p className="mt-6 mb-2 text-[10px] font-bold tracking-[0.2em] text-[#a92f2f] uppercase">Payment received</p>
              <h1 className="m-0 text-4xl leading-[1.02] font-semibold tracking-[-0.04em] text-[#101713] sm:text-5xl">Confirm your reservation.</h1>
              <p className="mt-4 mb-6 text-base leading-6 text-[#68716a]">Your mock payment is safe. Please confirm once and do not pay again.</p>
              <button className={primaryButton} onClick={() => void confirm()} disabled={working}>Confirm seats <Icon name="arrow" /></button>
            </section>}

            {bookStep === 'confirmed' && <section className="max-w-2xl py-4">
              <span className="grid size-14 place-items-center rounded-2xl bg-[#eaf3ee] text-[#0f4b3c]"><Icon name="check" /></span>
              <p className="mt-6 mb-2 text-[10px] font-bold tracking-[0.2em] text-[#a92f2f] uppercase">Journey booked</p>
              <h1 className="m-0 text-4xl leading-[1.02] font-semibold tracking-[-0.04em] text-[#101713] sm:text-5xl">You’re ready to travel.</h1>
              <p className="mt-4 mb-6 break-all text-sm text-[#68716a]">Booking {booking.id}</p>
              <button className={primaryButton} onClick={() => void showPass()} disabled={working}>Open journey pass <Icon name="ticket" /></button>
            </section>}

            {bookStep === 'failed' && <section className="max-w-2xl py-4">
              <span className="grid size-14 place-items-center rounded-2xl bg-[#fff1ee] text-[#b63231]"><Icon name="ticket" /></span>
              <p className="mt-6 mb-2 text-[10px] font-bold tracking-[0.2em] text-[#a92f2f] uppercase">Payment protected</p>
              <h1 className="m-0 text-4xl leading-[1.02] font-semibold tracking-[-0.04em] text-[#101713] sm:text-5xl">We couldn’t confirm your seat.</h1>
              <p className="mt-4 mb-0 text-base leading-7 text-[#68716a]">Your mock payment was received and a refund is {booking.refund_status.toLowerCase()}. The seat is available again.</p>
            </section>}
          </section>

          <JourneyReceipt booking={booking} seatNumbers={journeyPass?.seat_numbers} />
        </div>
      </div>
      {error && ErrorView()}
    </section>
  }
  function PassScreen() {
    if (!journeyPass || !booking) return null
    return <section className="min-h-[calc(100svh-72px)] bg-[#f5f1e9] px-4 py-6 sm:px-6 lg:py-8">
      <div className="mx-auto w-full max-w-5xl">
        <header className="flex items-center justify-between rounded-2xl border border-[#ded8cc] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(23,31,25,0.06)] sm:px-6">
          <button className="flex items-center gap-1.5 text-sm font-semibold text-[#0f4b3c] transition hover:text-[#b63231] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#e4bd73]" onClick={() => setStage('book')}><span className="rotate-180"><Icon name="chevron" /></span> Booking</button>
          <span className="rounded-full border border-[#d6b878] bg-[#fff9e9] px-3 py-1.5 text-xs font-semibold text-[#755419]">Journey pass · Prototype</span>
        </header>

        <article className="relative mt-5 overflow-hidden rounded-2xl bg-[#155b49] text-white shadow-[0_12px_32px_rgba(10,53,42,0.18)]">
          <div className="h-1 bg-[#c99a43]" aria-hidden="true" />

          <div className="relative p-6 sm:p-8 lg:p-10 [@media_(min-width:1024px)_and_(max-height:900px)]:p-7">
            <header className="flex flex-col gap-3 border-b border-white/16 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-[#f3d99d]"><Icon name="check" /> Journey confirmed</span>
              <div className="sm:text-right"><small className="block text-[10px] tracking-[0.15em] text-[#a9c2b7] uppercase">Ticket number</small><strong className="mt-1 block text-sm tracking-[0.04em] text-white">{journeyPass.ticket_number}</strong></div>
            </header>

            <div className="mt-7 grid gap-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center [@media_(min-width:1024px)_and_(max-height:900px)]:mt-5">
              <div><small className="text-[10px] font-bold tracking-[0.16em] text-[#a9c2b7] uppercase">Boarding</small><h1 className="mt-2 mb-0 text-3xl leading-tight font-semibold tracking-[-0.035em] sm:text-4xl lg:text-5xl [@media_(min-width:1024px)_and_(max-height:900px)]:text-4xl">{journeyPass.boarding_point}</h1></div>
              <span className="grid size-11 place-items-center rounded-full border border-[#f3d99d]/40 bg-white/8 text-[#f3d99d] max-sm:rotate-90" aria-hidden="true"><Icon name="arrow" /></span>
              <div className="sm:text-right"><small className="text-[10px] font-bold tracking-[0.16em] text-[#a9c2b7] uppercase">Destination</small><h1 className="mt-2 mb-0 text-3xl leading-tight font-semibold tracking-[-0.035em] sm:text-4xl lg:text-5xl [@media_(min-width:1024px)_and_(max-height:900px)]:text-4xl">{journeyPass.destination}</h1></div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-y border-white/16 py-4 text-sm text-[#d4e1db] [@media_(min-width:1024px)_and_(max-height:900px)]:mt-4">
              <strong className="text-base text-white">{formatTime(journeyPass.departure_at)} → {formatTime(journeyPass.arrival_at)}</strong><span className="hidden size-1 rounded-full bg-[#e4bd73] sm:block" /><span>{journeyPass.service_name}</span>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-5 sm:grid-cols-4">
              <div><dt className="text-[10px] tracking-[0.14em] text-[#a9c2b7] uppercase">Boarding point</dt><dd className="mt-2 ml-0 text-sm font-semibold text-white">{journeyPass.boarding_point}</dd></div>
              <div><dt className="text-[10px] tracking-[0.14em] text-[#a9c2b7] uppercase">Seat</dt><dd className="mt-2 ml-0 text-sm font-semibold text-white">{journeyPass.seat_numbers.join(', ')}</dd></div>
              <div><dt className="text-[10px] tracking-[0.14em] text-[#a9c2b7] uppercase">Passenger</dt><dd className="mt-2 ml-0 text-sm font-semibold text-white">{journeyPass.passenger_name}</dd></div>
              <div><dt className="text-[10px] tracking-[0.14em] text-[#a9c2b7] uppercase">Paid</dt><dd className="mt-2 ml-0 text-sm font-semibold text-[#f3d99d]">₹{journeyPass.paid_amount_inr}</dd></div>
            </dl>

            <footer className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="min-w-0 rounded-2xl bg-[#fffdf8] px-4 py-3 text-[#101713]"><small className="block text-[10px] tracking-[0.13em] text-[#68716a] uppercase">Simulated QR identifier</small><code className="mt-1 block overflow-hidden text-ellipsis whitespace-nowrap text-xs sm:text-sm">{journeyPass.qr_payload}</code></div>
              <button className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#f1d28d] px-5 font-semibold text-[#153d31] transition hover:bg-[#ffe3a2] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white" onClick={() => void openManage()}>Manage journey <Icon name="arrow" /></button>
            </footer>
          </div>
        </article>

        <p className="mt-4 text-center text-xs leading-5 text-[#727a74]">Keep this pass ready while boarding. This prototype does not represent a real MSRTC ticket or payment.</p>
      </div>
      {error && ErrorView()}
    </section>
  }
  function ManageScreen() {
    const backStage = booking ? (journeyPass ? 'pass' : 'book') : 'plan'
    const routeName = journey ? `${journey.origin.name} → ${journey.destination.name}` : journeyPass ? `${journeyPass.boarding_point} → ${journeyPass.destination}` : 'Your booking'

    return <section className="min-h-[calc(100svh-72px)] bg-[#f5f1e9] px-4 py-6 sm:px-6 lg:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex items-center justify-between rounded-2xl border border-[#ded8cc] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(23,31,25,0.06)] sm:px-6">
          <button className="flex items-center gap-1.5 text-sm font-semibold text-[#0f4b3c] transition hover:text-[#b63231] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#e4bd73]" onClick={() => setStage(backStage)}><span className="rotate-180"><Icon name="chevron" /></span> Back</button>
          <span className="rounded-full border border-[#d6b878] bg-[#fff9e9] px-3 py-1.5 text-xs font-semibold text-[#755419]">Booking management · Prototype</span>
        </header>

        {!booking && <form className="mx-auto mt-8 max-w-xl rounded-2xl border border-[#ded8cc] bg-white p-6 shadow-[0_8px_24px_rgba(23,31,25,0.06)] sm:p-8" onSubmit={(event) => void findBooking(event)}>
          <span className="grid size-12 place-items-center rounded-2xl bg-[#eaf3ee] text-[#0f4b3c]"><Icon name="ticket" /></span>
          <p className="mt-6 mb-2 text-[10px] font-bold tracking-[0.2em] text-[#a92f2f] uppercase">Existing journey</p>
          <h1 className="m-0 text-4xl leading-none font-semibold tracking-[-0.04em] text-[#101713] sm:text-5xl">Open a booking.</h1>
          <label className="mt-7 grid gap-2 text-sm font-semibold text-[#465149]">Booking ID<input className="min-h-13 rounded-xl border border-[#cbc7bd] bg-white px-4 text-base font-normal text-[#101713] outline-none transition placeholder:text-[#949a95] focus:border-[#155b49] focus:ring-4 focus:ring-[#155b49]/10" value={manageId} onChange={(event) => setManageId(event.target.value)} placeholder="booking_…" /></label>
          <button className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#b63231] px-5 font-semibold text-white shadow-sm transition hover:bg-[#922626] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#e4bd73] disabled:cursor-wait disabled:opacity-60" disabled={working}>Open journey <Icon name="arrow" /></button>
        </form>}

        {booking && <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <section className="rounded-2xl border border-[#ded8cc] bg-white p-5 shadow-[0_8px_24px_rgba(23,31,25,0.06)] sm:p-7 lg:p-8">
            <p className="mb-2 text-[10px] font-bold tracking-[0.2em] text-[#a92f2f] uppercase">Manage journey</p>
            <h1 className="m-0 max-w-3xl text-4xl leading-[1.04] font-semibold tracking-[-0.04em] text-[#101713] sm:text-5xl">{routeName}</h1>
            <p className="mt-3 mb-0 break-all text-sm text-[#68716a]">Booking ID: {booking.id}</p>

            {cancellation && <div className="mt-7 border-t border-black/10 pt-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-1 text-[10px] font-bold tracking-[0.17em] text-[#a92f2f] uppercase">Cancellation</p><h2 className="m-0 text-2xl font-semibold tracking-[-0.025em] text-[#101713] sm:text-3xl">{booking.status === 'CANCELLED' ? 'Journey cancelled' : 'Cancel this journey?'}</h2></div>{cancellation.deadline && <span className="text-sm text-[#68716a]">Deadline {formatTime(cancellation.deadline)}</span>}</div>
              <Fare cancellation={cancellation} />

              {booking.status === 'CANCELLED' ? <div className="mt-5 rounded-xl border border-[#155b49]/20 bg-[#eaf3ee] p-4">
                <div className="flex items-start gap-3"><span className="mt-0.5 text-[#0f4b3c]"><Icon name="check" /></span><div><strong className="block text-[#153d31]">Refund {booking.refund_status.toLowerCase()}</strong><p className="mt-1 mb-0 text-sm leading-5 text-[#59645e]">The cancellation is complete. Refund progress is simulated for this prototype.</p></div></div>
                {booking.refund_status !== 'COMPLETED' && <button className="mt-4 rounded-xl bg-[#0f4b3c] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#14624e]" onClick={() => void advanceRefund()}>Advance mock refund</button>}
              </div> : cancellation.can_cancel ? <div className="mt-5 flex flex-col gap-4 rounded-xl border border-[#e4bd73]/45 bg-[#fff5dc] p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="m-0 text-sm leading-5 text-[#72501c]">Review the refund above before cancelling. This action releases the booked seat.</p>
                <button className="shrink-0 rounded-xl border border-[#b63231] bg-white px-5 py-3 text-sm font-semibold text-[#a92f2f] transition hover:bg-[#b63231] hover:text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#e4bd73] disabled:cursor-wait disabled:opacity-60" onClick={() => void cancel()} disabled={working}>Cancel journey</button>
              </div> : <div className="mt-5 rounded-xl border border-[#b63231]/20 bg-[#fff1ee] p-4 text-sm leading-6 text-[#703634]">{cancellation.reason ?? 'This journey can no longer be cancelled.'}</div>}
            </div>}
          </section>
          <JourneyReceipt booking={booking} seatNumbers={journeyPass?.seat_numbers} />
        </div>}
      </div>
      {error && ErrorView()}
    </section>
  }
  function ErrorView() {
    const isAmbiguousStop = error?.code === 'AMBIGUOUS_STOP'
    const isDateWindow = error?.code === 'DATE_OUTSIDE_DEMO_WINDOW'
    const candidates = error?.details.candidates ?? []

    return <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#17201b]/65 p-4 sm:p-6">
      <section className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[#ded8cc] bg-white p-5 shadow-[0_24px_72px_rgba(8,23,17,0.3)] sm:p-7" role="alert" aria-live="assertive">
        <div className="absolute inset-x-0 top-0 h-1 bg-[#b63231]" aria-hidden="true" />
        <header className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#edf5f0] text-[#0f4b3c] shadow-sm" aria-hidden="true"><Icon name={isAmbiguousStop ? 'location' : 'sparkle'} /></span>
          <div className="min-w-0 pt-0.5">
            <p className="mb-1.5 text-[10px] font-bold tracking-[0.18em] text-[#a92f2f] uppercase">{isAmbiguousStop ? 'Confirm your destination' : isDateWindow ? 'Supported travel dates' : 'Journey planner'}</p>
            <h2 className="m-0 text-2xl leading-tight font-semibold tracking-[-0.025em] text-[#101713] sm:text-[28px]">{isAmbiguousStop ? 'Which stop did you mean?' : isDateWindow ? 'Choose a date in the demo window.' : 'Something went wrong'}</h2>
            <p className="mt-2 mb-0 text-sm leading-6 text-[#68716a] sm:text-base">{error?.message}</p>
          </div>
        </header>

        {candidates.length > 0 && <div className="mt-6 grid gap-2.5">
          {candidates.map((candidate) => <button className="group grid min-h-18 w-full grid-cols-[40px_minmax(0,1fr)_36px] items-center gap-3 rounded-xl border border-[#d8d3c8] bg-[#faf8f3] px-3 py-3 text-left transition hover:border-[#155b49]/45 hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#e4bd73] sm:px-4" key={candidate.id} onClick={() => selectStop(candidate)}>
            <span className="grid size-10 place-items-center rounded-xl bg-[#f8eee8] text-[#b63231]" aria-hidden="true"><Icon name="location" /></span>
            <span className="min-w-0 sm:grid sm:grid-cols-[minmax(150px,auto)_1fr] sm:items-center sm:gap-4">
              <strong className="block text-base font-semibold tracking-[-0.01em] text-[#101713] sm:text-lg">{candidate.name}</strong>
              <small className="mt-1 block text-sm leading-5 text-[#6b746e] sm:mt-0">{candidate.description}</small>
            </span>
            <span className="grid size-9 place-items-center rounded-full bg-[#f1eee7] text-[#0f4b3c] transition group-hover:bg-[#0f4b3c] group-hover:text-white" aria-hidden="true"><Icon name="chevron" /></span>
          </button>)}
        </div>}

        {!isAmbiguousStop && <button className="mt-6 rounded-xl bg-[#0f4b3c] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#14624e]" onClick={() => { setError(null); setLoading(false); setIsParsing(false); setResumeAiSearch(false); setIntentMessage('') }}>Return to journey planner</button>}
      </section>
    </div>
  }
}

function Fare({ booking, cancellation }: { booking?: Booking; cancellation?: CancellationPreview }) {
  const row = 'contents [&>dd]:text-right [&>dd]:font-semibold'
  const total = 'contents [&>dt]:border-t [&>dt]:border-black/10 [&>dt]:pt-4 [&>dt]:font-semibold [&>dt]:text-[#101713] [&>dd]:border-t [&>dd]:border-black/10 [&>dd]:pt-4 [&>dd]:text-right [&>dd]:text-xl [&>dd]:font-semibold'
  return <dl className="mt-7 grid grid-cols-[1fr_auto] gap-x-5 gap-y-3 rounded-xl border border-[#ded8cc] bg-[#faf8f3] p-5 text-sm text-[#68716a]">
    {booking ? <>
      <div className={row}><dt>Standard fare</dt><dd className="text-[#101713]">₹{booking.base_fare_inr}</dd></div>
      <div className={row}><dt>Concession</dt><dd className="text-[#0f4b3c]">−₹{booking.concession_discount_inr}</dd></div>
      <div className={total}><dt>You pay</dt><dd className="text-[#101713]">₹{booking.total_fare_inr}</dd></div>
    </> : cancellation && <>
      <div className={row}><dt>You paid</dt><dd className="text-[#101713]">₹{cancellation.paid_amount_inr}</dd></div>
      <div className={row}><dt>Cancellation deduction</dt><dd className="text-[#a92f2f]">−₹{cancellation.deduction_inr}</dd></div>
      <div className={row}><dt>Non-refundable charge</dt><dd className="text-[#a92f2f]">−₹{cancellation.non_refundable_charges_inr}</dd></div>
      <div className={total}><dt>You’ll receive</dt><dd className="text-[#101713]">₹{cancellation.refund_amount_inr}</dd></div>
    </>}
  </dl>
}

function JourneyReceipt({ booking, seatNumbers }: { booking: Booking; seatNumbers?: string[] }) {
  const seat = seatNumbers?.join(', ') ?? booking.seats.find((item) => item.held_by_current_booking)?.number ?? (booking.status === 'CONFIRMED' ? 'Confirmed' : 'Not selected')
  return <aside className="overflow-hidden rounded-2xl bg-[#155b49] text-white shadow-[0_8px_24px_rgba(10,53,42,0.14)] lg:sticky lg:top-5">
    <div className="h-1 bg-[#c99a43]" aria-hidden="true" />
    <div className="p-6">
      <p className="m-0 text-[10px] font-bold tracking-[0.18em] text-[#e4bd73] uppercase">Booking at a glance</p>
      <strong className="mt-5 block text-xl leading-tight font-semibold tracking-[-0.02em]">{booking.passenger?.name ?? 'Passenger details next'}</strong>
      <div className="mt-5 grid grid-cols-2 gap-3 border-y border-white/18 py-4 text-sm">
        <span className="text-[#c7d8d0]"><small className="block text-[10px] tracking-[0.12em] uppercase">Seat</small><b className="mt-1 block text-base text-white">{seat}</b></span>
        <span className="border-l border-white/18 pl-3 text-[#c7d8d0]"><small className="block text-[10px] tracking-[0.12em] uppercase">Status</small><b className="mt-1 block text-base text-white capitalize">{booking.status.toLowerCase().replace('_', ' ')}</b></span>
      </div>
      <div className="mt-5 flex items-end justify-between"><span className="text-sm text-[#c7d8d0]">Total fare</span><b className="text-2xl text-[#f3d99d]">₹{booking.total_fare_inr || booking.base_fare_inr}</b></div>
      <p className="mt-4 mb-0 text-xs leading-5 text-[#a9c2b7]">Prototype booking · no real payment is made</p>
    </div>
  </aside>
}
