# Requerimientos Iniciales: Maestro de Costos Portuarios

> **Fuente**: Audio de Iosef Zavala (`DESARROLLO.PORT.COSTS.FEEDBACK.IOSEF.ZAVALA.ogg`)
> **Fecha**: 16 de Julio de 2026

## 1. Nuevo Maestro de Tarifas Portuarias
Se requiere crear un nuevo maestro dedicado exclusivamente a las **Tarifas Portuarias**. 
* **Definición de Tarifa**: Es el monto que se cobra en un muelle específico por una determinada agencia (proveedor) para un barco y puerto en particular.
* **Referencia**: Estas tarifas se pueden verificar en la columna "Tarifa" de los excels de liquidación/gastos portuarios actuales.

## 2. Maestro de Proveedores (Agencias)
Dentro del Maestro de Tarifas, debe existir un Tab/Sección para gestionar los **Proveedores** (agencias marítimas o aduaneras).
* **Complejidad**: Muy simple, similar al actual "Maestro de Clientes".
* **Dato actual**: Por el momento, solo se tiene mapeado un proveedor principal: **Trans Total**.

## 3. Matriz de Gastos Portuarios
La matriz donde se consolidan todos los conceptos de gasto.
* **Alcance Regional**: Los conceptos de gasto varían dependiendo del país. Inicialmente, el desarrollo se enfocará **únicamente en Perú y Chile**.
* **Lógica de Cálculo**: 
  1. Para calcular un gasto específico, el sistema deberá traer la **Tarifa** correspondiente desde el "Maestro de Tarifas".
  2. Cada barco tiene una **Cantidad** asociada (cuánto consume de esa tarifa/concepto).
  3. El gasto final será el resultado de la **multiplicación**: `Tarifa x Cantidad`.

## 4. Notas Adicionales
* La lógica detrás de los gastos portuarios es compleja y extensa.
* El desarrollo y desglose de esta lógica se hará **de forma progresiva** ("poco a poco").
* El objetivo inicial es establecer la estructura base (Proveedores -> Tarifas -> Matriz -> Cálculo).

---
*Transcripción cruda original para referencia:*
> "Gemini vamos a empezar una bóveda para detallar cómo desarrollar el maestro de los costos portuario ya sé que teníamos uno pero vamos a tener que ampliarlo a los que es mucho más compleja ok entonces primero vamos a tener que añadir un maestro llamado maestro de tarifas portuarios te explico y luego lo verificas en los exceles que nos pasan sobre cómo calculan sus gastos portuarios hay una columna que se llama tarifa la tarifa obedece a cuando es lo que se cobra en ese muelle por determinada agencia que vendría a ser el proveedor en esa para ese barco y para esa puerta no sé si me dejo entender entonces eso las tarifas lo vas a ver en la columna de los exceles ok entonces tenemos que tener un tarifario en el tarifario donde vemos quién es el proveedor que lo ofrece por ahora tenemos un solo proveedor que es trans total pero en ese maestro de este como se llama tarifas aduaneras vamos a tener un tap que pueda crear proveedor una cosa muy simple como el maestro de clientes ya entonces ahí vamos a guardar todas las tarifas luego lo que vamos a hacer es ya en la matriz de gastos portuarios vamos a poner todos los conceptos que hay los conceptos varían entre Perú y Chile por ahora solo vamos a desarrollar Perú y Chile entonces cuando se vaya calcular uno de los gastos portuarios entonces traerás la tarifa que viene de este como se llama el maestro de tarifas luego cada barco tiene una cantidad asociada de cuánto consume de esa tarifa entonces traerás esa cantidad y el resultado que sería la multiplicación poco a poco vamos a ir a ir desgregando la lógica la lógica es compleja ya entonces a la que ya pude explicarlo bien yo no lo tengo tan clavos en mi cabeza pero poco a poco lo vamos a ir aclarando"
