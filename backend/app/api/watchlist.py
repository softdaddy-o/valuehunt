"""Watchlist API routes"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.watchlist import Watchlist
from app.models.stock import Stock
from app.models.value_score import ValueScore
from app.schemas.watchlist import (
    WatchlistCreate,
    WatchlistUpdate,
    WatchlistItem,
    WatchlistResponse,
)

router = APIRouter()


@router.get("", response_model=WatchlistResponse)
async def get_watchlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get current user's watchlist

    Requires authentication
    """
    # Get user's watchlist items with stock and value score info
    watchlist_items = (
        db.query(Watchlist, Stock, ValueScore)
        .join(Stock, Watchlist.stock_code == Stock.code)
        .outerjoin(ValueScore, Stock.code == ValueScore.stock_code)
        .filter(Watchlist.user_id == current_user.id)
        .order_by(desc(Watchlist.added_at))
        .all()
    )

    # Format response
    items = []
    for watchlist, stock, value_score in watchlist_items:
        # Calculate value score change (simplified - TODO: implement actual change calculation)
        value_score_change = None
        if value_score:
            value_score_change = "+3.5"  # Placeholder

        item = WatchlistItem(
            id=watchlist.id,
            stock_code=watchlist.stock_code,
            stock_name=stock.name,
            target_price=watchlist.target_price,
            alert_enabled=watchlist.alert_enabled,
            current_price=stock.current_price,
            value_score=value_score.total_score if value_score else None,
            value_score_change=value_score_change,
            added_at=watchlist.added_at,
        )
        items.append(item)

    return WatchlistResponse(watchlist=items)


@router.post("", status_code=status.HTTP_201_CREATED)
async def add_to_watchlist(
    data: WatchlistCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Add a stock to watchlist

    Requires authentication
    """
    # Check if stock exists
    stock = db.query(Stock).filter(Stock.code == data.stock_code).first()
    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stock with code {data.stock_code} not found",
        )

    # Check if already in watchlist
    existing = (
        db.query(Watchlist)
        .filter(
            Watchlist.user_id == current_user.id,
            Watchlist.stock_code == data.stock_code,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stock already in watchlist",
        )

    # Add to watchlist
    watchlist_item = Watchlist(
        user_id=current_user.id,
        stock_code=data.stock_code,
        target_price=data.target_price,
        alert_enabled=data.alert_enabled,
    )

    db.add(watchlist_item)
    db.commit()
    db.refresh(watchlist_item)

    return {
        "id": watchlist_item.id,
        "stock_code": watchlist_item.stock_code,
        "target_price": watchlist_item.target_price,
        "alert_enabled": watchlist_item.alert_enabled,
        "added_at": watchlist_item.added_at,
    }


@router.put("/{watchlist_id}")
async def update_watchlist_item(
    watchlist_id: int,
    data: WatchlistUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update watchlist item

    Requires authentication
    """
    # Get watchlist item
    watchlist_item = (
        db.query(Watchlist)
        .filter(
            Watchlist.id == watchlist_id,
            Watchlist.user_id == current_user.id,
        )
        .first()
    )

    if not watchlist_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Watchlist item not found",
        )

    # Update fields
    if data.target_price is not None:
        watchlist_item.target_price = data.target_price

    if data.alert_enabled is not None:
        watchlist_item.alert_enabled = data.alert_enabled

    db.commit()
    db.refresh(watchlist_item)

    return {
        "id": watchlist_item.id,
        "stock_code": watchlist_item.stock_code,
        "target_price": watchlist_item.target_price,
        "alert_enabled": watchlist_item.alert_enabled,
    }


@router.delete("/{watchlist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_watchlist(
    watchlist_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Remove a stock from watchlist

    Requires authentication
    """
    # Get watchlist item
    watchlist_item = (
        db.query(Watchlist)
        .filter(
            Watchlist.id == watchlist_id,
            Watchlist.user_id == current_user.id,
        )
        .first()
    )

    if not watchlist_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Watchlist item not found",
        )

    db.delete(watchlist_item)
    db.commit()

    return None
