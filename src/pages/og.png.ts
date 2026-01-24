import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import team from '../data/team.json';

export const GET: APIRoute = async () => {
  // Load Inter font
  const interBold = readFileSync(
    join(process.cwd(), 'node_modules/@fontsource/inter/files/inter-latin-700-normal.woff')
  ).buffer;

  // Convert webp logo to PNG base64 for satori compatibility
  const logoPath = join(process.cwd(), 'public/logo.webp');
  const logoPngBuffer = await sharp(logoPath).png().toBuffer();
  const logoDataUrl = `data:image/png;base64,${logoPngBuffer.toString('base64')}`;

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
          backgroundColor: '#062a4b',
          padding: '40px',
        },
        children: [
          {
            type: 'img',
            props: {
              src: logoDataUrl,
              width: 400,
              height: 138,
              style: {
                marginBottom: '40px',
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
                fontSize: 36,
                fontWeight: 700,
                color: '#c0c0c0',
                textAlign: 'center',
              },
              children: `${team.division} • ${team.location}`,
            },
          },
        ],
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
          style: 'normal',
        },
      ],
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
