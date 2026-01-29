"""add backtest tables

Revision ID: 20260129_0100_003
Revises: 20260122_0300_002
Create Date: 2026-01-29 01:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20260129_0100_003'
down_revision: Union[str, None] = '20260122_0300_002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create backtest_runs table
    op.create_table(
        'backtest_runs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('strategy_type', sa.String(), nullable=True),
        sa.Column('market', sa.String(), nullable=False),
        sa.Column('simulation_date', sa.DateTime(), nullable=False),
        sa.Column('lookback_years', sa.Integer(), nullable=False),
        sa.Column('holding_period_months', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', name='backteststatus'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('error_message', sa.String(), nullable=True),
        sa.Column('total_recommendations', sa.Integer(), nullable=True),
        sa.Column('avg_return_pct', sa.Float(), nullable=True),
        sa.Column('median_return_pct', sa.Float(), nullable=True),
        sa.Column('win_rate_pct', sa.Float(), nullable=True),
        sa.Column('best_return_pct', sa.Float(), nullable=True),
        sa.Column('worst_return_pct', sa.Float(), nullable=True),
        sa.Column('market_index_return_pct', sa.Float(), nullable=True),
        sa.Column('alpha_pct', sa.Float(), nullable=True),
        sa.Column('volatility_pct', sa.Float(), nullable=True),
        sa.Column('sharpe_ratio', sa.Float(), nullable=True),
        sa.Column('max_drawdown_pct', sa.Float(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sqlite_autoincrement=True
    )
    op.create_index(op.f('ix_backtest_runs_id'), 'backtest_runs', ['id'], unique=False)

    # Create backtest_recommendations table
    op.create_table(
        'backtest_recommendations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('backtest_run_id', sa.Integer(), nullable=False),
        sa.Column('stock_code', sa.String(), nullable=False),
        sa.Column('stock_name', sa.String(), nullable=False),
        sa.Column('recommendation_rank', sa.Integer(), nullable=False),
        sa.Column('value_score', sa.Float(), nullable=True),
        sa.Column('ai_upside_potential_pct', sa.Float(), nullable=True),
        sa.Column('ai_confidence', sa.Float(), nullable=True),
        sa.Column('ai_rationale', sa.String(), nullable=True),
        sa.Column('price_at_recommendation', sa.Float(), nullable=False),
        sa.Column('per_at_recommendation', sa.Float(), nullable=True),
        sa.Column('pbr_at_recommendation', sa.Float(), nullable=True),
        sa.Column('roe_at_recommendation', sa.Float(), nullable=True),
        sa.Column('debt_ratio_at_recommendation', sa.Float(), nullable=True),
        sa.Column('market_cap_at_recommendation', sa.Float(), nullable=True),
        sa.Column('price_after_holding', sa.Float(), nullable=True),
        sa.Column('actual_return_pct', sa.Float(), nullable=True),
        sa.Column('exceeded_prediction', sa.Float(), nullable=True),
        sa.Column('max_price_during_holding', sa.Float(), nullable=True),
        sa.Column('min_price_during_holding', sa.Float(), nullable=True),
        sa.Column('max_return_pct', sa.Float(), nullable=True),
        sa.Column('max_drawdown_pct', sa.Float(), nullable=True),
        sa.Column('sector', sa.String(), nullable=True),
        sa.Column('notes', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['backtest_run_id'], ['backtest_runs.id'], ),
        sa.ForeignKeyConstraint(['stock_code'], ['stocks.code'], ),
        sa.PrimaryKeyConstraint('id'),
        sqlite_autoincrement=True
    )
    op.create_index(op.f('ix_backtest_recommendations_id'), 'backtest_recommendations', ['id'], unique=False)

    # Create backtest_schedules table
    op.create_table(
        'backtest_schedules',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('strategy_type', sa.String(), nullable=True),
        sa.Column('market', sa.String(), nullable=False),
        sa.Column('lookback_years', sa.Integer(), nullable=False),
        sa.Column('frequency', sa.String(), nullable=False),
        sa.Column('is_active', sa.Integer(), nullable=False),
        sa.Column('last_run_date', sa.DateTime(), nullable=True),
        sa.Column('next_run_date', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sqlite_autoincrement=True
    )
    op.create_index(op.f('ix_backtest_schedules_id'), 'backtest_schedules', ['id'], unique=False)

    # Create historical_stock_prices table
    op.create_table(
        'historical_stock_prices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('stock_code', sa.String(), nullable=False),
        sa.Column('date', sa.DateTime(), nullable=False),
        sa.Column('open', sa.Float(), nullable=False),
        sa.Column('high', sa.Float(), nullable=False),
        sa.Column('low', sa.Float(), nullable=False),
        sa.Column('close', sa.Float(), nullable=False),
        sa.Column('volume', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['stock_code'], ['stocks.code'], ),
        sa.PrimaryKeyConstraint('id'),
        sqlite_autoincrement=True
    )
    op.create_index(op.f('ix_historical_stock_prices_id'), 'historical_stock_prices', ['id'], unique=False)
    op.create_index(op.f('ix_historical_stock_prices_stock_code'), 'historical_stock_prices', ['stock_code'], unique=False)
    op.create_index(op.f('ix_historical_stock_prices_date'), 'historical_stock_prices', ['date'], unique=False)

    # Create historical_financial_metrics table
    op.create_table(
        'historical_financial_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('stock_code', sa.String(), nullable=False),
        sa.Column('snapshot_date', sa.DateTime(), nullable=False),
        sa.Column('report_date', sa.DateTime(), nullable=False),
        sa.Column('per', sa.Float(), nullable=True),
        sa.Column('pbr', sa.Float(), nullable=True),
        sa.Column('psr', sa.Float(), nullable=True),
        sa.Column('ev_ebitda', sa.Float(), nullable=True),
        sa.Column('roe', sa.Float(), nullable=True),
        sa.Column('roa', sa.Float(), nullable=True),
        sa.Column('operating_margin', sa.Float(), nullable=True),
        sa.Column('net_profit_growth', sa.Float(), nullable=True),
        sa.Column('debt_ratio', sa.Float(), nullable=True),
        sa.Column('current_ratio', sa.Float(), nullable=True),
        sa.Column('interest_coverage', sa.Float(), nullable=True),
        sa.Column('operating_cash_flow', sa.Float(), nullable=True),
        sa.Column('dividend_yield', sa.Float(), nullable=True),
        sa.Column('dividend_payout_ratio', sa.Float(), nullable=True),
        sa.Column('consecutive_dividend_years', sa.Integer(), nullable=True),
        sa.Column('market_cap', sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(['stock_code'], ['stocks.code'], ),
        sa.PrimaryKeyConstraint('id'),
        sqlite_autoincrement=True
    )
    op.create_index(op.f('ix_historical_financial_metrics_id'), 'historical_financial_metrics', ['id'], unique=False)
    op.create_index(op.f('ix_historical_financial_metrics_stock_code'), 'historical_financial_metrics', ['stock_code'], unique=False)
    op.create_index(op.f('ix_historical_financial_metrics_snapshot_date'), 'historical_financial_metrics', ['snapshot_date'], unique=False)


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_index(op.f('ix_historical_financial_metrics_snapshot_date'), table_name='historical_financial_metrics')
    op.drop_index(op.f('ix_historical_financial_metrics_stock_code'), table_name='historical_financial_metrics')
    op.drop_index(op.f('ix_historical_financial_metrics_id'), table_name='historical_financial_metrics')
    op.drop_table('historical_financial_metrics')

    op.drop_index(op.f('ix_historical_stock_prices_date'), table_name='historical_stock_prices')
    op.drop_index(op.f('ix_historical_stock_prices_stock_code'), table_name='historical_stock_prices')
    op.drop_index(op.f('ix_historical_stock_prices_id'), table_name='historical_stock_prices')
    op.drop_table('historical_stock_prices')

    op.drop_index(op.f('ix_backtest_schedules_id'), table_name='backtest_schedules')
    op.drop_table('backtest_schedules')

    op.drop_index(op.f('ix_backtest_recommendations_id'), table_name='backtest_recommendations')
    op.drop_table('backtest_recommendations')

    op.drop_index(op.f('ix_backtest_runs_id'), table_name='backtest_runs')
    op.drop_table('backtest_runs')

    # Drop enum type (SQLite doesn't have enums, so this is handled by SQLAlchemy)
