/**
 * Módulo de Extracción de Huella Digital de Hardware (Device Fingerprint)
 * Sistema: DELFOS SHIPPING SOFTWARE
 * 
 * Combina señales de hardware y renderizado:
 * - GPU Renderer WebGL
 * - Hardware Concurrency (Cores CPU)
 * - Resolución de Pantalla y Profundidad de Color
 * - User-Agent y Arquitectura del Sistema Operativo
 */

export interface DeviceInfo {
    fingerprint: string;
    deviceName: string;
    platform: string;
    screenResolution: string;
    cores: number;
}

function getWebGLRenderer(): string {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return 'no-webgl';
        const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
        if (!debugInfo) return 'no-debug-info';
        return (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'generic-renderer';
    } catch (e) {
        return 'webgl-error';
    }
}

function calculateHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convertir a entero de 32 bits
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
}

export function generateDeviceFingerprint(userEmail: string): DeviceInfo {
    const userAgent = navigator.userAgent || 'unknown-ua';
    const screenRes = `${window.screen?.width || 0}x${window.screen?.height || 0}@${window.screen?.colorDepth || 24}`;
    const cores = navigator.hardwareConcurrency || 4;
    const gpu = getWebGLRenderer();
    const platform = (navigator as any).userAgentData?.platform || navigator.platform || 'Desktop';

    // Generar string de semilla determinística
    const rawSeed = `${userEmail.toLowerCase()}|${userAgent}|${screenRes}|${cores}|${gpu}|${platform}`;
    
    // Hash primario y secundario para firma de 16 caracteres
    const hash1 = calculateHash(rawSeed);
    const hash2 = calculateHash(rawSeed.split('').reverse().join(''));
    const fingerprint = `DEV-${hash1}-${hash2}`.toUpperCase();

    // Nombre amigable del equipo
    let osLabel = 'PC Windows';
    if (userAgent.includes('Mac')) osLabel = 'Apple Mac';
    else if (userAgent.includes('Linux')) osLabel = 'Linux Workstation';

    let browserLabel = 'Chrome';
    if (userAgent.includes('Edg/')) browserLabel = 'Edge';
    else if (userAgent.includes('Firefox/')) browserLabel = 'Firefox';
    else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) browserLabel = 'Safari';

    const deviceName = `${osLabel} (${browserLabel}) - ${screenRes.split('@')[0]}`;

    return {
        fingerprint,
        deviceName,
        platform,
        screenResolution: screenRes,
        cores
    };
}
