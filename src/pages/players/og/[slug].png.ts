import type { APIRoute, GetStaticPaths } from 'astro'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import players from '../../../data/players.json'
import { generatePlayerSlug } from '../../../lib/slug'
import { showPlayerPhoto } from '../../../lib/player-photo'
import { getOgFonts, getOgLogoDataUrl, getOgPlayerPhoto } from '../../../lib/og'

export const getStaticPaths: GetStaticPaths = async () => {
  return players.map((player) => ({
    params: { slug: generatePlayerSlug(player.firstName, player.lastName) },
    props: { player },
  }))
}

type Player = (typeof players)[0]

function playerCard(player: Player, photoDataUrl: string | null, logoDataUrl: string, commitLogoDataUrl: string | null = null) {
  const committedTo = (player as any).committedTo as string | null
  const portrait = Boolean((player as any).ogPhotoUrl)
  const positions = [player.position, ...(player.secondaryPositions || [])].filter(Boolean).join(' / ')
  const height = player.heightInches
    ? `${Math.floor(player.heightInches / 12)}'${player.heightInches % 12}"`
    : null

  return {
    type: 'div',
    props: {
      style: {
        height: '100%',
        width: '100%',
        display: 'flex',
        backgroundColor: '#2C3669',
        padding: portrait ? '50px 60px 50px 50px' : '50px 60px',
      },
      children: [
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
                      width: portrait ? 360 : 280,
                      height: portrait ? 530 : 280,
                      style: {
                        borderRadius: portrait ? '20px' : '50%',
                        border: '4px solid #FFFFFF',
                        objectFit: 'cover',
                      },
                    },
                  },
                ],
              },
            }
          : null,
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
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 30,
                    fontWeight: 700,
                    color: '#EEF2FA',
                    marginBottom: '8px',
                  },
                  children: [positions, height].filter(Boolean).join(' • '),
                },
              },
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
              committedTo
                ? {
                    type: 'div',
                    props: {
                      style: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' },
                      children: [
                        commitLogoDataUrl
                          ? {
                              type: 'div',
                              props: {
                                style: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '84px', height: '84px', borderRadius: '50%', backgroundColor: 'white', padding: '10px' },
                                children: [{ type: 'img', props: { src: commitLogoDataUrl, width: 64, height: 64, style: { objectFit: 'contain' } } }],
                              },
                            }
                          : null,
                        {
                          type: 'div',
                          props: {
                            style: { display: 'flex', flexDirection: 'column' },
                            children: [
                              { type: 'div', props: { style: { fontSize: 22, fontWeight: 700, color: '#DE5E2F', letterSpacing: '2px' }, children: 'COMMITTED TO' } },
                              { type: 'div', props: { style: { fontSize: 38, fontWeight: 700, color: 'white', lineHeight: 1.1 }, children: committedTo.replace(/ University$/, '') } },
                            ],
                          },
                        },
                      ].filter(Boolean),
                    },
                  }
                : null,
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
                        children: 'Top Gun National Walker',
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
  }
}

export const GET: APIRoute = async ({ props }) => {
  const player = props.player as Player
  const fonts = getOgFonts()
  const logoDataUrl = await getOgLogoDataUrl()
  const ogPhotoUrl = (player as any).ogPhotoUrl as string | undefined
  let photoDataUrl = ogPhotoUrl
    ? await getOgPlayerPhoto(ogPhotoUrl, 360, 530)
    : showPlayerPhoto(player) ? await getOgPlayerPhoto(player.photoUrl) : null
  const commitLogoUrl = (player as any).committedTo ? ((player as any).committedLogoUrl as string | null) : null
  const commitLogoDataUrl = commitLogoUrl ? await getOgPlayerPhoto(commitLogoUrl.replace('w_160', 'w_200'), 128, 128) : null

  const satoriOptions = {
    width: 1200,
    height: 630,
    fonts,
  }

  let svg: string
  try {
    svg = await satori(playerCard(player, photoDataUrl, logoDataUrl, commitLogoDataUrl), satoriOptions)
  } catch (err) {
    if (!photoDataUrl) throw err
    svg = await satori(playerCard(player, null, logoDataUrl, commitLogoDataUrl), satoriOptions)
  }

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
