/**
 * Erros de domínio. Carregam um status HTTP para o error handler global
 * traduzir em respostas consistentes, sem espalhar try/catch pelas rotas.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Requisição inválida', code?: string) {
    super(400, message, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Não autenticado', code?: string) {
    super(401, message, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acesso negado', code?: string) {
    super(403, message, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado', code?: string) {
    super(404, message, code);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflito', code?: string) {
    super(409, message, code);
  }
}
