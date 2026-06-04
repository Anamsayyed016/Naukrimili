/** Browser tab favicon only — do not use for navbar/footer branding */
const FAVICON_TAB_ICON_PATH = 'v1780573737/nmlogo1_eeen17.jpg';

export function faviconTabIconUrl(size: number) {
  return `https://res.cloudinary.com/drot7xb9m/image/upload/q_auto,f_auto,w_${size},h_${size},c_fit/${FAVICON_TAB_ICON_PATH}`;
}

export const size = {
  width: 48,
  height: 48,
};

export const contentType = 'image/jpeg';

export default async function Icon() {
  const src = faviconTabIconUrl(48);
  const res = await fetch(src, { next: { revalidate: 86400 } });
  if (!res.ok) {
    return new Response(null, { status: 502 });
  }
  const bytes = await res.arrayBuffer();
  return new Response(bytes, {
    headers: {
      'Content-Type': res.headers.get('content-type') ?? 'image/jpeg',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  });
}
