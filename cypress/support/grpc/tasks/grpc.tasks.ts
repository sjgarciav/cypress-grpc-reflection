import * as grpc from "@grpc/grpc-js";
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
  const client = await createUserServiceClient();

  const metadata = new grpc.Metadata();
  metadata.set(GRPC_METADATA_KEYS.AUTHORIZATION, `Bearer ${payload.metadata.bearerToken}`);
  metadata.set(GRPC_METADATA_KEYS.INDICADOR, payload.metadata.indicador);

  try {
    return await new Promise<GrpcTaskResult<UserResponseData>>((resolve) => {
      client.getUser(payload.request, metadata, (error, response) => {
        if (error) {
          resolve({
            statusCode: error.code ?? GRPC_STATUS_CODES.UNKNOWN,
            success: false,
            data: null,
            errorMessage: error.details ?? error.message,
          });
          return;
        }

        resolve({
          statusCode: GRPC_STATUS_CODES.OK,
          success: true,
          data: {
            id: response!.id,
            name: response!.name,
            email: response!.email,
          },
          errorMessage: null,
        });
      });
    });
  } finally {
    client.close();
  }
}

/**
 * Registro de tareas gRPC relacionadas con UserService.
 * Este objeto se conecta a Cypress mediante `on('task', ...)` en cypress.config.ts.
 * Las tareas corren en el proceso Node de Cypress, por lo que aquí sí se puede
 * usar @grpc/grpc-js sin restricciones del navegador.
 */
export const userServiceGrpcTasks = {
  "grpc:userService:getUser": callGetUser,
};
