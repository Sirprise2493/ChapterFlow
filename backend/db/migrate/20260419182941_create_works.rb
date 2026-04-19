class CreateWorks < ActiveRecord::Migration[7.1]
  def change
    create_table :works do |t|
      t.references :author, null: false, foreign_key: { to_table: :users }
      t.string :title, null: false
      t.string :slug, null: false
      t.text :description
      t.string :cover_picture
      t.integer :status, null: false, default: 0
      t.integer :access_level, null: false, default: 0
      t.integer :rating_count, null: false, default: 0
      t.decimal :rating_avg, precision: 3, scale: 2
      t.integer :chapter_count, null: false, default: 0
      t.integer :views_count, null: false, default: 0
      t.boolean :is_subscription_eligible, null: false, default: true
      t.datetime :published_at

      t.timestamps
    end
  end
end
