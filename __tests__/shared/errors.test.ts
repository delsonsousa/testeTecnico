import {
  NetworkError,
  NotFoundError,
  UnexpectedError,
  ValidationError,
} from '@shared/errors/AppError';

describe('App errors', () => {
  it('keeps stable codes and readable names', () => {
    expect(new NetworkError()).toMatchObject({
      code: 'NETWORK',
      name: 'NetworkError',
    });
    expect(new NotFoundError()).toMatchObject({
      code: 'NOT_FOUND',
      name: 'NotFoundError',
    });
    expect(new ValidationError('inválido')).toMatchObject({
      code: 'VALIDATION',
      name: 'ValidationError',
      message: 'inválido',
    });
    expect(new UnexpectedError()).toMatchObject({
      code: 'UNEXPECTED',
      name: 'UnexpectedError',
    });
  });
});
