'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5,6,7,8,9,10].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`text-xl transition ${n <= value ? 'text-yellow-400' : 'text-zinc-600 hover:text-yellow-300'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function CommentSection({ spotId }) {
  const [comments, setComments] = useState([])
  const [user, setUser] = useState(null)
  const [content, setContent] = useState('')
  const [rating, setRating] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [alreadyCommented, setAlreadyCommented] = useState(false)

  useEffect(() => {
    loadComments()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [spotId])

  useEffect(() => {
    if (user) checkAlreadyCommented()
  }, [user, comments])

  const checkAlreadyCommented = async () => {
    const exists = comments.some(c => c.user_id === user.id)
    setAlreadyCommented(exists)
  }

  const loadComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(username, avatar_url)')
      .eq('spot_id', spotId)
      .order('created_at', { ascending: false })
    if (data) setComments(data)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rating === 0) { setError('Dai un voto da 1 a 10!'); return }
    setLoading(true)
    setError('')

    const { error } = await supabase.from('comments').insert({
      spot_id: spotId,
      user_id: user.id,
      content,
      rating,
    })

    if (error) {
      setError(error.message)
    } else {
      setContent('')
      setRating(0)
      loadComments()
    }
    setLoading(false)
  }

  return (
    <div className="bg-zinc-900 rounded-2xl p-5">
      <h2 className="text-white font-bold text-lg mb-4">💬 Commenti</h2>

      {/* Form nuovo commento */}
      {user && !alreadyCommented && (
        <form onSubmit={handleSubmit} className="mb-6 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-sm mb-3">Lascia la tua recensione</p>

          <div className="mb-3">
            <p className="text-zinc-400 text-sm mb-2">Voto</p>
            <StarRating value={rating} onChange={setRating} />
            {rating > 0 && <p className="text-yellow-400 text-sm mt-1">{rating}/10</p>}
          </div>

          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-white/20 resize-none text-sm"
            placeholder="Scrivi un commento..."
            rows={3}
            required
          />

          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-3 bg-white text-black font-semibold rounded-lg px-4 py-2 text-sm hover:bg-zinc-200 transition disabled:opacity-50"
          >
            {loading ? 'Invio...' : 'Pubblica'}
          </button>
        </form>
      )}

      {user && alreadyCommented && (
        <div className="mb-6 bg-zinc-800 rounded-xl p-4 text-zinc-400 text-sm">
          ✅ Hai già lasciato una recensione per questo spot.
        </div>
      )}

      {!user && (
        <div className="mb-6 bg-zinc-800 rounded-xl p-4 text-sm">
          <span className="text-zinc-400">Vuoi commentare? </span>
          <a href="/login" className="text-white underline">Accedi</a>
          <span className="text-zinc-400"> o </span>
          <a href="/register" className="text-white underline">registrati</a>
        </div>
      )}

      {/* Lista commenti */}
      {comments.length === 0 ? (
        <p className="text-zinc-500 text-sm">Nessun commento ancora. Sii il primo!</p>
      ) : (
        <div className="flex flex-col gap-4">
          {comments.map(comment => (
            <div key={comment.id} className="border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-white font-bold">
                    {comment.profiles?.username?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-white text-sm font-medium">{comment.profiles?.username}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 font-bold">{comment.rating}/10</span>
                  <span className="text-zinc-500 text-xs">
                    {new Date(comment.created_at).toLocaleDateString('it-IT')}
                  </span>
                </div>
              </div>
              <p className="text-zinc-300 text-sm">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}