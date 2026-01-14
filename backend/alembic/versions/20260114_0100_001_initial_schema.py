"""Initial schema

Revision ID: 001_initial
Revises:
Create Date: 2026-01-14 01:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=True),
        sa.Column('is_premium', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('premium_expires_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # Create stocks table
    op.create_table(
        'stocks',
        sa.Column('code', sa.String(length=10), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('market', sa.String(length=10), nullable=False),
        sa.Column('sector', sa.String(length=50), nullable=True),
        sa.Column('market_cap', sa.BigInteger(), nullable=True),
        sa.Column('current_price', sa.Integer(), nullable=True),
        sa.Column('change_rate', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('code')
    )
    op.create_index(op.f('ix_stocks_market'), 'stocks', ['market'], unique=False)
    op.create_index(op.f('ix_stocks_sector'), 'stocks', ['sector'], unique=False)
    op.create_index(op.f('ix_stocks_market_cap'), 'stocks', ['market_cap'], unique=False)

    # Create financial_metrics table
    op.create_table(
        'financial_metrics',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('stock_code', sa.String(length=10), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('per', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('pbr', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('psr', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('ev_ebitda', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('roe', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('roa', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('operating_margin', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('net_profit_growth', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('debt_ratio', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('current_ratio', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('interest_coverage', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('operating_cashflow', sa.BigInteger(), nullable=True),
        sa.Column('dividend_yield', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('dividend_payout_ratio', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('consecutive_dividend_years', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['stock_code'], ['stocks.code'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('stock_code', 'date', name='uix_stock_code_date')
    )

    # Create value_scores table
    op.create_table(
        'value_scores',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('stock_code', sa.String(length=10), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('total_score', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('valuation_score', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('profitability_score', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('stability_score', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('dividend_score', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('upside_potential', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('ai_summary', sa.Text(), nullable=True),
        sa.Column('strengths', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('risks', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['stock_code'], ['stocks.code'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('stock_code', 'date', name='uix_value_score_stock_date')
    )
    op.create_index(op.f('ix_value_scores_date_total'), 'value_scores', ['date', 'total_score'], unique=False)

    # Create watchlist table
    op.create_table(
        'watchlist',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('stock_code', sa.String(length=10), nullable=False),
        sa.Column('target_price', sa.Integer(), nullable=True),
        sa.Column('alert_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('added_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['stock_code'], ['stocks.code'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'stock_code', name='uix_user_stock')
    )
    op.create_index(op.f('ix_watchlist_user_id'), 'watchlist', ['user_id'], unique=False)

    # Create screener_filters table
    op.create_table(
        'screener_filters',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('filters', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_screener_filters_user_id'), 'screener_filters', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_screener_filters_user_id'), table_name='screener_filters')
    op.drop_table('screener_filters')

    op.drop_index(op.f('ix_watchlist_user_id'), table_name='watchlist')
    op.drop_table('watchlist')

    op.drop_index(op.f('ix_value_scores_date_total'), table_name='value_scores')
    op.drop_table('value_scores')

    op.drop_table('financial_metrics')

    op.drop_index(op.f('ix_stocks_market_cap'), table_name='stocks')
    op.drop_index(op.f('ix_stocks_sector'), table_name='stocks')
    op.drop_index(op.f('ix_stocks_market'), table_name='stocks')
    op.drop_table('stocks')

    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
