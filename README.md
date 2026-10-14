# Pruebas gRPC con Cypress

Proyecto de ejemplo para probar servicios gRPC desde Cypress. Cypress ejecuta
los specs, mientras que las llamadas gRPC se realizan en el proceso Node mediante
`cy.task()` y `@connectrpc/connect-node`; así se evita intentar usar HTTP/2 desde
el navegador.

El repositorio incluye un servidor gRPC local de prueba basado en `@grpc/grpc-js`.
Implementa `users.UserService/GetUser` y no depende de WireMock Cloud ni de otro
servicio externo.

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
`USER_SERVICE_BASE_URL` en
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

## Generar código desde el proto

El código TypeScript generado se encuentra en `src/generated/user_pb.ts`.
Después de modificar el proto, puedes regenerarlo con Buf:

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
    ├── clients/                   # Cliente Connect/gRPC
    ├── constants/                 # Endpoint, metadata y status gRPC
    ├── tasks/                     # Llamadas gRPC ejecutadas en Node
    └── types/                     # Tipos de payload y resultado
grpcServer/                        # Servidor gRPC mock local
proto-files/                       # Definiciones .proto
src/generated/                     # Código TypeScript generado por Buf
cypress.config.ts                  # Configuración de Cypress y registro de tasks
buf.gen.yaml                       # Configuración de generación de código
```

## Tecnologías principales

- Cypress para ejecutar las pruebas.
- Buf y `@bufbuild/protoc-gen-es` para generar código TypeScript desde protobuf.
- `@bufbuild/protobuf`, `@connectrpc/connect` y `@connectrpc/connect-node` para
  trabajar con mensajes protobuf e invocar el servicio desde Node.
- `@grpc/grpc-js` y `@grpc/proto-loader` para levantar el servidor mock.
