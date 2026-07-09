import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('petral2026');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Simulación de autenticación (admin / petral2026)
        setTimeout(() => {
            if (username === 'admin' && password === 'petral2026') {
                localStorage.setItem('petral_session', 'authenticated');
                navigate('/dashboard');
            } else {
                setError('Credenciales incorrectas. Verifique el usuario y contraseña.');
                setLoading(false);
            }
        }, 800);
    };

    return (
        <div className="relative min-h-screen w-screen flex items-center justify-center overflow-hidden font-sans select-none">
            
            {/* 1. Carrusel de Fondo de Buques Insignia con Animación CSS y máscara azul marino */}
            <div 
                className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out z-0 animate-bgCarousel"
                style={{
                    filter: 'brightness(0.85)'
                }}
            />
            {/* Máscara azul marina y elegante (Overlay más translúcido) */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0A192F]/45 via-[#0B2545]/35 to-[#0F1E36]/45 z-0" />

            {/* 2. Tarjeta Flotante Central (Glassmorphism Premium) */}
            <div className="relative w-full max-w-[420px] mx-4 bg-[#F8FAFC]/15 border border-white/30 rounded-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.35),0_30px_60px_-30px_rgba(0,0,0,0.4)] p-8 md:p-10 z-10 flex flex-col justify-between">
                
                <div>
                    {/* Logo de Petral */}
                    <div className="flex justify-center mb-6">
                        <img 
                            src="/Logo.Petral.png" 
                            alt="Naviera Petral" 
                            className="h-10 object-contain" 
                            style={{ transform: 'translateX(-18px)' }}
                        />
                    </div>

                    <h2 className="text-2xl font-extrabold text-slate-800 text-center mb-6 tracking-tight">
                        Iniciar sesión
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-50/90 border border-red-200 text-red-600 rounded-lg p-3 text-xs font-semibold leading-relaxed animate-shake">
                                {error}
                            </div>
                        )}

                        <div className="space-y-1">
                            <label htmlFor="username" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Usuario
                            </label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="nombre@correo.com"
                                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 bg-white placeholder-slate-400 transition-all focus:outline-none focus:border-slate-800 focus:ring-4 focus:ring-slate-850/10"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="password" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Contraseña
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 bg-white placeholder-slate-400 transition-all focus:outline-none focus:border-slate-800 focus:ring-4 focus:ring-slate-850/10"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-[#0B2545] hover:bg-[#134074] active:bg-[#0B2545] text-white py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200 shadow-md mt-6 cursor-pointer flex items-center justify-center gap-2`}
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                    <span>Ingresando...</span>
                                </>
                            ) : (
                                <span>Ingresar al Sistema</span>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Geeksoft */}
                <div className="flex flex-col items-center pt-6 mt-8 border-t border-slate-100/60">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0">
                        Desarrollado por
                    </span>
                    <a href="https://geeksoft.tech" target="_blank" rel="noopener noreferrer" className="mt-[-18px]">
                        <img src="/Logo.Geeksoft.png" alt="Geeksoft Logo" className="h-24 object-contain opacity-75 hover:opacity-100 transition-opacity" />
                    </a>
                </div>
            </div>

            {/* Estilos e inyección de animación CSS para el carrusel de fondos de barcos */}
            <style>{`
                @keyframes bgCarousel {
                    0%, 45% {
                        background-image: url('/moquegua_1.jpg');
                    }
                    50%, 95% {
                        background-image: url('/tablones.jpeg');
                    }
                    100% {
                        background-image: url('/moquegua_1.jpg');
                    }
                }
                .animate-bgCarousel {
                    animation: bgCarousel 18s infinite ease-in-out;
                }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.3s ease-in-out;
                }
            `}</style>
        </div>
    );
};
