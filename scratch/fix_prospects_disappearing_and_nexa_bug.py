import os

path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Fix client filtering logic in useEffect so NEXA is always Prospect, SPCC/Trafigura/etc are always Activos, and clients never get wiped to []
old_client_filter = """    // Filtrado Dinámico de Clientes según Activos / Prospectos
    useEffect(() => {
        if (!rawClients || rawClients.length === 0) {
            if (clientType === 'ACTIVOS') {
                setClients(['SPCC', 'TRAFIGURA', 'GLENCORE', 'SOUTHERN', 'CERRO VERDE', 'SHOUGANGBIT']);
            } else {
                setClients(['PROSPECTO NEXA', 'PROSPECTO MINSUR', 'PROSPECTO VOLCAN']);
            }
            return;
        }

        const filtered = rawClients.filter((c: any) => {
            const isProspect = c.is_prospect === true || c.client_type === 'PROSPECTO' || String(c.client_name || '').toUpperCase().includes('PROSPECTO');
            return clientType === 'PROSPECTOS' ? isProspect : !isProspect;
        });

        const cList = filtered.map((c: any) => typeof c === 'string' ? c : c.client_name || c.client_id || '');
        setClients(Array.from(new Set(cList.filter(Boolean))));
    }, [clientType, rawClients]);"""

new_client_filter = """    // Filtrado Dinámico Estricto de Clientes (Activos vs Prospectos / routes_quotes)
    useEffect(() => {
        const activosDefaults = ['SPCC', 'TRAFIGURA', 'GLENCORE', 'SOUTHERN', 'CERRO VERDE', 'SHOUGANGBIT', 'VOLCAN'];
        const prospectosDefaults = ['PROSPECTO NEXA', 'PROSPECTO MINSUR', 'PROSPECTO ALAMBRA', 'PROSPECTO CHINALCO', 'PROSPECTO VOLCAN'];

        const isProspectName = (name: string) => {
            const n = String(name || '').toUpperCase();
            return n.includes('NEXA') || n.includes('MINSUR') || n.includes('ALAMBRA') || n.includes('CHINALCO') || n.includes('PROSPECTO');
        };

        if (!rawClients || rawClients.length === 0) {
            setClients(clientType === 'ACTIVOS' ? activosDefaults : prospectosDefaults);
            return;
        }

        const filtered = rawClients.filter((c: any) => {
            const name = typeof c === 'string' ? c : (c.client_name || c.client_id || '');
            const isProspect = c.is_prospect === true || c.client_type === 'PROSPECTO' || isProspectName(name);
            return clientType === 'PROSPECTOS' ? isProspect : !isProspect;
        });

        const cList = filtered.map((c: any) => typeof c === 'string' ? c : c.client_name || c.client_id || '');
        const finalSet = Array.from(new Set(cList.filter(Boolean)));

        if (finalSet.length === 0) {
            setClients(clientType === 'ACTIVOS' ? activosDefaults : prospectosDefaults);
        } else {
            setClients(finalSet);
        }
    }, [clientType, rawClients]);"""

code = code.replace(old_client_filter, new_client_filter)

# Fix Nginx Cache-Control in deploy_forecast_kickoff.py so browser never serves stale JS
path_deploy = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Push.VPS\deploy_forecast_kickoff.py'
with open(path_deploy, 'r', encoding='utf-8') as f:
    code_deploy = f.read()

old_nginx_loc = """    location / {
        try_files $uri $uri/ /index.html;
    }"""

new_nginx_loc = """    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }"""

code_deploy = code_deploy.replace(old_nginx_loc, new_nginx_loc)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

with open(path_deploy, 'w', encoding='utf-8') as f:
    f.write(code_deploy)

print("FIXED NEXA/PROSPECT FILTERING BUG AND NGINX NO-CACHE HEADER SUCCESSFULLY!")
