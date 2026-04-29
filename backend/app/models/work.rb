class Work < ApplicationRecord
  belongs_to :author, class_name: "User"

  has_many :chapters, dependent: :destroy
  has_many :ratings, dependent: :destroy
  has_many :work_genres, dependent: :destroy
  has_many :genres, through: :work_genres
  has_many :user_libraries, dependent: :destroy
  has_many :reading_progresses, dependent: :destroy

  enum status: { ongoing: 0, completed: 1 }
  enum access_level: { free_access: 0, subscription_only: 1, paid_access: 2 }

  validates :free_chapter_until,
            numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  validates :title, presence: true
  validates :slug, presence: true, uniqueness: true

  scope :published, -> { where.not(published_at: nil).where("published_at <= ?", Time.current) }
  scope :latest, -> { order(published_at: :desc, created_at: :desc) }
  scope :best_rated, -> { order(rating_avg: :desc, rating_count: :desc) }
  scope :bestsellers, -> { order(views_count: :desc) }
  scope :with_min_chapters, ->(count) { where("chapter_count >= ?", count) }
  scope :by_status, ->(value) { value.present? ? where(status: statuses[value]) : all }
  scope :by_genre, ->(genre_id) {
    genre_id.present? ? joins(:work_genres).where(work_genres: { genre_id: genre_id }) : all
  }
  scope :search_query, ->(query) {
    query.present? ? where("title ILIKE :q OR description ILIKE :q", q: "%#{query}%") : all
  }
end
