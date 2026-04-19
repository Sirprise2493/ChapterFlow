class CreateChapters < ActiveRecord::Migration[7.1]
  def change
    create_table :chapters do |t|
      t.references :work, null: false, foreign_key: true
      t.integer :chapter_number, null: false
      t.string :title
      t.text :content
      t.boolean :is_monetizable, null: false, default: true

      t.timestamps
    end
  end
end
