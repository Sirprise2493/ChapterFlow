class AllowChapterNullOnComments < ActiveRecord::Migration[7.1]
  def change
    change_column_null :comments, :chapter_id, true
  end
end
