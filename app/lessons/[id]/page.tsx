import { supabase } from '../../../lib/supabase'
import MarkAsCompleteButton from '../../components/MarkAsCompleteButton'

async function getLesson(id: string) {
  const { data, error } = await supabase.from('lessons').select('*').eq('id', id).single()
  if (error) {
    console.error('Error fetching lesson:', error)
    return null
  }
  return data
}

export default async function LessonPage({ params }: { params: { id: string } }) {
  const lesson = await getLesson(params.id)

  if (!lesson) {
    return <div>Lesson not found</div>
  }

  return (
    <div>
      <h1>{lesson.title}</h1>
      <p>{lesson.description}</p>
      <div>{lesson.content}</div>
      <MarkAsCompleteButton lessonId={lesson.id} />
    </div>
  )
}
