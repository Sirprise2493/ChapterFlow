puts "Seeding started..."

# Cleanup in sinnvoller Reihenfolge
AuthorEarning.delete_all
ChapterRead.delete_all
SubscriptionPeriod.delete_all
Subscription.delete_all
SubscriptionPlan.delete_all
ReadingProgress.delete_all
UserLibrary.delete_all
Comment.delete_all
Rating.delete_all
WorkGenre.delete_all
Chapter.delete_all
Work.delete_all
Genre.delete_all
User.delete_all

# Users
author1 = User.create!(
  email: "author1@example.com",
  username: "author_one",
  password: "password123",
  password_confirmation: "password123",
  status: :active
)

author2 = User.create!(
  email: "author2@example.com",
  username: "author_two",
  password: "password123",
  password_confirmation: "password123",
  status: :active
)

reader_with_subscription = User.create!(
  email: "reader@example.com",
  username: "reader_one",
  password: "password123",
  password_confirmation: "password123",
  status: :active
)

reader_without_subscription = User.create!(
  email: "reader_no_sub@example.com",
  username: "reader_no_sub",
  password: "password123",
  password_confirmation: "password123",
  status: :active
)

reader_at_limit = User.create!(
  email: "reader_limit@example.com",
  username: "reader_limit",
  password: "password123",
  password_confirmation: "password123",
  status: :active
)

extra_readers = 8.times.map do |index|
  User.create!(
    email: "reader#{index + 2}@example.com",
    username: "reader_#{index + 2}",
    password: "password123",
    password_confirmation: "password123",
    status: :active
  )
end

all_rating_users = [
  reader_with_subscription,
  reader_without_subscription,
  reader_at_limit,
  author1,
  author2,
  *extra_readers
]

# Genres
fantasy = Genre.create!(name: "Fantasy")
action = Genre.create!(name: "Action")
romance = Genre.create!(name: "Romance")
drama = Genre.create!(name: "Drama")
adventure = Genre.create!(name: "Adventure")
system = Genre.create!(name: "System")
reincarnation = Genre.create!(name: "Reincarnation")
mystery = Genre.create!(name: "Mystery")
comedy = Genre.create!(name: "Comedy")

# Subscription Plan
premium_plan = SubscriptionPlan.create!(
  name: "Premium Monthly",
  price_cents: 999,
  currency: "EUR",
  billing_period: "monthly",
  is_active: true,
  monthly_chapter_limit: 1000,
  author_payout_share: 0.8
)

limited_plan = SubscriptionPlan.create!(
  name: "Test Limit Plan",
  price_cents: 999,
  currency: "EUR",
  billing_period: "monthly",
  is_active: true,
  monthly_chapter_limit: 3,
  author_payout_share: 0.8
)

# Active subscription user
active_subscription = Subscription.create!(
  user: reader_with_subscription,
  plan: premium_plan,
  status: :active,
  chapters_read_current_period: 0,
  started_at: Time.current - 10.days,
  current_period_start: Time.current.beginning_of_month,
  current_period_end: Time.current.end_of_month
)

active_period = SubscriptionPeriod.create!(
  subscription: active_subscription,
  user: reader_with_subscription,
  plan: premium_plan,
  period_start: Time.current.beginning_of_month,
  period_end: Time.current.end_of_month,
  price_cents_snapshot: premium_plan.price_cents,
  currency_snapshot: premium_plan.currency,
  monthly_chapter_limit_snapshot: premium_plan.monthly_chapter_limit,
  author_payout_share_snapshot: premium_plan.author_payout_share,
  per_chapter_payout_cents: 0.7992,
  chapters_read_count: 0
)

# User already at limit
limit_subscription = Subscription.create!(
  user: reader_at_limit,
  plan: limited_plan,
  status: :active,
  chapters_read_current_period: limited_plan.monthly_chapter_limit,
  started_at: Time.current - 10.days,
  current_period_start: Time.current.beginning_of_month,
  current_period_end: Time.current.end_of_month
)

limit_period = SubscriptionPeriod.create!(
  subscription: limit_subscription,
  user: reader_at_limit,
  plan: limited_plan,
  period_start: Time.current.beginning_of_month,
  period_end: Time.current.end_of_month,
  price_cents_snapshot: limited_plan.price_cents,
  currency_snapshot: limited_plan.currency,
  monthly_chapter_limit_snapshot: limited_plan.monthly_chapter_limit,
  author_payout_share_snapshot: limited_plan.author_payout_share,
  per_chapter_payout_cents: 2.6640,
  chapters_read_count: limited_plan.monthly_chapter_limit
)

