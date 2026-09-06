import { Icon } from './Icon'
import { translate, type Locale } from '../i18n'

type GuideCase = { number: string; title: string; input?: string; action?: string; expected: string; kind: string; start?: string }
type GuideChange = { number: string; theme: string; title: string; before: string; now: string }
type ProofStep = { number: string; title: string; instruction: string }

const guideContent = {
  en: {
    back: 'Back to journey planner', eyebrow: 'Round 2 at a glance', title: 'Five upgrades since V1.',
    intro: 'Marathi, voice search, bookable connections, bus tracking and ticket-linked complaints.', startDemo: 'Start the demo',
    v1: 'V1', round2: 'Round 2', changes: [
      { number: '01', theme: 'Inclusive', title: 'Marathi, end to end', before: 'The core experience was English-first.', now: 'The complete journey—from search and stop clarification to booking, tracking and complaints—works in Marathi.' },
      { number: '02', theme: 'Accessible', title: 'Speak instead of type', before: 'Passengers typed a form or natural-language query.', now: 'Voice search understands Marathi and English, keeps the transcript editable and handles uncertainty before searching.' },
      { number: '03', theme: 'Intelligent', title: 'A connection you can actually book', before: 'Connecting travel was difficult to discover and incomplete to book.', now: 'The planner explains one safe transfer, reserves a separate seat on each bus and keeps both legs on one Journey Pass.' },
      { number: '04', theme: 'Reassuring', title: 'The physical bus stays visible', before: 'The experience largely ended after confirmation.', now: 'Bus assignment and six clear tracking states show what a passenger would know before, during and after departure.' },
      { number: '05', theme: 'Accountable', title: 'Complaints start from the ticket', before: 'Passengers would have to repeat journey information elsewhere.', now: 'A booking opens a prefilled complaint flow with structured issues, optional photo evidence and a trackable reference.' },
    ] as GuideChange[],
    proofEyebrow: '60-second proof', proofTitle: 'Three moments tell the story.', proofIntro: 'Scan these, then start the demo.', proofTime: '60 seconds', proofSteps: [
      { number: '1', title: 'Speak', instruction: 'Marathi voice resolves Pune → Nashik and asks which Nashik stop.' },
      { number: '2', title: 'Connect', instruction: 'Pune → Demo Destination reserves one seat on each bus.' },
      { number: '3', title: 'Continue', instruction: 'The Journey Pass leads to tracking and a prefilled complaint.' },
    ] as ProofStep[],
    fullPlan: 'Full reviewer test plan', fullPlanHint: '8 flows · about 7 minutes', coldTitle: 'First request may take a minute.',
    coldBody: 'Free hosting sleeps when idle; keep the page open while the service wakes up.', flows: 'Test these flows', time: 'About 7 minutes',
    before: 'Prototype note', boundary: 'Synthetic demo data only; payment, GPS and complaint dispatch are not connected to MSRTC.',
    cases: [
      { number: '01', kind: 'Language + voice', start: 'Start here', title: 'Marathi voice journey', input: 'Switch to मराठी and say “मला उद्या पुण्याहून नाशिकला जायचे आहे”.', expected: 'The transcript is editable, intent is understood, and Nashik stop clarification appears in Marathi.' },
      { number: '02', kind: 'Direct journey', title: 'Compare direct services', input: 'Pune → Nashik · choose Nashik Mahamarg.', expected: 'Compare Recommended, Fastest, Cheapest, Earliest and AC only, then open seat selection.' },
      { number: '03', kind: 'Connecting journey', title: 'Book both buses', input: 'Pune → Demo Destination.', expected: 'Choose the Satara connection, select one seat on each bus, and reserve both together.' },
      { number: '04', kind: 'Booking', title: 'Complete mock booking', action: 'Use a fictitious passenger, complete mock payment, confirm, and open the Journey Pass.', expected: 'The pass shows the full journey, both bus legs, both seats and the change at Satara.' },
      { number: '05', kind: 'After booking', title: 'Preview tracking states', action: 'Open Track your bus and switch through the prototype-state selector.', expected: 'Assignment, available, started, stale and completed states are distinct; only started/stale show a mock position.' },
      { number: '06', kind: 'After booking', title: 'Report an issue', action: 'Choose a category, optionally attach a photo, and submit.', expected: 'Journey context is prefilled and a simulated complaint reference/status is shown.' },
      { number: '07', kind: 'Recovery', title: 'Prototype boundary', input: 'Search Pune → Mahabaleshwar by voice, AI text or manual fields.', expected: 'The request is acknowledged and supported demo journeys are offered without presenting it as a failure.' },
      { number: '08', kind: 'Recovery', title: 'Payment recovery', action: 'Before payment, select “Demonstrate payment recovery”.', expected: 'Payment succeeds, confirmation fails safely, refund begins, and held seats are released.' },
    ] as GuideCase[],
  },
  mr: {
    back: 'प्रवास नियोजकाकडे परत', eyebrow: 'राऊंड २ एका नजरेत', title: 'V1 नंतरच्या पाच सुधारणा.',
    intro: 'मराठी, आवाजाने शोध, बुक करता येणारा जोडप्रवास, बस ट्रॅकिंग आणि तिकिटाशी जोडलेली तक्रार.', startDemo: 'नमुना सुरू करा',
    v1: 'V1', round2: 'राऊंड २', changes: [
      { number: '०१', theme: 'समावेशक', title: 'सुरुवातीपासून शेवटपर्यंत मराठी', before: 'मुख्य अनुभव इंग्रजी-केंद्रित होता.', now: 'शोध व थांबा निवडीपासून बुकिंग, ट्रॅकिंग आणि तक्रारीपर्यंत संपूर्ण प्रवास मराठीत चालतो.' },
      { number: '०२', theme: 'सुलभ', title: 'टाइप करण्याऐवजी बोला', before: 'प्रवासी फॉर्म किंवा साध्या भाषेतील मजकूर टाइप करत होते.', now: 'आवाजाने शोध मराठी व इंग्रजी समजतो, शब्द बदलता येतात आणि शोधापूर्वी संदिग्धता स्पष्ट केली जाते.' },
      { number: '०३', theme: 'बुद्धिमान', title: 'प्रत्यक्ष बुक करता येणारा जोडप्रवास', before: 'जोडप्रवास शोधणे कठीण होते आणि बुकिंग अपूर्ण होते.', now: 'नियोजक एक सुरक्षित बसबदल समजावतो, दोन्ही बसमध्ये स्वतंत्र आसन राखतो आणि एकाच प्रवास पासमध्ये दोन्ही टप्पे दाखवतो.' },
      { number: '०४', theme: 'विश्वासार्ह', title: 'प्रवासातील बस सतत दिसते', before: 'पुष्टीनंतर अनुभव जवळजवळ संपत होता.', now: 'बस नेमणूक आणि सहा स्पष्ट ट्रॅकिंग स्थितींमुळे प्रस्थानापूर्वी, प्रवासात व नंतरची माहिती दिसते.' },
      { number: '०५', theme: 'उत्तरदायी', title: 'तक्रार तिकिटापासून सुरू होते', before: 'प्रवाशांना प्रवासाची माहिती पुन्हा दुसरीकडे भरावी लागली असती.', now: 'बुकिंगमधून पूर्वभरलेली तक्रार, ठराविक समस्या, ऐच्छिक फोटो पुरावा आणि संदर्भ क्रमांक मिळतो.' },
    ] as GuideChange[],
    proofEyebrow: '60 सेकंदांचा पुरावा', proofTitle: 'तीन क्षण संपूर्ण गोष्ट सांगतात.', proofIntro: 'हे पाहा आणि नमुना सुरू करा.', proofTime: '60 सेकंद', proofSteps: [
      { number: '१', title: 'बोला', instruction: 'मराठी आवाज पुणे → नाशिक समजून नेमका नाशिक थांबा विचारतो.' },
      { number: '२', title: 'जोडा', instruction: 'पुणे → नमुना गंतव्य दोन्ही बसमध्ये स्वतंत्र आसन राखते.' },
      { number: '३', title: 'पुढे जा', instruction: 'प्रवास पासमधून ट्रॅकिंग आणि पूर्वभरलेली तक्रार उघडते.' },
    ] as ProofStep[],
    fullPlan: 'परीक्षकांसाठी संपूर्ण चाचणी आराखडा', fullPlanHint: '8 प्रवाह · सुमारे 7 मिनिटे', coldTitle: 'पहिल्या विनंतीला एक मिनिट लागू शकते.',
    coldBody: 'विनामूल्य होस्टिंग निष्क्रिय असताना थांबते; सेवा सुरू होईपर्यंत पान उघडे ठेवा.', flows: 'या प्रवाहांची चाचणी करा', time: 'सुमारे 7 मिनिटे',
    before: 'नमुना सूचना', boundary: 'फक्त कृत्रिम नमुना माहिती; पेमेंट, GPS आणि तक्रार पाठवणे MSRTC शी जोडलेले नाही.',
    cases: [
      { number: '०१', kind: 'भाषा + आवाज', start: 'येथून सुरू करा', title: 'मराठीत आवाजाने प्रवास', input: 'मराठी निवडा आणि “मला उद्या पुण्याहून नाशिकला जायचे आहे” असे बोला.', expected: 'लिहिलेले शब्द बदलता येतात, प्रवास समजतो आणि नाशिक बसस्थानकाची निवड मराठीत दिसते.' },
      { number: '०२', kind: 'थेट प्रवास', title: 'थेट सेवांची तुलना', input: 'पुणे → नाशिक · नाशिक महामार्ग निवडा.', expected: 'शिफारस, जलद, स्वस्त, लवकर आणि फक्त एसी वापरून आसन निवडीपर्यंत जा.' },
      { number: '०३', kind: 'जोडप्रवास', title: 'दोन्ही बस बुक करा', input: 'पुणे → नमुना गंतव्य.', expected: 'सातारामार्गे जोडप्रवास निवडा, प्रत्येक बसमध्ये एक आसन निवडा आणि दोन्ही एकत्र राखीव करा.' },
      { number: '०४', kind: 'बुकिंग', title: 'नमुना बुकिंग पूर्ण करा', action: 'काल्पनिक प्रवासी वापरा, नमुना पेमेंट व पुष्टी पूर्ण करून प्रवास पास उघडा.', expected: 'पासमध्ये संपूर्ण प्रवास, दोन्ही बस, दोन्ही आसने आणि साताऱ्यातील बदल दिसतो.' },
      { number: '०५', kind: 'बुकिंगनंतर', title: 'ट्रॅकिंग स्थिती पाहा', action: 'तुमची बस शोधा उघडा आणि नमुना स्थिती निवडा.', expected: 'बस नेमणे, ट्रॅकिंग, सुरू, जुने स्थान आणि पूर्ण स्थिती स्पष्ट दिसतात.' },
      { number: '०६', kind: 'बुकिंगनंतर', title: 'समस्या नोंदवा', action: 'प्रकार निवडा, हवे असल्यास फोटो जोडा आणि पाठवा.', expected: 'प्रवासाची माहिती भरलेली असते आणि नमुना तक्रार संदर्भ व स्थिती दिसते.' },
      { number: '०७', kind: 'मर्यादा', title: 'नमुना नेटवर्कची मर्यादा', input: 'आवाज, एआय मजकूर किंवा तपशीलातून पुणे → महाबळेश्वर शोधा.', expected: 'विनंती समजल्याचे सांगून बिघाड न दाखवता उपलब्ध नमुना प्रवास सुचवले जातात.' },
      { number: '०८', kind: 'पुनर्प्राप्ती', title: 'पेमेंट पुनर्प्राप्ती', action: 'पेमेंटपूर्वी “पेमेंट पुनर्प्राप्ती दाखवा” निवडा.', expected: 'पेमेंट मिळते, आरक्षण सुरक्षितपणे अयशस्वी होते, परतावा सुरू होतो आणि आसने मोकळी होतात.' },
    ] as GuideCase[],
  },
}

