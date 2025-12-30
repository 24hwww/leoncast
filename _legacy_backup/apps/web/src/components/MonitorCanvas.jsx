import React, { useEffect, useRef, useState } from 'react';
import { Monitor, WifiOff, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function MonitorCanvas({ channelId, className }) {
    const canvasRef = useRef(null);
    const [status, setStatus] = useState('connecting'); // connecting, streaming, error, closed
    const [fps, setFps] = useState(0);
    const frameCount = useRef(0);
    const lastFpsUpdate = useRef(Date.now());

    useEffect(() => {
        if (!channelId) return;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${protocol}//${window.location.host}/ws/monitor?channelId=${channelId}`);
        ws.binaryType = 'arraybuffer';

        let currentUrl = null;

        ws.onopen = () => {
            setStatus('streaming');
        };

        ws.onmessage = (event) => {
            const blob = new Blob([event.data], { type: 'image/jpeg' });
            const url = URL.createObjectURL(blob);

            const img = new Image();
            img.onload = () => {
                const canvas = canvasRef.current;
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                }
                if (currentUrl) URL.revokeObjectURL(currentUrl);
                currentUrl = url;

                // Track FPS
                frameCount.current++;
                const now = Date.now();
                if (now - lastFpsUpdate.current > 1000) {
                    setFps(Math.round((frameCount.current * 1000) / (now - lastFpsUpdate.current)));
                    frameCount.current = 0;
                    lastFpsUpdate.current = now;
                }
            };
            img.src = url;
        };

        ws.onclose = () => {
            setStatus('closed');
            if (currentUrl) URL.revokeObjectURL(currentUrl);
        };

        ws.onerror = () => {
            setStatus('error');
        };

        return () => {
            ws.close();
            if (currentUrl) URL.revokeObjectURL(currentUrl);
        };
    }, [channelId]);

    return (
        <div className={cn("relative group overflow-hidden bg-neutral-900 rounded-lg border border-neutral-800 aspect-video flex items-center justify-center", className)}>
            <canvas
                ref={canvasRef}
                className={cn(
                    "w-full h-full object-contain transition-opacity duration-300",
                    status === 'streaming' ? "opacity-100" : "opacity-0"
                )}
            />

            {/* Overlays */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {status === 'connecting' && (
                    <div className="flex flex-col items-center gap-2 text-neutral-400">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="text-xs font-medium uppercase tracking-widest">Iniciando Monitor...</span>
                    </div>
                )}

                {status === 'closed' && (
                    <div className="flex flex-col items-center gap-2 text-neutral-500">
                        <Monitor className="h-8 w-8 opacity-20" />
                        <span className="text-xs font-medium uppercase">Monitor Detenido</span>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center gap-2 text-red-400">
                        <WifiOff className="h-8 w-8" />
                        <span className="text-xs font-medium uppercase">Error de Conexión</span>
                    </div>
                )}
            </div>

            {/* Stats Overlay */}
            {status === 'streaming' && (
                <div className="absolute top-2 left-2 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span>LIVE PREVIEW</span>
                    <span className="text-white/40">|</span>
                    <span>{fps} FPS</span>
                </div>
            )}
        </div>
    );
}
