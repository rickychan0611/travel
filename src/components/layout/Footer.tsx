import Link from 'next/link'
import Image from 'next/image'
import type { Route } from 'next'

const footerColumns = [
  {
    title: '关于途风',
    links: [
      { label: '关于我们', href: '/about' },
      { label: '专业团队', href: '/about' },
      { label: '联系我们', href: '/about' },
      { label: '隐私政策', href: '/about' },
      { label: '新闻中心', href: '/about' },
      { label: '旅游度假资质', href: '/about' },
    ],
  },
  {
    title: '客户服务',
    links: [
      { label: '预订指南', href: '/tours' },
      { label: '服务中心', href: '/about' },
    ],
  },
  {
    title: '预订须知',
    links: [
      { label: '客户协议', href: '/about' },
      { label: '信用卡支付验证书', href: '/about' },
      { label: '取消和修改条例', href: '/about' },
      { label: '全球入境签证信息', href: '/about' },
    ],
  },
  {
    title: '合作加盟',
    links: [{ label: '商务合作', href: '/agent' }],
  },
]

const hotlineRows = [
  ['7x24小时服务热线', '(中国台湾)886-277039159'],
  ['(美国)866-638-6888', '(中国香港)852-30024111'],
  ['(国际)1-626-389-8666', '(中)023-81744260'],
]

const socialIcons = [
  { src: '/tff/work-weixin-logo.png', alt: '企业微信' },
  { src: '/tff/public-weixin-logo.png', alt: '微信' },
  { src: '/tff/link-logo.png', alt: '链接' },
  { src: '/tff/video-weixin-logo.png', alt: '视频号' },
  { src: '/tff/facebook-logo.png', alt: 'Facebook' },
  { src: '/tff/xiaohongshu-logo.png', alt: '小红书' },
  { src: '/tff/ins-logo.png', alt: 'Instagram' },
  { src: '/tff/whatsapp-logo.png', alt: 'WhatsApp' },
]

const legalLinks = [
  { label: 'CST# 2096846-40', href: 'https://cn.toursforfun.com/' },
  { label: '蜀ICP备10200285号-4', href: 'https://beian.miit.gov.cn/' },
  {
    label: '川公网安备51019002004820号',
    href: 'https://www.beian.gov.cn/portal/registerSystemInfo?recordcode=51019002004820',
  },
  { label: '川B2-20150113', href: 'https://cn.toursforfun.com/' },
  { label: '版权信息', href: 'https://cn.toursforfun.com/copy-right.php' },
  { label: '隐私条例', href: 'https://cn.toursforfun.com/privacy-policy.php' },
]

const creditBadges = [
  { src: '/tff/credit-police.webp', alt: '警务备案', href: 'https://jtbchina.com/index.html', width: 33, height: 33 },
  { src: '/tff/credit-regulation.webp', alt: '市场监管', href: 'https://scjgj.sc.gov.cn/', width: 33, height: 31 },
  {
    src: '/tff/credit-site.webp',
    alt: '诚信网站',
    href: 'https://credit.szfw.org/CX20140829005030005116.html',
    width: 83,
    height: 30,
  },
  { src: '/tff/credit-china.webp', alt: '信用中国', href: 'https://www.creditchina.gov.cn/', width: 93, height: 30 },
]

export function Footer({ locale }: { locale: string }) {
  return (
    <footer className="mt-auto bg-[#2d2d2d] text-[#e1e1e1]">
      <div className="mx-auto max-w-[1200px] px-4 pb-10 pt-10">
        <div className="grid gap-8 lg:grid-cols-[470px_335px_280px] lg:items-start">
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4">
            {footerColumns.map((col) => (
              <div key={col.title}>
                <h4 className="mb-5 text-[14px] font-bold leading-5 text-white">{col.title}</h4>
                <ul>
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={`/${locale}${link.href}` as Route}
                        className="text-[12px] leading-[30px] text-[#e1e1e1] hover:underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div>
            <form className="mb-6 flex h-[36px] overflow-hidden rounded border-2 border-[#414141]">
              <input
                aria-label="邮箱地址"
                placeholder="请输入您的邮箱地址"
                className="min-w-0 flex-1 bg-[#2d2d2d] px-3 text-[14px] text-white outline-none placeholder:text-[#8c8c8c]"
              />
              <button
                type="submit"
                className="w-[70px] bg-[#5b5b5b] text-[14px] font-bold text-white transition-colors hover:bg-[#6a6a6a]"
              >
                订阅途风
              </button>
            </form>

            <div className="space-y-1 text-[12px] font-bold leading-[24px] text-white">
              {hotlineRows.map((row) => (
                <div key={row.join()} className="grid grid-cols-2 gap-3">
                  <span>{row[0]}</span>
                  <span>{row[1]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className="flex gap-10">
              <div className="w-[120px] text-center">
                <Image
                  src="/tff/app_ios_android.png"
                  alt="途风APP"
                  width={120}
                  height={120}
                  className="h-[120px] w-[120px] bg-white object-contain"
                />
                <p className="mt-2 text-[12px] font-bold leading-5 text-white">途风APP</p>
              </div>
              <div className="w-[120px] text-center">
                <Image
                  src="/tff/footer-wechat-bouns.png"
                  alt="途风旅游福利官"
                  width={120}
                  height={120}
                  className="h-[120px] w-[120px] bg-white object-contain"
                />
                <p className="mt-2 text-[12px] font-bold leading-5 text-white">
                  添加途风旅游福利官领
                  <br />
                  $200出行大礼包!
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-nowrap items-center justify-end gap-2">
              {socialIcons.map((icon) => (
                <Image
                  key={icon.alt}
                  src={icon.src}
                  alt={icon.alt}
                  width={24}
                  height={24}
                  className="h-6 w-6 shrink-0 object-contain"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-[#464646] pt-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <Image
              src="/tff/footer-logo.png"
              alt="Tours4fun 途风旅游"
              width={160}
              height={60}
              className="h-[60px] w-[160px] shrink-0 object-contain"
            />
            <p className="flex-1 text-[12px] leading-[26px] text-[#777]">
              <span>
                途风（携程旗下）ToursForFun.com不对文字错误引起的不便负任何责任，文字错误都会及时更正。网站内在线旅游产品报价和行程有可能会有更改变动，不做另行通知。
              </span>
              <a href={legalLinks[0].href} className="mx-1 hover:underline">
                {legalLinks[0].label}
              </a>
              <span>成都途风国际旅行社有限公司 | ©2004-2026 ToursForFun.com</span>
              {legalLinks.slice(1).map((link) => (
                <a key={link.label} href={link.href} target="_blank" className="mx-1 hover:underline">
                  {link.label}
                </a>
              ))}
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Image
              src="/tff/footer-slogan.png"
              alt="探索世界不同"
              width={243}
              height={67}
              className="h-auto w-[243px] opacity-40"
            />
            <div className="flex items-center gap-[30px]">
              {creditBadges.map((badge) => (
                <a key={badge.alt} href={badge.href} target="_blank" rel="noreferrer" className="block">
                  <Image
                    src={badge.src}
                    alt={badge.alt}
                    width={badge.width}
                    height={badge.height}
                    className="h-auto w-auto"
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
