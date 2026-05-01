# Prompt 1: Obtener el contexto de la funcionalidad insertar candidatos

Actúa como un desarrollador senior especializado en TypeScript, arquitectura backend, Jest y TDD.

Analiza este proyecto y localiza la funcionalidad responsable de insertar candidatos en base de datos.

Resultado esperado:
- Identifica los archivos implicados en el flujo de creación de candidatos.
- Describe el flujo desde la recepción de datos hasta el guardado en base de datos.
- Señala qué función, servicio o módulo debería ser testeado.
- Identifica dependencias externas que podrían necesitar mock.
- No generes código todavía.

# Prompt 2: extraer criterios de aceptación

A partir del flujo de insertar de candidatos identificado, extrae criterios de aceptación testeables utilizando formato Gherkin

Resultado esperado:
- Define criterios de aceptación claros y pequeños.
- Incluye criterios para recepción/procesamiento de datos.
- Incluye criterios para guardado en base de datos.
- Evita criterios E2E, navegador, HTTP real o base de datos real.
- Indica qué comportamiento valida cada criterio.
- Prioriza criterios simples y relevantes.

# Prompt 3: generar tests caso a caso aplicando TDD

Actúa como un experto en testing con TypeScript usando Jest, siguiendo TDD con Red-Green-Refactor.

Dados los criterios de aceptación identificados para la funcionalidad insertar de candidatos, tu misión es procesar todos los criterios de aceptación paso a paso y escribir tests unitarios que garanticen que cada criterio se cumple.

## Proceso obligatorio

Trabaja los criterios de aceptación uno por uno.

Para cada criterio:

1. Indica qué criterio de aceptación vas a implementar.
2. Explica brevemente el comportamiento esperado.
3. Escribe los tests unitarios necesarios usando Jest.
4. Incluye buenas prácticas de testing:
   - Arrange / Act / Assert
   - asserts significativos
   - tests independientes
   - nombres descriptivos que expliquen qué comportamiento se esta verificando
   - mocks solo cuando sean necesarios
5. Añade los casos límite relevantes derivados del criterio o del código existente.

## Ciclo TDD obligatorio

Para cada criterio, indica claramente:

### Red
- Qué test debe fallar inicialmente.
- Qué comportamiento aún no está implementado o no está garantizado.

### Green
- Qué implementación mínima haría pasar el test.
- Usa:
  - Fake It si ayuda a validar primero el contrato.
  - Triangulation si un nuevo caso obliga a generalizar.
  - Obvious Implementation si la solución es directa.

### Refactor
- Propón refactor solo si mejora claridad, mantenibilidad o elimina duplicación.

## Dependencias externas

Si el criterio implica base de datos, Prisma u otra dependencia externa:

- Mockea la dependencia dentro de ese ciclo.
- No uses base de datos real.
- Verifica las llamadas relevantes al mock.

## Control de avance

Después de completar cada criterio de aceptación:

- Detente.
- No proceses el siguiente criterio automáticamente.
- Pregunta explícitamente:

“¿Quieres que continúe con el siguiente criterio de aceptación?”

Solo continúa cuando el usuario responda “ok”, “sí”, “continúa” o equivalente.

## Restricciones

- No generes toda la suite de golpe.
- No saltes criterios.
- No hagas tests E2E.
- No uses base de datos real.
- No generes tests redundantes o que solo aumenten coverage.
- Para cada criterio, genera los tests necesarios y relevantes, no necesariamente uno solo.

## Resultado esperado

- Tests unitarios con Jest y TypeScript.
- Tests que garanticen que cada criterio de aceptación se cumple.
- Casos felices, inválidos y límites cuando aporten valor.
- Evolución incremental con Red-Green-Refactor.
- Generar los test en el archivo:
  `backend/src/tests/tests-iniciales.test.ts`

# Prompt 4: Extra. Revisar calidad de los tests

Actúa como revisor experto en testing unitario, Jest y buenas prácticas TDD.

Revisa el archivo `backend/src/tests/tests-iniciales.test.ts`.

Resultado esperado:
- Verifica que los tests cubren recepción/procesamiento de datos.
- Verifica que los tests cubren guardado en base de datos.
- Comprueba que no se usa base de datos real.
- Comprueba que Prisma u otras dependencias externas están mockeadas solo cuando es necesario.
- Detecta tests frágiles o demasiado acoplados a detalles internos.
- Detecta tests que solo aumentan coverage sin validar comportamiento real.
- Verifica que todos los tests tienen `expect` significativo.
- Sugiere simplificaciones si hay sobreingeniería.
- Refactoriza los tests en base a las mejoras que identifiques