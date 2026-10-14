import { getUserHappyPathData } from "../../fixtures/user-service/get-user.data";
import { UserResponseAssertions } from "../../support/grpc/assertions/user-response.assertions";
import type { GrpcTaskResult, UserResponseData } from "../../support/grpc/types/grpc-task.types";

/**
 * Suite de pruebas del servicio gRPC local UserService.GetUser.
 */
describe("UserService/GetUser", () => {
  it("Happy path: retorna el usuario esperado con status OK (0)", () => {
    const { request, expectedResponse } = getUserHappyPathData;

    // La llamada gRPC real se ejecuta en la tarea de Node "grpc:userService:getUser",
    // ya que el protocolo gRPC (HTTP/2 + trailers) no puede invocarse desde el navegador.
    cy.task<GrpcTaskResult<UserResponseData>>("grpc:userService:getUser", request).then((result) => {
      UserResponseAssertions.assertHappyPath(result, expectedResponse);
    });
  });
});
