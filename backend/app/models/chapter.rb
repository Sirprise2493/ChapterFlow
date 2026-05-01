class Chapter < ApplicationRecord
  belongs_to :work
  has_many :comments, dependent: :destroy

  validates :chapter_number, presence: true, uniqueness: { scope: :work_id }

  after_commit :refresh_work_counts

  private

  def refresh_work_counts
    return unless work

    work.update!(
      chapter_count: work.chapters.count,
      word_count: work.chapters.sum do |chapter|
        chapter.content.to_s.scan(/\S+/).size
      end
    )
  end
end
