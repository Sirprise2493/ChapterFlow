puts "Seeding started..."

# Cleanup in sinnvoller Reihenfolge
Notification.delete_all if defined?(Notification)
AuthorEarning.delete_all if defined?(AuthorEarning)
ChapterRead.delete_all if defined?(ChapterRead)
SubscriptionPeriod.delete_all if defined?(SubscriptionPeriod)
Subscription.delete_all if defined?(Subscription)
SubscriptionPlan.delete_all if defined?(SubscriptionPlan)
ReadingProgress.delete_all if defined?(ReadingProgress)
UserLibrary.delete_all if defined?(UserLibrary)
CommentLike.delete_all if defined?(CommentLike)
Comment.delete_all if defined?(Comment)
Rating.delete_all if defined?(Rating)
WorkGenre.delete_all if defined?(WorkGenre)
Chapter.delete_all if defined?(Chapter)
Work.delete_all if defined?(Work)
Genre.delete_all if defined?(Genre)
User.delete_all if defined?(User)

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

extra_readers = 12.times.map do |index|
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

# Subscription Plans
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

SubscriptionPeriod.create!(
  subscription: active_subscription,
  user: reader_with_subscription,
  plan: premium_plan,
  period_start: Time.current.beginning_of_month,
  period_end: Time.current.end_of_month,
  price_cents_snapshot: premium_plan.price_cents,
  currency_snapshot: premium_plan.currency,
  monthly_chapter_limit_snapshot: premium_plan.monthly_chapter_limit,
  author_payout_share_snapshot: premium_plan.author_payout_share,
  per_chapter_payout_cents: ((premium_plan.price_cents * premium_plan.author_payout_share) / premium_plan.monthly_chapter_limit).round(4),
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

SubscriptionPeriod.create!(
  subscription: limit_subscription,
  user: reader_at_limit,
  plan: limited_plan,
  period_start: Time.current.beginning_of_month,
  period_end: Time.current.end_of_month,
  price_cents_snapshot: limited_plan.price_cents,
  currency_snapshot: limited_plan.currency,
  monthly_chapter_limit_snapshot: limited_plan.monthly_chapter_limit,
  author_payout_share_snapshot: limited_plan.author_payout_share,
  per_chapter_payout_cents: ((limited_plan.price_cents * limited_plan.author_payout_share) / limited_plan.monthly_chapter_limit).round(4),
  chapters_read_count: limited_plan.monthly_chapter_limit
)

def sample_chapter_content(work_title, chapter_number)
  <<~TEXT
    This is chapter #{chapter_number} of "#{work_title}".

    The story continues with new tension, new decisions, and a stronger sense of momentum.

    This sample chapter exists so you can test reading progress, subscription access, chapter limits, comments, ratings, libraries, author dashboards, and author payouts.

    If this work is subscription-only, chapters after the free chapter limit should require an active subscription.

    The hero faces a difficult choice, the supporting cast reacts, and the world expands through conflict, mystery, humor, and emotion.
  TEXT
end

base_works_data = [
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
    word_count: 124_000,
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
    chapter_total: 18,
    word_count: 360_000,
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
    chapter_total: 14,
    word_count: 92_000,
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
    word_count: 48_000,
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
    chapter_total: 22,
    word_count: 510_000,
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
    chapter_total: 16,
    word_count: 302_000,
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
    chapter_total: 11,
    word_count: 76_000,
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
    chapter_total: 13,
    word_count: 118_000,
    genres: [comedy, fantasy, action]
  }
]

