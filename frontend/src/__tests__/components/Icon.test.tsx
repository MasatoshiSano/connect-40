import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Icon } from '../../components/ui/Icon';

describe('Icon Component', () => {
  it('renders with default props', () => {
    const { container } = render(<Icon name="home" />);
    const icon = container.querySelector('.material-symbols-outlined');
    expect(icon).toBeTruthy();
    expect(icon?.textContent).toBe('home');
  });

  it('renders filled variant', () => {
    const { container } = render(<Icon name="home" filled />);
    const icon = container.querySelector('.material-symbols-filled');
    expect(icon).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = render(<Icon name="home" className="custom-class" />);
    const icon = container.querySelector('.custom-class');
    expect(icon).toBeTruthy();
  });

  it('renders with different sizes', () => {
    const { container: small } = render(<Icon name="home" size="sm" />);
    const { container: large } = render(<Icon name="home" size="lg" />);

    expect(small.querySelector('.text-base')).toBeTruthy();
    expect(large.querySelector('.text-2xl')).toBeTruthy();
  });
});
