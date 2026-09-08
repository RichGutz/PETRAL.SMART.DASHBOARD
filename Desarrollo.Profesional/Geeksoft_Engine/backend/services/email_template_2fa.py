"""
Servicio Generador de Plantilla HTML de Correo 2FA
DELFOS SHIPPING SOFTWARE
Remitente: petra@geeksoft.tech
Logo URL Pública: https://forecast.geeksoft.tech/LOGO.DELFOS.NUEVO.BLANCO.3.horizontal.jpg
"""

def generate_2fa_email_html(user_name: str, otp_code: str, valid_minutes: int = 5) -> str:
    # Formatear el código OTP con espacios para legibilidad (ej: "5  7  5  0  7  5")
    formatted_code = "  ".join(list(str(otp_code)))
    logo_url = "https://forecast.geeksoft.tech/LOGO.DELFOS.NUEVO.BLANCO.3.horizontal.jpg"
    
    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de Seguridad DELFOS</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:1px solid #e2e8f0;">
          
          <!-- LÍNEA SUPERIOR DE IDENTIDAD -->
          <tr>
            <td style="background:linear-gradient(135deg, #0b2545 0%, #0284c7 100%);height:6px;"></td>
          </tr>

          <!-- CABECERA CON LOGO OFICIAL DELFOS -->
          <tr>
            <td style="padding:32px 30px 20px 30px;text-align:center;">
              <img src="{logo_url}" alt="DELFOS Shipping Software" width="280" style="display:block;margin:0 auto;max-width:280px;width:100%;height:auto;border:0;outline:none;text-decoration:none;" />
              <div style="margin-top:12px;color:#0284c7;font-size:10.5px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">
                PLATAFORMA INTEGRAL DE GESTIÓN MARÍTIMA &amp; COMERCIAL
              </div>
            </td>
          </tr>

          <!-- BADGE 2FA -->
          <tr>
            <td align="center" style="padding-bottom:16px;">
              <span style="display:inline-block;background-color:#e0f2fe;color:#0369a1;font-size:11px;font-weight:800;letter-spacing:0.8px;padding:6px 16px;border-radius:20px;text-transform:uppercase;">
                AUTENTICACIÓN DE DOS FACTORES (2FA)
              </span>
            </td>
          </tr>

          <!-- CUERPO PRINCIPAL -->
          <tr>
            <td style="padding:0 36px 28px 36px;text-align:left;">
              <h2 style="margin:0 0 14px 0;font-size:18px;font-weight:800;color:#0f172a;text-align:center;letter-spacing:-0.2px;">
                Código de Verificación para Acceso Seguro
              </h2>
              
              <p style="margin:0 0 12px 0;font-size:14px;color:#334155;line-height:1.5;">
                Estimado(a) <strong>{user_name}</strong>,
              </p>

              <p style="margin:0 0 20px 0;font-size:13.5px;color:#475569;line-height:1.6;">
                Se ha registrado una solicitud de inicio de sesión en <strong>DELFOS SHIPPING SOFTWARE</strong> desde un nuevo dispositivo o sesión corporativa asociada a su cuenta.
              </p>

              <!-- RECUADRO CÓDIGO OTP -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:22px 0;background-color:#f8fafc;border:2px dashed #38bdf8;border-radius:10px;">
                <tr>
                  <td style="padding:22px 16px;text-align:center;">
                    <div style="font-size:10.5px;font-weight:800;letter-spacing:1.5px;color:#0284c7;text-transform:uppercase;margin-bottom:10px;">
                      CÓDIGO DE AUTORIZACIÓN TRANSACCIONAL
                    </div>
                    <div style="font-family:'Consolas','Courier New',Courier,monospace;font-size:36px;font-weight:900;letter-spacing:8px;color:#0b2545;line-height:1.2;">
                      {formatted_code}
                    </div>
                    <div style="margin-top:12px;font-size:11.5px;color:#64748b;">
                      ⏱ Válido durante los próximos <strong>{valid_minutes} minutos</strong> • Uso único
                    </div>
                  </td>
                </tr>
              </table>

              <!-- AVISO DE SEGURIDAD -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#fefce8;border-left:4px solid #eab308;border-radius:6px;margin-top:16px;">
                <tr>
                  <td style="padding:12px 14px;font-size:12px;color:#713f12;line-height:1.5;">
                    🔒 <strong>Aviso de Seguridad:</strong> Este código es personal, de un solo uso y estrictamente confidencial. Nunca comparta este token por llamada, chat ni correo. Si no solicitó este acceso, contacte de inmediato con administración.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- PIE DE PÁGINA -->
          <tr>
            <td style="background-color:#0f172a;padding:18px 30px;text-align:center;">
              <p style="margin:0 0 6px 0;font-size:11px;color:#cbd5e1;line-height:1.5;font-weight:600;">
                DELFOS SHIPPING SOFTWARE • GEEKSOFT TECHNOLOGY PARTNER
              </p>
              <p style="margin:0;font-size:10px;color:#94a3b8;line-height:1.4;">
                Remitente Oficial: <span style="color:#38bdf8;">petra@geeksoft.tech</span> • Cifrado TLS 1.3 de Extremo a Extremo<br>
                Todos los derechos reservados © 2026.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""
    return html

if __name__ == "__main__":
    sample_html = generate_2fa_email_html(user_name="Richard Gutiérrez", otp_code="575075", valid_minutes=5)
    with open("preview_email_2fa.html", "w", encoding="utf-8") as f:
        f.write(sample_html)
    print("Plantilla con URL pública oficial generada.")