generated_titles = [
  ["Moonlit Sword Saint", [fantasy, action, adventure], 58_000],
  ["Dungeon Delivery Service", [comedy, adventure, system], 24_000],
  ["The Duchess Solves Murders", [romance, mystery, drama], 112_000],
  ["Infinite Level Tavern", [system, comedy, fantasy], 64_000],
  ["Reincarnated as a Library Ghost", [reincarnation, mystery, comedy], 37_000],
  ["Dragon Market Broker", [fantasy, adventure, comedy], 82_000],
  ["The Saintess Refuses Destiny", [romance, drama, fantasy], 158_000],
  ["Blade Runner of the East Gate", [action, mystery, adventure], 71_000],
  ["My Brother Is the Final Boss", [fantasy, system, drama], 206_000],
  ["The Alchemist's Fake Engagement", [romance, comedy, fantasy], 54_000],
  ["Seven Lives of the Black Cat", [reincarnation, mystery, fantasy], 96_000],
  ["Guild Receptionist at Level 999", [system, comedy, adventure], 188_000],
  ["Ashes of the Silver Empire", [fantasy, action, drama], 442_000],
  ["Detective of the Demon Court", [mystery, fantasy, drama], 129_000],
  ["Romance Route Error", [romance, comedy, system], 33_000],
  ["The Last Quest Board", [adventure, fantasy, comedy], 67_000],
  ["Crown Prince of the Abyss", [fantasy, action, romance], 305_000],
  ["A Maid's Guide to Revolution", [drama, romance, mystery], 87_000],
  ["Skill Thief Chronicle", [system, action, fantasy], 526_000],
  ["The Forgotten Floor", [mystery, adventure, system], 141_000],
  ["Princess of Practical Magic", [fantasy, comedy, romance], 73_000],
  ["Monster Ranch Regression", [reincarnation, system, adventure], 254_000],
  ["The Hero's Tax Accountant", [comedy, fantasy, adventure], 18_000],
  ["Empire of Broken Oaths", [drama, fantasy, action], 612_000],
  ["The Oracle Logs Out", [system, mystery, comedy], 46_000],
  ["Hearts Beneath Iron Snow", [romance, drama, mystery], 335_000],
  ["The Million Word Necromancer", [fantasy, system, action], 1_050_000],
  ["A Thousand Doors Academy", [fantasy, mystery, adventure], 720_000]
]

generated_works_data = generated_titles.each_with_index.map do |(title, genre_list, word_count), index|
  author = index.even? ? author1 : author2
  access_level = index % 4 == 0 ? :subscription_only : :free_access

  chapter_total =
    case word_count
    when 0...50_000
      6 + (index % 4)
    when 50_000...150_000
      10 + (index % 6)
    when 150_000...350_000
      16 + (index % 8)
    else
      24 + (index % 12)
    end

  {
    author: author,
    title: title,
    slug: title.downcase.gsub(/[^a-z0-9]+/, "-").gsub(/^-|-$/, ""),
    description: "#{title} is a seeded test work for pagination, genre combinations, search, sorting, and word-count filters.",
    cover_picture: "https://picsum.photos/seed/#{title.downcase.gsub(/[^a-z0-9]+/, "-")}/600/900",
    status: index % 5 == 0 ? :completed : :ongoing,
    access_level: access_level,
    free_chapter_until: access_level == :subscription_only ? 3 + (index % 3) : 0,
    views_count: 2_500 + (index * 1_375),
    published_at: (index + 1).days.ago,
    chapter_total: chapter_total,
    word_count: word_count,
    genres: genre_list
  }
end

works_data = base_works_data + generated_works_data

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
    word_count: 0,
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
      content: sample_chapter_content(work.title, chapter_number),
      is_monetizable: true
    )
  end

  # Die echte Chapter-Content-Länge ist kurz, damit Seeds schnell bleiben.
  # word_count ist ein Snapshot-Testwert für Browse/Filter/Sortierung.
  work.update!(
    chapter_count: work.chapters.count,
    word_count: data[:word_count]
  )

  work
end

# Ratings: mindestens 3 Ratings pro Work, damit Top-Listen funktionieren
created_works.each_with_index do |work, work_index|
  rating_count = 3 + (work_index % 5)

  rating_count.times do |index|
    user = all_rating_users[index % all_rating_users.length]
    score = 3 + ((work_index + index) % 3)

    Rating.create!(
      user: user,
      work: work,
      score: score
    )
  end
end

