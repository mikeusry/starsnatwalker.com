import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const FONT_FILES = {
  400: 'inter-latin-400-normal.woff',
  700: 'inter-latin-700-normal.woff',
} as const

type FontWeight = keyof typeof FONT_FILES

export type OgFont = {
  name: 'Inter'
  data: ArrayBuffer
  weight: FontWeight
  style: 'normal'
}

const FONT_MAGICS = [
  // wOFF / wOF2
  [0x77, 0x4f, 0x46, 0x46],
  [0x77, 0x4f, 0x46, 0x32],
  // OTTO, TrueType, `true`
  [0x4f, 0x54, 0x54, 0x4f],
  [0x00, 0x01, 0x00, 0x00],
  [0x74, 0x72, 0x75, 0x65],
] as const

const IMAGE_MAGICS = [
  [0xff, 0xd8, 0xff], // JPEG
  [0x89, 0x50, 0x4e, 0x47], // PNG
  [0x47, 0x49, 0x46, 0x38], // GIF
  [0x52, 0x49, 0x46, 0x46], // RIFF / WebP
] as const

const PHOTO_FETCH_MS = 8_000

let cachedFonts: OgFont[] | null = null
let cachedLogo: string | null = null

function startsWith(bytes: Uint8Array, magic: readonly number[]): boolean {
  if (bytes.length < magic.length) return false
  return magic.every((value, i) => bytes[i] === value)
}

function hexMagic(bytes: Uint8Array): string {
  return Array.from(bytes.subarray(0, 4))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function isFontBytes(bytes: Uint8Array): boolean {
  return FONT_MAGICS.some((magic) => startsWith(bytes, magic))
}

function isImageBytes(bytes: Uint8Array): boolean {
  return IMAGE_MAGICS.some((magic) => startsWith(bytes, magic))
}

/**
 * Copy the Buffer's exact byte range into a new ArrayBuffer.
 * Never return `buf.buffer`: on Node 24 Buffer.poolSize is 64 KiB, so
 * `.buffer` is the shared slab. A later JPEG photo allocation can sit at
 * offset 0 of that slab — satori then sees FFD8FFE0 and throws
 * "Unsupported OpenType signature".
 */
function exclusiveArrayBuffer(buf: Buffer): ArrayBuffer {
  const copy = new Uint8Array(buf.byteLength)
  copy.set(buf)
  return copy.buffer.slice(copy.byteOffset, copy.byteOffset + copy.byteLength)
}

function resolveFontFile(filename: string): string {
  const candidates = [
    join(process.cwd(), 'src/fonts', filename),
    join(dirname(fileURLToPath(import.meta.url)), '../fonts', filename),
  ]
  const found = candidates.find((path) => existsSync(path))
  if (!found) {
    throw new Error(`OG font missing: ${filename} (cwd=${process.cwd()})`)
  }
  return found
}

function loadFont(weight: FontWeight): OgFont {
  const filename = FONT_FILES[weight]
  const buf = readFileSync(resolveFontFile(filename))
  const bytes = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
  if (!isFontBytes(bytes)) {
    throw new Error(
      `OG font ${filename} is not a font (magic=${hexMagic(bytes)}); refusing to pass it to satori`
    )
  }
  return {
    name: 'Inter',
    data: exclusiveArrayBuffer(buf),
    weight,
    style: 'normal',
  }
}

export function getOgFonts(): OgFont[] {
  if (!cachedFonts) {
    cachedFonts = [loadFont(700), loadFont(400)]
  }
  return cachedFonts
}

export async function getOgLogoDataUrl(): Promise<string> {
  if (cachedLogo) return cachedLogo
  const logoPath = join(process.cwd(), 'public/star-white.png')
  const png = await sharp(logoPath).png().toBuffer()
  cachedLogo = `data:image/png;base64,${png.toString('base64')}`
  return cachedLogo
}

async function readPhotoBuffer(photoUrl: string): Promise<Buffer | null> {
  if (photoUrl.startsWith('/')) {
    const path = join(process.cwd(), 'public', photoUrl)
    if (!existsSync(path)) return null
    return readFileSync(path)
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PHOTO_FETCH_MS)
  try {
    const res = await fetch(photoUrl, { signal: controller.signal })
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Player photo as a PNG data URL, or null so the card renders without a face.
 * A bad fetch / non-image body / sharp failure must not fail the build.
 */
export async function getOgPlayerPhoto(photoUrl: string | null | undefined, width = 300, height = 300): Promise<string | null> {
  if (!photoUrl) return null
  try {
    const buffer = await readPhotoBuffer(photoUrl)
    if (!buffer || !isImageBytes(buffer)) return null
    const png = await sharp(buffer).resize(width, height, { fit: 'cover', position: width === height ? 'centre' : 'north' }).png().toBuffer()
    return `data:image/png;base64,${png.toString('base64')}`
  } catch {
    return null
  }
}
