class ReadingProgress < ApplicationRecord
  belongs_to :user
  belongs_to :work
  belongs_to :last_chapter, class_name: "Chapter", optional: true

  validates :user_id, uniqueness: { scope: :work_id }
end
