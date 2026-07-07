$filePath = "Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/MultiCotizadorExcel.tsx"
$content = Get-Content -Path $filePath -Encoding utf8 -Raw

# --- FONT SIZES (Largest to smallest to avoid cascading) ---
$content = $content.Replace("text-sm", "text-base")
$content = $content.Replace("text-xs", "text-sm")
$content = $content.Replace("text-[12px]", "text-sm")
$content = $content.Replace("text-[11px]", "text-[13px]")
$content = $content.Replace("text-[10.5px]", "text-[12px]")
$content = $content.Replace("text-[10px]", "text-xs")
$content = $content.Replace("text-[9.8px]", "text-[11.8px]")
$content = $content.Replace("text-[9.5px]", "text-[11.5px]")
$content = $content.Replace("text-[9px]", "text-[11px]")
$content = $content.Replace("text-[8.5px]", "text-[10.5px]")
$content = $content.Replace("text-[8px]", "text-[10px]")
$content = $content.Replace("text-[7.5px]", "text-[9.5px]")
$content = $content.Replace("text-[7px]", "text-[9px]")

# --- HEIGHTS ---
$content = $content.Replace("h-6", "h-8")
$content = $content.Replace("h-5", "h-7")
$content = $content.Replace("h-4", "h-6")
$content = $content.Replace("h-[18px]", "h-[26px]")
$content = $content.Replace("min-h-[18px]", "min-h-[26px]")
$content = $content.Replace("h-[16px]", "h-[22px]")

# Write back with UTF-8 encoding
[System.IO.File]::WriteAllText($filePath, $content, [System.Text.Encoding]::UTF8)
Write-Output "Scaling completed successfully!"
