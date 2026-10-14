import { GRPC_STATUS_CODES, GRPC_STATUS_NAMES } from "../constants/grpc-status.constants";
import type { GrpcTaskResult, UserResponseData } from "../types/grpc-task.types";

/**
 * Clase de utilidades de aserción para las respuestas del servicio gRPC de usuarios.
 *
 * Centralizar los `expect` en una clase separada permite:
 *  - Reutilizar las validaciones en varios specs sin duplicar código.
 *  - Mantener los tests (*.cy.ts) enfocados en el "qué" se prueba,
 *    dejando el "cómo" se valida encapsulado aquí.
 */
export class UserResponseAssertions {
  /**
   * Verifica que la llamada gRPC haya finalizado con el código de estado OK (0).
   */
  static assertStatusOk(result: GrpcTaskResult<UserResponseData>): void {
    const expectedCode = GRPC_STATUS_CODES.OK;

    expect(
      result.statusCode,
      `Se esperaba el código gRPC ${expectedCode} (${GRPC_STATUS_NAMES[expectedCode]}) ` +
        `pero se obtuvo ${result.statusCode} (${GRPC_STATUS_NAMES[result.statusCode] ?? "DESCONOCIDO"}). ` +
        `Detalle: ${result.errorMessage ?? "sin mensaje de error"}`,
    ).to.equal(expectedCode);

    expect(result.success, "Se esperaba que la llamada gRPC fuera exitosa (success = true)").to.be.true;
  }

  /**
   * Verifica que el mensaje UserResponse devuelto coincida exactamente
   * con los datos esperados definidos en la data de prueba.
   */
  static assertUserResponseMatches(actual: UserResponseData | null, expected: UserResponseData): void {
    expect(actual, "Se esperaba recibir un UserResponse en la respuesta").to.not.be.null;

    expect(actual!.id, "El campo 'id' de la respuesta no coincide").to.equal(expected.id);
    expect(actual!.name, "El campo 'name' de la respuesta no coincide").to.equal(expected.name);
    expect(actual!.email, "El campo 'email' de la respuesta no coincide").to.equal(expected.email);
  }

  /**
   * Assertion de conveniencia que agrupa la validación completa del happy path:
   * código de estado OK + contenido del mensaje de respuesta.
   */
  static assertHappyPath(result: GrpcTaskResult<UserResponseData>, expected: UserResponseData): void {
    this.assertStatusOk(result);
    this.assertUserResponseMatches(result.data, expected);
  }
}
