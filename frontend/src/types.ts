export type StopCandidate = { id: string; name: string; city: string; description: string }

export type Journey = {
  id: string; trip_id: string; service_name: string; service_type: string; is_air_conditioned: boolean
  departure_at: string; arrival_at: string; duration_minutes: number; fare_inr: number
  available_seats: number; total_seats: number; origin: StopCandidate; destination: StopCandidate
}

export type JourneySegment = Omit<Journey, 'id'> & { trip_id: string }
export type ConnectingJourney = { id: string; segments: JourneySegment[]; transfer_stop: StopCandidate; transfer_minutes: number; total_duration_minutes: number; total_fare_inr: number; available_seats: number }
export type ApiError = { code: string; message: string; details: { field?: 'origin' | 'destination'; candidates?: StopCandidate[]; start_date?: string; end_date?: string } }
export type DemoNetwork = {
  data_mode: 'seeded_synthetic'
  coverage_start: string
  coverage_end: string
  coverage: { start_date: string; end_date: string; hub_count: number; corridor_count: number; demo_connection_count: number; stop_count: number; route_count: number; service_count: number; trip_count: number }
  stops: Array<StopCandidate & { aliases: string[]; code: string }>
}
export type ParsedIntent = { origin: string; destination: string; travel_date: string; time_window: { start: string; end: string } | null; preferences: { air_conditioned: boolean | null } }
export type BookingSeat = { id: string; number: string; status: 'AVAILABLE' | 'HELD' | 'BOOKED'; seat_type: 'WINDOW' | 'AISLE'; held_by_current_booking: boolean }
export type Passenger = { name: string; age: number; concession_type: 'NONE' | 'STUDENT' | 'SENIOR' }
export type Booking = { id: string; trip_id: string; status: 'DRAFT' | 'SEATS_HELD' | 'PAYMENT_PENDING' | 'PAYMENT_RECEIVED' | 'CONFIRMING' | 'CONFIRMED' | 'CANCELLED' | 'FAILED'; expires_at: string | null; seats: BookingSeat[]; passenger: Passenger | null; base_fare_inr: number; concession_discount_inr: number; total_fare_inr: number; payment_status: 'NOT_STARTED' | 'PENDING' | 'RECEIVED'; payment_reference: string | null; refund_status: 'NOT_REQUIRED' | 'PENDING' | 'PROCESSING' | 'COMPLETED' }
export type JourneyPass = { ticket_id: string; ticket_number: string; qr_payload: string; issued_at: string; departure_at: string; arrival_at: string; boarding_point: string; destination: string; service_name: string; seat_numbers: string[]; passenger_name: string; paid_amount_inr: number; payment_reference: string }
export type CancellationPreview = { can_cancel: boolean; reason: string | null; deadline: string | null; paid_amount_inr: number; deduction_inr: number; non_refundable_charges_inr: number; refund_amount_inr: number }
