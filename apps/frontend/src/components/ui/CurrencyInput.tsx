import React from 'react';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (value: number) => void;
}

export default function CurrencyInput({ value, onChange, ...props }: CurrencyInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    onChange(val ? parseInt(val, 10) : 0);
  };

  return (
    <input
      type="text"
      value={value === 0 ? '' : new Intl.NumberFormat('vi-VN').format(value)}
      onChange={handleChange}
      {...props}
    />
  );
}
