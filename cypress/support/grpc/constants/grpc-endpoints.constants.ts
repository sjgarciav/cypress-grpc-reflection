/**
 * Constantes de endpoints gRPC utilizados por las pruebas.
 * Mantener las URLs en un solo lugar facilita cambiar de ambiente
 * (dev, qa, mock, etc.) sin tocar el código de los clientes o de las pruebas.
 */
export const GRPC_ENDPOINTS = {
  // Connect's Node gRPC transport uses http:// for insecure (h2c) gRPC.
  USER_SERVICE_BASE_URL: "http://0.0.0.0:50051",
} as const;
