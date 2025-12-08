"""add payment fields to borrows

Revision ID: add_payment_fields
Revises: 5ce05ccd7d1b
Create Date: 2025-12-08

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_payment_fields'
down_revision = '5ce05ccd7d1b'
branch_labels = None
depends_on = None


def upgrade():
    # Add payment_status column
    op.add_column('borrows', sa.Column('payment_status', sa.String(), nullable=True))
    
    # Add paid_at column
    op.add_column('borrows', sa.Column('paid_at', sa.DateTime(), nullable=True))
    
    # Set default value for existing rows
    op.execute("UPDATE borrows SET payment_status = 'unpaid' WHERE payment_status IS NULL")
    

def downgrade():
    op.drop_column('borrows', 'paid_at')
    op.drop_column('borrows', 'payment_status')
