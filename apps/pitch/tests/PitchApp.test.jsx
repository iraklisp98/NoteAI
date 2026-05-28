import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PitchApp from '../src/PitchApp.jsx';
import { pitchSlides } from '../src/content/pitchCopy.js';

describe('CAREFLOW pitch deck', () => {
  it('renders all required slides in order', () => {
    render(<PitchApp />);

    const headings = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent);
    expect(headings).toEqual(pitchSlides.map((slide) => slide.title));
  });

  it('includes the insurance, safety, and Android future story', () => {
    render(<PitchApp />);

    expect(screen.getByRole('heading', { name: /insurance buyer value/i })).toBeInTheDocument();
    expect(screen.getAllByText(/avoidable readmissions/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: /safety boundaries/i })).toBeInTheDocument();
    expect(screen.getByText(/does not diagnose, prescribe, or replace clinicians/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /future android implementation/i })).toBeInTheDocument();
    expect(screen.getByText(/push reminders/i)).toBeInTheDocument();
  });

  it('shows the demo case, live path, and fallback path', () => {
    render(<PitchApp />);

    expect(screen.getAllByText(/pneumonia discharge/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/upload pdf/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/sample note fallback/i)).toBeInTheDocument();
    expect(screen.getAllByText(/ibuprofen/i).length).toBeGreaterThan(0);
  });
});
