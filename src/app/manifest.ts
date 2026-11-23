import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Manah',
        description: "Lacak dan hitung skor latihan panahan Anda dengan mudah — rambahan, skor target, dan status kelulusan.",
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#101c17',
        theme_color: '#101c17',
        icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ]
    }
}
