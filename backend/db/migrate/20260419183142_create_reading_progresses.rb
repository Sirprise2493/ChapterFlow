class CreateReadingProgresses < ActiveRecord::Migration[7.1]
  def change
    create_table :reading_progresses do |t|
      t.references :user, null: false, foreign_key: true
      t.references :work, null: false, foreign_key: true
      t.bigint :last_chapter_id
      t.datetime :last_read_at

      t.timestamps
    end

    add_foreign_key :reading_progresses, :chapters, column: :last_chapter_id
  end
end
