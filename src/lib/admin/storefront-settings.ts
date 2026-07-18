import { promises as fs } from 'fs'
import path from 'path'

type StorefrontSettings = {
  ssrEnabled: boolean
}

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'admin-settings.json')

const defaults: StorefrontSettings = {
  ssrEnabled: process.env.NODE_ENV === 'development',
}

export async function getStorefrontSettings(): Promise<StorefrontSettings> {
  try {
    const parsed = JSON.parse(await fs.readFile(SETTINGS_PATH, 'utf8')) as Partial<StorefrontSettings>
    return {
      ssrEnabled: typeof parsed.ssrEnabled === 'boolean' ? parsed.ssrEnabled : defaults.ssrEnabled,
    }
  } catch {
    return defaults
  }
}

export async function isStorefrontSsrEnabled() {
  return (await getStorefrontSettings()).ssrEnabled
}

export async function setStorefrontSsrEnabled(ssrEnabled: boolean) {
  await fs.mkdir(path.dirname(SETTINGS_PATH), { recursive: true })
  const settings: StorefrontSettings = { ssrEnabled }
  await fs.writeFile(SETTINGS_PATH, `${JSON.stringify(settings, null, 2)}\n`, 'utf8')
  return settings
}
