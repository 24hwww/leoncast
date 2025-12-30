import { useState, useEffect } from 'react'
import { sha256 } from 'js-sha256'
import { useNavigate } from 'react-router-dom'
import {
    Monitor,
    Lock,
    Mail,
    Loader2,
    ChevronRight,
    Cast,
    ShieldCheck,
    Zap
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { motion, AnimatePresence } from 'framer-motion'

export default function Login({ onLogin }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const passwordHash = sha256(password)
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password: passwordHash })
            })

            const data = await response.json()

            if (response.ok) {
                if (onLogin) await onLogin()
                navigate('/')
            } else {
                setError(data.error || 'Credenciales inválidas')
            }
        } catch (err) {
            setError('Error al conectar con el servidor')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-background transition-colors duration-500">
            {/* Left Side: Illustration / Branding */}
            <div className="hidden lg:flex flex-col justify-between p-12 bg-muted/30 border-r relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5 pointer-events-none" />

                <div className="flex items-center gap-2 relative z-10">
                    <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20">
                        <Cast className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight">LeonCast</span>
                </div>

                <div className="relative z-10 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl text-foreground">
                            Stream flows <br />
                            <span className="text-primary italic">Simplified.</span>
                        </h1>
                        <p className="mt-6 text-xl text-muted-foreground max-w-md leading-relaxed">
                            The ultimate control center for dynamic streaming scenarios and real-time interactions.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { icon: Zap, label: 'Low Latency' },
                            { icon: ShieldCheck, label: 'Secure Access' },
                        ].map((item, i) => (
                            <motion.div
                                key={item.label}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 + i * 0.1 }}
                                className="flex items-center gap-2 p-4 rounded-2xl bg-background/50 border backdrop-blur-sm"
                            >
                                <item.icon className="h-5 w-5 text-primary" />
                                <span className="font-medium text-sm">{item.label}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} LeonCast System. All rights reserved.
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="flex items-center justify-center p-6 lg:p-12">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-sm space-y-8"
                >
                    <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
                        <div className="p-1.5 bg-primary rounded-lg">
                            <Cast className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold">LeonCast</span>
                    </div>

                    <div className="space-y-2 text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight">Bienvenido</h2>
                        <p className="text-muted-foreground">Ingresa tus credenciales para acceder al panel</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <AnimatePresence mode='wait'>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-3 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-lg text-center"
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="correo@ejemplo.com"
                                        className="pl-10 h-11"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Contraseña</Label>
                                    <Button variant="link" size="sm" className="px-0 font-normal text-muted-foreground">
                                        ¿Olvidaste tu contraseña?
                                    </Button>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10 h-11"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 text-base font-semibold transition-all active:scale-[0.98]"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    Entrar al Dashboard
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="text-center text-sm text-muted-foreground pt-4 border-t border-dashed">
                        ¿Problemas para acceder? <br />
                        Contacta con el administrador del sistema.
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
