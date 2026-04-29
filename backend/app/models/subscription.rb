class Subscription < ApplicationRecord
    belongs_to :user
    belongs_to :plan, class_name: "SubscriptionPlan"

    has_many :subscription_periods, dependent: :destroy
    has_many :chapter_reads, dependent: :destroy

    enum status: { active: 0, canceled: 1, expired: 2 }
end
