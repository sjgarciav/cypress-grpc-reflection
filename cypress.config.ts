import { defineConfig } from "cypress";
import { userServiceGrpcTasks } from "./cypress/support/grpc/tasks/grpc.tasks";

export default defineConfig({
  e2e: {
    // No se navega a ninguna UI: las pruebas gRPC solo usan cy.task().
    baseUrl: undefined,
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
    setupNodeEvents(on, config) {
      // Registra las tareas de Node que ejecutan las llamadas gRPC reales
      // usando @connectrpc/connect-node (requiere entorno Node, no navegador).
      on("task", userServiceGrpcTasks);

      return config;
    },
  },
});
