'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Route } from 'next'
import { FOOTER_COLUMNS, PHONE_LINES } from '@/data/home-mock'

export function Footer({ locale }: { locale: string }) {
  return (
    <footer className="mt-auto bg-tff-dark text-[#c0c4cc]">
      <div className="mx-auto max-w-[1200px] px-4 py-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="space-y-3">
              <h4 className="text-sm font-semibold text-white">{col.title}</h4>
              <ul className="space-y-2 text-sm">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={`/${locale}${link.href}` as Route}
                      className="hover:text-tff-blue transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="col-span-2 space-y-3 md:col-span-1">
            <h4 className="text-sm font-semibold text-white">订阅途风</h4>
            <p className="text-sm leading-relaxed">获取最新特惠与目的地资讯</p>
            <div className="space-y-1 text-sm">
              {PHONE_LINES.map((p) => (
                <p key={p.region}>
                  <span className="text-white">{p.region}</span> {p.number}
                </p>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <Image src="/tff/app_ios_android.png" alt="App" width={80} height={80} className="h-16 w-16 rounded bg-white object-contain p-1" />
              <Image src="/tff/footer-wechat-bouns.png" alt="WeChat" width={80} height={80} className="h-16 w-16 rounded bg-white object-contain p-1" />
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {[
                '/tff/public-weixin-logo.png',
                '/tff/xiaohongshu-logo.png',
                '/tff/ins-logo.png',
                '/tff/facebook-logo.png',
                '/tff/whatsapp-logo.png',
                '/tff/link-logo.png',
              ].map((src) => (
                <Image key={src} src={src} alt="" width={22} height={22} className="h-5 w-5 opacity-80" />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 border-t border-white/10 pt-6 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Image src="/tff/footer-logo.png" alt="途风" width={100} height={28} className="h-7 w-auto" />
            <Image src="/tff/footer-slogan.png" alt="" width={160} height={24} className="h-6 w-auto opacity-90" />
          </div>
          <p className="text-sm">
            旅行团优惠低至 <span className="text-tff-orange font-bold">75折</span>
          </p>
          <p className="text-sm text-[#909399]">
            © {new Date().getFullYear()} ToursForFun / 途风. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
