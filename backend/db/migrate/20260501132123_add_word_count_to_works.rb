class AddWordCountToWorks < ActiveRecord::Migration[7.1]
  def change
    add_column :works, :word_count, :integer, default: 0, null: false
    add_index :works, :word_count
  end
end
