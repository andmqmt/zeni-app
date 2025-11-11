"use client";

import { useState, useEffect } from "react";

interface CurrencyInputProps {
  value: number | string;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function CurrencyInput({
  value,
  onChange,
  placeholder = "0,00",
  className = "",
  required = false,
  disabled = false,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState("");

  // Formata número para string com vírgula (ex: 1234.56 -> "1.234,56")
  const formatValue = (num: number): string => {
    if (num === 0 || isNaN(num)) return "";
    return num.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Converte string formatada para número (ex: "1.234,56" -> 1234.56)
  const parseValue = (str: string): number => {
    if (!str || str.trim() === "") return 0;
    // Remove pontos (separador de milhar) e substitui vírgula por ponto
    const cleaned = str.replace(/\./g, "").replace(",", ".");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Sincroniza valor inicial/externo
  useEffect(() => {
    const numValue = typeof value === "string" ? parseValue(value) : value;
    setDisplayValue(formatValue(numValue));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    // Permite apenas números, vírgula e ponto
    const cleaned = input.replace(/[^\d,]/g, "");

    // Permite apenas uma vírgula
    const parts = cleaned.split(",");
    let formatted = parts[0];
    if (parts.length > 1) {
      formatted = parts[0] + "," + parts[1].slice(0, 2); // Limita a 2 casas decimais
    }

    setDisplayValue(formatted);

    // Converte para número e notifica onChange
    const numValue = parseValue(formatted);
    onChange(numValue);
  };

  const handleBlur = () => {
    // Formata corretamente ao perder o foco
    const numValue = parseValue(displayValue);
    setDisplayValue(formatValue(numValue));
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
      required={required}
      disabled={disabled}
    />
  );
}
