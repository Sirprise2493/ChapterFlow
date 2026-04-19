class SubscriptionPlan < ApplicationRecord
  has_many :subscriptions, foreign_key: :plan_id, dependent: :restrict_with_exception
  has_many :subscription_periods, foreign_key: :plan_id, dependent: :restrict_with_exception

  validates :name, :price_cents, :currency, :billing_period, presence: true
end
