import { ConnectError } from "@connectrpc/connect";
import { createUserServiceClient } from "../clients/user-service.client";
import { GRPC_METADATA_KEYS } from "../constants/grpc-metadata.constants";
import { GRPC_STATUS_CODES } from "../constants/grpc-status.constants";
import type { GetUserTaskPayload, GrpcTaskResult, UserResponseData } from "../types/grpc-task.types";

/**
 * Ejecuta GetUser contra el servidor gRPC local con la autorización y metadata requeridas.
 * Se encapsula en una función independiente para poder reutilizarla desde
 * distintas tareas de Cypress y para facilitar pruebas unitarias del propio
 * framework si se necesitaran en el futuro.
 */
async function callGetUser(payload: GetUserTaskPayload): Promise<GrpcTaskResult<UserResponseData>> {
  const client = createUserServiceClient();

  try {
    const response = await client.getUser(
      payload.request,
      {
        headers: {
          [GRPC_METADATA_KEYS.AUTHORIZATION]: `Bearer ${payload.metadata.bearerToken}`,
          [GRPC_METADATA_KEYS.INDICADOR]: payload.metadata.indicador,
        },
      },
    );

    return {
      statusCode: GRPC_STATUS_CODES.OK,
      success: true,
      data: {
        id: response.id,
        name: response.name,
        email: response.email,
      },
      errorMessage: null,
    };
  } catch (error) {
    // ConnectError expone el código de estado gRPC equivalente y el mensaje del servidor.
    const connectError = ConnectError.from(error);

    return {
      statusCode: connectError.code,
      success: false,
      data: null,
      errorMessage: connectError.message,
    };
  }
}

/**
 * Registro de tareas gRPC relacionadas con UserService.
 * Este objeto se conecta a Cypress mediante `on('task', ...)` en cypress.config.ts.
 * Las tareas corren en el proceso Node de Cypress, por lo que aquí sí se puede
 * usar @connectrpc/connect-node sin restricciones del navegador.
 */
export const userServiceGrpcTasks = {
  "grpc:userService:getUser": callGetUser,
};
