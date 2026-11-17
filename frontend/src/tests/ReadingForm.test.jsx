import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ReadingForm from '../components/ReadingForm';

describe('ReadingForm Component - Validation Rules & Submission', () => {
  it('1. Value is required: displays "Please enter a glucose value." when value is empty', async () => {
    const handleSubmit = vi.fn();
    render(<ReadingForm onSubmit={handleSubmit} />);

    const submitBtn = screen.getByTestId('submit-reading-button');
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(screen.getByText('Please enter a glucose value.')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('2. Value must be a whole number between 40 and 600: displays "Value must be between 40 and 600 mg/dl."', async () => {
    const handleSubmit = vi.fn();
    render(<ReadingForm onSubmit={handleSubmit} />);

    const valueInput = screen.getByTestId('reading-value-input');
    const submitBtn = screen.getByTestId('submit-reading-button');

    // Test value below 40
    await act(async () => {
      fireEvent.change(valueInput, { target: { value: '30' } });
      fireEvent.click(submitBtn);
    });
    expect(screen.getByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();

    // Test value above 600
    await act(async () => {
      fireEvent.change(valueInput, { target: { value: '601' } });
      fireEvent.click(submitBtn);
    });
    expect(screen.getByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();

    // Test decimal value (not a whole number)
    await act(async () => {
      fireEvent.change(valueInput, { target: { value: '115.5' } });
      fireEvent.click(submitBtn);
    });
    expect(screen.getByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('3. Date cannot be in the future: displays "Date cannot be in the future."', async () => {
    const handleSubmit = vi.fn();
    render(<ReadingForm onSubmit={handleSubmit} />);

    const dateInput = screen.getByTestId('reading-date-input');
    const valueInput = screen.getByTestId('reading-value-input');
    const submitBtn = screen.getByTestId('submit-reading-button');

    await act(async () => {
      fireEvent.change(valueInput, { target: { value: '120' } });
      fireEvent.change(dateInput, { target: { value: '2099-01-01' } });
      fireEvent.click(submitBtn);
    });

    expect(screen.getByText('Date cannot be in the future.')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('Submits successfully when inputs satisfy all validation rules', async () => {
    const handleSubmit = vi.fn().mockResolvedValue({});
    render(<ReadingForm onSubmit={handleSubmit} />);

    const dateInput = screen.getByTestId('reading-date-input');
    const slotSelect = screen.getByTestId('reading-slot-select');
    const valueInput = screen.getByTestId('reading-value-input');
    const submitBtn = screen.getByTestId('submit-reading-button');

    await act(async () => {
      fireEvent.change(dateInput, { target: { value: '2026-10-15' } });
      fireEvent.change(slotSelect, { target: { value: 'After lunch' } });
      fireEvent.change(valueInput, { target: { value: '135' } });
      fireEvent.click(submitBtn);
    });

    expect(handleSubmit).toHaveBeenCalledWith({
      date: '2026-10-15',
      slot: 'After lunch',
      value: 135,
    });
  });
});
