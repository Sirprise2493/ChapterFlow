class CreateAuthorEarnings < ActiveRecord::Migration[7.1]
  def change
    create_table :author_earnings do |t|
      t.references :author, null: false, foreign_key: { to_table: :users }
      t.references :reader_user, null: false, foreign_key: { to_table: :users }
      t.references :chapter_read, null: false, foreign_key: true
      t.references :subscription_period, null: false, foreign_key: true
      t.references :work, null: false, foreign_key: true
      t.references :chapter, null: false, foreign_key: true
      t.decimal :amount_cents, precision: 12, scale: 4, null: false
      t.string :currency, null: false, default: "EUR"
      t.integer :status, null: false, default: 0
      t.datetime :paid_at

      t.timestamps
    end
  end
end
