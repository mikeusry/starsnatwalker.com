import type { APIRoute, GetStaticPaths } from 'astro'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import sharp from 'sharp'
import players from '../../../data/players.json'
import { generatePlayerSlug } from '../../../lib/slug'

export const getStaticPaths: GetStaticPaths = async () => {
  return players.map((player) => ({
    params: { slug: generatePlayerSlug(player.firstName, player.lastName) },
    props: { player },
  }))
}

export const GET: APIRoute = async ({ props }) => {
  const player = props.player as (typeof players)[0]

  const interBold = readFileSync(
    join(process.cwd(), 'node_modules/@fontsource/inter/files/inter-latin-700-normal.woff')
  ).buffer

  const interRegular = readFileSync(
    join(process.cwd(), 'node_modules/@fontsource/inter/files/inter-latin-400-normal.woff')
  ).buffer

  // Convert logo to PNG for satori
  const logoPath = join(process.cwd(), 'public/logo.webp')
  const logoPngBuffer = await sharp(logoPath).png().toBuffer()
  const logoDataUrl = `data:image/png;base64,${logoPngBuffer.toString('base64')}`

  // Fetch and convert player photo to base64
  let photoDataUrl: string | null = null
  if (player.photoUrl) {
    try {
      const res = await fetch(player.photoUrl)
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer())
        // Convert to PNG via sharp for consistency
        const pngBuffer = await sharp(buffer).resize(300, 300, { fit: 'cover' }).png().toBuffer()
        photoDataUrl = `data:image/png;base64,${pngBuffer.toString('base64')}`
      }
    } catch {
      // Fall through — no photo
    }
  }

  const positions = [player.position, ...(player.secondaryPositions || [])].filter(Boolean).join(' / ')
  const height = player.heightInches
    ? `${Math.floor(player.heightInches / 12)}'${player.heightInches % 12}"`
    : null

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          height: '100%',
          width: '100%',
          display: 'flex',
          backgroundColor: '#062a4b',
          padding: '50px 60px',
        },
        children: [
          // Left: Player photo
          photoDataUrl
            ? {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '50px',
                    flexShrink: 0,
                  },
                  children: [
                    {
                      type: 'img',
                      props: {
                        src: photoDataUrl,
                        width: 280,
                        height: 280,
                        style: {
                          borderRadius: '50%',
                          border: '4px solid #FFD700',
                          objectFit: 'cover',
                        },
                      },
                    },
                  ],
                },
              }
            : null,
          // Right: Text content
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                flex: 1,
              },
              children: [
                // Player name
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 56,
                      fontWeight: 700,
                      color: 'white',
                      lineHeight: 1.1,
                      marginBottom: '12px',
                    },
                    children: `${player.firstName} ${player.lastName}`,
                  },
                },
                // Position + height
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 30,
                      fontWeight: 700,
                      color: '#FFD700',
                      marginBottom: '8px',
                    },
                    children: [positions, height].filter(Boolean).join(' • '),
                  },
                },
                // Class year + handedness
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 26,
                      fontWeight: 400,
                      color: '#c0c0c0',
                      marginBottom: '24px',
                    },
                    children: `Class of ${player.gradYear}${player.bats && player.throws ? ` • ${player.bats}/${player.throws}` : ''}`,
                  },
                },
                // Team branding
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    },
                    children: [
                      {
                        type: 'img',
                        props: {
                          src: logoDataUrl,
                          width: 50,
                          height: 50,
                          style: { objectFit: 'contain' },
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: 22,
                            fontWeight: 700,
                            color: 'rgba(255,255,255,0.6)',
                          },
                          children: 'Stars National Walker',
                        },
                      },
                    ],
                  },
                },
              ].filter(Boolean),
            },
          },
        ].filter(Boolean),
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: interBold,
          weight: 700,
          style: 'normal' as const,
        },
        {
          name: 'Inter',
          data: interRegular,
          weight: 400,
          style: 'normal' as const,
        },
      ],
    }
  )

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  })

  const pngBuffer = resvg.render().asPng()

  return new Response(pngBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
