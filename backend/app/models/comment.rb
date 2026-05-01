class Comment < ApplicationRecord
  belongs_to :user
  belongs_to :chapter, optional: true
  belongs_to :work, optional: true
  belongs_to :parent_comment, class_name: "Comment", optional: true

  has_many :replies,
           class_name: "Comment",
           foreign_key: :parent_comment_id,
           dependent: :destroy

  has_many :comment_likes, dependent: :destroy

  validates :content, presence: true, unless: -> { media_url.present? }
  validate :comment_target_present

  private

  def comment_target_present
    if chapter_id.blank? && work_id.blank?
      errors.add(:base, "Comment must belong to a chapter or a work")
    end

    if chapter_id.present? && work_id.present?
      errors.add(:base, "Comment cannot belong to both chapter and work")
    end
  end
end
