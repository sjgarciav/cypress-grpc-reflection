/**
 * Tipos compartidos entre las tareas de Node (cypress/support/grpc/tasks)
 * y los specs de Cypress que consumen sus resultados vía cy.task().
 */

/** Payload que reciben las tareas gRPC del servicio de usuarios. */
export interface GetUserRequestPayload {
  id: string;
}

/** Metadata required by the UserService/GetUser RPC. */
export interface GetUserRequestMetadata {
  bearerToken: string;
  indicador: string;
}

/** Input passed to the Cypress task: protobuf request plus gRPC metadata. */
export interface GetUserTaskPayload {
  request: GetUserRequestPayload;
  metadata: GetUserRequestMetadata;
}

/** Estructura de datos "cruda" que devuelve el servidor cuando la llamada es exitosa. */
export interface UserResponseData {
  id: string;
  name: string;
  email: string;
}

/**
 * Resultado normalizado que devuelve la tarea `grpc:getUser` a los specs.
 * Se serializa como JSON plano porque cy.task solo admite datos serializables.
 */
export interface GrpcTaskResult<T> {
  /** Código de estado gRPC de la respuesta (0 = OK). */
  statusCode: number;
  /** Indica si la llamada terminó exitosamente (statusCode === OK). */
  success: boolean;
  /** Mensaje/response de la respuesta cuando la llamada fue exitosa. */
  data: T | null;
  /** Mensaje de error de gRPC cuando la llamada falló. */
  errorMessage: string | null;
}