works_data = [
  {
    author: author1,
    title: "The Last Arcane King",
    slug: "the-last-arcane-king",
    description: "A fallen mage king returns in a weaker body and rebuilds his power from nothing.",
    cover_picture: "https://picsum.photos/seed/arcane-king/600/900",
    status: :ongoing,
    access_level: :free_access,
    free_chapter_until: 0,
    views_count: 12_000,
    published_at: 20.days.ago,
    chapter_total: 12,
    genres: [fantasy, action, adventure, reincarnation]
  },
  {
    author: author1,
    title: "Shadow System Hunter",
    slug: "shadow-system-hunter",
    description: "A boy gains access to a forbidden system that lets him steal skills from monsters.",
    cover_picture: "https://picsum.photos/seed/shadow-system-hunter/600/900",
    status: :ongoing,
    access_level: :subscription_only,
    free_chapter_until: 3,
    views_count: 22_000,
    published_at: 15.days.ago,
    chapter_total: 12,
    genres: [action, fantasy, system]
  },
  {
    author: author2,
    title: "Reborn as the Tyrant's Healer",
    slug: "reborn-as-the-tyrants-healer",
    description: "She wakes up inside a tragic novel and becomes the healer of the future tyrant.",
    cover_picture: "https://picsum.photos/seed/tyrants-healer/600/900",
    status: :ongoing,
    access_level: :free_access,
    free_chapter_until: 0,
    views_count: 18_000,
    published_at: 10.days.ago,
    chapter_total: 10,
    genres: [romance, drama, fantasy, reincarnation]
  },
  {
    author: author2,
    title: "The Hero Quit the Guild",
    slug: "the-hero-quit-the-guild",
    description: "After defeating the demon king, the hero abandons fame and starts over as an adventurer.",
    cover_picture: "https://picsum.photos/seed/hero-quit-guild/600/900",
    status: :completed,
    access_level: :free_access,
    free_chapter_until: 0,
    views_count: 9_000,
    published_at: 40.days.ago,
    chapter_total: 9,
    genres: [adventure, action, fantasy]
  },
  {
    author: author1,
    title: "My Quiet Life in the Demon Forest",
    slug: "my-quiet-life-in-the-demon-forest",
    description: "An overpowered recluse wants peace, but the world keeps dragging him into conflict.",
    cover_picture: "https://picsum.photos/seed/demon-forest/600/900",
    status: :ongoing,
    access_level: :subscription_only,
    free_chapter_until: 5,
    views_count: 14_000,
    published_at: 5.days.ago,
    chapter_total: 14,
    genres: [fantasy, adventure, drama]
  },
  {
    author: author2,
    title: "Contract Marriage with the Ice Duke",
    slug: "contract-marriage-with-the-ice-duke",
    description: "A fake marriage turns complicated when political intrigue and real feelings collide.",
    cover_picture: "https://picsum.photos/seed/ice-duke/600/900",
    status: :completed,
    access_level: :free_access,
    free_chapter_until: 0,
    views_count: 30_000,
    published_at: 30.days.ago,
    chapter_total: 11,
    genres: [romance, drama]
  },
  {
    author: author2,
    title: "Clockwork Mystery Academy",
    slug: "clockwork-mystery-academy",
    description: "A young investigator enters an academy where every secret is powered by clockwork magic.",
    cover_picture: "https://picsum.photos/seed/clockwork-academy/600/900",
    status: :ongoing,
    access_level: :subscription_only,
    free_chapter_until: 2,
    views_count: 7_500,
    published_at: 3.days.ago,
    chapter_total: 8,
    genres: [mystery, fantasy, drama]
  },
  {
    author: author1,
    title: "The Villain Wants a Vacation",
    slug: "the-villain-wants-a-vacation",
    description: "A retired villain tries to live quietly, but heroes keep asking for rematches.",
    cover_picture: "https://picsum.photos/seed/villain-vacation/600/900",
    status: :ongoing,
    access_level: :free_access,
    free_chapter_until: 0,
    views_count: 16_500,
    published_at: 2.days.ago,
    chapter_total: 10,
    genres: [comedy, fantasy, action]
  }
]

