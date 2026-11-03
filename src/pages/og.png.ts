import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import team from '../data/team.json';
import { getOgFonts, getOgLogoDataUrl } from '../lib/og';

export const GET: APIRoute = async () => {
  const fonts = getOgFonts();
  const logoDataUrl = await getOgLogoDataUrl();

  // The top achievement doubles as the share-card headline. Keeping it derived
  // from team.json means the card follows the roster's best current credential.
  const headlineAchievement = team.achievements?.[0] ?? null;

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#2C3669',
          padding: '40px',
        },
        children: [
          {
            type: 'img',
            props: {
              src: logoDataUrl,
              width: 110,
              height: 110,
              style: {
                marginBottom: '28px',
                objectFit: 'contain',
              },
            },
          },
          {
            type: 'div',
            props: {
              style: {
                fontSize: 64,
                fontWeight: 700,
                color: 'white',
                textAlign: 'center',
                marginBottom: '10px',
              },
              children: team.name,
            },
          },
          {
            type: 'div',
            props: {
              style: {
                fontSize: 32,
                fontWeight: 700,
                color: '#D9DEE8',
                textAlign: 'center',
                marginBottom: headlineAchievement ? '28px' : '0px',
              },
              children: `${team.division} • ${team.location} • Formerly Stars National Walker`,
            },
          },
          ...(headlineAchievement
            ? [
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      backgroundColor: '#FFFFFF',
                      color: '#2C3669',
                      fontSize: 30,
                      fontWeight: 700,
                      textAlign: 'center',
                      padding: '14px 32px',
                      borderRadius: '999px',
                    },
                    children: headlineAchievement,
                  },
                },
              ]
            : []),
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts,
    }
  );

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 1200,
    },
  });

  const pngBuffer = resvg.render().asPng();

  return new Response(pngBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
