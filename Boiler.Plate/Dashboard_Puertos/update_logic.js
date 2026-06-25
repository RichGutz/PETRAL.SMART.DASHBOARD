// ========================================
// PHOTO UPDATE LOGIC (Modularized)
// ========================================

async function triggerPhotoUpdate() {
    const btn = document.getElementById('btn-update-photos');
    if (!btn) return;
    const originalText = btn.innerHTML;
    
    // Safety check for user ID
    const userId = document.getElementById('user-id')?.value || "RG";
    
    if (!confirm(`¿Deseas actualizar los links de Google Photos ahora? (${userId})`)) return;

    btn.innerHTML = '⏳ ACTUALIZANDO...';
    btn.disabled = true;
    btn.style.backgroundColor = '#444';

    try {
        const VPS_IP = "91.108.125.253";
        const TOKEN = "MARK_UPDATE_2026";
        const url = `http://${VPS_IP}:5005/update-photos?token=${TOKEN}&user=${userId}`;
        
        console.log("Triggering update at:", url);
        
        const response = await fetch(url, { method: 'GET', mode: 'cors' });
        const result = await response.text();

        if (response.ok) {
            alert("✅ ¡Éxito! Los links de Google Photos han sido actualizados.\n\nRecarga el Dashboard para aplicar los cambios.");
            btn.innerHTML = '✅ LISTO';
            btn.style.borderColor = '#00e676';
            btn.style.color = '#00e676';
        } else {
            throw new Error(result);
        }
    } catch (err) {
        console.error("Error triggering update:", err);
        alert("❌ Error al conectar con el servidor de actualización.\n\nDetalles: " + err.message);
        btn.innerHTML = '❌ ERROR';
        btn.style.borderColor = '#ff4444';
        btn.style.color = '#ff4444';
    } finally {
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
            btn.style.backgroundColor = '';
            btn.style.borderColor = '#03a9f4';
            btn.style.color = '#03a9f4';
        }, 3000);
    }
}
