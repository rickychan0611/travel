'use client'

import { useState } from 'react'
import Image from 'next/image'
import { PHONE_LINES } from '@/data/home-mock'

const ITEMS = [
  { id: 'app', icon: '/tff/vertical-bar-app.png', label: 'APP' },
  { id: 'mini', icon: '/tff/vertical-bar-mini.png', label: '小程序' },
  { id: 'phone', icon: '/tff/vertical-bar-phone.png', label: '电话' },
  { id: 'consult', icon: '/tff/vertical-bar-consult.png', label: '咨询' },
  { id: 'wechat', icon: '/tff/vertical-bar-wechat.png', label: '微信' },
  { id: 'whatsapp', icon: '/tff/vertical-bar-whatsapp.png', label: 'WhatsApp' },
  { id: 'line', icon: '/tff/sidebar-link.png', label: 'Line' },
  { id: 'feedback', icon: '/tff/vertical-bar-feedback.png', label: '反馈' },
] as const

export function FloatingSidebar() {
  const [active, setActive] = useState<string | null>(null)
  const [hidden, setHidden] = useState(true)

  if (hidden) {
    return (
      <button
        type="button"
        className="fixed right-0 top-1/2 z-[100] hidden h-16 w-6 -translate-y-1/2 items-center justify-center rounded-l-md bg-[#252525] text-sm font-bold text-white shadow-lg transition hover:bg-tff-blue lg:flex"
        onClick={() => setHidden(false)}
        aria-label="Show sidebar"
      >
        {'<'}
      </button>
    )
  }

  return (
    <aside className="fixed right-0 top-1/2 z-[100] hidden -translate-y-1/2 lg:block">
      <div className="flex w-11 flex-col overflow-hidden rounded-l-md bg-[#252525] shadow-lg">
        <button
          type="button"
          className="flex h-8 w-11 items-center justify-center border-b border-white/10 text-sm font-bold text-white hover:bg-tff-blue"
          onClick={() => {
            setActive(null)
            setHidden(true)
          }}
          aria-label="Hide sidebar"
        >
          {'>'}
        </button>
        {ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="relative flex h-11 w-11 items-center justify-center border-b border-white/10 hover:bg-tff-blue"
            onMouseEnter={() => setActive(item.id)}
            onMouseLeave={() => setActive(null)}
            aria-label={item.label}
          >
            <Image src={item.icon} alt="" width={22} height={22} className="h-5 w-5 object-contain" />
            {active === item.id ? (
              <div className="absolute right-full top-1/2 mr-2 w-max -translate-y-1/2 rounded bg-white px-3 py-2 text-left text-sm text-[#303133] shadow-lg">
                {item.id === 'phone' ? (
                  <ul className="space-y-1">
                    {PHONE_LINES.map((p) => (
                      <li key={p.region}>
                        <span className="font-medium">{p.region}</span> {p.number}
                      </li>
                    ))}
                  </ul>
                ) : item.id === 'wechat' || item.id === 'app' || item.id === 'mini' ? (
                  <div className="flex flex-col items-center gap-1">
                    <Image
                      src={item.id === 'wechat' ? '/tff/public-weixin-qr-code.jpeg' : '/tff/app_ios_android.png'}
                      alt=""
                      width={96}
                      height={96}
                      className="h-24 w-24 object-contain"
                    />
                    <span>{item.label}</span>
                  </div>
                ) : (
                  <span>{item.label}</span>
                )}
              </div>
            ) : null}
          </button>
        ))}
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center hover:bg-tff-blue"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="回到顶部"
        >
          <Image src="/tff/vertical-bar-top.png" alt="" width={22} height={22} className="h-5 w-5 object-contain" />
        </button>
      </div>
    </aside>
  )
}
