class AddFreeChapterUntilToWorks < ActiveRecord::Migration[7.1]
  def change
    add_column :works, :free_chapter_until, :integer, default: 0, null: false
  end
end
