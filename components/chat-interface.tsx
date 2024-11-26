'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Plus, MessageSquare } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  sender: string;
  content: string;
  created_at: string;
}

interface ChatSession {
  chat_id: number;
  name: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentChatId, setCurrentChatId] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchChatSessions()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchChatSessions = async () => {
    try {
      const response = await fetch('https://quang1709.ddns.net/chat-session')
      const data = await response.json()
      setChatSessions(data)
    } catch (error) {
      console.error('Error fetching chat sessions:', error)
    }
  }

  const fetchMessages = async (chatId: number) => {
    try {
      const response = await fetch(`https://quang1709.ddns.net/message?chat_id=${chatId}`)
      const data = await response.json()
      setMessages(data.reverse())  // Đảm bảo tin nhắn hiển thị từ cũ đến mới
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleSend = async () => {
    if (input.trim()) {
      try {
        const response = await fetch('https://quang1709.ddns.net/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: currentChatId,
            message: input,
          }),
        })
        const data = await response.json()
        if (data.chat_id) {
          setCurrentChatId(data.chat_id)
          setMessages((prevMessages) => [...prevMessages, { sender: 'User', content: input, created_at: new Date().toISOString() }])
          setMessages((prevMessages) => [...prevMessages, { sender: 'Bot', content: data.response, created_at: new Date().toISOString() }])
          await fetchChatSessions()
          scrollToBottom()
        }
      } catch (error) {
        console.error('Error sending message:', error)
      }
      setInput('')
    }
  }

  const startNewChat = async () => {
    setCurrentChatId(null)
    setMessages([])
    setInput('')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-4">
        <Button variant="outline" className="w-full justify-start text-white mb-4" onClick={startNewChat}>
          <Plus className="mr-2 h-4 w-4" />
          New chat
        </Button>
        <ScrollArea className="h-[calc(100vh-80px)]">
          {chatSessions.map((session) => (
            <Button
              key={session.chat_id}
              variant="ghost"
              className={`w-full justify-start text-white mb-2 ${currentChatId === session.chat_id ? 'font-bold' : ''}`}
              onClick={() => {
                setCurrentChatId(session.chat_id)
                fetchMessages(session.chat_id)
              }}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              {session.name}
            </Button>
          ))}
        </ScrollArea>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow p-4">
          <h1 className="text-xl font-semibold">MathGPT</h1>
        </header>

        <ScrollArea className="flex-1 p-4">
          <div className="flex flex-col space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex items-start ${message.sender === 'User' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-lg p-3 max-w-3/4 ${
                  message.sender === 'User' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}>
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 bg-white">
          <div className="flex items-center">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Nhập tin nhắn của bạn..."
              className="flex-1 mr-2"
            />
            <Button onClick={handleSend}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
