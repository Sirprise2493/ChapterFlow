class Api::V1::SubscriptionController < ApplicationController
  before_action :authenticate_api_user!

  def show
    subscription = active_subscription_for_user(current_api_user)

    unless subscription
      plan = SubscriptionPlan.where(is_active: true).order(:price_cents).first

      return render json: {
        subscription: nil,
        available_plan: plan ? plan_payload(plan) : nil,
        message: "No active subscription"
      }, status: :ok
    end

    render json: {
      subscription: subscription_payload(subscription),
      available_plan: nil
    }, status: :ok
  end

  def activate_test
    unless Rails.env.development?
      return render json: {
        message: "Test subscriptions are only available in development."
      }, status: :forbidden
    end

    existing_subscription = active_subscription_for_user(current_api_user)

    if existing_subscription
      return render json: {
        message: "Subscription already active",
        subscription: subscription_payload(existing_subscription)
      }, status: :ok
    end

    plan = SubscriptionPlan.where(is_active: true).order(:price_cents).first

    unless plan
      return render json: {
        message: "No active subscription plan found"
      }, status: :unprocessable_entity
    end

    subscription = nil

    ActiveRecord::Base.transaction do
      subscription = Subscription.create!(
        user: current_api_user,
        plan: plan,
        status: :active,
        chapters_read_current_period: 0,
        started_at: Time.current,
        current_period_start: Time.current.beginning_of_month,
        current_period_end: Time.current.end_of_month
      )

      SubscriptionPeriod.create!(
        subscription: subscription,
        user: current_api_user,
        plan: plan,
        period_start: subscription.current_period_start,
        period_end: subscription.current_period_end,
        price_cents_snapshot: plan.price_cents,
        currency_snapshot: plan.currency,
        monthly_chapter_limit_snapshot: plan.monthly_chapter_limit,
        author_payout_share_snapshot: plan.author_payout_share,
        per_chapter_payout_cents: calculate_per_chapter_payout_cents(plan),
        chapters_read_count: 0
      )
    end

    render json: {
      message: "Test subscription activated",
      subscription: subscription_payload(subscription.reload)
    }, status: :created
  end

  private

  def active_subscription_for_user(user)
    user
      .subscriptions
      .includes(:plan, :subscription_periods)
      .where(status: :active)
      .where("current_period_start <= ? AND current_period_end >= ?", Time.current, Time.current)
      .first
  end

  def calculate_per_chapter_payout_cents(plan)
    return 0 if plan.monthly_chapter_limit.to_i <= 0

    ((plan.price_cents * plan.author_payout_share) / plan.monthly_chapter_limit).round(4)
  end

  def subscription_payload(subscription)
    period = subscription
      .subscription_periods
      .where("period_start <= ? AND period_end >= ?", Time.current, Time.current)
      .first

    monthly_limit = subscription.plan.monthly_chapter_limit
    used_count = subscription.chapters_read_current_period
    remaining_count = [monthly_limit - used_count, 0].max

    {
      id: subscription.id,
      status: subscription.status,
      started_at: subscription.started_at,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      chapters_read_current_period: used_count,
      monthly_chapter_limit: monthly_limit,
      remaining_chapters_current_period: remaining_count,
      plan: plan_payload(subscription.plan),
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
  end

  def plan_payload(plan)
    {
      id: plan.id,
      name: plan.name,
      price_cents: plan.price_cents,
      currency: plan.currency,
      billing_period: plan.billing_period,
      monthly_chapter_limit: plan.monthly_chapter_limit,
      author_payout_share: plan.author_payout_share
    }
  end
end
