// src/components/auth/LoginForm.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import '../../styles/components/loginPage/LoginForm.scss';

const LoginForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Invalid email address';

    if (!formData.password.trim()) newErrors.password = 'Password is required';
    else if (formData.password.length < 8)
      newErrors.password = 'Password must be at least 8 characters long';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSubmit(formData);
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="login-form"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2>Sign In</h2>

      <div className={`form-group ${errors.email ? 'has-error' : ''}`}>
        <label htmlFor="email" className={formData.email ? 'hide' : ''}>
          Email Address
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
        />
        {errors.email && <span className="error-text">{errors.email}</span>}
      </div>

      <div className={`form-group ${errors.password ? 'has-error' : ''}`}>
        <label htmlFor="password" className={formData.password ? 'hide' : ''}>
          Password
        </label>
        <input
          type="password"
          id="password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
        />
        {errors.password && (
          <span className="error-text">{errors.password}</span>
        )}
      </div>

      <motion.button
        type="submit"
        className="btn-primary"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
      >
        Login
      </motion.button>
    </motion.form>
  );
};

export default LoginForm;
