import type { ReactNode } from 'react'
import { Icon } from './Icon'

export function AppShell({ children }: { children: ReactNode }) {
  return <><a className="skip-link" href="#journey-search">Skip to journey search</a><header className="app-header"><div className="shell header-inner"><a className="brand" href="#top" aria-label="MSRTC Journey Service home"><span className="brand-mark"><Icon name="bus" /></span><span><strong>MSRTC</strong><small>Journey Service</small></span></a><span className="header-section">Journey planner</span><span className="prototype-pill">Prototype</span></div></header><main id="top" className="shell page-content">{children}</main><footer className="app-footer"><div className="shell footer-inner"><p><strong>Prototype notice:</strong> Transport, seat, payment, refund and ticket data are synthetic. This is not connected to MSRTC or a payment provider.</p><p className="footer-labels" aria-label="Prototype information">Accessibility · Help · Terms</p></div></footer></>
}
