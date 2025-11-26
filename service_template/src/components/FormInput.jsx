import React from 'react';
import './FormInput.css';

function FormInput({ 
  label, 
  id, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  required = true, 
  disabled = false 
}) {
  return (
    <div className="form-group">
      <label htmlFor={id}>
        {label} {required && <span className="required">*</span>}
      </label>
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="form-input"
        disabled={disabled}
      />
    </div>
  );
}

export default FormInput;

