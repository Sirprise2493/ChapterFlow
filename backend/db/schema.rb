# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2026_04_19_183202) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "author_earnings", force: :cascade do |t|
    t.bigint "author_id", null: false
    t.bigint "reader_user_id", null: false
    t.bigint "chapter_read_id", null: false
    t.bigint "subscription_period_id", null: false
    t.bigint "work_id", null: false
    t.bigint "chapter_id", null: false
    t.decimal "amount_cents", precision: 12, scale: 4, null: false
    t.string "currency", default: "EUR", null: false
    t.integer "status", default: 0, null: false
    t.datetime "paid_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["author_id"], name: "index_author_earnings_on_author_id"
    t.index ["chapter_id"], name: "index_author_earnings_on_chapter_id"
    t.index ["chapter_read_id"], name: "index_author_earnings_on_chapter_read_id"
    t.index ["reader_user_id"], name: "index_author_earnings_on_reader_user_id"
    t.index ["subscription_period_id"], name: "index_author_earnings_on_subscription_period_id"
    t.index ["work_id"], name: "index_author_earnings_on_work_id"
  end

  create_table "chapter_reads", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "chapter_id", null: false
    t.bigint "work_id", null: false
    t.bigint "author_id", null: false
    t.bigint "subscription_id", null: false
    t.bigint "subscription_period_id", null: false
    t.datetime "read_at", null: false
    t.boolean "counted_in_quota", default: true, null: false
    t.boolean "counted_for_payout", default: true, null: false
    t.decimal "payout_cents", precision: 12, scale: 4, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["author_id"], name: "index_chapter_reads_on_author_id"
    t.index ["chapter_id"], name: "index_chapter_reads_on_chapter_id"
    t.index ["subscription_id"], name: "index_chapter_reads_on_subscription_id"
    t.index ["subscription_period_id"], name: "index_chapter_reads_on_subscription_period_id"
    t.index ["user_id", "chapter_id", "subscription_period_id"], name: "idx_unique_chapter_read_per_period", unique: true
    t.index ["user_id"], name: "index_chapter_reads_on_user_id"
    t.index ["work_id"], name: "index_chapter_reads_on_work_id"
  end

  create_table "chapters", force: :cascade do |t|
    t.bigint "work_id", null: false
    t.integer "chapter_number", null: false
    t.string "title"
    t.text "content"
    t.boolean "is_monetizable", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["work_id", "chapter_number"], name: "index_chapters_on_work_id_and_chapter_number", unique: true
    t.index ["work_id"], name: "index_chapters_on_work_id"
  end

  create_table "comments", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "chapter_id", null: false
    t.bigint "parent_comment_id"
    t.text "content", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["chapter_id"], name: "index_comments_on_chapter_id"
    t.index ["user_id"], name: "index_comments_on_user_id"
  end

  create_table "genres", force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_genres_on_name", unique: true
  end

  create_table "ratings", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "work_id", null: false
    t.integer "score", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "work_id"], name: "index_ratings_on_user_id_and_work_id", unique: true
    t.index ["user_id"], name: "index_ratings_on_user_id"
    t.index ["work_id"], name: "index_ratings_on_work_id"
    t.check_constraint "score >= 1 AND score <= 5", name: "ratings_score_between_1_and_5"
  end

  create_table "reading_progresses", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "work_id", null: false
    t.bigint "last_chapter_id"
    t.datetime "last_read_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "work_id"], name: "index_reading_progresses_on_user_id_and_work_id", unique: true
    t.index ["user_id"], name: "index_reading_progresses_on_user_id"
    t.index ["work_id"], name: "index_reading_progresses_on_work_id"
  end

  create_table "subscription_periods", force: :cascade do |t|
    t.bigint "subscription_id", null: false
    t.bigint "user_id", null: false
    t.bigint "plan_id", null: false
    t.datetime "period_start", null: false
    t.datetime "period_end", null: false
    t.integer "price_cents_snapshot", null: false
    t.string "currency_snapshot", null: false
    t.integer "monthly_chapter_limit_snapshot", null: false
    t.decimal "author_payout_share_snapshot", precision: 5, scale: 4, null: false
    t.decimal "per_chapter_payout_cents", precision: 12, scale: 4, null: false
    t.integer "chapters_read_count", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["plan_id"], name: "index_subscription_periods_on_plan_id"
    t.index ["subscription_id"], name: "index_subscription_periods_on_subscription_id"
    t.index ["user_id"], name: "index_subscription_periods_on_user_id"
  end

  create_table "subscription_plans", force: :cascade do |t|
    t.string "name", null: false
    t.integer "price_cents", null: false
    t.string "currency", default: "EUR", null: false
    t.string "billing_period", default: "monthly", null: false
    t.boolean "is_active", default: true, null: false
    t.integer "monthly_chapter_limit", default: 1000, null: false
    t.decimal "author_payout_share", precision: 5, scale: 4, default: "0.8", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "subscriptions", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "plan_id", null: false
    t.integer "status", default: 0, null: false
    t.integer "chapters_read_current_period", default: 0, null: false
    t.datetime "started_at"
    t.datetime "current_period_start"
    t.datetime "current_period_end"
    t.datetime "canceled_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["plan_id"], name: "index_subscriptions_on_plan_id"
    t.index ["status"], name: "index_subscriptions_on_status"
    t.index ["user_id"], name: "index_subscriptions_on_user_id"
  end

  create_table "user_libraries", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "work_id", null: false
    t.datetime "added_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "work_id"], name: "index_user_libraries_on_user_id_and_work_id", unique: true
    t.index ["user_id"], name: "index_user_libraries_on_user_id"
    t.index ["work_id"], name: "index_user_libraries_on_work_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "username", null: false
    t.integer "status", default: 0, null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "last_sign_in_ip"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["username"], name: "index_users_on_username", unique: true
  end

  create_table "work_genres", force: :cascade do |t|
    t.bigint "work_id", null: false
    t.bigint "genre_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["genre_id"], name: "index_work_genres_on_genre_id"
    t.index ["work_id", "genre_id"], name: "index_work_genres_on_work_id_and_genre_id", unique: true
    t.index ["work_id"], name: "index_work_genres_on_work_id"
  end

  create_table "works", force: :cascade do |t|
    t.bigint "author_id", null: false
    t.string "title", null: false
    t.string "slug", null: false
    t.text "description"
    t.string "cover_picture"
    t.integer "status", default: 0, null: false
    t.integer "access_level", default: 0, null: false
    t.integer "rating_count", default: 0, null: false
    t.decimal "rating_avg", precision: 3, scale: 2
    t.integer "chapter_count", default: 0, null: false
    t.integer "views_count", default: 0, null: false
    t.boolean "is_subscription_eligible", default: true, null: false
    t.datetime "published_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["author_id"], name: "index_works_on_author_id"
    t.index ["chapter_count"], name: "index_works_on_chapter_count"
    t.index ["published_at"], name: "index_works_on_published_at"
    t.index ["rating_avg"], name: "index_works_on_rating_avg"
    t.index ["slug"], name: "index_works_on_slug", unique: true
    t.index ["status"], name: "index_works_on_status"
    t.index ["views_count"], name: "index_works_on_views_count"
  end

  add_foreign_key "author_earnings", "chapter_reads"
  add_foreign_key "author_earnings", "chapters"
  add_foreign_key "author_earnings", "subscription_periods"
  add_foreign_key "author_earnings", "users", column: "author_id"
  add_foreign_key "author_earnings", "users", column: "reader_user_id"
  add_foreign_key "author_earnings", "works"
  add_foreign_key "chapter_reads", "chapters"
  add_foreign_key "chapter_reads", "subscription_periods"
  add_foreign_key "chapter_reads", "subscriptions"
  add_foreign_key "chapter_reads", "users"
  add_foreign_key "chapter_reads", "users", column: "author_id"
  add_foreign_key "chapter_reads", "works"
  add_foreign_key "chapters", "works"
  add_foreign_key "comments", "chapters"
  add_foreign_key "comments", "comments", column: "parent_comment_id"
  add_foreign_key "comments", "users"
  add_foreign_key "ratings", "users"
  add_foreign_key "ratings", "works"
  add_foreign_key "reading_progresses", "chapters", column: "last_chapter_id"
  add_foreign_key "reading_progresses", "users"
  add_foreign_key "reading_progresses", "works"
  add_foreign_key "subscription_periods", "subscription_plans", column: "plan_id"
  add_foreign_key "subscription_periods", "subscriptions"
  add_foreign_key "subscription_periods", "users"
  add_foreign_key "subscriptions", "subscription_plans", column: "plan_id"
  add_foreign_key "subscriptions", "users"
  add_foreign_key "user_libraries", "users"
  add_foreign_key "user_libraries", "works"
  add_foreign_key "work_genres", "genres"
  add_foreign_key "work_genres", "works"
  add_foreign_key "works", "users", column: "author_id"
end
