class AddIndexesAndConstraints < ActiveRecord::Migration[7.1]
  def change
    add_index :works, :slug, unique: true
    add_index :works, :status
    add_index :works, :published_at
    add_index :works, :views_count
    add_index :works, :chapter_count
    add_index :works, :rating_avg

    add_index :chapters, [:work_id, :chapter_number], unique: true

    add_index :work_genres, [:work_id, :genre_id], unique: true

    add_index :ratings, [:user_id, :work_id], unique: true
    add_check_constraint :ratings, "score BETWEEN 1 AND 5", name: "ratings_score_between_1_and_5"

    add_index :user_libraries, [:user_id, :work_id], unique: true
    add_index :reading_progresses, [:user_id, :work_id], unique: true

    add_index :chapter_reads, [:user_id, :chapter_id, :subscription_period_id],
      unique: true,
      name: "idx_unique_chapter_read_per_period"
  end
end
