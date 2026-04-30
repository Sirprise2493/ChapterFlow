class AddMediaToComments < ActiveRecord::Migration[7.1]
  def change
    add_column :comments, :media_url, :string
    add_column :comments, :media_type, :string
  end
end
