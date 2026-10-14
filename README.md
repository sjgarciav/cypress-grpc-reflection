# Pruebas gRPC con Cypress

Proyecto de ejemplo para probar servicios gRPC desde Cypress. Cypress ejecuta
los specs, mientras que las llamadas gRPC se realizan en el proceso Node mediante
`cy.task()` y `@grpc/grpc-js`; así se evita intentar usar HTTP/2 desde el navegador.

El repositorio incluye un servidor gRPC local de prueba basado en `@grpc/grpc-js`.
Implementa `users.UserService/GetUser`, expone **gRPC Server Reflection**
(`@grpc/reflection`) y no depende de WireMock Cloud ni de otro servicio externo.

Gracias a la reflection, el cliente de Cypress descubre en tiempo real la
definición de `UserService` directamente desde el servidor en ejecución: no
necesita el `.proto` del negocio ni código pre-generado (p. ej.
`src/generated/user_pb.ts`). Lo único vendorizado localmente es
`proto-files/reflection/v1/reflection.proto`, que es el protocolo estándar y
estable de gRPC Server Reflection (no código de negocio).

## Requisitos

- Node.js y npm.
- `grpcurl` (opcional, solo para invocar el servicio manualmente).

## Instalación

Instala las dependencias del proyecto y del servidor mock desde la raíz:

```bash
npm ci
npm --prefix grpcServer ci
```

## Ejecutar la prueba

Inicia el servidor mock en una terminal:

```bash
npm --prefix grpcServer start
```

Por defecto escucha en `0.0.0.0:50051`. En otra terminal, ejecuta el spec:

```bash
npm run cy:run -- --spec cypress/e2e/user-service/get-user.cy.ts
```

Para abrir Cypress en modo interactivo:

```bash
npm run cy:open
```

Si cambias el puerto del servidor usando `PORT`, actualiza también
`USER_SERVICE_ADDRESS` en
`cypress/support/grpc/constants/grpc-endpoints.constants.ts`.

## Servicio y prueba incluidos

El proto `proto-files/user.proto` define `users.UserService/GetUser`. El servidor
mock responde correctamente cuando recibe el ID `123`, una metadata
`authorization` con un Bearer token válido y la metadata `indicador` con el valor
`yes`. La prueba incluida cubre únicamente este caso exitoso (*happy path*).

La respuesta esperada es:

```json
{
  "id": "123",
  "name": "Alice Mocked via WireMock Cloud",
  "email": "alice-cloud@example.com"
}
```

El nombre del usuario es solo parte de los datos de la respuesta mock; no implica
que se realice una conexión a WireMock Cloud.

## Invocar el servicio con grpcurl

Con el servidor en ejecución, puedes hacer una llamada manual. Sustituye
`<BEARER_TOKEN>` por un token aceptado por el servidor:

```bash
grpcurl \
  -plaintext \
  -import-path ./proto-files \
  -proto user.proto \
  -H 'authorization: Bearer <BEARER_TOKEN>' \
  -H 'indicador: yes' \
  -d '{"id":"123"}' \
  127.0.0.1:50051 \
  users.UserService/GetUser
```

## Generar código desde el proto (opcional)

Las pruebas de Cypress ya no requieren código pre-generado: obtienen la
definición de `UserService` vía reflection en tiempo de ejecución. El comando
de Buf se mantiene por si algún otro consumidor del repo necesita el código
TypeScript generado en `src/generated/user_pb.ts`:

```bash
npm run proto:generate
```

## Estructura principal

```text
cypress/
├── e2e/user-service/              # Specs de Cypress
├── fixtures/user-service/         # Request y respuesta esperada
└── support/grpc/
    ├── assertions/                # Aserciones de status y respuesta
    ├── clients/                   # Cliente gRPC que descubre el esquema vía reflection
    ├── constants/                 # Endpoint, metadata y status gRPC
    ├── tasks/                     # Llamadas gRPC ejecutadas en Node
    └── types/                     # Tipos de payload y resultado
grpcServer/                        # Servidor gRPC mock local (con reflection)
proto-files/
├── user.proto                     # Definición del negocio (UserService)
└── reflection/v1/reflection.proto # Protocolo estándar de gRPC Server Reflection
src/generated/                     # Código TypeScript generado por Buf (no usado por los tests)
cypress.config.ts                  # Configuración de Cypress y registro de tasks
buf.gen.yaml                       # Configuración de generación de código (opcional)
```

## Tecnologías principales

- Cypress para ejecutar las pruebas.
- `@grpc/grpc-js` y `@grpc/proto-loader` para levantar el servidor mock y para
  invocarlo desde las pruebas de Cypress.
- `@grpc/reflection` en el servidor para exponer gRPC Server Reflection.
- El cliente de pruebas consulta la reflection del servidor en tiempo real
  (usando únicamente `@grpc/grpc-js` + `@grpc/proto-loader`), por lo que no
  depende de código protobuf pre-generado para invocar `UserService`.
- Buf y `@bufbuild/protoc-gen-es` siguen disponibles de forma opcional para
  generar código TypeScript desde el proto (`src/generated/user_pb.ts`), por
  si se necesita en otro contexto distinto a las pruebas de Cypress.
