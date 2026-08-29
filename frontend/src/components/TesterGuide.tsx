import type { DemoNetwork } from '../types'
import { Icon } from './Icon'

const searchCases = [
  { number: '01', title: 'AI search + stop clarification', input: 'Pune to Nashik tomorrow morning, AC', expected: 'Choose a Nashik stop. Matching buses should load automatically after the choice.' },
  { number: '02', title: 'Direct service comparison', input: 'Mumbai → Pune · tomorrow', expected: 'Compare direct services, then try Recommended, Fastest, Cheapest, Earliest and AC only.' },
  { number: '03', title: 'Expanded network route', input: 'Pune → Kolhapur · tomorrow', expected: 'See bookable direct services from the larger seeded Maharashtra network.' },
  { number: '04', title: 'No direct bus', input: 'Pune → Demo Destination · tomorrow', expected: 'See a one-change journey via Satara, with transfer time and total fare. It is preview-only.' },
  { number: '05', title: 'No supported journey', input: 'Mumbai → Sangli · tomorrow', expected: 'See a clear unavailable-route message. Returning to search should reset the loading state.' },
]

const bookingCases = [
  { number: '06', title: 'Complete a booking', action: 'Choose any direct service → seat → fictitious passenger → mock payment.', expected: 'The seat is held, the fare updates, and a confirmed journey pass is issued.' },
  { number: '07', title: 'Payment recovery', action: 'Before mock payment, select “Demonstrate payment recovery”.', expected: 'Payment succeeds, confirmation fails, refund begins, and the held seat is released.' },
  { number: '08', title: 'Reopen and cancel', action: 'Finish a booking, refresh, then choose “My booking”.', expected: 'The booking and pass reopen. Review cancellation values, cancel, and advance the mock refund.' },
]

const questions = [
  { question: 'How is journey planning different from the current MSRTC portal?', answer: 'The current public portal begins with exact Leaving From, Going To and departure-date fields. This prototype keeps that manual option, but leads with a natural-language request and clarifies an ambiguous stop only when necessary.' },
  { question: 'Does the AI invent buses, fares or availability?', answer: 'No. AI only converts passenger language into structured intent. Routes, schedules, fares, seats, bookings and refunds come from deterministic seeded data and backend rules.' },
  { question: 'What happens when there is no direct bus?', answer: 'The planner checks for a reasonable one-transfer journey instead of immediately ending at “no buses found”. Connections show both legs, transfer time, total duration and fare; linked connection booking is deliberately not supported yet.' },
  { question: 'What is clearer about the booking experience?', answer: 'Services are compared by time, duration, fare, type and availability. Seat status, fare changes, payment recovery, the journey pass, cancellation deductions and refund progress remain visible in plain language.' },
  { question: 'Is this an official replacement for the MSRTC website?', answer: 'No. It is a citizen-first product prototype showing a possible experience direction. Schedules, fares, inventory, payments and refunds are illustrative, and the frontend login is only a demo gate.' },
]

type TesterGuidePageProps = { network: DemoNetwork | null; onBack: () => void }

