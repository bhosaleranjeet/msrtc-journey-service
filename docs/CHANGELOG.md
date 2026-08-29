# Changelog

All notable implementation and documentation changes are recorded here.

## Unreleased

### Added

- Replaced the process-local transport and booking runtime with SQLAlchemy persistence, using local SQLite by default and a Neon-compatible PostgreSQL URL in production.
- Added an idempotent 15-hub Maharashtra seed with 18 bidirectional corridors, multiple service classes and departures, a rolling 14-day timetable, and non-destructive trip creation.
- Added separate confirmed-seat and temporary-hold records, transactional hold acquisition, persisted passengers/tickets/refunds, and restart-safe booking management.
- Added Alembic migrations, Neon/Render database configuration, `seeded_synthetic` health metadata, network coverage/count metadata, and a specific supported-date API error.
- Added manual stop suggestions, a supported-network disclosure, four representative direct-route shortcuts, date constraints, and a warning not to enter real passenger information.
- Added a prominent dedicated tester-guide page with eight exact working scenarios, expected outcomes, prototype boundaries and a free-host cold-start notice; kept a five-question reviewer FAQ at the bottom of the landing page.
- Simplified the tester guide into one ordered reviewer checklist with a clear starting point, compact network facts, quieter cold-start guidance and a single prototype-boundaries note.

- Added a frontend-only prototype login gate with one configurable demo credential pair, session-scoped access, explicit security disclosure, and sign-out control.
- Added persistent access to the latest confirmed booking: the frontend remembers its booking reference locally and a global “My booking” action restores the backend record, journey pass details, and cancellation screen after refresh or sign-in.
- Fixed failed AI searches leaving stale “Finding buses” feedback after returning to the planner, and replaced the bouncing sparkle with a static AI marker while retaining restrained progress feedback.
- Prepared the public submission build with a rolling next-day synthetic schedule, server-owned AI reference date, Vercel frontend configuration, split Vercel/Render deployment guidance, social metadata, favicon, optimized hero delivery, and current one-submit demo instructions.