created_works = works_data.map do |data|
  work = Work.create!(
    author: data[:author],
    title: data[:title],
    slug: data[:slug],
    description: data[:description],
    cover_picture: data[:cover_picture],
    status: data[:status],
    access_level: data[:access_level],
    free_chapter_until: data[:free_chapter_until],
    rating_count: 0,
    rating_avg: nil,
    chapter_count: 0,
    views_count: data[:views_count],
    is_subscription_eligible: true,
    published_at: data[:published_at]
  )

  data[:genres].each do |genre|
    WorkGenre.create!(work: work, genre: genre)
  end

  data[:chapter_total].times do |index|
    chapter_number = index + 1

    Chapter.create!(
      work: work,
      chapter_number: chapter_number,
      title: "Chapter #{chapter_number}",
      content: <<~TEXT,
        This is chapter #{chapter_number} of "#{work.title}".

        The story continues with new tension, new decisions, and a stronger sense of momentum.

        This sample chapter exists so you can test reading progress, subscription access, chapter limits, and author payouts.

        If this work is subscription-only, chapters after the free chapter limit should require an active subscription.
      TEXT
      is_monetizable: true
    )
  end

  work.update!(chapter_count: work.chapters.count)
  work
end

# Ratings: mindestens 3 Ratings pro Work, damit Top-Listen funktionieren
rating_patterns = {
  "the-last-arcane-king" => [5, 5, 4, 5, 4, 5],
  "shadow-system-hunter" => [5, 4, 4, 5, 5, 4],
  "reborn-as-the-tyrants-healer" => [5, 5, 5, 4, 4],
  "the-hero-quit-the-guild" => [4, 4, 5, 4],
  "my-quiet-life-in-the-demon-forest" => [4, 5, 4, 4, 5],
  "contract-marriage-with-the-ice-duke" => [5, 5, 4, 5, 5, 5],
  "clockwork-mystery-academy" => [4, 4, 3, 5],
  "the-villain-wants-a-vacation" => [5, 4, 5, 4, 5]
}

created_works.each do |work|
  scores = rating_patterns.fetch(work.slug)

  scores.each_with_index do |score, index|
    user = all_rating_users[index]

    Rating.create!(
      user: user,
      work: work,
      score: score
    )
  end
end

# Library
UserLibrary.create!(
  user: reader_with_subscription,
  work: created_works.find { |work| work.slug == "the-last-arcane-king" },
  added_at: 3.days.ago
)

UserLibrary.create!(
  user: reader_with_subscription,
  work: created_works.find { |work| work.slug == "shadow-system-hunter" },
  added_at: 2.days.ago
)

UserLibrary.create!(
  user: reader_with_subscription,
  work: created_works.find { |work| work.slug == "my-quiet-life-in-the-demon-forest" },
  added_at: 1.day.ago
)

UserLibrary.create!(
  user: reader_without_subscription,
  work: created_works.find { |work| work.slug == "shadow-system-hunter" },
  added_at: 1.day.ago
)

# Reading progress: nur ein freies Kapitel, damit ChapterRead/AuthorEarning sauber bei 0 starten können
progress_work = created_works.find { |work| work.slug == "the-last-arcane-king" }
progress_chapter = progress_work.chapters.find_by!(chapter_number: 3)

ReadingProgress.create!(
  user: reader_with_subscription,
  work: progress_work,
  last_chapter: progress_chapter,
  last_read_at: 2.hours.ago
)

# Comments
sample_chapter = progress_work.chapters.first

comment1 = Comment.create!(
  user: reader_with_subscription,
  chapter: sample_chapter,
  content: "Really strong first chapter."
)

Comment.create!(
  user: author2,
  chapter: sample_chapter,
  parent_comment: comment1,
  content: "Agreed, the opening was great."
)

puts "Seeding finished."
puts "Users: #{User.count}"
puts "Genres: #{Genre.count}"
puts "Works: #{Work.count}"
puts "Chapters: #{Chapter.count}"
puts "Ratings: #{Rating.count}"
puts "Comments: #{Comment.count}"
puts "Subscriptions: #{Subscription.count}"
puts "SubscriptionPeriods: #{SubscriptionPeriod.count}"
puts "ChapterReads: #{ChapterRead.count}"
puts "AuthorEarnings: #{AuthorEarning.count}"

puts ""
puts "Login users:"
puts "Author 1: author1@example.com / password123"
puts "Author 2: author2@example.com / password123"
puts "Reader with subscription: reader@example.com / password123"
puts "Reader without subscription: reader_no_sub@example.com / password123"
puts "Reader at limit: reader_limit@example.com / password123"

puts ""
puts "Subscription test works:"
puts "Shadow System Hunter: free chapters until 3, chapter 4+ requires subscription"
puts "My Quiet Life in the Demon Forest: free chapters until 5, chapter 6+ requires subscription"
puts "Clockwork Mystery Academy: free chapters until 2, chapter 3+ requires subscription"
