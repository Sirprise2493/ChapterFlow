class CreateUserLibraries < ActiveRecord::Migration[7.1]
  def change
    create_table :user_libraries do |t|
      t.references :user, null: false, foreign_key: true
      t.references :work, null: false, foreign_key: true
      t.datetime :added_at

      t.timestamps
    end
  end
end
