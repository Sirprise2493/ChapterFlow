module ChapterAccess
  extend ActiveSupport::Concern

  private

  def free_chapter?(chapter)
    work = chapter.work

    work.free_access? || chapter.chapter_number <= work.free_chapter_until
  end

  def can_read_chapter?(chapter)
    return true if free_chapter?(chapter)
    return true if current_api_user&.id == chapter.work.author_id

    active_subscription_for_current_user.present?
  end

  def active_subscription_for_current_user
    return nil unless current_api_user

    current_api_user
      .subscriptions
      .includes(:plan)
      .where(status: :active)
      .where("current_period_start <= ? AND current_period_end >= ?", Time.current, Time.current)
      .first
  end

  def remaining_chapters_for_current_user
    subscription = active_subscription_for_current_user
    return nil unless subscription

    [
      subscription.plan.monthly_chapter_limit - subscription.chapters_read_current_period,
      0
    ].max
  end
end
