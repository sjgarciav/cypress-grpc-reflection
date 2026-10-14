import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import * as path from "node:path";
import { GRPC_ENDPOINTS } from "../constants/grpc-endpoints.constants";
import type { GetUserRequestPayload, UserResponseData } from "../types/grpc-task.types";

const USER_SERVICE_SYMBOL = "users.UserService";
const REFLECTION_PROTO_PATH = path.resolve(
  __dirname,
  "../../../../proto-files/reflection/v1/reflection.proto",
);

/** Opciones de proto-loader: deben coincidir con las usadas por grpcServer. */
const PROTO_LOADER_OPTIONS: protoLoader.Options = {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

/** Forma del cliente gRPC de UserService tal como lo construye grpc-js en tiempo de ejecución. */
export interface UserServiceClient extends grpc.Client {
  getUser(
    request: GetUserRequestPayload,
    metadata: grpc.Metadata,
    callback: (error: grpc.ServiceError | null, response?: UserResponseData) => void,
  ): void;
}

type UserServiceConstructor = new (address: string, credentials: grpc.ChannelCredentials) => UserServiceClient;

interface ServerReflectionResponse {
  fileDescriptorResponse?: { fileDescriptorProto: Buffer[] };
  errorResponse?: { errorCode: number; errorMessage: string };
}

interface ServerReflectionClient extends grpc.Client {
  serverReflectionInfo(): grpc.ClientDuplexStream<unknown, ServerReflectionResponse>;
}

type ServerReflectionConstructor = new (
  address: string,
  credentials: grpc.ChannelCredentials,
) => ServerReflectionClient;

// Se cachea el constructor del servicio para no repetir la consulta de reflection en cada test.
let cachedUserServiceConstructor: UserServiceConstructor | undefined;

/**
 * Carga el stub del servicio estándar `grpc.reflection.v1.ServerReflection`
 * desde un .proto vendorizado localmente (protocolo público y estable de gRPC,
 * no código de negocio generado), para poder consultarlo contra grpcServer.
 */
function loadServerReflectionConstructor(): ServerReflectionConstructor {
  const packageDefinition = protoLoader.loadSync(REFLECTION_PROTO_PATH, PROTO_LOADER_OPTIONS);
  const grpcObject = grpc.loadPackageDefinition(packageDefinition) as unknown as {
    grpc: { reflection: { v1: { ServerReflection: ServerReflectionConstructor } } };
  };

  return grpcObject.grpc.reflection.v1.ServerReflection;
}

/** Codifica un entero como varint protobuf (LEB128 sin signo). */
function encodeVarint(value: number): Buffer {
  const bytes: number[] = [];
  let remaining = value;

  while (remaining > 0x7f) {
    bytes.push((remaining & 0x7f) | 0x80);
    remaining >>>= 7;
  }
  bytes.push(remaining);

  return Buffer.from(bytes);
}

/**
 * Reconstruye el binario de un `FileDescriptorSet` a partir de los
 * `FileDescriptorProto` serializados que devuelve el servicio de reflection,
 * envolviéndolos como el campo repetido `file = 1` (tag + longitud + bytes).
 */
function buildFileDescriptorSet(fileDescriptorProtos: Buffer[]): Buffer {
  const fieldTag = encodeVarint((1 << 3) | 2); // field 1, wire type 2 (length-delimited)
  const chunks = fileDescriptorProtos.flatMap((fileDescriptorProto) => [
    fieldTag,
    encodeVarint(fileDescriptorProto.length),
    fileDescriptorProto,
  ]);

  return Buffer.concat(chunks);
}

/** Consulta vía reflection los `FileDescriptorProto` (con sus dependencias) que declaran `symbol`. */
function fetchFileDescriptorProtos(symbol: string): Promise<Buffer[]> {
  return new Promise((resolve, reject) => {
    const ServerReflection = loadServerReflectionConstructor();
    const reflectionClient = new ServerReflection(
      GRPC_ENDPOINTS.USER_SERVICE_ADDRESS,
      grpc.credentials.createInsecure(),
    );
    const call = reflectionClient.serverReflectionInfo();

    call.on("data", (response: ServerReflectionResponse) => {
      if (response.errorResponse) {
        reject(
          new Error(
            `gRPC reflection error (${response.errorResponse.errorCode}): ${response.errorResponse.errorMessage}`,
          ),
        );
      } else {
        resolve(response.fileDescriptorResponse?.fileDescriptorProto ?? []);
      }
      call.end();
    });
    call.on("error", reject);
    call.on("end", () => reflectionClient.close());

    call.write({ fileContainingSymbol: symbol });
  });
}

/**
 * Obtiene la definición de `users.UserService` consultando el servicio de
 * gRPC Server Reflection expuesto por grpcServer, en lugar de depender de
 * código generado estáticamente (p. ej. `src/generated/user_pb.ts`).
 */
async function resolveUserServiceConstructor(): Promise<UserServiceConstructor> {
  if (cachedUserServiceConstructor) {
    return cachedUserServiceConstructor;
  }

  const fileDescriptorProtos = await fetchFileDescriptorProtos(USER_SERVICE_SYMBOL);
  const descriptorSet = buildFileDescriptorSet(fileDescriptorProtos);
  const packageDefinition = protoLoader.loadFileDescriptorSetFromBuffer(descriptorSet, PROTO_LOADER_OPTIONS);
  const grpcObject = grpc.loadPackageDefinition(packageDefinition) as unknown as {
    users: { UserService: UserServiceConstructor };
  };

  cachedUserServiceConstructor = grpcObject.users.UserService;
  return cachedUserServiceConstructor;
}

/**
 * Crea el cliente gRPC de UserService resolviendo su esquema en tiempo real
 * a través de reflection. Se instancia por llamada (igual que antes con
 * Connect) para mantener aislada cada invocación de `cy.task`.
 */
export async function createUserServiceClient(): Promise<UserServiceClient> {
  const UserService = await resolveUserServiceConstructor();
  return new UserService(GRPC_ENDPOINTS.USER_SERVICE_ADDRESS, grpc.credentials.createInsecure());
}


