class SubscriptionPeriod < ApplicationRecord
  belongs_to :subscription
  belongs_to :user
  belongs_to :plan, class_name: "SubscriptionPlan"

  has_many :chapter_reads, dependent: :destroy
  has_many :author_earnings, dependent: :destroy
end
