class Comment < ApplicationRecord
  belongs_to :user
  belongs_to :chapter
  belongs_to :parent_comment, class_name: "Comment", optional: true

  has_many :replies,
           class_name: "Comment",
           foreign_key: :parent_comment_id,
           dependent: :destroy

  has_many :comment_likes, dependent: :destroy
  has_many :liked_by_users, through: :comment_likes, source: :user

  validates :content, presence: true, unless: -> { media_url.present? }
  validates :media_type, inclusion: { in: %w[image gif], allow_blank: true }
end
