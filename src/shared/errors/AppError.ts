export abstract class AppError extends Error {
  abstract readonly code: string;
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class NetworkError extends AppError {
  readonly code = 'NETWORK';
  constructor(message = 'Sem conexão com o serviço de clima. Tente novamente.') {
    super(message);
  }
}

export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND';
  constructor(message = 'Não encontramos dados para essa busca.') {
    super(message);
  }
}

export class ValidationError extends AppError {
  readonly code = 'VALIDATION';
}

export class UnexpectedError extends AppError {
  readonly code = 'UNEXPECTED';
  constructor(message = 'Algo deu errado. Tente novamente em instantes.') {
    super(message);
  }
}