# Library
[
  "the-last-arcane-king",
  "shadow-system-hunter",
  "my-quiet-life-in-the-demon-forest",
  "the-million-word-necromancer"
].each_with_index do |slug, index|
  work = created_works.find { |item| item.slug == slug }
  next unless work

  UserLibrary.create!(
    user: reader_with_subscription,
    work: work,
    added_at: (index + 1).days.ago
  )
end

shadow_system_hunter = created_works.find { |work| work.slug == "shadow-system-hunter" }

UserLibrary.create!(
  user: reader_without_subscription,
  work: shadow_system_hunter,
  added_at: 1.day.ago
) if shadow_system_hunter

# Reading progress: freies Kapitel, damit ChapterRead/AuthorEarning sauber bei 0 starten können
progress_work = created_works.find { |work| work.slug == "the-last-arcane-king" }
progress_chapter = progress_work.chapters.find_by!(chapter_number: 3)

ReadingProgress.create!(
  user: reader_with_subscription,
  work: progress_work,
  last_chapter: progress_chapter,
  last_read_at: 2.hours.ago,
  progress_percent: 35,
  scroll_position: 480
)

# Chapter Comments
sample_chapter = progress_work.chapters.first

chapter_comment1 = Comment.create!(
  user: reader_with_subscription,
  chapter: sample_chapter,
  content: "Really strong first chapter."
)

chapter_comment2 = Comment.create!(
  user: author2,
  chapter: sample_chapter,
  parent_comment: chapter_comment1,
  content: "Agreed, the opening was great."
)

chapter_comment3 = Comment.create!(
  user: reader_without_subscription,
  chapter: sample_chapter,
  content: "The pacing is already interesting."
)

# Work Comments
arcane_king = created_works.find { |work| work.slug == "the-last-arcane-king" }
shadow_hunter = created_works.find { |work| work.slug == "shadow-system-hunter" }
demon_forest = created_works.find { |work| work.slug == "my-quiet-life-in-the-demon-forest" }
ice_duke = created_works.find { |work| work.slug == "contract-marriage-with-the-ice-duke" }

work_comment1 = Comment.create!(
  user: reader_with_subscription,
  work: shadow_hunter,
  content: "This is exactly the kind of system fantasy I wanted. The pacing feels really addictive."
)

work_comment2 = Comment.create!(
  user: reader_without_subscription,
  work: shadow_hunter,
  content: "I like the premise, but I need a subscription before I can continue past the free chapters."
)

work_comment3 = Comment.create!(
  user: author2,
  work: shadow_hunter,
  parent_comment: work_comment1,
  content: "Same here. The skill stealing idea is fun."
)

work_comment4 = Comment.create!(
  user: reader_at_limit,
  work: shadow_hunter,
  content: "I reached my monthly chapter limit while reading this. Good test case for the subscription limit."
)

work_comment5 = Comment.create!(
  user: reader_with_subscription,
  work: arcane_king,
  content: "The reincarnation angle works nicely here. The worldbuilding is clear without being too slow."
)

work_comment6 = Comment.create!(
  user: reader_without_subscription,
  work: arcane_king,
  parent_comment: work_comment5,
  content: "Agree. This one is easy to start because it is free access."
)

work_comment7 = Comment.create!(
  user: extra_readers[0],
  work: demon_forest,
  content: "The calm-life fantasy setup is cozy, but the conflict keeps it interesting."
)

work_comment8 = Comment.create!(
  user: extra_readers[1],
  work: demon_forest,
  parent_comment: work_comment7,
  content: "The free chapter limit is also useful for testing locked chapters."
)

work_comment9 = Comment.create!(
  user: extra_readers[2],
  work: ice_duke,
  content: "The romance/drama combination is strong. This should show up when filtering Romance + Drama."
)

work_comment10 = Comment.create!(
  user: extra_readers[3],
  work: ice_duke,
  content: "Testing a work-level comment with an image attachment.",
  media_url: "https://picsum.photos/seed/work-comment-media/500/300",
  media_type: "image"
)

