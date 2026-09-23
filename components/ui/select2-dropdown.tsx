"use client";

import * as React from "react";
import Select, { Props as SelectProps, StylesConfig, GroupBase } from "react-select";

export interface Select2Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
}

interface Select2DropdownProps extends Omit<SelectProps<Select2Option, false, GroupBase<Select2Option>>, "options" | "value" | "onChange"> {
  options: Select2Option[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  isSearchable?: boolean;
  isClearable?: boolean;
}

export function Select2Dropdown({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  className = "",
  isSearchable = true,
  isClearable = false,
  ...props
}: Select2DropdownProps) {
  const selectedOption = React.useMemo(() => {
    return options.find((opt) => opt.value === value) || null;
  }, [options, value]);

  const customStyles: StylesConfig<Select2Option, false, GroupBase<Select2Option>> = {
    control: (base, state) => ({
      ...base,
      backgroundColor: "hsl(var(--background))",
      borderColor: state.isFocused ? "hsl(var(--ring))" : "hsl(var(--input))",
      boxShadow: state.isFocused ? "0 0 0 1px hsl(var(--ring))" : "none",
      minHeight: "36px",
      height: "36px",
      borderRadius: "calc(var(--radius) - 2px)",
      fontSize: "0.75rem",
      color: "hsl(var(--foreground))",
      cursor: "pointer",
      "&:hover": {
        borderColor: "hsl(var(--border))",
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: "0 8px",
    }),
    input: (base) => ({
      ...base,
      color: "hsl(var(--foreground))",
      margin: 0,
      padding: 0,
    }),
    singleValue: (base) => ({
      ...base,
      color: "hsl(var(--foreground))",
      display: "flex",
      alignItems: "center",
      gap: "6px",
    }),
    placeholder: (base) => ({
      ...base,
      color: "hsl(var(--muted-foreground))",
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "hsl(var(--popover))",
      borderColor: "hsl(var(--border))",
      borderWidth: "1px",
      borderRadius: "calc(var(--radius) - 2px)",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      zIndex: 50,
      padding: "4px",
    }),
    menuList: (base) => ({
      ...base,
      padding: 0,
      maxHeight: "220px",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "hsl(var(--primary))"
        : state.isFocused
        ? "hsl(var(--muted))"
        : "transparent",
      color: state.isSelected
        ? "hsl(var(--primary-foreground))"
        : "hsl(var(--foreground))",
      fontSize: "0.75rem",
      borderRadius: "calc(var(--radius) - 4px)",
      padding: "6px 10px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      "&:active": {
        backgroundColor: "hsl(var(--primary))",
        color: "hsl(var(--primary-foreground))",
      },
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: "hsl(var(--muted-foreground))",
      padding: "4px 8px",
      "&:hover": {
        color: "hsl(var(--foreground))",
      },
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
    clearIndicator: (base) => ({
      ...base,
      color: "hsl(var(--muted-foreground))",
      padding: "4px",
      "&:hover": {
        color: "hsl(var(--foreground))",
      },
    }),
  };

  return (
    <div className={`w-full min-w-[140px] ${className}`}>
      <Select<Select2Option, false, GroupBase<Select2Option>>
        options={options}
        value={selectedOption}
        onChange={(option) => {
          if (option) {
            onChange(option.value);
          }
        }}
        placeholder={placeholder}
        isSearchable={isSearchable}
        isClearable={isClearable}
        styles={customStyles}
        formatOptionLabel={(option) => (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {option.icon}
              <span>{option.label}</span>
            </div>
            {option.badge && (
              <span className="text-[10px] opacity-70 ml-2 font-mono">
                {option.badge}
              </span>
            )}
          </div>
        )}
        {...props}
      />
    </div>
  );
}
