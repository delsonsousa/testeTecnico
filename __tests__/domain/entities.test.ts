import { formatCityLabel } from '@domain/entities/City';
import { makeCity } from '../fixtures';

describe('formatCityLabel', () => {
  it('joins available city parts without empty separators', () => {
    expect(formatCityLabel(makeCity())).toBe('Rio de Janeiro, Rio de Janeiro, Brasil');
    expect(formatCityLabel(makeCity({ admin1: null, country: '' }))).toBe(
      'Rio de Janeiro',
    );
  });
});