export function TesterGuidePage({ network, onBack }: TesterGuidePageProps) {
  const coverage = network?.coverage
  const allCases = [...searchCases, ...bookingCases]
  return (
    <section className="min-h-[calc(100svh-72px)] bg-[#f5f1e9] px-4 py-7 sm:px-6 sm:py-10" aria-labelledby="tester-guide-title">
      <div className="mx-auto w-full max-w-6xl">
        <button className="flex items-center gap-1.5 text-sm font-semibold text-[#0f4b3c] transition hover:text-[#b63231] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#e4bd73]" onClick={onBack}><span className="rotate-180"><Icon name="chevron" /></span> Back to journey planner</button>

        <header className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-3xl">
            <p className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-[#a92f2f]">Reviewer test plan</p>
            <h1 id="tester-guide-title" className="mt-2 max-w-2xl text-4xl leading-[1.05] font-semibold tracking-[-0.045em] text-[#101713] sm:text-5xl">See the full prototype in eight steps.</h1>
            <p className="mt-4 mb-0 max-w-2xl text-base leading-7 text-[#5f6963]">Start with the AI journey planner, compare services, then complete and manage a booking.</p>
          </div>
          <dl className="grid grid-cols-3 gap-5 border-y border-[#d8d1c5] py-3 lg:min-w-80">
            <GuideStat value={coverage?.hub_count ?? 15} label="Hubs" />
            <GuideStat value={coverage?.corridor_count ?? 18} label="Corridors" />
            <GuideStat value="14" label="Travel days" />
          </dl>
        </header>

        <aside className="mt-7 flex items-center gap-3 border-l-2 border-[#c58a1d] bg-[#fbf2da] px-4 py-3 text-sm leading-6 text-[#624817]" aria-label="Free hosting cold-start note">
          <span className="shrink-0 text-[#9a6a12]"><Icon name="clock" /></span>
          <p className="m-0"><strong>First request may take a minute.</strong> Free hosting sleeps when idle; keep the page open while the service wakes up.</p>
        </aside>

        <section className="mt-8 overflow-hidden rounded-2xl border border-[#d8d1c5] bg-white" aria-labelledby="test-cases-title">
          <div className="flex items-center justify-between gap-4 border-b border-[#e2dcd1] px-5 py-4 sm:px-6">
            <h2 id="test-cases-title" className="m-0 text-lg font-semibold tracking-[-0.02em] text-[#17201b]">Test these flows</h2>
            <span className="text-xs font-semibold text-[#747c76]">About 5 minutes</span>
          </div>

          <ol className="m-0 list-none p-0">
            {allCases.map((testCase, index) => (
              <TestCaseRow key={testCase.number} testCase={testCase} first={index === 0} booking={index >= searchCases.length} />
            ))}
          </ol>
        </section>

        <aside className="mt-5 grid gap-2 border-t border-[#d8d1c5] pt-5 text-sm leading-6 sm:grid-cols-[170px_1fr]" aria-label="Prototype boundaries">
          <strong className="text-[#17201b]">Before you begin</strong>
          <p className="m-0 max-w-4xl text-[#68716a]">Book direct journeys only; connections are previews. Use fictitious passenger details. Schedules, fares, inventory, payment and identity checks are illustrative—not official MSRTC systems.</p>
        </aside>
      </div>
    </section>
  )
}

type GuideCase = { number: string; title: string; input?: string; action?: string; expected: string }

function GuideStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7a827c]">{label}</dt>
      <dd className="mt-0.5 text-xl font-semibold text-[#17201b]">{value}</dd>
    </div>
  )
}

function TestCaseRow({ testCase, first, booking }: { testCase: GuideCase; first: boolean; booking: boolean }) {
  return (
    <li className={`grid gap-3 border-b border-[#e8e2d8] px-5 py-5 last:border-b-0 sm:grid-cols-[40px_minmax(190px,0.8fr)_minmax(250px,1.4fr)] sm:gap-5 sm:px-6 ${first ? 'bg-[#fff8eb]' : ''}`}>
      <span className={`grid size-8 place-items-center rounded-full text-[11px] font-bold ${first ? 'bg-[#b63231] text-white' : 'bg-[#f2eee7] text-[#69716c]'}`}>{testCase.number}</span>
      <div>
        <span className={`text-[9px] font-black uppercase tracking-[0.16em] ${booking ? 'text-[#155b49]' : 'text-[#a92f2f]'}`}>{booking ? 'Booking' : 'Planning'}</span>
        <h3 className="mt-1 mb-0 text-sm font-semibold text-[#17201b] sm:text-base">{testCase.title}</h3>
        {first && <span className="mt-2 inline-block text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a6219]">Start here</span>}
      </div>
      <div className="sm:border-l sm:border-[#e8e2d8] sm:pl-5">
        <p className="m-0 text-sm leading-6 text-[#465149]">{testCase.input ?? testCase.action}</p>
        <p className="mt-1.5 mb-0 text-sm leading-6 text-[#747c76]">{testCase.expected}</p>
      </div>
    </li>
  )
}

export function ProductFaq() {
  return (
    <section className="mt-12 border-t border-[#ded8cc] bg-[#eee8dc] px-4 py-12 sm:px-6 sm:py-16" aria-labelledby="product-questions-title">
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-2xl"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a92f2f]">Product Q&amp;A</p><h2 id="product-questions-title" className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-[#101713] sm:text-4xl">Five questions reviewers usually ask.</h2></div>
        <div className="mt-6 divide-y divide-[#ded8cc] overflow-hidden rounded-2xl border border-[#d8d1c5] bg-white">
          {questions.map((item, index) => (
            <details key={item.question} className="group">
              <summary className="flex min-h-16 cursor-pointer list-none items-center gap-4 px-4 py-4 text-left marker:hidden sm:px-6 [&::-webkit-details-marker]:hidden"><span className="text-xs font-bold text-[#a92f2f]">0{index + 1}</span><span className="flex-1 text-sm font-semibold text-[#17201b] sm:text-base">{item.question}</span><span className="transition group-open:rotate-90" aria-hidden="true"><Icon name="chevron" /></span></summary>
              <p className="mt-0 mr-6 mb-5 ml-12 max-w-3xl text-sm leading-6 text-[#68716a] sm:mr-10 sm:ml-16">{item.answer}</p>
            </details>
          ))}
        </div>
        <p className="mt-4 text-xs leading-5 text-[#747c76]">Comparison refers to the current public MSRTC reservation portal’s form-first search flow. This prototype is an independent, non-official demonstration.</p>
      </div>
    </section>
  )
}
