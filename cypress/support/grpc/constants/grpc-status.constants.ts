/**
 * Constantes con los códigos de estado estándar de gRPC.
 * Referencia oficial: https://grpc.io/docs/guides/status-codes/
 *
 * Se centralizan aquí para que las pruebas y los asserts no usen
 * "números mágicos" y sean fáciles de mantener.
 */
export const GRPC_STATUS_CODES = {
  OK: 0,
  CANCELLED: 1,
  UNKNOWN: 2,
  INVALID_ARGUMENT: 3,
  DEADLINE_EXCEEDED: 4,
  NOT_FOUND: 5,
  ALREADY_EXISTS: 6,
  PERMISSION_DENIED: 7,
  RESOURCE_EXHAUSTED: 8,
  FAILED_PRECONDITION: 9,
  ABORTED: 10,
  OUT_OF_RANGE: 11,
  UNIMPLEMENTED: 12,
  INTERNAL: 13,
  UNAVAILABLE: 14,
  DATA_LOSS: 15,
  UNAUTHENTICATED: 16,
} as const;

/** Nombres legibles asociados a cada código, útiles para mensajes de error en los asserts. */
export const GRPC_STATUS_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(GRPC_STATUS_CODES).map(([name, code]) => [code, name]),
);

export type GrpcStatusCode = (typeof GRPC_STATUS_CODES)[keyof typeof GRPC_STATUS_CODES];
