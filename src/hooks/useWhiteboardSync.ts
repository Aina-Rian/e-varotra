// hooks/useWhiteboardSync.ts
import { useEffect } from 'react'
import { Editor } from 'tldraw'
import { supabase } from '../lib/supabase'

export function useWhiteboardSync(sessionId: string | undefined, editor: Editor | null) {
  useEffect(() => {
    if (!editor || !sessionId) return

    // Chargement initial du tableau
    const loadInitial = async () => {
      const { data, error } = await supabase
        .from('whiteboards')
        .select('data')
        .eq('session_id', sessionId)
        .single()

      if (data?.data && !error) {
        editor.store.loadSnapshot(data.data)
      }
    }

    loadInitial()
  }, [editor, sessionId])

  useEffect(() => {
    if (!editor || !sessionId) return

    // Écoute des mises à jour depuis Supabase
    const channel = supabase
      .channel(`whiteboard-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whiteboards',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.new?.data) {
            // ⚠️ Ne pas écraser l'état local
            editor.store.mergeRemoteChanges(payload.new.data)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [editor, sessionId])

  useEffect(() => {
    if (!editor || !sessionId) return

    let timeout: ReturnType<typeof setTimeout> | null = null

    // Envoie les changements avec un petit debounce
    const cleanup = editor.store.listen(() => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(async () => {
        const snapshot = editor.store.getSnapshot()
        await supabase
          .from('whiteboards')
          .update({
            data: snapshot,
            updated_at: new Date().toISOString(),
          })
          .eq('session_id', sessionId)
      }, 800)
    })

    return () => {
      cleanup()
      if (timeout) clearTimeout(timeout)
    }
  }, [editor, sessionId])
}
