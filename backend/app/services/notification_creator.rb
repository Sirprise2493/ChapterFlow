class NotificationCreator
  def self.comment_reply!(comment:)
    parent_comment = comment.parent_comment
    return unless parent_comment
    return if parent_comment.user_id == comment.user_id

    Notification.create!(
      user: parent_comment.user,
      actor: comment.user,
      notifiable: comment,
      action: "comment_reply",
      title: "Neue Antwort auf deinen Kommentar",
      body: "#{comment.user.username} hat auf deinen Kommentar geantwortet."
    )
  end

  def self.comment_like!(comment:, actor:)
    return unless comment
    return unless actor
    return if comment.user_id == actor.id

    already_notified = Notification.exists?(
      user_id: comment.user_id,
      actor_id: actor.id,
      notifiable: comment,
      action: "comment_like"
    )

    return if already_notified

    Notification.create!(
      user: comment.user,
      actor: actor,
      notifiable: comment,
      action: "comment_like",
      title: "Dein Kommentar wurde geliked",
      body: "#{actor.username} hat deinen Kommentar geliked."
    )
  end

  def self.new_chapter!(chapter:)
    work = chapter.work
    author = work.author

    user_ids = UserLibrary
      .where(work_id: work.id)
      .where.not(user_id: author.id)
      .distinct
      .pluck(:user_id)

    user_ids.each do |user_id|
      already_notified = Notification.exists?(
        user_id: user_id,
        actor_id: author.id,
        notifiable: chapter,
        action: "new_chapter"
      )

      next if already_notified

      Notification.create!(
        user_id: user_id,
        actor: author,
        notifiable: chapter,
        action: "new_chapter",
        title: "Neues Kapitel verfügbar",
        body: "#{work.title} hat ein neues Kapitel: Kapitel #{chapter.chapter_number}#{chapter.title.present? ? " – #{chapter.title}" : ""}."
      )
    end
  end
end
