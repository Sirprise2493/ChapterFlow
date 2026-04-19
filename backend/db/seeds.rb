# db/seeds.rb

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

reader = User.create!(
  email: "reader@example.com",
  username: "reader_one",
  password: "password123",
  password_confirmation: "password123",
  status: :active
)

# Genres
fantasy = Genre.create!(name: "Fantasy")
action = Genre.create!(name: "Action")
romance = Genre.create!(name: "Romance")
drama = Genre.create!(name: "Drama")
adventure = Genre.create!(name: "Adventure")
system = Genre.create!(name: "System")
reincarnation = Genre.create!(name: "Reincarnation")

# Subscription Plan
plan = SubscriptionPlan.create!(
  name: "Premium Monthly",
  price_cents: 999,
  currency: "EUR",
  billing_period: "monthly",
  is_active: true,
  monthly_chapter_limit: 1000,
  author_payout_share: 0.8
)

subscription = Subscription.create!(
  user: reader,
  plan: plan,
  status: :active,
  chapters_read_current_period: 3,
  started_at: Time.current - 10.days,
  current_period_start: Time.current.beginning_of_month,
  current_period_end: Time.current.end_of_month
)

period = SubscriptionPeriod.create!(
  subscription: subscription,
  user: reader,
  plan: plan,
  period_start: Time.current.beginning_of_month,
  period_end: Time.current.end_of_month,
  price_cents_snapshot: 999,
  currency_snapshot: "EUR",
  monthly_chapter_limit_snapshot: 1000,
  author_payout_share_snapshot: 0.8,
  per_chapter_payout_cents: 0.7992,
  chapters_read_count: 3
)

works_data = [
  {
    author: author1,
    title: "The Last Arcane King",
    slug: "the-last-arcane-king",
    description: "A fallen mage king returns in a weaker body and rebuilds his power from nothing.",
    cover_picture: "https://example.com/covers/arcane-king.jpg",
    status: :ongoing,
    access_level: :free_access,
    views_count: 12000,
    published_at: 20.days.ago,
    genres: [fantasy, action, adventure, reincarnation]
  },
  {
    author: author1,
    title: "Shadow System Hunter",
    slug: "shadow-system-hunter",
    description: "A boy gains access to a forbidden system that lets him steal skills from monsters.",
    cover_picture: "https://example.com/covers/shadow-system-hunter.jpg",
    status: :ongoing,
    access_level: :subscription_only,
    views_count: 22000,
    published_at: 15.days.ago,
    genres: [action, fantasy, system]
  },
  {
    author: author2,
    title: "Reborn as the Tyrant's Healer",
    slug: "reborn-as-the-tyrants-healer",
    description: "She wakes up inside a tragic novel and becomes the healer of the future tyrant.",
    cover_picture: "https://example.com/covers/tyrants-healer.jpg",
    status: :ongoing,
    access_level: :free_access,
    views_count: 18000,
    published_at: 10.days.ago,
    genres: [romance, drama, fantasy, reincarnation]
  },
  {
    author: author2,
    title: "The Hero Quit the Guild",
    slug: "the-hero-quit-the-guild",
    description: "After defeating the demon king, the hero abandons fame and starts over as an adventurer.",
    cover_picture: "https://example.com/covers/hero-quit-the-guild.jpg",
    status: :completed,
    access_level: :free_access,
    views_count: 9000,
    published_at: 40.days.ago,
    genres: [adventure, action, fantasy]
  },
  {
    author: author1,
    title: "My Quiet Life in the Demon Forest",
    slug: "my-quiet-life-in-the-demon-forest",
    description: "An overpowered recluse wants peace, but the world keeps dragging him into conflict.",
    cover_picture: "https://example.com/covers/demon-forest.jpg",
    status: :ongoing,
    access_level: :subscription_only,
    views_count: 14000,
    published_at: 5.days.ago,
    genres: [fantasy, adventure, drama]
  },
  {
    author: author2,
    title: "Contract Marriage with the Ice Duke",
    slug: "contract-marriage-with-the-ice-duke",
    description: "A fake marriage turns complicated when political intrigue and real feelings collide.",
    cover_picture: "https://example.com/covers/ice-duke.jpg",
    status: :completed,
    access_level: :free_access,
    views_count: 30000,
    published_at: 30.days.ago,
    genres: [romance, drama]
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

  chapter_total = rand(8..15)

  chapter_total.times do |i|
    Chapter.create!(
      work: work,
      chapter_number: i + 1,
      title: "Chapter #{i + 1}",
      content: <<~TEXT,
        This is the content of chapter #{i + 1} of "#{work.title}".

        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
      TEXT
      is_monetizable: true
    )
  end

  work.update!(chapter_count: work.chapters.count)
  work
end

# Ratings
ratings_data = [
  [reader, created_works[0], 5],
  [reader, created_works[1], 4],
  [reader, created_works[2], 5],
  [author1, created_works[2], 4],
  [author2, created_works[0], 5],
  [author2, created_works[4], 4],
  [author1, created_works[5], 5]
]

ratings_data.each do |user, work, score|
  Rating.create!(user: user, work: work, score: score)
end

# Library
UserLibrary.create!(user: reader, work: created_works[0], added_at: 3.days.ago)
UserLibrary.create!(user: reader, work: created_works[1], added_at: 2.days.ago)
UserLibrary.create!(user: reader, work: created_works[2], added_at: 1.day.ago)

# Reading progress
progress_work = created_works[0]
progress_chapter = progress_work.chapters.find_by(chapter_number: 3)

ReadingProgress.create!(
  user: reader,
  work: progress_work,
  last_chapter: progress_chapter,
  last_read_at: 2.hours.ago
)

# Chapter reads + author earnings
read_chapters = created_works[1].chapters.order(:chapter_number).limit(3)

read_chapters.each do |chapter|
  chapter_read = ChapterRead.create!(
    user: reader,
    chapter: chapter,
    work: chapter.work,
    author: chapter.work.author,
    subscription: subscription,
    subscription_period: period,
    read_at: Time.current - rand(1..5).hours,
    counted_in_quota: true,
    counted_for_payout: true,
    payout_cents: 0.7992
  )

  AuthorEarning.create!(
    author: chapter.work.author,
    reader_user: reader,
    chapter_read: chapter_read,
    subscription_period: period,
    work: chapter.work,
    chapter: chapter,
    amount_cents: 0.7992,
    currency: "EUR",
    status: :pending
  )
end

# Beispiel-Kommentare
sample_chapter = created_works[0].chapters.first
comment1 = Comment.create!(
  user: reader,
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
puts "ChapterReads: #{ChapterRead.count}"
puts "AuthorEarnings: #{AuthorEarning.count}"
