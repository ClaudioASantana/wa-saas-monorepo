import { io, Socket } from 'socket.io-client'

export const useWebSocket = () => {
  const socket = ref<Socket | null>(null)
  const isConnected = ref(false)
  const config = useRuntimeConfig()
  const user = useSupabaseUser()
  const client = useSupabaseClient()

  const connect = async () => {
    if (socket.value?.connected) return

    // Get the current session token from Supabase
    const { data: { session } } = await client.auth.getSession()
    const token = session?.access_token

    if (!token) {
      console.warn('[WebSocket] No session token found, skipping connection')
      return
    }

    // Connect to the same host as the API
    // In Nuxt 3, if server and client run on the same port, we can omit the URL
    const socketUrl = config.public.apiUrl || window.location.origin
    
    console.log('[WebSocket] Connecting to:', socketUrl)

    socket.value = io(socketUrl, {
      auth: { token },
      transports: ['websocket'], // Prefer WebSockets
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socket.value.on('connect', () => {
      isConnected.value = true
      console.info('[WebSocket] Connected with ID:', socket.value?.id)
    })

    socket.value.on('disconnect', (reason) => {
      isConnected.value = false
      console.warn('[WebSocket] Disconnected:', reason)
    })

    socket.value.on('connect_error', (err) => {
      console.error('[WebSocket] Connection Error:', err.message)
    })

    socket.value.on('connection:ack', (data) => {
      console.log('[WebSocket] ACK received:', data)
    })
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
    }
  }

  const onEvent = (event: string, callback: (data: any) => void) => {
    if (!socket.value) return
    socket.value.on(event, callback)
  }

  const offEvent = (event: string) => {
    if (!socket.value) return
    socket.value.off(event)
  }

  // Auto-connect on mount if user exists
  onMounted(() => {
    if (user.value) {
      connect()
    }
  })

  // Watch user changes to handle login/logout
  watch(user, (newUser) => {
    if (newUser) {
      connect()
    } else {
      disconnect()
    }
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    socket,
    isConnected,
    connect,
    disconnect,
    onEvent,
    offEvent
  }
}
