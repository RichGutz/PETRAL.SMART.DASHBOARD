import sys
import os

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# 1. Update FondosPage.tsx
fondos_path = r"C:\Users\rguti\Inandes.ERP.React\src\features\fondos\FondosPage.tsx"
with open(fondos_path, 'r', encoding='utf-8') as f:
    fondos_content = f.read()

# Add import if missing
if "import { getApiBaseUrl }" not in fondos_content:
    fondos_content = fondos_content.replace(
        "import { getFondos, upsertFondos, calculateValorCuotaV26 } from '../../services/fondosService';",
        "import { getFondos, upsertFondos, calculateValorCuotaV26 } from '../../services/fondosService';\nimport { getApiBaseUrl } from '../../config/apiConfig';"
    )

# Replace fetch URL
fondos_content = fondos_content.replace(
    "const response = await fetch('https://inandes.react.geeksoft.tech/api/inversionistas/generate-pdf', {",
    "const API_BASE = getApiBaseUrl();\n      const response = await fetch(`${API_BASE}/api/inversionistas/generate-pdf`, {"
)

with open(fondos_path, 'w', encoding='utf-8') as f:
    f.write(fondos_content)

print(" FondosPage.tsx actualizado exitosamente.")


# 2. Update InversionistasPage.tsx
inv_path = r"C:\Users\rguti\Inandes.ERP.React\src\features\inversionistas\InversionistasPage.tsx"
with open(inv_path, 'r', encoding='utf-8') as f:
    inv_content = f.read()

# Add import if missing
if "import { getApiBaseUrl }" not in inv_content:
    inv_content = inv_content.replace(
        "import { getInversionistas, upsertInversionista } from '../../services/inversionistasService';",
        "import { getInversionistas, upsertInversionista } from '../../services/inversionistasService';\nimport { getApiBaseUrl } from '../../config/apiConfig';"
    )

# Replace generate-pdf
inv_content = inv_content.replace(
    "const response = await fetch('https://inandes.react.geeksoft.tech/api/inversionistas/generate-pdf', {",
    "const API_BASE = getApiBaseUrl();\n      const response = await fetch(`${API_BASE}/api/inversionistas/generate-pdf`, {"
)

# Replace eecc URL
inv_content = inv_content.replace(
    "window.open(`https://inandes.react.geeksoft.tech/api/inversionistas/eecc/${fondo}/${fEnd}`, '_blank');",
    "const API_BASE = getApiBaseUrl();\n                          window.open(`${API_BASE}/api/inversionistas/eecc/${fondo}/${fEnd}`, '_blank');"
)

# Replace retenciones URL
inv_content = inv_content.replace(
    "window.open(`https://inandes.react.geeksoft.tech/api/inversionistas/retenciones/${fondo}/${fEnd}`, '_blank');",
    "const API_BASE = getApiBaseUrl();\n                          window.open(`${API_BASE}/api/inversionistas/retenciones/${fondo}/${fEnd}`, '_blank');"
)

with open(inv_path, 'w', encoding='utf-8') as f:
    f.write(inv_content)

print(" InversionistasPage.tsx actualizado exitosamente.")
