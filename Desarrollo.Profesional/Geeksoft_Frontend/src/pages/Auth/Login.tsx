import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { generateDeviceFingerprint } from '../../utils/deviceFingerprint';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const { loginStepOne, verifyTwoFactor, resendTwoFactor } = useAuth();
    
    // Estados de flujo
    const [step, setStep] = useState<'EMAIL_ENTRY' | '2FA_OTP'>('EMAIL_ENTRY');
    const [email, setEmail] = useState('izavala@petral.com.pe');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Estados de 2FA
    const [tempToken, setTempToken] = useState('');
    const [maskedEmail, setMaskedEmail] = useState('');
    const [userName, setUserName] = useState('');
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutos en segundos
    const [resendCooldown, setResendCooldown] = useState(60); // 60s cooldown para reenvío
    const [resendSuccess, setResendSuccess] = useState('');
    
    // Referencias a los 6 inputs numéricos
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Temporizador regresivo de 5 minutos para expiración de OTP
    useEffect(() => {
        let timer: any;
        if (step === '2FA_OTP' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [step, timeLeft]);

    // Cooldown para reenvío de código
    useEffect(() => {
        let cooldownTimer: any;
        if (step === '2FA_OTP' && resendCooldown > 0) {
            cooldownTimer = setInterval(() => {
                setResendCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(cooldownTimer);
    }, [step, resendCooldown]);

    // Auto-focus en el primer input al pasar a la pantalla OTP
    useEffect(() => {
        if (step === '2FA_OTP' && inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [step]);

    // Formatear segundos a MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Paso 1: Enviar Email para recibir OTP
    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const deviceInfo = generateDeviceFingerprint(email);
            const response = await loginStepOne(
                email, 
                undefined, // Sin contraseña (Passwordless)
                deviceInfo.fingerprint, 
                deviceInfo.deviceName
            );

            if (response.status === 'REQUIRES_2FA') {
                setTempToken(response.temp_token);
                setMaskedEmail(response.masked_destination);
                setUserName(response.user_name);
                setStep('2FA_OTP');
                setTimeLeft(300);
                setResendCooldown(60);
                setOtpDigits(['', '', '', '', '', '']);
            }
        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.detail) {
                setError(err.response.data.detail);
            } else {
                setError('Error de conexión con el servidor. Intente más tarde.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Manejo de entrada de cada dígito OTP
    const handleDigitChange = (index: number, value: string) => {
        const cleanVal = value.replace(/[^0-9]/g, '');
        if (!cleanVal) {
            const newDigits = [...otpDigits];
            newDigits[index] = '';
            setOtpDigits(newDigits);
            return;
        }

        // Si pega múltiples dígitos (ej. "123456")
        if (cleanVal.length > 1) {
            const pasted = cleanVal.slice(0, 6).split('');
            const newDigits = [...otpDigits];
            pasted.forEach((char, i) => {
                if (index + i < 6) newDigits[index + i] = char;
            });
            setOtpDigits(newDigits);
            const nextIdx = Math.min(index + pasted.length, 5);
            inputRefs.current[nextIdx]?.focus();
            if (newDigits.every(d => d !== '')) {
                handleVerifyOtp(newDigits.join(''));
            }
            return;
        }

        const newDigits = [...otpDigits];
        newDigits[index] = cleanVal[0];
        setOtpDigits(newDigits);

        // Auto-avanzar al siguiente input
        if (index < 5 && cleanVal) {
            inputRefs.current[index + 1]?.focus();
        }

        // Si se completaron los 6 dígitos, auto-verificar
        if (newDigits.every(d => d !== '')) {
            handleVerifyOtp(newDigits.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    // Paso 2: Verificar OTP
    const handleVerifyOtp = async (codeToVerify?: string) => {
        const fullCode = codeToVerify || otpDigits.join('');
        if (fullCode.length !== 6) {
            setError('Por favor ingrese el código completo de 6 dígitos.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await verifyTwoFactor(tempToken, fullCode);
            navigate('/dashboard');
        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.detail) {
                setError(err.response.data.detail);
            } else {
                setError('Código de verificación inválido o expirado.');
            }
            // Limpiar inputs en caso de error y enfocar el primero
            setOtpDigits(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    // Reenviar código OTP
    const handleResend = async () => {
        if (resendCooldown > 0 || !tempToken) return;
        setError('');
        setResendSuccess('');
        try {
            await resendTwoFactor(tempToken);
            setResendSuccess('¡Código reenviado con éxito a tu correo!');
            setResendCooldown(60);
            setTimeLeft(300);
            setTimeout(() => setResendSuccess(''), 4000);
        } catch (err: any) {
            setError('No se pudo reenviar el código. Intente de nuevo.');
        }
    };

    return (
        <div className="relative min-h-screen w-screen flex items-center justify-center overflow-hidden font-sans select-none bg-slate-900">
            
            {/* Carrusel de Fondo con Buques Insignia */}
            <div 
                className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out z-0 animate-bgCarousel"
                style={{ filter: 'brightness(0.85)' }}
            />
            {/* Máscara azul marina y elegante */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0A192F]/60 via-[#0B2545]/50 to-[#0F1E36]/65 z-0" />

            {/* Tarjeta Flotante Central (Glassmorphism Premium) */}
            <div className="relative w-full max-w-[440px] mx-4 bg-[#F8FAFC]/95 backdrop-blur-md border border-white/40 rounded-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4),0_30px_60px_-30px_rgba(0,0,0,0.5)] p-8 md:p-9 z-10 flex flex-col justify-between">
                <div>
                    {/* Header Logo */}
                    <div className="flex items-center justify-center mb-5">
                        <img 
                            src="/Logo.Petral.png" 
                            alt="Naviera Petral" 
                            className="h-10 object-contain" 
                        />
                    </div>

                    {step === 'EMAIL_ENTRY' ? (
                        /* === PASO 1: ENTRADA DE CORREO PASSWORDLESS === */
                        <>
                            <h2 className="text-2xl font-extrabold text-slate-800 text-center mb-1 tracking-tight">
                                Acceso Seguro DELFOS
                            </h2>
                            <p className="text-xs text-slate-500 text-center mb-6 font-medium">
                                Autenticación 2FA sin contraseñas vía código OTP
                            </p>

                            <form onSubmit={handleEmailSubmit} className="space-y-4">
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-xs font-semibold leading-relaxed animate-shake">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label htmlFor="email" className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                        Correo Electrónico Corporativo
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            id="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="nombre@petral.com.pe"
                                            className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-3 text-sm text-slate-900 bg-white placeholder-slate-400 transition-all focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15 font-medium"
                                            required
                                            autoFocus
                                        />
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                            </svg>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-400 leading-tight pt-1">
                                        Recibirás un código de verificación seguro de un solo uso (OTP).
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !email}
                                    className="w-full bg-[#0B2545] hover:bg-[#134074] active:bg-[#0B2545] text-white py-3.5 px-4 rounded-lg font-bold text-sm transition-all duration-200 shadow-md mt-6 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                            <span>Enviando código de seguridad...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            <span>Enviar Código de Acceso</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        /* === PASO 2: VERIFICACIÓN 2FA OTP === */
                        <div className="animate-fadeIn">
                            <div className="text-center mb-5">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 border border-blue-200 text-blue-600 mb-2">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                                    Código de Seguridad
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    Hola <strong className="text-slate-700">{userName}</strong>, enviamos tu código de 6 dígitos a:
                                </p>
                                <p className="text-xs font-mono font-bold text-blue-700 bg-blue-50/70 border border-blue-100 rounded px-2.5 py-1 mt-1 inline-block">
                                    {maskedEmail}
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-xs font-semibold leading-relaxed mb-4 text-center animate-shake">
                                    {error}
                                </div>
                            )}

                            {resendSuccess && (
                                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-2.5 text-xs font-semibold leading-relaxed mb-4 text-center">
                                    {resendSuccess}
                                </div>
                            )}

                            {/* Grid de 6 dígitos con auto-avance */}
                            <div className="flex justify-between gap-2 mb-5">
                                {otpDigits.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        ref={(el) => (inputRefs.current[idx] = el)}
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(idx, e)}
                                        className="w-12 h-14 text-center text-2xl font-mono font-bold text-slate-800 bg-white border-2 border-slate-300 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20 transition-all shadow-sm"
                                        autoComplete="off"
                                    />
                                ))}
                            </div>

                            {/* Timer y Reenvío */}
                            <div className="flex items-center justify-between text-xs text-slate-500 mb-6 px-1">
                                <span className="flex items-center gap-1 font-medium">
                                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Vence en: <strong className={timeLeft < 60 ? 'text-red-600' : 'text-slate-700'}>{formatTime(timeLeft)}</strong>
                                </span>

                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={resendCooldown > 0}
                                    className={`font-bold transition-colors ${
                                        resendCooldown > 0 
                                            ? 'text-slate-400 cursor-not-allowed' 
                                            : 'text-blue-600 hover:text-blue-800 cursor-pointer underline'
                                    }`}
                                >
                                    {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar código'}
                                </button>
                            </div>

                            {/* Botón de Validación */}
                            <button
                                type="button"
                                onClick={() => handleVerifyOtp()}
                                disabled={loading || otpDigits.some(d => d === '')}
                                className={`w-full bg-[#0B2545] hover:bg-[#134074] active:bg-[#0B2545] text-white py-3.5 px-4 rounded-lg font-bold text-sm transition-all duration-200 shadow-md flex items-center justify-center gap-2 ${
                                    otpDigits.some(d => d === '') ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                                }`}
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                        <span>Verificando código...</span>
                                    </>
                                ) : (
                                    <span>Verificar y Entrar</span>
                                )}
                            </button>

                            {/* Volver a ingresar email */}
                            <div className="text-center mt-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep('EMAIL_ENTRY');
                                        setError('');
                                    }}
                                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                                >
                                    ← Cambiar correo corporativo
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Delfos & Geeksoft */}
                <div className="flex flex-col items-center pt-5 mt-6 border-t border-slate-200">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                        Desarrollado por
                    </span>
                    <div className="flex items-center justify-center gap-8">
                        <img 
                            src="/favicon.png" 
                            alt="DELFOS" 
                            className="h-[72px] object-contain opacity-90 hover:opacity-100 transition-opacity drop-shadow-sm" 
                        />
                        <a href="https://geeksoft.tech" target="_blank" rel="noopener noreferrer" className="flex items-center">
                            <img 
                                src="/Logo.Geeksoft.png" 
                                alt="Geeksoft Logo" 
                                className="h-[72px] object-contain opacity-90 hover:opacity-100 transition-opacity drop-shadow-sm" 
                            />
                        </a>
                    </div>
                </div>
            </div>

            {/* Estilos CSS */}
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

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(6px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.25s ease-out;
                }
            `}</style>
        </div>
    );
};
