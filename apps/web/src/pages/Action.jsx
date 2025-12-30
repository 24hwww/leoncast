import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
    Wifi,
    WifiOff,
    Smartphone,
    Settings,
    Zap,
    Gamepad2,
    Activity,
    ChevronRight,
    ShieldCheck,
    Cast
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'
import { toast } from 'sonner'
import axios from 'axios'

export default function Action() {
    const { scenarioId } = useParams()
    const [connected, setConnected] = useState(false)
    const [socket, setSocket] = useState(null)
    const [lastAction, setLastAction] = useState(null)
    const [scenario, setScenario] = useState(null)

    useEffect(() => {
        const fetchScenario = async () => {
            try {
                const res = await axios.get(`/api/scenarios/${scenarioId}`)
                setScenario(res.data)
            } catch (err) {
                console.error('Failed to fetch scenario:', err)
                toast.error('Error al cargar detalles del escenario')
            }
        }
        fetchScenario()
    }, [scenarioId])

    useEffect(() => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const ws = new WebSocket(`${protocol}//${window.location.host}/ws?scenarioId=${scenarioId}`)

        ws.onopen = () => {
            setConnected(true)
            toast.success('Conectado al sistema de control')
        }
        ws.onclose = () => {
            setConnected(false)
            toast.error('Conexión perdida con el servidor')
        }
        ws.onerror = () => {
            setConnected(false)
            toast.error('Error de conexión WebSocket')
        }

        setSocket(ws)

        return () => ws.close()
    }, [scenarioId])

    const sendAction = (type, data = {}) => {
        if (!socket || !connected) {
            toast.error('No hay conexión activa')
            return
        }

        const payload = { type, scenarioId, ...data }
        socket.send(JSON.stringify(payload))
        setLastAction(type)
        toast.info(`Acción enviada: ${type}`, { duration: 2000 })

        if (window.navigator.vibrate) {
            window.navigator.vibrate(20)
        }

        setTimeout(() => setLastAction(null), 500)
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 flex flex-col items-center justify-center font-sans overflow-hidden">
            {/* Background Decor */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_70%)] pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            <div className="w-full max-w-sm space-y-8 relative z-10">
                {/* Header Profile */}
                <div className="flex flex-col items-center text-center space-y-4">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-4 bg-primary/10 rounded-3xl border border-primary/20 shadow-[0_0_30px_rgba(59,130,246,0.15)]"
                    >
                        <Smartphone className="h-10 w-10 text-primary" />
                    </motion.div>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-extrabold tracking-tight">Acción Remota</h1>
                        <p className="text-neutral-400 font-medium">Escenario: <span className="text-primary">{scenario?.name || scenarioId}</span></p>
                    </div>

                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-500",
                        connected
                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                    )}>
                        {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                        {connected ? 'Conectado al Servidor' : 'Sin Conexión'}
                    </div>
                </div>

                {/* Main Interaction Area */}
                <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <CardHeader className="text-center border-b border-neutral-800 bg-neutral-900/40">
                        <CardTitle className="text-lg">Control de Escena</CardTitle>
                        <CardDescription className="text-neutral-500">Toca los botones para activar eventos</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 grid grid-cols-2 gap-4">
                        {[
                            { id: 'EVENT_1', icon: Zap, label: 'Efecto 1', color: 'hover:bg-blue-500/20 hover:text-blue-400' },
                            { id: 'EVENT_2', icon: Activity, label: 'Efecto 2', color: 'hover:bg-purple-500/20 hover:text-purple-400' },
                            { id: 'EVENT_3', icon: ShieldCheck, label: 'Efecto 3', color: 'hover:bg-green-500/20 hover:text-green-400' },
                            { id: 'EVENT_4', icon: Gamepad2, label: 'Efecto 4', color: 'hover:bg-orange-500/20 hover:text-orange-400' },
                        ].map((event) => (
                            <Button
                                key={event.id}
                                disabled={!connected}
                                onClick={() => sendAction(event.id)}
                                variant="outline"
                                className={cn(
                                    "h-24 flex flex-col gap-2 rounded-2xl border-neutral-800 bg-neutral-950/50 transition-all duration-300 font-bold tracking-tight",
                                    event.color,
                                    lastAction === event.id && "scale-95 ring-2 ring-primary bg-primary/20"
                                )}
                            >
                                <event.icon className="h-6 w-6" />
                                <span className="text-xs uppercase whitespace-nowrap">{event.label}</span>
                            </Button>
                        ))}
                    </CardContent>
                    <CardFooter className="bg-neutral-900/40 border-t border-neutral-800 p-4">
                        <div className="flex items-center justify-between w-full px-2">
                            <div className="flex items-center gap-2 group cursor-pointer">
                                <div className="h-2 w-2 rounded-full bg-primary group-hover:animate-ping" />
                                <span className="text-[10px] uppercase font-bold text-neutral-500 group-hover:text-primary transition-colors">Sistema Listo</span>
                            </div>
                            <MoreVertical className="h-4 w-4 text-neutral-600" />
                        </div>
                    </CardFooter>
                </Card>

                {/* Footer Info */}
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 text-neutral-500">
                        <Cast className="h-4 w-4" />
                        <span className="text-xs font-medium">Powered by LeonCast Ultra</span>
                    </div>
                </div>
            </div>

            {/* Retro Gradient Effect */}
            <div className="fixed bottom-0 left-0 w-full h-1/4 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
        </div>
    )
}

function MoreVertical(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
        </svg>
    )
}