export function TesterGuidePage({ locale, onBack }: { locale: Locale; onBack: () => void }) {
  const content = guideContent[locale]
  const t = (key: string) => translate(locale, key)
  return <section className="ui-page min-h-[calc(100svh-72px)] pt-7 sm:pt-10" aria-labelledby="tester-guide-title"><div className="mx-auto w-full max-w-6xl px-4 lg:px-6">
    <header className="flex flex-col items-start justify-between gap-6 border-b border-[#d8d1c5] pb-7 sm:flex-row sm:items-end"><div className="max-w-3xl"><p className="ui-eyebrow m-0">{content.eyebrow}</p><h1 id="tester-guide-title" className="mt-2 text-[32px] leading-tight font-semibold tracking-[-0.03em] text-[#101713] sm:text-[40px]">{content.title}</h1><p className="mt-3 mb-0 max-w-3xl text-sm leading-6 text-[#5f6963] sm:text-base">{content.intro}</p></div><button className="ui-button flex min-h-11 shrink-0 items-center gap-2 bg-[#155b49] px-5 text-sm font-semibold text-white hover:bg-[#104838]" onClick={onBack}>{content.startDemo}<Icon name="arrow" /></button></header>

    <section className="mt-6" aria-labelledby="round-two-changes"><h2 id="round-two-changes" className="sr-only">{content.title}</h2><div className="hidden grid-cols-[44px_210px_1fr_1.15fr] gap-5 border-b border-[#d8d1c5] px-4 pb-2 text-[10px] font-bold tracking-[0.14em] text-[#7a827c] uppercase md:grid"><span /><span /><span>{content.v1}</span><span className="text-[#155b49]">{content.round2}</span></div><ol className="m-0 list-none divide-y divide-[#ded8cc] border-b border-[#d8d1c5] p-0">{content.changes.map((change) => <ChangeRow key={change.number} change={change} v1Label={content.v1} round2Label={content.round2} />)}</ol></section>

  </div><footer className="mt-8 border-t border-[#ded8cc]"><div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-[#727a74] lg:px-6"><span>{t('search.syntheticFooter')}</span><span>{t('search.noPaymentFooter')}</span></div></footer></section>
}

function ChangeRow({ change, v1Label, round2Label }: { change: GuideChange; v1Label: string; round2Label: string }) { return <li className="grid items-start gap-3 px-1 py-3.5 md:grid-cols-[44px_210px_1fr_1.15fr] md:gap-5 md:px-4"><span className="pt-px text-[10px] leading-4 font-bold text-[#b63231]">{change.number}</span><div><span className="block text-[9px] leading-4 font-bold tracking-[0.14em] text-[#155b49] uppercase">{change.theme}</span><h3 className="mt-1 mb-0 text-base leading-6 font-semibold text-[#17201b]">{change.title}</h3></div><div><span className="mb-1 block text-[9px] leading-4 font-bold tracking-[0.12em] text-[#8a918c] uppercase md:hidden">{v1Label}</span><p className="m-0 text-sm leading-6 text-[#7a827c]">{change.before}</p></div><div><span className="mb-1 block text-[9px] leading-4 font-bold tracking-[0.12em] text-[#155b49] uppercase md:hidden">{round2Label}</span><p className="m-0 text-sm leading-6 font-medium text-[#315348]">{change.now}</p></div></li> }

const questions = [
  { question: 'What citizen problem does this solve?', answer: 'Passengers can describe the journey they understand—in Marathi or English, by voice or text—instead of first learning operator terminology. The planner resolves the stops and presents a direct or connected journey as one understandable trip.' },
  { question: 'What does the AI do—and what is it never allowed to invent?', answer: 'AI converts a natural request into origin, destination, date, time and bus preferences. The backend then validates every stop and route; schedules, fares, seats, bookings and refunds always come from deterministic transport data and rules.' },
  { question: 'Is Marathi genuinely supported across the journey?', answer: 'Yes. Navigation, search, stop clarification, results, both booking legs, the Journey Pass and after-booking flows are localized. Marathi speech and stop aliases map to the same canonical transport identifiers used by English searches.' },
  { question: 'Does a connecting journey really reserve both buses?', answer: 'Yes. The planner validates the transfer, asks for one seat on each bus, and holds and confirms both legs under one booking. The final Journey Pass keeps both buses, seats, timings and the change point visible.' },
  { question: 'What is working today, and what is intentionally simulated?', answer: 'Search, route validation, two-leg booking, persistence, cancellation, refund states, tracking states and journey-linked complaints work end to end. Timetables are synthetic and payment, GPS, complaint dispatch and demo sign-in are clearly simulated until official integrations are available.' },
]
const marathiQuestions = [
  { question: 'हा अनुभव नागरिकांची कोणती समस्या सोडवतो?', answer: 'प्रवाशांना आधी वाहतूक व्यवस्थेतील संज्ञा शिकण्याची गरज नाही. ते मराठी किंवा इंग्रजीत, बोलून किंवा लिहून प्रवास सांगू शकतात; नियोजक योग्य थांबे ओळखून थेट किंवा जोडप्रवास एकाच समजण्यास सोप्या प्रवासाप्रमाणे दाखवतो.' },
  { question: 'एआय नेमके काय करते—आणि काय तयार करू शकत नाही?', answer: 'एआय साध्या भाषेतील विनंतीतून सुरुवात, गंतव्य, तारीख, वेळ आणि बसची पसंती ओळखते. त्यानंतर प्रत्येक थांबा आणि मार्ग बॅकएंड तपासतो; वेळापत्रक, भाडे, आसने, बुकिंग आणि परतावा नेहमी निश्चित वाहतूक माहिती व नियमांतूनच येतात.' },
  { question: 'संपूर्ण प्रवासात मराठी खरोखर समर्थित आहे का?', answer: 'होय. नेव्हिगेशन, शोध, थांबा निवड, निकाल, दोन्ही बसचे बुकिंग, प्रवास पास आणि बुकिंगनंतरच्या सुविधा मराठीत उपलब्ध आहेत. मराठी आवाज व थांब्यांची पर्यायी नावे इंग्रजी शोधासाठी वापरल्या जाणाऱ्या त्याच अधिकृत ओळख क्रमांकांशी जोडली जातात.' },
  { question: 'जोडप्रवासात दोन्ही बसची आसने खरोखर राखीव होतात का?', answer: 'होय. नियोजक बसबदल तपासतो, प्रत्येक बससाठी स्वतंत्र आसन निवडायला सांगतो आणि दोन्ही टप्पे एकाच बुकिंगमध्ये राखीव व निश्चित करतो. अंतिम प्रवास पासमध्ये दोन्ही बस, आसने, वेळा आणि बदलाचे ठिकाण स्पष्ट दिसते.' },
  { question: 'आज काय कार्यरत आहे आणि काय हेतुपुरस्सर कृत्रिम आहे?', answer: 'शोध, मार्ग तपासणी, दोन बसचे बुकिंग, माहिती साठवणे, रद्दीकरण, परतावा स्थिती, ट्रॅकिंग स्थिती आणि प्रवासाशी जोडलेली तक्रार सुरुवातीपासून शेवटपर्यंत कार्यरत आहेत. अधिकृत जोडणी होईपर्यंत वेळापत्रक कृत्रिम असून पेमेंट, GPS, तक्रार पाठवणे आणि नमुना प्रवेश स्पष्टपणे अनुकरण केलेले आहेत.' },
]

export function ProductFaq({ locale = 'en' }: { locale?: Locale }) {
  const activeQuestions = locale === 'mr' ? marathiQuestions : questions
  return <section className="mt-8 py-8 sm:py-10" aria-labelledby="product-questions-title"><div className="mx-auto w-full max-w-6xl px-4 lg:px-6"><div className="max-w-2xl"><p className="ui-eyebrow">{locale === 'mr' ? 'परीक्षणासाठी महत्त्वाचे' : 'For evaluation'}</p><h2 id="product-questions-title" className="mt-2 text-[28px] leading-tight font-semibold text-[#101713] sm:text-[32px]">{locale === 'mr' ? 'तुम्हाला जाणून घ्यायच्या गोष्टी.' : 'What you may want to know.'}</h2></div><div className="mt-5 divide-y divide-[#d8d1c5] border-y border-[#d8d1c5]">{activeQuestions.map((item, index) => <details key={item.question} className="group"><summary className="flex min-h-14 cursor-pointer list-none items-center gap-4 py-4 text-left marker:hidden transition-colors duration-180 hover:text-[#155b49] marker:hidden sm:gap-5 [&::-webkit-details-marker]:hidden"><span className="w-7 shrink-0 text-[11px] font-bold tracking-[0.08em] text-[#a92f2f]">0{index + 1}</span><span className="flex-1 text-sm font-semibold sm:text-base">{item.question}</span><span className="text-[#657069] transition-transform duration-180 group-open:rotate-90" aria-hidden="true"><Icon name="chevron" /></span></summary><p className="mt-[-4px] mr-10 mb-5 ml-11 max-w-3xl text-sm leading-6 text-[#68716a] sm:ml-12">{item.answer}</p></details>)}</div></div></section>
}
