"""Minimal structured domain-event logging for the prototype.

Events intentionally exclude passenger names, ages, payment references and other
personal or financial values. They are operational breadcrumbs, not an audit log.
"""

import json
import logging
from typing import Any


logger = logging.getLogger("msrtc.domain_events")


def emit_domain_event(event: str, **attributes: Any) -> None:
    logger.info(json.dumps({"event": event, **attributes}, sort_keys=True, default=str))
