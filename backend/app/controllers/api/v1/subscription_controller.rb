class Api::V1::SubscriptionController < ApplicationController
  before_action :authenticate_api_user!

  def show
    subscription = current_api_user
      .subscriptions
      .includes(:plan, :subscription_periods)
      .where(status: :active)
      .where("current_period_start <= ? AND current_period_end >= ?", Time.current, Time.current)
      .first

    unless subscription
      return render json: {
        subscription: nil,
        message: "No active subscription"
      }, status: :ok
    end

    period = subscription
      .subscription_periods
      .where("period_start <= ? AND period_end >= ?", Time.current, Time.current)
      .first

    monthly_limit = subscription.plan.monthly_chapter_limit
    used_count = subscription.chapters_read_current_period
    remaining_count = [monthly_limit - used_count, 0].max

    render json: {
      subscription: {
        id: subscription.id,
        status: subscription.status,
        started_at: subscription.started_at,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        chapters_read_current_period: used_count,
        monthly_chapter_limit: monthly_limit,
        remaining_chapters_current_period: remaining_count,
        plan: {
          id: subscription.plan.id,
          name: subscription.plan.name,
          price_cents: subscription.plan.price_cents,
          currency: subscription.plan.currency,
          billing_period: subscription.plan.billing_period,
          monthly_chapter_limit: subscription.plan.monthly_chapter_limit,
          author_payout_share: subscription.plan.author_payout_share
        },
        period: period ? {
          id: period.id,
          period_start: period.period_start,
          period_end: period.period_end,
          price_cents_snapshot: period.price_cents_snapshot,
          currency_snapshot: period.currency_snapshot,
          monthly_chapter_limit_snapshot: period.monthly_chapter_limit_snapshot,
          author_payout_share_snapshot: period.author_payout_share_snapshot,
          per_chapter_payout_cents: period.per_chapter_payout_cents,
          chapters_read_count: period.chapters_read_count
        } : nil
      }
    }, status: :ok
  end
end
