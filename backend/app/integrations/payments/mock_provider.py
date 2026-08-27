from dataclasses import dataclass
from typing import Protocol
from uuid import uuid4


@dataclass(frozen=True)
class PaymentReceipt:
    reference: str
    amount_inr: int


class PaymentProvider(Protocol):
    def create_payment(self, amount_inr: int) -> PaymentReceipt: ...


class MockPaymentProvider:
    """Synthetic payment gateway; it never contacts a bank or UPI provider."""

    def create_payment(self, amount_inr: int) -> PaymentReceipt:
        return PaymentReceipt(reference=f"mock_pay_{uuid4().hex[:12]}", amount_inr=amount_inr)
