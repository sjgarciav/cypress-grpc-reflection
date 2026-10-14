import type {GetUserTaskPayload, UserResponseData} from "../../support/grpc/types/grpc-task.types";

/**
 * Data de prueba para el happy path de UserService/GetUser.
 * Mantener el request, la metadata y la respuesta esperada en un mismo archivo
 * facilita reutilizar el caso en otros specs sin duplicar la configuración.
 */
export const getUserHappyPathData: {
    request: GetUserTaskPayload;
    expectedResponse: UserResponseData;
} = {
    request: {
        request: {
            id: "123",
        },
        metadata: {
            bearerToken: "token123",
            indicador: "yes",
        },
    },
    expectedResponse: {
        id: "123",
        name: "Alice Mocked via WireMock Cloud",
        email: "alice-cloud@example.com",
    },
};
