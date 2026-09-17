import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { generateDeviceFingerprint } from '../../utils/deviceFingerprint';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const { loginStepOne, verifyTwoFactor, resendTwoFactor } = useAuth();
    
    // Estados de flujo
    const [step, setStep] = useState<'EMAIL_ENTRY' | '2FA_OTP'>('EMAIL_ENTRY');
    const [email, setEmail] = useState('');
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
        <div className="relative min-h-screen w-screen flex flex-col justify-center items-center md:justify-end md:items-start p-4 md:p-6 lg:p-8 overflow-hidden font-sans select-none bg-slate-950">
            
            {/* Fondo con la imagen panorámica de portada ancha */}
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
                style={{ 
                    backgroundImage: "url('/PORTADA.ANCHA.jpg')",
                }}
            />

            {/* Tarjeta Flotante Inferior Izquierda (90% Transparente / Glassmorphism Compacto) */}
            <div className="relative w-full max-w-[275px] bg-slate-950/10 backdrop-blur-md border border-white/25 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 z-10 flex flex-col justify-between transition-all duration-300">
                <div>
                    {step === 'EMAIL_ENTRY' ? (
                        /* === PASO 1: ENTRADA DE CORREO PASSWORDLESS === */
                        <>
                            <div className="text-center mb-2.5">
                                <h2 className="text-base font-bold text-white tracking-tight drop-shadow-md">
                                    Acceso Seguro 2FA
                                </h2>
                                <p className="text-[10.5px] text-slate-100 font-medium drop-shadow leading-tight mt-0.5">
                                    Ingresa tu correo corporativo
                                </p>
                            </div>

                            <form onSubmit={handleEmailSubmit} className="space-y-2.5">
                                {error && (
                                    <div className="bg-red-500/30 border border-red-500/50 text-white rounded-lg p-2 text-[11px] font-semibold leading-relaxed animate-shake">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <label htmlFor="email" className="block text-[9.5px] font-bold text-white uppercase tracking-wider drop-shadow">
                                        Correo Corporativo
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            id="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="nombre@petral.com.pe"
                                            className="w-full rounded-lg border border-white/30 pl-8 pr-2.5 py-1.5 text-xs text-white bg-slate-950/40 placeholder-slate-300 transition-all focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 font-medium"
                                            required
                                            autoFocus
                                        />
                                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-slate-200">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !email}
                                    className="w-full bg-blue-600/90 hover:bg-blue-500 active:bg-blue-700 text-white py-2 px-3 rounded-lg font-bold text-xs transition-all duration-200 shadow-md shadow-blue-600/30 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></div>
                                            <span>Enviando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-3.5 h-3.5 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            <span>Enviar Código</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        /* === PASO 2: VERIFICACIÓN 2FA OTP === */
                        <div className="animate-fadeIn">
                            <div className="text-center mb-2.5">
                                <h2 className="text-sm font-bold text-white tracking-tight drop-shadow-md">
                                    Código de Seguridad
                                </h2>
                                <p className="text-[10px] text-slate-100 mt-0.5 drop-shadow">
                                    Hola <strong className="text-blue-200">{userName}</strong>, código a:
                                </p>
                                <p className="text-[10px] font-mono font-bold text-blue-200 bg-blue-950/60 border border-blue-400/40 rounded px-1.5 py-0.5 mt-0.5 inline-block truncate max-w-full">
                                    {maskedEmail}
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-500/30 border border-red-500/50 text-white rounded-lg p-1.5 text-[11px] font-semibold leading-relaxed mb-2 text-center animate-shake">
                                    {error}
                                </div>
                            )}

                            {resendSuccess && (
                                <div className="bg-emerald-500/30 border border-emerald-500/50 text-emerald-200 rounded-lg p-1.5 text-[11px] font-semibold leading-relaxed mb-2 text-center">
                                    {resendSuccess}
                                </div>
                            )}

                            {/* Grid de 6 dígitos compacto */}
                            <div className="flex justify-between gap-1 mb-2.5">
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
                                        className="w-8 h-9 text-center text-base font-mono font-bold text-white bg-slate-950/50 border border-white/30 rounded-md focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 transition-all"
                                        autoComplete="off"
                                    />
                                ))}
                            </div>

                            {/* Timer y Reenvío */}
                            <div className="flex items-center justify-between text-[10px] text-slate-200 mb-2.5 px-0.5 drop-shadow">
                                <span className="flex items-center gap-0.5 font-medium">
                                    Vence: <strong className={timeLeft < 60 ? 'text-red-400' : 'text-white'}>{formatTime(timeLeft)}</strong>
                                </span>

                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={resendCooldown > 0}
                                    className={`font-bold transition-colors ${
                                        resendCooldown > 0 
                                            ? 'text-slate-400 cursor-not-allowed' 
                                            : 'text-blue-300 hover:text-white cursor-pointer underline'
                                    }`}
                                >
                                    {resendCooldown > 0 ? `Reenviar (${resendCooldown}s)` : 'Reenviar'}
                                </button>
                            </div>

                            {/* Botón de Validación */}
                            <button
                                type="button"
                                onClick={() => handleVerifyOtp()}
                                disabled={loading || otpDigits.some(d => d === '')}
                                className={`w-full bg-blue-600/90 hover:bg-blue-500 active:bg-blue-700 text-white py-2 px-3 rounded-lg font-bold text-xs transition-all duration-200 shadow-md flex items-center justify-center gap-1.5 ${
                                    otpDigits.some(d => d === '') ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                                }`}
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></div>
                                        <span>Verificando...</span>
                                    </>
                                ) : (
                                    <span>Verificar y Entrar</span>
                                )}
                            </button>

                            {/* Volver a ingresar email */}
                            <div className="text-center mt-1.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep('EMAIL_ENTRY');
                                        setError('');
                                    }}
                                    className="text-[10px] font-semibold text-slate-200 hover:text-white transition-colors drop-shadow"
                                >
                                    ← Cambiar correo
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Geeksoft con logo 50% mas grande y titulo exacto */}
                <div className="flex flex-col items-center pt-2.5 mt-2.5 border-t border-white/15">
                    <span className="text-[8.5px] font-extrabold text-slate-100 tracking-wider mb-1.5 drop-shadow text-center uppercase">
                        DESARROLLADO POR GEEKSOFT
                    </span>
                    <a href="https://geeksoft.tech" target="_blank" rel="noopener noreferrer" className="flex items-center">
                        <img 
                            src="/Logo.Geeksoft.png" 
                            alt="Geeksoft" 
                            className="h-14 object-contain opacity-95 hover:opacity-100 transition-opacity drop-shadow-md" 
                        />
                    </a>
                </div>
            </div>

            {/* Estilos CSS */}
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.3s ease-in-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
            `}</style>
        </div>
    );
};
