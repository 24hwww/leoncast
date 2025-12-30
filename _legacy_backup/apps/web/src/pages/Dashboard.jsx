import { useState, useEffect } from 'react'
import {
    BarChart3,
    Cast,
    Settings,
    LogOut,
    Plus,
    Play,
    Square,
    Trash2,
    MoreVertical,
    Layers,
    Activity,
    User,
    ExternalLink,
    ChevronRight,
    MonitorPlay,
    Moon,
    Sun,
    Search,
    CheckCircle2,
    XCircle,
    Clock,
    Layout
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select"
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { MonitorCanvas } from '../components/MonitorCanvas'

const channelSchema = z.object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(50),
    streamKey: z.string().min(3, 'La clave debe tener al menos 3 caracteres').regex(/^[a-z0-9_]+$/, 'Solo letras minúsculas, números y guiones bajos')
})

const scenarioSchema = z.object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(50),
    description: z.string().max(200).optional(),
    channelId: z.string().uuid('Debes seleccionar un canal válido')
})

export default function Dashboard({ user, onLogout }) {
    const [channels, setChannels] = useState([])
    const [scenarios, setScenarios] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('channels')
    const [darkMode, setDarkMode] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [isChannelDialogOpen, setIsChannelDialogOpen] = useState(false)
    const [isScenarioDialogOpen, setIsScenarioDialogOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [monitoringChannels, setMonitoringChannels] = useState({}) // { channelId: boolean }

    // Forms
    const {
        register: registerChannel,
        handleSubmit: handleSubmitChannel,
        setValue: setValueChannel,
        watch: watchChannelName,
        reset: resetChannel,
        formState: { errors: channelErrors }
    } = useForm({
        resolver: zodResolver(channelSchema),
        defaultValues: { name: '', streamKey: '' }
    })

    const {
        register: registerScenario,
        handleSubmit: handleSubmitScenario,
        setValue: setValueScenario,
        reset: resetScenario,
        formState: { errors: scenarioErrors }
    } = useForm({
        resolver: zodResolver(scenarioSchema),
        defaultValues: { name: '', description: '', channelId: '' }
    })

    const [streamMetrics, setStreamMetrics] = useState({})
    const [sockets, setSockets] = useState({})

    const navigate = useNavigate()

    // Manage WebSockets for metrics
    useEffect(() => {
        channels.forEach(channel => {
            if (channel.status === 'RUNNING' && !sockets[channel.id]) {
                const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws?channelId=${channel.id}`;
                const socket = new WebSocket(wsUrl);

                socket.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    if (data.type === 'STREAM_PROGRESS') {
                        setStreamMetrics(prev => ({
                            ...prev,
                            [data.channelId]: data.metrics
                        }));
                    } else if (data.type === 'STREAM_ENDED' || data.type === 'STREAM_ERROR') {
                        fetchData();
                    }
                };

                setSockets(prev => ({ ...prev, [channel.id]: socket }));
            }
        });

        return () => {
            // Cleanup closed streams
            Object.keys(sockets).forEach(id => {
                if (!channels.find(c => c.id === id && c.status === 'RUNNING')) {
                    sockets[id].close();
                    setSockets(prev => {
                        const newSockets = { ...prev };
                        delete newSockets[id];
                        return newSockets;
                    });
                }
            });
        };
    }, [channels]);

    // Auto-generate streamKey
    useEffect(() => {
        const subscription = watchChannelName((value, { name }) => {
            if (name === 'name') {
                const streamKey = (value.name || '').toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/\s+/g, '_')
                    .replace(/[^a-z0-9_]/g, '')
                    .replace(/^_+|_+$/g, '');
                setValueChannel('streamKey', streamKey, { shouldValidate: true });
            }
        });
        return () => subscription.unsubscribe();
    }, [watchChannelName, setValueChannel]);

    useEffect(() => {
        fetchData()
        // Apply dark mode by default
        document.documentElement.classList.toggle('dark', darkMode)
    }, [darkMode])

    const showError = (title, err) => {
        console.error(title, err)
        const message = err.response?.data?.error || err.message || 'Error desconocido'
        const status = err.response?.status ? ` [${err.response.status}]` : ''

        toast.error(`${title}${status}`, {
            description: message,
            duration: 5000,
            action: err.response?.data ? {
                label: 'Ver Detalles',
                onClick: () => {
                    alert(JSON.stringify(err.response.data, null, 2))
                }
            } : null
        })
    }

    const fetchData = async () => {
        try {
            const [channelsRes, scenariosRes] = await Promise.all([
                axios.get('/api/channels'),
                axios.get('/api/scenarios')
            ])
            setChannels(channelsRes.data)
            setScenarios(scenariosRes.data)
        } catch (err) {
            showError('Error al cargar datos', err)
        } finally {
            setLoading(false)
        }
    }

    const createChannel = async (data) => {
        setSubmitting(true)
        try {
            await axios.post('/api/channels', data)
            toast.success('Canal creado correctamente')
            resetChannel()
            setIsChannelDialogOpen(false)
            fetchData()
        } catch (err) {
            showError('Error al crear canal', err)
        } finally {
            setSubmitting(false)
        }
    }

    const createScenario = async (data) => {
        setSubmitting(true)
        try {
            await axios.post('/api/scenarios', data)
            toast.success('Escenario creado correctamente')
            resetScenario()
            setIsScenarioDialogOpen(false)
            fetchData()
        } catch (err) {
            showError('Error al crear escenario', err)
        } finally {
            setSubmitting(false)
        }
    }

    const activateScenario = async (id) => {
        const t = toast.loading('Activando escenario...')
        try {
            await axios.post(`/api/scenarios/${id}/activate`)
            toast.success('Escenario activado', { id: t })
            fetchData()
        } catch (err) {
            showError('Error al activar escenario', err)
            toast.dismiss(t)
        }
    }

    const startStream = async (id) => {
        const t = toast.loading('Iniciando transmisión...')
        try {
            await axios.post(`/api/channels/${id}/start`)
            toast.success('Transmisión iniciada', { id: t })
            fetchData()
        } catch (err) {
            showError('Error al iniciar stream', err)
            toast.dismiss(t)
        }
    }

    const stopStream = async (id) => {
        const t = toast.loading('Deteniendo transmisión...')
        try {
            await axios.post(`/api/channels/${id}/stop`)
            toast.success('Transmisión detenida', { id: t })
            fetchData()
        } catch (err) {
            showError('Error al detener stream', err)
            toast.dismiss(t)
        }
    }

    const deleteChannel = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este canal?')) {
            try {
                await axios.delete(`/api/channels/${id}`)
                toast.success('Canal eliminado')
                fetchData()
            } catch (err) {
                showError('Error al eliminar canal', err)
            }
        }
    }

    const deleteScenario = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este escenario?')) {
            try {
                await axios.delete(`/api/scenarios/${id}`)
                toast.success('Escenario eliminado')
                fetchData()
            } catch (err) {
                showError('Error al eliminar escenario', err)
            }
        }
    }

    const handleLogout = async () => {
        try {
            await axios.post('/auth/logout')
            if (onLogout) onLogout()
            navigate('/login')
        } catch (err) {
            console.error('Logout error:', err)
            if (onLogout) onLogout()
            navigate('/login')
        }
    }

    return (
        <div className={cn("min-h-screen flex bg-background text-foreground transition-all duration-300", darkMode && "dark")}>
            {/* Sidebar */}
            <aside className={cn(
                "fixed left-0 top-0 h-full bg-card border-r z-50 transition-all duration-300 flex flex-col shadow-2xl items-center",
                sidebarOpen ? "w-64" : "w-20"
            )}>
                <div className="p-6 flex items-center gap-3 w-full overflow-hidden">
                    <div className="min-w-[40px] h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                        <Cast className="h-6 w-6 text-primary-foreground" />
                    </div>
                    {sidebarOpen && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="font-bold text-xl tracking-tight whitespace-nowrap"
                        >
                            LeonCast
                        </motion.span>
                    )}
                </div>

                <nav className="flex-1 w-full px-3 py-4 space-y-2">
                    {[
                        { id: 'channels', label: 'Canales', icon: Activity },
                        { id: 'scenarios', label: 'Escenarios', icon: Layers },
                        { id: 'analytics', label: 'Estadísticas', icon: BarChart3 },
                        { id: 'settings', label: 'Configuración', icon: Settings },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={cn(
                                "flex items-center gap-4 w-full p-3 rounded-xl transition-all group overflow-hidden",
                                activeTab === item.id
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5 shrink-0 transition-transform group-active:scale-95", activeTab === item.id ? "text-primary-foreground" : "group-hover:text-primary")} />
                            {sidebarOpen && <span className="font-medium whitespace-nowrap">{item.label}</span>}
                        </button>
                    ))}
                </nav>

                <div className="p-4 w-full border-t space-y-2">
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="flex items-center gap-4 w-full p-3 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-all group overflow-hidden"
                    >
                        {darkMode ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
                        {sidebarOpen && <span className="font-medium whitespace-nowrap">{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-4 w-full p-3 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all group overflow-hidden"
                    >
                        <LogOut className="h-5 w-5 shrink-0" />
                        {sidebarOpen && <span className="font-medium whitespace-nowrap">Cerrar Sesión</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={cn(
                "flex-1 transition-all duration-300 min-w-0 h-screen overflow-y-auto",
                sidebarOpen ? "pl-64" : "pl-20"
            )}>
                {/* Header */}
                <header className="h-16 border-b bg-background/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-8">
                    <div className="flex items-center gap-4 flex-1">
                        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:flex">
                            <Layout className="h-5 w-5" />
                        </Button>
                        <div className="relative max-w-md w-full hidden md:block">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Buscar canales o escenas..." className="pl-9 h-9 bg-muted/50 border-none focus-visible:ring-1" />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end mr-2 hidden sm:flex">
                            <span className="text-sm font-semibold">{user?.email || 'Admin User'}</span>
                            <span className="text-xs text-muted-foreground">{user?.role || 'Administrador'}</span>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-primary/50 flex items-center justify-center text-white font-bold ring-2 ring-background border shadow-xl">
                            <User className="h-5 w-5" />
                        </div>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto space-y-8">
                    {/* Welcome Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h2 className="text-4xl font-extrabold tracking-tight">Panel de Control</h2>
                            <p className="text-muted-foreground text-lg mt-1">
                                Gestiona tus infraestructuras de streaming en tiempo real.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button onClick={() => setIsChannelDialogOpen(true)} className="shadow-lg shadow-primary/20">
                                <Plus className="mr-2 h-4 w-4" /> Nuevo Canal
                            </Button>
                            <Button onClick={() => setIsScenarioDialogOpen(true)} variant="outline" className="bg-card">
                                <Plus className="mr-2 h-4 w-4" /> Nuevo Escenario
                            </Button>
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Canales Activos', value: (Array.isArray(channels) ? channels : []).filter(c => c.status === 'RUNNING').length, icon: Play, color: 'text-green-500' },
                            { label: 'Escenarios', value: (Array.isArray(scenarios) ? scenarios : []).length, icon: Layers, color: 'text-blue-500' },
                            { label: 'Uso de CPU', value: '42%', icon: Activity, color: 'text-orange-500' },
                            { label: 'Uptime Global', value: '99.9%', icon: Clock, color: 'text-primary' },
                        ].map((stat, i) => (
                            <Card key={i} className="bg-card/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                        <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                                    </div>
                                    <div className={cn("p-3 rounded-xl bg-muted", stat.color)}>
                                        <stat.icon className="h-5 w-5" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Content Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="bg-muted/50 p-1 rounded-xl w-full max-w-sm">
                            <TabsTrigger value="channels" className="rounded-lg flex-1">Canales</TabsTrigger>
                            <TabsTrigger value="scenarios" className="rounded-lg flex-1">Escenarios</TabsTrigger>
                        </TabsList>

                        <TabsContent value="channels" className="mt-8 space-y-6">
                            {!Array.isArray(channels) || channels.length === 0 ? (
                                <Card>
                                    <CardHeader className="text-center py-12">
                                        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                            <MonitorPlay className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <CardTitle>No hay canales configurados</CardTitle>
                                        <CardDescription>Comienza creando tu primer canal de streaming.</CardDescription>
                                        <Button onClick={() => setIsChannelDialogOpen(true)} className="mt-4 mx-auto w-fit">Crear Canal</Button>
                                    </CardHeader>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {(Array.isArray(channels) ? channels : []).map((channel) => (
                                        <motion.div
                                            key={channel.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                        >
                                            <Card className="group border-none shadow-sm hover:shadow-xl transition-all duration-300 ring-1 ring-border bg-card overflow-hidden">
                                                <div className={cn(
                                                    "h-2 w-full",
                                                    channel.status === 'RUNNING' ? "bg-green-500 animate-pulse" : "bg-muted"
                                                )} />
                                                <CardHeader className="pb-4">
                                                    <div className="flex justify-between items-start">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <CardTitle className="text-xl font-bold">{channel.name}</CardTitle>
                                                                {channel.status === 'RUNNING' && (
                                                                    <div className="flex items-center bg-green-500/10 text-green-500 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                                        Live
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <CardDescription className="flex items-center gap-1.5 font-mono text-xs">
                                                                RTMP: {channel.streamKey.slice(0, 8)}...
                                                            </CardDescription>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className={cn(
                                                                    "h-8 w-8 rounded-lg",
                                                                    monitoringChannels[channel.id] ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted"
                                                                )}
                                                                onClick={() => setMonitoringChannels(prev => ({ ...prev, [channel.id]: !prev[channel.id] }))}
                                                                title="Monitorear Señal"
                                                            >
                                                                <MonitorPlay className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardHeader>

                                                <AnimatePresence>
                                                    {monitoringChannels[channel.id] && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="px-4 pb-4 overflow-hidden"
                                                        >
                                                            <MonitorCanvas channelId={channel.id} className="rounded-xl shadow-inner border-neutral-800/50" />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                <CardContent>
                                                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-dashed mb-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] uppercase font-bold text-muted-foreground">Escena Activa</span>
                                                            <span className="text-sm font-medium">{channel.scenario?.name || 'Ninguna'}</span>
                                                        </div>
                                                        {channel.status === 'RUNNING' && (
                                                            <div className="flex items-center gap-3">
                                                                {streamMetrics[channel.id] && (
                                                                    <div className="flex flex-col items-end text-[10px] font-mono text-primary animate-pulse">
                                                                        <span>{streamMetrics[channel.id].fps} FPS</span>
                                                                        <span>{Math.round(streamMetrics[channel.id].kbps)} kbps</span>
                                                                    </div>
                                                                )}
                                                                <div className="p-2 rounded-full bg-green-500/20">
                                                                    <Play className="h-4 w-4 text-green-500" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2">
                                                        {channel.status === 'RUNNING' ? (
                                                            <Button
                                                                variant="destructive"
                                                                onClick={() => stopStream(channel.id)}
                                                                className="w-full shadow-md shadow-destructive/10"
                                                            >
                                                                <Square className="mr-2 h-4 w-4 fill-current" /> Detener
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                onClick={() => startStream(channel.id)}
                                                                className="w-full shadow-md shadow-primary/10"
                                                            >
                                                                <Play className="mr-2 h-4 w-4 fill-current" /> Iniciar
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="outline"
                                                            className="w-full"
                                                            onClick={() => window.open(`/render/${channel.id}`, '_blank')}
                                                        >
                                                            <MonitorPlay className="mr-2 h-4 w-4" /> Señal
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            className="w-full"
                                                            onClick={() => window.open(`/action/${channel.scenario?.id}`, '_blank')}
                                                            disabled={!channel.scenario?.id}
                                                        >
                                                            <ExternalLink className="mr-2 h-4 w-4" /> Control
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                                <CardFooter className="pt-0 border-t bg-muted/10 p-4 flex justify-between">
                                                    <span className="text-xs text-muted-foreground">Modificado hace 2h</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => deleteChannel(channel.id)}
                                                        className="h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="scenarios" className="mt-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {(Array.isArray(scenarios) ? scenarios : []).map((scenario) => (
                                    <motion.div
                                        key={scenario.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <Card className="group hover:shadow-xl transition-all duration-300 ring-1 ring-border bg-card border-none">
                                            <CardHeader>
                                                <div className="flex justify-between items-start">
                                                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                        <Layers className="h-5 w-5" />
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <CardTitle className="text-xl mt-4 font-bold">{scenario.name}</CardTitle>
                                                <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                                                    {scenario.description || 'Sin descripción disponible para este escenario.'}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    <div className="px-2 py-1 rounded bg-muted text-[10px] font-bold text-muted-foreground">HTML5</div>
                                                    <div className="px-2 py-1 rounded bg-muted text-[10px] font-bold text-muted-foreground">PUBSUB</div>
                                                    <div className="px-2 py-1 rounded bg-muted text-[10px] font-bold text-muted-foreground">INTERACTIVE</div>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    {!scenario.isActive ? (
                                                        <Button
                                                            onClick={() => activateScenario(scenario.id)}
                                                            className="w-full"
                                                            size="sm"
                                                        >
                                                            <CheckCircle2 className="mr-2 h-4 w-4" /> Activar para Transmisión
                                                        </Button>
                                                    ) : (
                                                        <div className="flex items-center justify-center p-2 bg-primary/10 text-primary rounded-md text-xs font-bold uppercase tracking-wider border border-primary/20">
                                                            <CheckCircle2 className="mr-2 h-4 w-4" /> Escenario Activo
                                                        </div>
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full"
                                                        onClick={() => window.open(`/s/${scenario.id}/`, '_blank')}
                                                    >
                                                        <ExternalLink className="mr-2 h-4 w-4" /> Previsualizar
                                                    </Button>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="border-t bg-muted/10 p-2 flex justify-end">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => deleteScenario(scenario.id)}
                                                    className="h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </motion.div>
                                ))}
                                <Button
                                    variant="outline"
                                    onClick={() => setIsScenarioDialogOpen(true)}
                                    className="border-dashed border-2 min-h-[200px] h-full rounded-2xl flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-primary hover:border-primary transition-all bg-muted/10"
                                >
                                    <div className="p-4 rounded-full bg-muted border-2 border-dashed group-hover:bg-primary/20">
                                        <Plus className="h-8 w-8" />
                                    </div>
                                    <span className="font-semibold">Nuevo Escenario</span>
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="analytics" className="mt-8">
                            <Card className="border-none shadow-sm ring-1 ring-border">
                                <CardHeader>
                                    <CardTitle>Análisis de Rendimiento</CardTitle>
                                    <CardDescription>Métricas detalladas de tus streams.</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground border-t border-dashed mx-6">
                                    <div className="flex flex-col items-center gap-2">
                                        <BarChart3 className="h-12 w-12 opacity-20" />
                                        <p>Los datos aparecerán cuando inicies un stream.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="settings" className="mt-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Card className="border-none shadow-sm ring-1 ring-border">
                                    <CardHeader>
                                        <CardTitle>Configuración del Servidor</CardTitle>
                                        <CardDescription>Parámetros técnicos de LeonCast.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>RTMP Restreamer URL</Label>
                                            <Input defaultValue="rtmp://localhost:1935/live" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Directorio de Escenarios</Label>
                                            <Input defaultValue="./apps/scenarios" readOnly className="bg-muted" />
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-t mt-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">Auto-start Streams</span>
                                                <span className="text-xs text-muted-foreground">Inicia streams al arrancar el servidor.</span>
                                            </div>
                                            <Button variant="outline" size="sm">Habilitar</Button>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button className="w-full">Guardar Cambios</Button>
                                    </CardFooter>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Create Channel Dialog */}
                <Dialog open={isChannelDialogOpen} onOpenChange={setIsChannelDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Crear Nuevo Canal</DialogTitle>
                            <DialogDescription>
                                Configura un nuevo canal para tus transmisiones en vivo.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmitChannel(createChannel)} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre del Canal</Label>
                                <Input
                                    id="name"
                                    placeholder="Ej: Canal Principal"
                                    {...registerChannel('name')}
                                    className={cn(channelErrors.name && "border-destructive focus-visible:ring-destructive")}
                                />
                                {channelErrors.name && <p className="text-[10px] font-bold text-destructive uppercase tracking-wider">{channelErrors.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="key">Stream Key</Label>
                                <Input
                                    id="key"
                                    placeholder="Clave única oficial"
                                    {...registerChannel('streamKey')}
                                    className={cn(channelErrors.streamKey && "border-destructive focus-visible:ring-destructive")}
                                />
                                {channelErrors.streamKey && <p className="text-[10px] font-bold text-destructive uppercase tracking-wider">{channelErrors.streamKey.message}</p>}
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsChannelDialogOpen(false)}>Cancelar</Button>
                                <Button type="submit" disabled={submitting}>{submitting ? 'Creando...' : 'Crear Canal'}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Create Scenario Dialog */}
                <Dialog open={isScenarioDialogOpen} onOpenChange={setIsScenarioDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Crear Nuevo Escenario</DialogTitle>
                            <DialogDescription>
                                Los escenarios definen lo que se verá en pantalla.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmitScenario(createScenario)} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="sname">Nombre</Label>
                                <Input
                                    id="sname"
                                    placeholder="Ej: Escena Invitados"
                                    {...registerScenario('name')}
                                    className={cn(scenarioErrors.name && "border-destructive focus-visible:ring-destructive")}
                                />
                                {scenarioErrors.name && <p className="text-[10px] font-bold text-destructive uppercase tracking-wider">{scenarioErrors.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="desc">Descripción</Label>
                                <Input
                                    id="desc"
                                    placeholder="Opcional"
                                    {...registerScenario('description')}
                                    className={cn(scenarioErrors.description && "border-destructive focus-visible:ring-destructive")}
                                />
                                {scenarioErrors.description && <p className="text-[10px] font-bold text-destructive uppercase tracking-wider">{scenarioErrors.description.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Canal Relacionado</Label>
                                <Select
                                    onValueChange={(val) => setValueScenario('channelId', val, { shouldValidate: true })}
                                >
                                    <SelectTrigger className={cn(scenarioErrors.channelId && "border-destructive focus-visible:ring-destructive")}>
                                        <SelectValue placeholder="Selecciona un canal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {channels.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {scenarioErrors.channelId && <p className="text-[10px] font-bold text-destructive uppercase tracking-wider">{scenarioErrors.channelId.message}</p>}
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsScenarioDialogOpen(false)}>Cancelar</Button>
                                <Button type="submit" disabled={submitting}>{submitting ? 'Creando...' : 'Crear Escenario'}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </main >
        </div >
    )
}
