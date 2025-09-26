'use client'

import { supabase } from '../../lib/supabase'

export default function MarkAsCompleteButton({ lessonId }: { lessonId: string }) {
  const handleMarkAsComplete = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('You must be logged in to mark a lesson as complete.')
      return
    }

    try {
      const { error } = await supabase.from('lesson_completions').insert({ user_id: user.id, lesson_id: lessonId, progress: 100 })
      if (error) throw error
      alert('Lesson marked as complete!')
    } catch (error: any) {
      alert(error.error_description || error.message)
    }
  }

  return (
    <button onClick={handleMarkAsComplete}>
      Mark as Complete
    </button>
  )
}
