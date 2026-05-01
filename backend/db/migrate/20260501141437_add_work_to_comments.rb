class AddWorkToComments < ActiveRecord::Migration[7.1]
  def change
    add_reference :comments, :work, null: true, foreign_key: true
    add_index :comments, [:work_id, :created_at]
  end
end
