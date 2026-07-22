# Arquitectura Coder-QC Loop en AntiGravity

Documento de especificación para implementar un flujo de trabajo iterativo **Coder-QC** (Programador - Control de Calidad) utilizando la topología de grafos de **AntiGravity**.

---

## 📐 Topología del Grafo

```
[ Inicio: Requisito de Código / Bugfix ]
                  │
                  ▼
          ( Nodo Programador )
                  │
                  ▼
          ( Nodo Agente QC ) ───► ¿`qc_passed == True` o `intentos >= max`?
                  │                                   │
               NO │                                   │ SÍ
                  └───────────────────────────────────┴───► [ Fin / Salida ]
```

---

## 💻 Implementación Idiomática en AntiGravity

### 1. Definir el Estado (`CodeTaskState`)

El estado mantiene el contrato de datos entre iteraciones y registra el historial completo de errores para evitar bucles repetitivos.

```python
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any

@dataclass
class CodeTaskState:
    task_description: str
    code: str = ""
    qc_passed: bool = False
    feedback_history: List[str] = field(default_factory=list)
    attempts: int = 0
    max_attempts: int = 4
```

### 2. Definir los Nodos de los Agentes

#### A. Agente Programador (`agent_coder`)
```python
from antigravity import node

@node
def agent_coder(state: CodeTaskState) -> CodeTaskState:
    """Agente programador: genera o corrige el código según el feedback acumulado."""
    state.attempts += 1
    
    if not state.code:
        prompt = f"Crea la solución técnica para: {state.task_description}"
    else:
        last_feedback = state.feedback_history[-1]
        prompt = (
            f"El código anterior falló en el control de calidad (QC):\n{last_feedback}\n\n"
            f"Historial de errores pasados:\n{state.feedback_history}\n\n"
            f"Código a corregir:\n```python\n{state.code}\n```\n"
            "Corrige el código asegurando resolver el problema sin romper el contrato."
        )
    
    state.code = call_llm_coder(prompt)
    return state
```

#### B. Agente de Control de Calidad (`agent_qc`)
```python
@node
def agent_qc(state: CodeTaskState) -> CodeTaskState:
    """Agente QC: ejecuta validación estática/dinámica y evaluación de convergencia."""
    
    # 1. Short-Circuiting: Prueba rápida en sandbox o ejecución de tests
    exec_result = run_tests_in_sandbox(state.code)
    if not exec_result["success"]:
        state.qc_passed = False
        state.feedback_history.append(f"Error de ejecución/tests:\n{exec_result['error_log']}")
        return state

    # 2. Revisor LLM con Output Estructurado
    qc_prompt = f"""
    Evalúa si la solución satisface el requerimiento: "{state.task_description}".
    
    Código:
    ```python
    {state.code}
    ```
    
    Responde en formato JSON estricto:
    {{
      "passed": true/false,
      "issues": "Detalle claro de cualquier fallo o descalce visual/matemático"
    }}
    """
    
    result = call_llm_qc_json(qc_prompt)
    state.qc_passed = result.get("passed", False)
    if not state.qc_passed:
        state.feedback_history.append(result.get("issues", "Error indeterminado en QC"))
        
    return state
```

### 3. Regla de Transición Cíclica y Grafo

```python
from antigravity import Workflow, END

def should_continue(state: CodeTaskState) -> str:
    if state.qc_passed:
        return "approved"
    if state.attempts >= state.max_attempts:
        return "max_attempts_reached"
    return "retry"

# Construcción del Flujo
workflow = Workflow(initial_state=CodeTaskState)
workflow.add_node("coder", agent_coder)
workflow.add_node("qc", agent_qc)
workflow.set_entry_point("coder")
workflow.add_edge("coder", "qc")

workflow.add_conditional_edges(
    source="qc",
    condition=should_continue,
    mapping={
        "retry": "coder",
        "approved": END,
        "max_attempts_reached": END
    }
)

app = workflow.compile()
```

---

## 🎯 Reglas de Oro para este Flujo

1. **Short-Circuiting Primero:** Ejecutar los comandos de verificación (`npm run build`, `python test_*.py`) en terminal **antes** de evaluar visualmente para no perder tiempo si el código no compila.
2. **Historial Inmutable:** Conservar todo el `feedback_history` para evitar que el programador vuelva a tropezar con la misma piedra.
3. **Structured Outputs:** Garantizar respuestas JSON estructuradas en las pruebas de QC.

---

## 🧪 4. Loop de Auditoría PDF No-Interactiva para Rutas Oficiales (SPCC & NEXA)

### 🔹 4.1 Objetivo del Script Autónomo de QC (`run_qc_loop_pdf.py`)
Ejecutar la validación completa de punta a punta de todas las rutas corporativas de **SPCC** y **NEXA** mediante terminal/script en Python (sin depender de la interfaz web ni del navegador), generando y auditando la misma Acta de Auditoría PDF que ve el usuario.

### 🔹 4.2 Pasos del Algoritmo del Loop QC

```mermaid
graph TD
    A[Cargar Rutas SPCC y NEXA desde DB] --> B[Setear Q=13,500 MT + Tarifas Contractuales]
    B --> C[Ejecutar spot_engine.py]
    C --> D[Generar HTML del Acta de Auditoria]
    D --> E[Convertir a PDF mediante Headless Script]
    E --> F{¿Pasó Criterios de Aceptación QC?}
    F -- SÍ --> G[✅ APROBADO: QC Passed]
    F -- NO --> H[❌ RECHAZADO: Registrar Diagnóstico de Anomalías]
    H --> I[Nodo Coder: Retornar a corregir spot_engine.py / Frontend]
    I --> C
```

### 🔹 4.3 Criterios de Aceptación y Auditoría Automática (Filtro Anti-Valores Ridículos)

El script de QC examina las variables y la estructura del Acta PDF buscando anomalías:

1. 🚫 **Búnker Ridículo / Erróneo:**
   - Para cualquier viaje con distancia total $> 500$ NM, si el costo total de búnker es $< \$20,000$ USD (por ejemplo, $\$1,500$ USD), el test falla inmediatamente con error: `INVALID_BUNKER_COST`.
2. 🚫 **Sobrecosto Portuario en Lastre (`BALLAST`):**
   - Si una pierna en lastre registra costo portuario de agencia $> \$0.00$ USD, el test falla con error: `BALLAST_PORT_COST_NOT_ZERO`.
3. 🚫 **Ingreso Bruto de Flete Cero (`LADEN`):**
   - Si una pierna cargada tiene $Q > 0$ pero su ingreso de flete resulta $\$0.00$ USD, el test falla con error: `MISSING_FREIGHT_INCOME`.
4. 🚫 **Ausencia de Fórmulas Sustituidas (Fishbowl):**
   - Si el HTML/PDF no contiene las fórmulas desglosadas con valores numéricos reales sustituidos por pierna, el test falla con error: `MISSING_FISHBOWL_FORMULAS`.

