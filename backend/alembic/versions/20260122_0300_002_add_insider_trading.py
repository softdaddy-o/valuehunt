"""Add insider trading table

Revision ID: 002_insider_trading
Revises: 001_initial
Create Date: 2026-01-22 03:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002_insider_trading'
down_revision: Union[str, None] = '001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create insider_trading table
    op.create_table(
        'insider_trading',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('stock_code', sa.String(length=10), nullable=False),
        sa.Column('rcept_no', sa.String(length=14), nullable=False),
        sa.Column('rcept_dt', sa.Date(), nullable=False),
        sa.Column('corp_code', sa.String(length=8), nullable=False),
        sa.Column('corp_name', sa.String(length=100), nullable=True),
        sa.Column('repror', sa.String(length=100), nullable=True),
        sa.Column('isu_exctv_rgist_at', sa.String(length=50), nullable=True),
        sa.Column('isu_exctv_ofcps', sa.String(length=100), nullable=True),
        sa.Column('isu_main_shrholdr', sa.String(length=100), nullable=True),
        sa.Column('sp_stock_lmp_cnt', sa.BigInteger(), nullable=True),
        sa.Column('sp_stock_lmp_irds_cnt', sa.BigInteger(), nullable=True),
        sa.Column('sp_stock_lmp_rate', sa.Numeric(precision=10, scale=4), nullable=True),
        sa.Column('sp_stock_lmp_irds_rate', sa.Numeric(precision=10, scale=4), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['stock_code'], ['stocks.code'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_insider_trading_stock_code', 'insider_trading', ['stock_code'], unique=False)
    op.create_index('ix_insider_trading_rcept_dt', 'insider_trading', ['rcept_dt'], unique=False)
    op.create_unique_constraint('uq_insider_trading_rcept_no', 'insider_trading', ['rcept_no'])


def downgrade() -> None:
    op.drop_constraint('uq_insider_trading_rcept_no', 'insider_trading', type_='unique')
    op.drop_index('ix_insider_trading_rcept_dt', table_name='insider_trading')
    op.drop_index('ix_insider_trading_stock_code', table_name='insider_trading')
    op.drop_table('insider_trading')
