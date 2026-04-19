class CreateComments < ActiveRecord::Migration[7.1]
  def change
    create_table :comments do |t|
      t.references :user, null: false, foreign_key: true
      t.references :chapter, null: false, foreign_key: true
      t.bigint :parent_comment_id
      t.text :content, null: false

      t.timestamps
    end

    add_foreign_key :comments, :comments, column: :parent_comment_id
  end
end
