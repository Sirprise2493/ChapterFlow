class ChapterReadRecorder
  Result = Struct.new(:success?, :chapter_read, :error_message, keyword_init: true)

  def initialize(user:, chapter:)
    @user = user
    @chapter = chapter
    @work = chapter.work
    @author = @work.author
  end

  def call
    return success(nil) unless should_count_read?

    subscription = active_subscription
    return failure("Dieses Kapitel benötigt ein aktives Abo.") unless subscription

    period = current_subscription_period(subscription)
    return failure("Für dein Abo wurde keine aktuelle Abrechnungsperiode gefunden.") unless period

    existing_read = ChapterRead.find_by(
      user: @user,
      chapter: @chapter,
      subscription_period: period
    )

    return success(existing_read) if existing_read

    if subscription.chapters_read_current_period >= subscription.plan.monthly_chapter_limit
      return failure("Du hast dein monatliches Kapitel-Limit erreicht.")
    end

    chapter_read = nil

    ActiveRecord::Base.transaction do
      chapter_read = ChapterRead.create!(
        user: @user,
        chapter: @chapter,
        work: @work,
        author: @author,
        subscription: subscription,
        subscription_period: period,
        read_at: Time.current,
        counted_in_quota: true,
        counted_for_payout: payout_eligible?,
        payout_cents: payout_eligible? ? period.per_chapter_payout_cents : 0
      )

      subscription.increment!(:chapters_read_current_period)
      period.increment!(:chapters_read_count)

      create_author_earning!(chapter_read, period) if payout_eligible?
    end

    success(chapter_read)
  rescue ActiveRecord::RecordInvalid => e
    failure(e.record.errors.full_messages.join(", "))
  end

  private

  def should_count_read?
    return false if @user.blank?
    return false if @user.id == @author.id
    return false if @work.free_access?
    return false if @chapter.chapter_number <= @work.free_chapter_until

    true
  end

  def payout_eligible?
    @chapter.is_monetizable? && @work.is_subscription_eligible?
  end

  def active_subscription
    @user
      .subscriptions
      .includes(:plan)
      .where(status: :active)
      .where("current_period_start <= ? AND current_period_end >= ?", Time.current, Time.current)
      .first
  end

  def current_subscription_period(subscription)
    subscription
      .subscription_periods
      .where("period_start <= ? AND period_end >= ?", Time.current, Time.current)
      .first
  end

  def create_author_earning!(chapter_read, period)
    AuthorEarning.create!(
      author: @author,
      reader_user: @user,
      chapter_read: chapter_read,
      subscription_period: period,
      work: @work,
      chapter: @chapter,
      amount_cents: period.per_chapter_payout_cents,
      currency: period.currency_snapshot,
      status: :pending
    )
  end

  def success(chapter_read)
    Result.new(success?: true, chapter_read: chapter_read, error_message: nil)
  end

  def failure(message)
    Result.new(success?: false, chapter_read: nil, error_message: message)
  end
end
