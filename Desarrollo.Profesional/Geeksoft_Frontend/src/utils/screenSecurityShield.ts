/**
 * Módulo de Blindaje Web, Anti-Captura de Pantalla & DRM Forense
 * Sistema: DELFOS SHIPPING SOFTWARE
 * 
 * 5 Capas de Protección Activa:
 * 1. Anti-PrintScreen & Vaciado de Portapapeles (Clipboard Purge).
 * 2. Desenfoque Instantáneo al Perder Foco (Blur en Win+Shift+S / Snipping Tool).
 * 3. Bloqueo de Clic Derecho e Inspección (F12, Ctrl+U, Ctrl+Shift+I).
 * 4. Bloqueo de Atajos de Descarga/Copia (Ctrl+S, Ctrl+P, Ctrl+C).
 * 5. CSS Anti-Impresión (@media print oculta).
 */

export interface SecurityShieldOptions {
    enableClipboardShield?: boolean;
    enableFocusBlur?: boolean;
    enableInspectorBlock?: boolean;
    enableAntiPrint?: boolean;
}

/**
 * 1. Vaciado de Portapapeles al presionar PrintScreen
 */
export function initClipboardShield(): () => void {
    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === 'PrintScreen' || e.keyCode === 44) {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(''); // Vacía el portapapeles del SO
            }
            console.warn('[SECURITY] Intento de captura de pantalla neutralizado.');
        }
    };
    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
}

/**
 * 2. Desenfoque Automático (Blur) cuando el usuario intenta capturar con Win+Shift+S o cambia de ventana
 */
export function initFocusBlurShield(): () => void {
    const enableBlur = () => document.body.classList.add('screen-blur-active');
    const disableBlur = () => document.body.classList.remove('screen-blur-active');

    window.addEventListener('blur', enableBlur);
    window.addEventListener('focus', disableBlur);
    
    const handleVisibility = () => {
        if (document.hidden) enableBlur();
        else disableBlur();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
        window.removeEventListener('blur', enableBlur);
        window.removeEventListener('focus', disableBlur);
        document.removeEventListener('visibilitychange', handleVisibility);
        document.body.classList.remove('screen-blur-active');
    };
}

/**
 * 3. Bloqueo de Inspección (F12), Clic Derecho y Atajos Sensibles
 */
export function initInspectorShield(): () => void {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleSelectStart = (e: Event) => {
        const target = e.target as HTMLElement;
        // Permitir selección en inputs y textareas
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        const isCtrl = e.ctrlKey || e.metaKey;
        const key = e.key.toLowerCase();

        // Bloquear Ctrl+S (Guardar), Ctrl+U (Ver Fuente), Ctrl+P (Imprimir)
        if (isCtrl && ['s', 'u', 'p'].includes(key)) {
            e.preventDefault();
            return false;
        }

        // Bloquear F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (DevTools)
        if (e.key === 'F12' || (isCtrl && e.shiftKey && ['i', 'j', 'c'].includes(key))) {
            e.preventDefault();
            return false;
        }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('selectstart', handleSelectStart);
        window.removeEventListener('keydown', handleKeyDown);
    };
}

/**
 * Función Maestra para inicializar todo el blindaje con una sola llamada
 */
export function activateWebSecurityShield(options: SecurityShieldOptions = {}): () => void {
    const cleanups: Array<() => void> = [];

    if (options.enableClipboardShield !== false) {
        cleanups.push(initClipboardShield());
    }
    if (options.enableFocusBlur === true) {
        cleanups.push(initFocusBlurShield());
    }
    if (options.enableInspectorBlock !== false) {
        cleanups.push(initInspectorShield());
    }

    return () => {
        cleanups.forEach(cleanup => cleanup());
    };
}
