class ChapterRead < ApplicationRecord
  belongs_to :user
  belongs_to :chapter
  belongs_to :work
  belongs_to :author, class_name: "User"
  belongs_to :subscription
  belongs_to :subscription_period

  validates :user_id, uniqueness: { scope: [:chapter_id, :subscription_period_id] }
end
