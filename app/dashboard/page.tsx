import { supabase } from '../../lib/supabase'

async function getLessonsWithCompletion() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const { data, error } = await supabase.from('lessons').select('*')
    if (error) {
      console.error('Error fetching lessons:', error)
      return []
    }
    return data.map(lesson => ({ ...lesson, isCompleted: false }))
  }

  const { data, error } = await supabase
    .from('lessons')
    .select(`
      *,
      lesson_completions ( progress )
    `)
    .eq('lesson_completions.user_id', user.id)

  if (error) {
    console.error('Error fetching lessons with completion:', error)
    return []
  }

  return data.map(lesson => ({
    ...lesson,
    isCompleted: lesson.lesson_completions.length > 0 && lesson.lesson_completions[0].progress === 100,
  }))
}

export default async function Dashboard() {
  const lessons = await getLessonsWithCompletion()

  return (
    <div>
      <h1>Dashboard</h1>
      <h2>Your Learning Path</h2>
      <div>
        {lessons.map((lesson) => (
          <div key={lesson.id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px', backgroundColor: lesson.isCompleted ? '#e0ffe0' : 'transparent' }}>
            <h3>{lesson.title}</h3>
            <p>{lesson.description}</p>
            <p>Difficulty: {lesson.difficulty}</p>
            <a href={`/lessons/${lesson.id}`}>Go to lesson</a>
            {lesson.isCompleted && <p>Completed!</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
