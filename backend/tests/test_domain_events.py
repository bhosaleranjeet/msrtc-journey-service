import logging

from app.core.events import emit_domain_event


def test_domain_event_is_structured_and_does_not_require_sensitive_fields(caplog) -> None:
    caplog.set_level(logging.INFO, logger="msrtc.domain_events")

    emit_domain_event("booking.created", booking_id="booking_demo", trip_id="trip_demo")

    assert '"event": "booking.created"' in caplog.text
    assert "booking_demo" in caplog.text
