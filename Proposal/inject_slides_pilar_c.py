import os

def inject():
    proposal_dir = r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Proposal"
    v61_html_path = os.path.join(proposal_dir, "PROPOSAL_PETRAL_PPT_V61.html")
    nuevos_html_path = os.path.join(proposal_dir, "PROPOSAL_PETRAL_PPT_V61_slides_nuevos.html")
    
    if not os.path.exists(v61_html_path) or not os.path.exists(nuevos_html_path):
        print("Error: No se encontraron los archivos HTML necesarios.")
        return
        
    v61_content = open(v61_html_path, encoding='utf-8').read()
    nuevos_content = open(nuevos_html_path, encoding='utf-8').read()
    
    # Extraer el fragmento de los slides nuevos
    start_tag = "<!-- SLIDE 1: MAPA DE ESPAGUETI GIGANTE CON PANEL LATERAL DE CONTROL -->"
    end_tag = "</td></tr></tbody>"
    
    start_idx = nuevos_content.find(start_tag)
    end_idx = nuevos_content.rfind(end_tag)
    
    if start_idx == -1 or end_idx == -1:
        print("Error: No se pudo extraer la seccion de slides nuevos del archivo de prueba.")
        return
        
    slides_to_inject = nuevos_content[start_idx:end_idx].strip()
    
    # Buscar el punto de insercion justo antes del slide de KPIs Operativos
    # que viene inmediatamente despues de la seccion del Pilar C
    target_pattern = "<h2>KPIs Operativos y Comerciales</h2>"
    target_idx = v61_content.find(target_pattern)
    
    if target_idx == -1:
        print("Error: No se encontro el punto de insercion 'KPIs Operativos y Comerciales' en PROPOSAL_PETRAL_PPT_V61.html.")
        return
        
    # Construir el nuevo HTML
    # Insertamos los slides de refuerzo justo antes del titulo de KPIs Operativos
    new_content = v61_content[:target_idx] + slides_to_inject + "\n\n" + v61_content[target_idx:]
    
    with open(v61_html_path, "w", encoding="utf-8") as f:
        f.write(new_content)
        
    print(f"Slides Spaghetti y Bubble inyectados exitosamente como refuerzo del Pilar C en: {v61_html_path}")

if __name__ == "__main__":
    inject()
