class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: Devise::JWT::RevocationStrategies::Null

  enum status: { active: 0, blocked: 1 }

  has_many :works, foreign_key: :author_id, dependent: :destroy
  has_many :ratings, dependent: :destroy
  has_many :subscriptions, dependent: :destroy
  has_many :user_libraries, dependent: :destroy
  has_many :library_works, through: :user_libraries, source: :work
  has_many :reading_progresses, dependent: :destroy
  has_many :chapter_reads, dependent: :destroy
  has_many :author_earnings, foreign_key: :author_id, dependent: :destroy

  validates :username, presence: true, uniqueness: true
end
