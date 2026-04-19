class CreateSubscriptionPeriods < ActiveRecord::Migration[7.1]
  def change
    create_table :subscription_periods do |t|
      t.references :subscription, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.references :plan, null: false, foreign_key: { to_table: :subscription_plans }
      t.datetime :period_start, null: false
      t.datetime :period_end, null: false
      t.integer :price_cents_snapshot, null: false
      t.string :currency_snapshot, null: false
      t.integer :monthly_chapter_limit_snapshot, null: false
      t.decimal :author_payout_share_snapshot, precision: 5, scale: 4, null: false
      t.decimal :per_chapter_payout_cents, precision: 12, scale: 4, null: false
      t.integer :chapters_read_count, null: false, default: 0

      t.timestamps
    end
  end
end
