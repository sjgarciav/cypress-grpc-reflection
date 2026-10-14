# gRPC mock server

This server implements `users.UserService/GetUser` from
[`../proto-files/user.proto`](../proto-files/user.proto).

The request succeeds only when all of these conditions are met:

- The request body is `{ "id": "123" }`.
- The `authorization` metadata contains a valid `Bearer` token.
- The `indicador` metadata is exactly `yes`.

## Start

From the repository root:

```bash
npm --prefix grpcServer install
npm --prefix grpcServer start
```

The server listens on `0.0.0.0:50051`. Set `PORT` to use another port:

```bash
PORT=50052 npm --prefix grpcServer start
```
