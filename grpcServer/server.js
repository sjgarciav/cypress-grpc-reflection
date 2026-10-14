'use strict';

const path = require('node:path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = path.resolve(__dirname, '..', 'proto-files', 'user.proto');
const PORT = process.env.PORT || '50051';
const BEARER_TOKEN_REGEX = /^Bearer [A-Za-z0-9\-._~+/]+=*$/;

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const users = grpc.loadPackageDefinition(packageDefinition).users;

function getMetadataValue(metadata, key) {
  const values = metadata.get(key);
  return values.length > 0 && typeof values[0] === 'string' ? values[0] : undefined;
}

function getUser(call, callback) {
  const request = call.request;
  const authorization = getMetadataValue(call.metadata, 'authorization');
  const indicador = getMetadataValue(call.metadata, 'indicador');

  if (request.id !== '123') {
    callback({
      code: grpc.status.INVALID_ARGUMENT,
      details: 'The request must contain id "123".',
    });
    return;
  }

  if (!authorization || !BEARER_TOKEN_REGEX.test(authorization)) {
    callback({
      code: grpc.status.UNAUTHENTICATED,
      details: 'A valid Bearer token is required in the authorization metadata.',
    });
    return;
  }

  if (indicador !== 'yes') {
    callback({
      code: grpc.status.INVALID_ARGUMENT,
      details: 'The indicador metadata must have the value "yes".',
    });
    return;
  }

  callback(null, {
    id: '123',
    name: 'Alice Mocked via WireMock Cloud',
    email: 'alice-cloud@example.com',
  });
}

function startServer() {
  const server = new grpc.Server();
  server.addService(users.UserService.service, { getUser });
  server.bindAsync(
    `0.0.0.0:${PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (error, boundPort) => {
      if (error) {
        console.error('Failed to start gRPC server:', error);
        process.exitCode = 1;
        return;
      }

      console.log(`gRPC UserService listening on 0.0.0.0:${boundPort}`);
    },
  );
}

startServer();
