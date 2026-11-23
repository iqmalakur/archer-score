'use client'

import { useEffect } from 'react'

export default function SwRegister() {
    useEffect(() => {
        if (process.env.NODE_ENV !== 'production') return;
        if (!('serviceWorker' in navigator)) return;

        navigator.serviceWorker
            .register('/sw.js', { scope: '/', updateViaCache: 'none' })
            .then((reg) => console.log('SW registered with scope: ', reg.scope))
            .catch((err) => console.error('SW failed to register: ', err));
    }, []);

    return null;
}