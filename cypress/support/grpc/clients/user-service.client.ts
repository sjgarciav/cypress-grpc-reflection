import { createClient, type Client } from "@connectrpc/connect";
import { createGrpcTransport } from "@connectrpc/connect-node";
import { UserService } from "../../../../src/generated/user_pb";
import { GRPC_ENDPOINTS } from "../constants/grpc-endpoints.constants";

/**
 * Crea el cliente gRPC del servicio UserService.
 *
 * Usa `createGrpcTransport` de @connectrpc/connect-node porque el protocolo
 * gRPC real (HTTP/2 + trailers) solo puede ejecutarse en un entorno Node,
 * por eso el cliente se instancia dentro de una tarea de Cypress (cy.task)
 * y no directamente en el navegador donde corren los specs.
 */
export function createUserServiceClient(): Client<typeof UserService> {
  const transport = createGrpcTransport({
    baseUrl: GRPC_ENDPOINTS.USER_SERVICE_BASE_URL,
  });

  return createClient(UserService, transport);
}
