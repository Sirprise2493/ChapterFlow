class ReadingProgress < ApplicationRecord
  belongs_to :user
  belongs_to :work
  belongs_to :last_chapter, class_name: "Chapter", optional: true

  validates :user_id, uniqueness: { scope: :work_id }
  validates :progress_percent,
            numericality: {
              only_integer: true,
              greater_than_or_equal_to: 0,
              less_than_or_equal_to: 100
            }

  validates :scroll_position,
            numericality: {
              only_integer: true,
              greater_than_or_equal_to: 0
            }
end
