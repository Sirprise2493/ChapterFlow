class CreateWorkGenres < ActiveRecord::Migration[7.1]
  def change
    create_table :work_genres do |t|
      t.references :work, null: false, foreign_key: true
      t.references :genre, null: false, foreign_key: true

      t.timestamps
    end
  end
end
