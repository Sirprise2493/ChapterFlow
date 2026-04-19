class CreateChapterReads < ActiveRecord::Migration[7.1]
  def change
    create_table :chapter_reads do |t|
      t.references :user, null: false, foreign_key: true
      t.references :chapter, null: false, foreign_key: true
      t.references :work, null: false, foreign_key: true
      t.references :author, null: false, foreign_key: { to_table: :users }
      t.references :subscription, null: false, foreign_key: true
      t.references :subscription_period, null: false, foreign_key: true
      t.datetime :read_at, null: false
      t.boolean :counted_in_quota, null: false, default: true
      t.boolean :counted_for_payout, null: false, default: true
      t.decimal :payout_cents, precision: 12, scale: 4, null: false

      t.timestamps
    end
  end
end
