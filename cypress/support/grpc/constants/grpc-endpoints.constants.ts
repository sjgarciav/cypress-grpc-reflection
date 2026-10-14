/**
 * Constantes de endpoints gRPC utilizados por las pruebas.
 * Mantener las URLs en un solo lugar facilita cambiar de ambiente
 * (dev, qa, mock, etc.) sin tocar el código de los clientes o de las pruebas.
 */
export const GRPC_ENDPOINTS = {
  // Dirección "host:port" (sin esquema) usada por el cliente nativo de @grpc/grpc-js.
  USER_SERVICE_ADDRESS: "0.0.0.0:50051",
} as const;
