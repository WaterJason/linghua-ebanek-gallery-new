import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '聆华ERP',
    short_name: '聆华ERP',
    description: '聆华掐丝珐琅馆管理系统',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#007aff',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    orientation: 'portrait',
    prefer_related_applications: false,
  }
}
