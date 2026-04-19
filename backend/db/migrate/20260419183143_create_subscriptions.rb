class CreateSubscriptions < ActiveRecord::Migration[7.1]
  def change
    create_table :subscriptions do |t|
      t.references :user, null: false, foreign_key: true
      t.references :plan, null: false, foreign_key: { to_table: :subscription_plans }

      t.integer :status, null: false, default: 0
      t.integer :chapters_read_current_period, null: false, default: 0

      t.datetime :started_at
      t.datetime :current_period_start
      t.datetime :current_period_end
      t.datetime :canceled_at

      t.timestamps
    end

    add_index :subscriptions, :status
  end
end