- Product brief, decision log, changelog, and incremental implementation specifications.
- Runnable Vite React/TypeScript frontend scaffold and FastAPI backend scaffold.
- Local environment templates, dependency manifests, and startup instructions.
- Typed transport domain models and an explicit in-memory mock transport provider.
- Deterministic Pune–Nashik and Pune–Satara–Demo Destination data, with seeded seats and transport-domain tests.
- Structured direct-journey search, stop ambiguity resolution, deterministic sorting, and responsive search/results UI.
- OpenAI Structured Outputs intent adapter with validated schemas, recoverable failure handling, and mock-provider tests.
- Deterministic one-transfer journey search with transfer-window validation and connection results.
- Server-owned booking drafts, ten-minute seat holds, and booking retrieval APIs.
- Passenger capture, synthetic concession calculations, mock payment receipts, and explicit payment/confirmation recovery states.
- Released held seats on terminal confirmation failure while retaining the independent refund-pending state.
- Issued mock journey passes after confirmation and added backend-calculated cancellation/refund management.
- Added mobile/keyboard accessibility polish, explicit synthetic-data disclosures, safe structured domain-event logs, same-origin production API configuration, Docker/Render deployment configuration, and reproducible direct/connecting demo scripts.
- Rebuilt the frontend as a responsive MSRTC Journey Service public-service experience with reusable presentation components, design tokens, accessible code-native icons, modern journey search/results, a connection timeline, booking progress, a visual seat map, and polished ticket/cancellation states—without changing backend behavior or API contracts.
- Replaced the scrolling booking page with a stage-based journey experience: dedicated planning, service selection, focused booking tasks, journey pass, and booking-management views, using a new transport-led visual system while preserving all existing frontend/backend behavior.
- Added a custom Maharashtra travel illustration to the planning stage, featuring Sahyadri terrain, a hill-fort silhouette, and a red state-bus journey; it is an original visual asset with no official MSRTC branding.
- Added Tailwind CSS through its official Vite integration and rebuilt the planning homepage with utility classes, replacing the accumulated landing-page override stack with one coherent responsive composition.
- Replaced the temporary “MS” navigation monogram with the official MSRTC emblem sourced from the MSRTC website, while retaining the prominent Prototype disclosure.
- Added a compact short-laptop homepage breakpoint so the hero, planner, popular routes, and footer fit without clipping, and tightened the official-logo crop to prevent wordmark leakage.
- Restyled stop-resolution and journey-error dialogs to match the homepage’s frosted Maharashtra travel visual language, with clearer stop cards and responsive interaction states.
- Rebuilt service selection in the homepage visual language with a frosted journey summary, segmented sorting, responsive comparison cards, clearer timing/fare hierarchy, and a matching connecting-journey treatment.
- Rebuilt the complete booking flow in the homepage visual language, including the progress stepper, bus-shaped accessible seat map, passenger and payment forms, confirmation/recovery states, fare breakdown, and responsive booking summary.
- Fixed controlled inputs losing focus after every keystroke by stabilizing the nested stage render path, including passenger, journey-search, and booking-management inputs.
- Rebuilt the journey pass as a compact, responsive travel document in the homepage visual language, keeping route, ticket, passenger, seat, fare, simulated QR, and management details visible without oversized overflow.
- Rebuilt booking management with a compact glass layout, explicit cancellation eligibility and refund states, visible actions, a responsive summary, and seat-number continuity when opened from the journey pass.
- Unified the complete frontend around one restrained service design system: glass is now limited to the homepage planner, while results, booking, pass, dialogs, and management use solid accessible surfaces, natural scrolling, consistent typography, spacing, radii, shadows, and semantic colours. Removed the accumulated legacy presentation override stack.
- Changed AI journey planning into a single-submit flow: a successfully interpreted prompt now searches buses immediately, and resolving an ambiguous stop automatically resumes the pending search.
- Added an accessible working state to the AI planner card with active styling, a reduced-motion-safe progress rail, animated icon and spinner, status copy, and Enter-key submission.
- Clarified connection-only results as non-bookable itinerary previews, removed irrelevant sort controls, explained the direct-booking limitation, and added a clear route back to search.
- Replaced the connection preview's success-green treatment with a neutral white surface, MSRTC-red identity accents, and a gold transfer indicator so it no longer resembles a confirmed or bookable journey.
- Replaced the homepage hero with an original warm-paper Maharashtra illustration featuring a classic red Lal Pari-inspired bus, subtle state-map linework, a winding road, and low-contrast edges that blend into the page background.
- Positioned the Maharashtra map motif on the left and kept the Lal Pari-inspired bus and landscape on the right, creating a calm central field for the homepage headline.
- Added a cleaner alternative homepage hero using a contemporary Maharashtra route-map poster, restrained regional print textures, abstract Deccan contours, and an isolated Lal Pari-inspired bus.
- Replaced the AI-drawn approximate Maharashtra map with a verified public-domain vector outline, and separated it from the decorative Lal Pari hero artwork so the geography remains accurate and independently positionable.
- Restored the original full-width Sahyadri, hill-fort, and Lal Pari homepage artwork while constraining the hero to roughly 30% of the viewport height, keeping the journey planner visible immediately below it.
- Rebalanced the compact homepage composition with a smaller headline, narrower planner and popular-route grid, and a subtle outline-only Maharashtra map so the shortened hero no longer compresses or visually overwhelms the remaining content.
- Rolled back the experimental compact/map homepage variants and restored the previously approved scenic hero proportions, planner overlap, popular-route layout, and footer spacing.
- Made stop disambiguation immediately resume journey search for both manual and AI-planned journeys, removing the redundant second “Find buses” action.
- Replaced the generic homepage hero headline with the Marathi ST identity line “जनसामान्यांसाठी, रस्ता तिथे एसटी”.
- Shifted the homepage hero hierarchy so the Marathi slogan uses the MSRTC-red accent while the corporation name remains a subdued neutral label.
- Refined the Marathi hero into a showcase-ready brand lockup with Devanagari-first typography, quieter corporation framing, a restrained gold divider, and shorter journey-focused supporting copy.
- Removed the navigation logo crop and proportionally fitted the standalone MSRTC emblem in a 48px slot, preserving the complete ribbon edges.
- Removed the redundant “MSRTC / Journey Service” navigation copy, leaving the standalone emblem as the labelled home control beside the current-page indicator.
- Redesigned the natural-language field as an explicit AI journey planner with a distinct multitone prompt surface, AI badge, natural-language guidance, recognisable send action, and branded working animation.
- Simplified the AI journey planner after visual review, retaining an explicit AI label, sparkle marker and processing rail while removing the competing gradient surface, filled badge, helper line and oversized send control.
