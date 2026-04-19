class Chapter < ApplicationRecord
  belongs_to :work
  has_many :comments, dependent: :destroy

  validates :chapter_number, presence: true, uniqueness: { scope: :work_id }
end
