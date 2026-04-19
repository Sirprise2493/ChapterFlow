class Rating < ApplicationRecord
  belongs_to :user
  belongs_to :work

  validates :score, inclusion: { in: 1..5 }
  validates :user_id, uniqueness: { scope: :work_id }

  after_commit :refresh_work_rating

  private

  def refresh_work_rating
    work.update(
      rating_count: work.ratings.count,
      rating_avg: work.ratings.average(:score)&.round(2)
    )
  end
end
