/**
 * Módulo de Extracción de Huella Digital de Hardware (Device Fingerprint)
 * Sistema: DELFOS SHIPPING SOFTWARE / PETRAL ONE
 * 
 * Implementa persistencia Zero-Trust mediante Token Criptográfico Inmutable (localStorage)
 * anclado a la plataforma y arquitectura del equipo.
 * Previene falsas revocaciones automáticas causadas por:
 * - Conexión/desconexión a monitores externos (HDMI / Docking Station)
 * - Cambios de resolución de pantalla o escala de Windows (DPI 100%/125%/150%)
 * - Parches y actualizaciones menores de Chrome / Edge
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
    } catch {
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

/**
 * Obtiene o inicializa un token inmutable de dispositivo almacenado en localStorage.
 * Garantiza que la huella del navegador permanezca constante y aprobada a lo largo del tiempo.
 */
function getOrCreateDeviceVaultToken(): string {
    const STORAGE_KEY = 'petral_device_vault_token';
    try {
        let token = localStorage.getItem(STORAGE_KEY);
        if (!token || token.trim() === '') {
            if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                token = crypto.randomUUID();
            } else {
                token = 'dev-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
            }
            localStorage.setItem(STORAGE_KEY, token);
        }
        return token;
    } catch {
        // Fallback para contextos donde localStorage esté bloqueado (ej. iframe aislado)
        return 'session-ephemeral-device';
    }
}

export function generateDeviceFingerprint(userEmail: string): DeviceInfo {
    const userAgent = navigator.userAgent || 'unknown-ua';
    const screenRes = `${window.screen?.width || 0}x${window.screen?.height || 0}@${window.screen?.colorDepth || 24}`;
    const cores = navigator.hardwareConcurrency || 4;
    const gpu = getWebGLRenderer();
    const platform = (navigator as any).userAgentData?.platform || navigator.platform || 'Desktop';

    // 1. Obtener el token inmutable del dispositivo
    const vaultToken = getOrCreateDeviceVaultToken();

    // 2. Semilla canónica estabilizada:
    // NOTA FORENSE: Se excluye window.screen.width/height para evitar que conectar monitores externos cambie la huella.
    const rawSeed = `${userEmail.toLowerCase()}|${vaultToken}|${platform}|${cores}|${gpu}`;
    
    // Hash primario y secundario para firma de 16 caracteres
    const hash1 = calculateHash(rawSeed);
    const hash2 = calculateHash(rawSeed.split('').reverse().join(''));
    const fingerprint = `DEV-${hash1}-${hash2}`.toUpperCase();

    // Nombre amigable y profesional del equipo
    let osLabel = 'PC Windows';
    if (userAgent.includes('Mac')) osLabel = 'Apple Mac';
    else if (userAgent.includes('Linux')) osLabel = 'Linux Workstation';

    let browserLabel = 'Chrome';
    if (userAgent.includes('Edg/')) browserLabel = 'Edge';
    else if (userAgent.includes('Firefox/')) browserLabel = 'Firefox';
    else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) browserLabel = 'Safari';

    const deviceName = `${osLabel} (${browserLabel}) - Navegador Autorizado`;

    return {
        fingerprint,
        deviceName,
        platform,
        screenResolution: screenRes,
        cores
    };
}
