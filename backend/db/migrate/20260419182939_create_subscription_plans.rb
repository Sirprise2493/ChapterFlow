class CreateSubscriptionPlans < ActiveRecord::Migration[7.1]
  def change
    create_table :subscription_plans do |t|
      t.string :name, null: false
      t.integer :price_cents, null: false
      t.string :currency, null: false, default: "EUR"
      t.string :billing_period, null: false, default: "monthly"
      t.boolean :is_active, null: false, default: true
      t.integer :monthly_chapter_limit, null: false, default: 1000
      t.decimal :author_payout_share, precision: 5, scale: 4, null: false, default: 0.8

      t.timestamps
    end
  end
end