# Optional Likes
if defined?(CommentLike)
  [
    [reader_without_subscription, work_comment1],
    [reader_at_limit, work_comment1],
    [extra_readers[0], work_comment1],
    [reader_with_subscription, work_comment2],
    [author1, work_comment5],
    [reader_with_subscription, work_comment7],
    [reader_without_subscription, chapter_comment1],
    [extra_readers[1], chapter_comment1]
  ].each do |user, comment|
    CommentLike.find_or_create_by!(user: user, comment: comment)
  end
end

# Notifications
Notification.delete_all if defined?(Notification)

if defined?(Notification)
  shadow_hunter_like_comment = work_comment1
  arcane_reply_comment = work_comment6
  chapter_reply_comment = chapter_comment2

  Notification.create!(
    user: work_comment1.user,
    actor: reader_without_subscription,
    notifiable: shadow_hunter_like_comment,
    action: "comment_like",
    title: "Dein Kommentar wurde geliked",
    body: "#{reader_without_subscription.username} hat deinen Kommentar geliked.",
    read_at: nil
  )

  Notification.create!(
    user: work_comment5.user,
    actor: reader_without_subscription,
    notifiable: arcane_reply_comment,
    action: "comment_reply",
    title: "Neue Antwort auf deinen Kommentar",
    body: "#{reader_without_subscription.username} hat auf deinen Kommentar geantwortet.",
    read_at: nil
  )

  Notification.create!(
    user: chapter_comment1.user,
    actor: author2,
    notifiable: chapter_reply_comment,
    action: "comment_reply",
    title: "Neue Antwort auf deinen Kapitel-Kommentar",
    body: "#{author2.username} hat auf deinen Kommentar geantwortet.",
    read_at: 1.day.ago
  )

  Notification.create!(
    user: author1,
    actor: reader_without_subscription,
    notifiable: shadow_hunter,
    action: "work_comment",
    title: "Neuer Kommentar auf deinem Werk",
    body: "#{reader_without_subscription.username} hat Shadow System Hunter kommentiert.",
    read_at: nil
  )

  Notification.create!(
    user: author1,
    actor: reader_at_limit,
    notifiable: shadow_hunter,
    action: "work_comment",
    title: "Neuer Kommentar auf deinem Werk",
    body: "#{reader_at_limit.username} hat Shadow System Hunter kommentiert.",
    read_at: 2.hours.ago
  )
end

puts "Seeding finished."
puts "Users: #{User.count}"
puts "Genres: #{Genre.count}"
puts "Works: #{Work.count}"
puts "Chapters: #{Chapter.count}"
puts "Ratings: #{Rating.count}"
puts "Comments: #{Comment.count}"
puts "CommentLikes: #{defined?(CommentLike) ? CommentLike.count : 0}"
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
puts "Browse/Search test data:"
puts "Works: #{Work.count} total, enough for pagination with 12 per page"
puts "Word count examples:"
puts "> 10,000: #{Work.where('word_count >= ?', 10_000).count}"
puts "> 50,000: #{Work.where('word_count >= ?', 50_000).count}"
puts "> 100,000: #{Work.where('word_count >= ?', 100_000).count}"
puts "> 300,000: #{Work.where('word_count >= ?', 300_000).count}"
puts "> 500,000: #{Work.where('word_count >= ?', 500_000).count}"
puts "> 1,000,000: #{Work.where('word_count >= ?', 1_000_000).count}"

puts ""
puts "Subscription test works:"
puts "Shadow System Hunter: free chapters until 3, chapter 4+ requires subscription"
puts "My Quiet Life in the Demon Forest: free chapters until 5, chapter 6+ requires subscription"
puts "Clockwork Mystery Academy: free chapters until 2, chapter 3+ requires subscription"

puts ""
puts "Work comment test works:"
puts "Shadow System Hunter: several work comments, replies and likes"
puts "The Last Arcane King: free-access work comments"
puts "My Quiet Life in the Demon Forest: subscription work comments"
puts "Contract Marriage with the Ice Duke: media comment"
