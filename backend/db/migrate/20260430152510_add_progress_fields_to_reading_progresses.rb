class AddProgressFieldsToReadingProgresses < ActiveRecord::Migration[7.1]
  def change
    add_column :reading_progresses, :progress_percent, :integer, default: 0, null: false
    add_column :reading_progresses, :scroll_position, :integer, default: 0, null: false
  end
end
