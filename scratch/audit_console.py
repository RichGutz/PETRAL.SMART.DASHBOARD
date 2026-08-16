import asyncio
import json
from playwright.async_api import async_playwright

sample_lines = [
    {
        "month_index": "2026-01",
        "client_id": "CLIENT_01",
        "origin_port_id": "BAYOVAR",
        "destination_port_id": "CALLAO",
        "vessel_id": "VESSEL_A",
        "monthly_frequency": 2,
        "custom_tariff": 15.5,
        "quantity": 10000
    },
    {
        "month_index": "2026-02",
        "client_id": "CLIENT_01",
        "origin_port_id": "BAYOVAR",
        "destination_port_id": "MEJILLONES",
        "vessel_id": "VESSEL_B",
        "monthly_frequency": 1,
        "custom_tariff": 22.0,
        "quantity": 15000
    }
]

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"[{msg.type.upper()}] {msg.text} ({msg.location.get('url', '')}:{msg.location.get('lineNumber', '')})"))
        page.on("pageerror", lambda err: console_logs.append(f"[EXCEPTIONAL_ERROR] {err}"))

        print("--> 1. Cargando https://forecast.geeksoft.tech/dashboard ...")
        await page.goto("https://forecast.geeksoft.tech/dashboard", wait_until="networkidle")

        print("--> 2. Inyectando Escenario Simulado en sessionStorage ...")
        await page.evaluate(f"""() => {{
            sessionStorage.setItem('petral_projection_lines', '{json.dumps(sample_lines)}');
            sessionStorage.setItem('petral_forecast_name', 'Escenario de Prueba Audit');
        }}""")

        print("--> 3. Recargando Dashboard con Escenario Activo ...")
        await page.goto("https://forecast.geeksoft.tech/dashboard", wait_until="networkidle")
        await page.wait_for_timeout(3000)

        print("--> 4. Navegando a ANGRAF (/graphic-analysis) con Escenario Activo ...")
        await page.goto("https://forecast.geeksoft.tech/graphic-analysis", wait_until="networkidle")
        await page.wait_for_timeout(3000)

        print("--> 5. Regresando a Dashboard (/dashboard) ...")
        await page.goto("https://forecast.geeksoft.tech/dashboard", wait_until="networkidle")
        await page.wait_for_timeout(3000)

        print("--> 6. Navegando a Spaghetti Map (/spaghetti-map) con Escenario Activo ...")
        await page.goto("https://forecast.geeksoft.tech/spaghetti-map", wait_until="networkidle")
        await page.wait_for_timeout(3000)

        print("--> 7. Regresando a Dashboard (/dashboard) ...")
        await page.goto("https://forecast.geeksoft.tech/dashboard", wait_until="networkidle")
        await page.wait_for_timeout(3000)

        await browser.close()

        print("\n" + "="*80)
        print("=== CONSOLE LOGS & ERRORS CAPTURADOS CON ESCENARIO ACTIVO ===")
        print("="*80)
        for log in console_logs:
            print(log)
        print("="*80)

asyncio.run(run())
