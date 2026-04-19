class WorkGenre < ApplicationRecord
  belongs_to :work
  belongs_to :genre

  validates :genre_id, uniqueness: { scope: :work_id }
end
