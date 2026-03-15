'use client'

import { Bell, Heart, Sparkles, MessageCircle, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

type NotificationType = 'match' | 'message' | 'like' | 'superlike'

interface Notification {
  id: string
  type: NotificationType
  message: string
  user: string
  time: string
  read: boolean
}

export default function LiveNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Simulate WebSocket connection and notifications
  useEffect(() => {
    const connectTimeout = setTimeout(() => {
      setIsConnected(true)
      toast.success('Live notifications connected', {
        description: 'You will now receive real-time updates',
        position: 'top-center',
        style: {
          background: 'var(--romantic-100)',
          borderColor: 'var(--romantic-200)',
          color: 'var(--romantic-800)'
        }
      })
      
      // Initial demo notifications
      setNotifications([
        {
          id: '1',
          type: 'match',
          message: 'You have a new match!',
          user: 'Sarah J.',
          time: '2 min ago',
          read: false
        },
        {
          id: '2',
          type: 'message',
          message: 'New message from Alex',
          user: 'Alex M.',
          time: '15 min ago',
          read: false
        },
        {
          id: '3',
          type: 'like',
          message: 'Someone liked your profile',
          user: 'Anonymous',
          time: '1 hour ago',
          read: true
        }
      ])
      setUnreadCount(2)
    }, 1000)

    // Simulate receiving new notifications
    const notificationInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: ['match', 'message', 'like', 'superlike'][Math.floor(Math.random() * 4)] as NotificationType,
          message: [
            'You have a new match!',
            'New message received',
            'Someone liked your profile',
            'You got a superlike!'
          ][Math.floor(Math.random() * 4)],
          user: ['Sarah', 'Alex', 'Jordan', 'Taylor'][Math.floor(Math.random() * 4)] + ' ' + 
                ['J.', 'M.', 'R.', 'L.'][Math.floor(Math.random() * 4)],
          time: 'Just now',
          read: false
        }

        setNotifications(prev => [newNotification, ...prev])
        setUnreadCount(prev => prev + 1)
        
        // Show toast for important notifications
        if (newNotification.type === 'match' || newNotification.type === 'superlike') {
          toast.info(newNotification.message, {
            description: `From ${newNotification.user}`,
            position: 'top-center',
            action: {
              label: 'View',
              onClick: () => setIsOpen(true)
            },
            style: {
              background: 'var(--romantic-50)',
              borderColor: 'var(--romantic-200)',
              color: 'var(--romantic-800)'
            }
          })
        }
      }
    }, 30000)

    return () => {
      clearTimeout(connectTimeout)
      clearInterval(notificationInterval)
    }
  }, [])

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? {...n, read: true} : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({...n, read: true})))
    setUnreadCount(0)
  }

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'match': return <Heart className="h-5 w-5 text-rose-500 fill-current" />
      case 'message': return <MessageCircle className="h-5 w-5 text-sky-500" />
      case 'like': return <Heart className="h-5 w-5 text-rose-400" />
      case 'superlike': return <Sparkles className="h-5 w-5 text-amber-400" />
      default: return <Bell className="h-5 w-5 text-romantic-500" />
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 10, stiffness: 100 }}
      >
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "relative p-3 rounded-full shadow-lg transition-all",
            "flex items-center justify-center",
            isConnected 
              ? "bg-gradient-to-br from-romantic-500 to-pink-500 hover:from-romantic-600 hover:to-pink-600 text-white"
              : "bg-gray-200 text-gray-500 cursor-not-allowed",
            "ring-2 ring-offset-2 ring-transparent focus-visible:ring-romantic-400"
          )}
          aria-label={isConnected ? "Notifications" : "Connecting..."}
          disabled={!isConnected}
        >
          <Bell className="w-5 h-5" />
          {isConnected && unreadCount > 0 && (
            <motion.span 
              key={`count-${unreadCount}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-rose-500 text-xs font-bold rounded-full"
            >
              {unreadCount}
            </motion.span>
          )}
        </button>
      </motion.div>

      {/* Notification dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute right-0 bottom-full mb-2 w-80 bg-white rounded-xl shadow-xl border border-romantic-200 overflow-hidden"
          >
            <div className="p-4 border-b border-romantic-100 bg-gradient-to-r from-romantic-50 to-pink-50">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-romantic-800">Notifications</h3>
                <button 
                  onClick={markAllAsRead}
                  className="text-sm text-romantic-600 hover:text-romantic-800"
                  disabled={unreadCount === 0}
                >
                  Mark all as read
                </button>
              </div>
              <p className="text-xs text-romantic-500">
                {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                <ul className="divide-y divide-romantic-100">
                  {notifications.map((notification) => (
                    <motion.li
                      key={notification.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className={cn(
                        "p-3 hover:bg-romantic-50 transition-colors cursor-pointer",
                        !notification.read && "bg-romantic-50/50"
                      )}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-romantic-800 truncate">
                            {notification.message}
                          </p>
                          <p className="text-xs text-romantic-600">
                            {notification.user} • {notification.time}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="flex-shrink-0 w-2 h-2 bg-rose-500 rounded-full self-center" />
                        )}
                      </div>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <div className="p-6 text-center">
                  <UserPlus className="h-8 w-8 mx-auto text-romantic-300 mb-2" />
                  <p className="text-sm text-romantic-600">
                    No notifications yet
                  </p>
                  <p className="text-xs text-romantic-400 mt-1">
                    Your activity will appear here
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-romantic-100 bg-romantic-50 text-center">
              <a
                href="/notifications"
                className="text-xs font-medium text-romantic-600 hover:text-romantic-800"
              >
                View all notifications
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}