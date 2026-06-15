"""drop tax/penalty tables, link payment plans to payments

Guarded with IF EXISTS / IF NOT EXISTS because revision 0001 has shipped in two
shapes (some existing databases were stamped at "0001" before tax_records/
late_fees were removed and payment_plans.payment_id was added directly into
that revision's create_table calls). This migration brings either starting
point to the same end state without erroring on either one.

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-08 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("DROP TABLE IF EXISTS late_fees")
    op.execute("DROP TABLE IF EXISTS tax_records")
    op.execute("DROP TYPE IF EXISTS taxtype")
    op.execute(
        "ALTER TABLE payment_plans "
        "ADD COLUMN IF NOT EXISTS payment_id INTEGER REFERENCES payments(id)"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE payment_plans DROP COLUMN IF EXISTS payment_id")

    op.execute("""
DO $$ BEGIN
    CREATE TYPE taxtype AS ENUM ('vat', 'sales_tax', 'withholding');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
    """)
    op.execute("""
CREATE TABLE IF NOT EXISTS tax_records (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id),
    tax_type taxtype NOT NULL,
    tax_rate FLOAT NOT NULL,
    tax_amount FLOAT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
)
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_tax_records_id ON tax_records (id)")
    op.execute("""
CREATE TABLE IF NOT EXISTS late_fees (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id),
    amount FLOAT NOT NULL,
    reason VARCHAR,
    applied_at TIMESTAMPTZ DEFAULT now()
)
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_late_fees_id ON late_fees (id)")
