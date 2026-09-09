import React from 'react'
import { MessageSquare } from 'lucide-react'
import { PageHeader, EmptyState } from '@/components/ui'

const messages = [
  { id: '1', sender: 'Fatuma N.', channel: 'WhatsApp', body: 'Hi, do you have Velvet Oud in 100ml?', time: '10 min ago', unread: true },
  { id: '2', sender: 'Brian K.', channel: 'Contact Form', body: 'I placed an order yesterday but haven\'t received a confirmation.', time: '1 hour ago', unread: true },
  { id: '3', sender: 'Aisha M.', channel: 'Contact Form', body: 'Do you offer gift wrapping for the gift sets?', time: '3 hours ago', unread: false },
]

export default function MessagesPage() {
  return (
    <div className="space-y-5 fade-in">
      <PageHeader title="Messages" subtitle="Customer inquiries and messages" />
      <div className="bg-white border border-sand rounded-[14px] overflow-hidden">
        {messages.length === 0 ? (
          <EmptyState icon={<MessageSquare size={22} />} title="No messages yet" description="Customer inquiries will appear here." />
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={['flex items-start gap-4 px-5 py-4 border-b border-sand last:border-0', msg.unread ? 'bg-blue-light/30' : ''].join(' ')}>
              <div className="w-9 h-9 rounded-full bg-sand flex items-center justify-center font-serif font-semibold text-ink shrink-0">
                {msg.sender[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[13.5px] font-semibold text-ink">{msg.sender}</p>
                  <span className="text-[11px] text-slate bg-sand px-2 py-0.5 rounded-full">{msg.channel}</span>
                  {msg.unread && <span className="w-2 h-2 bg-blue rounded-full shrink-0" />}
                </div>
                <p className="text-[13px] text-slate truncate">{msg.body}</p>
              </div>
              <p className="text-[11.5px] text-slate shrink-0">{msg.time}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
