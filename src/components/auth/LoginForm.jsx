import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

/* ── Icons (inline SVG, no external dep) ───────────────────── */
const EyeIcon = ({ className = '' }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = ({ className = '' }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const MailIcon = ({ className = '' }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const LockIcon = ({ className = '' }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);

const AlertIcon = ({ className = '' }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

/* ── Petal Spinner (Pratiti logo-inspired) ──────────────────── */
const PetalSpinner = ({ size = 22 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    className="petal-spinner"
    aria-label="Loading"
  >
    {/* Top-left petal — cyan */}
    <ellipse cx="14" cy="14" rx="7" ry="11"
      fill="#14a0c8" opacity="0.9"
      transform="rotate(-45 14 14)"
    />
    {/* Top-right petal — indigo */}
    <ellipse cx="26" cy="14" rx="7" ry="11"
      fill="#3c3c8c" opacity="0.9"
      transform="rotate(45 26 14)"
    />
    {/* Bottom-left petal — purple */}
    <ellipse cx="14" cy="26" rx="7" ry="11"
      fill="#783c78" opacity="0.9"
      transform="rotate(45 14 26)"
    />
    {/* Bottom-right petal — deep indigo */}
    <ellipse cx="26" cy="26" rx="7" ry="11"
      fill="#252568" opacity="0.85"
      transform="rotate(-45 26 26)"
    />
  </svg>
);

/* ── Field validation ───────────────────────────────────────── */
const validateEmail = (value) => {
  if (!value.trim())                       return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address.';
  return '';
};

const validatePassword = (value) => {
  if (!value) return 'Password is required.';
  if (value.length < 6) return 'Password must be at least 6 characters.';
  return '';
};

/* ── Component ──────────────────────────────────────────────── */
const LoginForm = () => {
  const { handleSubmit, isLoading, error, shakeForm, isLocked, getRemainingLockoutMinutes } = useAuth();

  const [fields, setFields] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [showPassword, setShowPassword] = useState(false);

  const fieldErrors = {
    email:    touched.email    ? validateEmail(fields.email)       : '',
    password: touched.password ? validatePassword(fields.password) : '',
  };

  const hasFieldError = Object.values(fieldErrors).some(Boolean);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    /* Mark all touched on submit attempt */
    setTouched({ email: true, password: true });

    const emailErr    = validateEmail(fields.email);
    const passwordErr = validatePassword(fields.password);
    if (emailErr || passwordErr) return;

    handleSubmit({ email: fields.email, password: fields.password });
  };

  const inputBase =
    'w-full pl-10 pr-4 py-3 rounded-xl border bg-white text-sm text-gray-900 ' +
    'placeholder-gray-400 transition-all duration-200 outline-none ' +
    'focus:ring-2 focus:ring-offset-0';

  const inputNormal =
    `${inputBase} border-gray-200 focus:border-indigo-500 focus:ring-indigo-100`;

  const inputError =
    `${inputBase} border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50`;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={shakeForm ? 'animate-shake' : ''}
    >
      {/* ── API / lockout error banner ── */}
      {(error || isLocked) && (
        <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 animate-fade-in">
          <AlertIcon className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-700 leading-relaxed">
            {isLocked
              ? `Account locked. Try again in ${getRemainingLockoutMinutes()} minute(s).`
              : error}
          </p>
        </div>
      )}

      {/* ── Email ── */}
      <div className="mb-4 animate-slide-up animate-slide-up-delay-3">
        <label htmlFor="email" className="block text-xs font-500 text-gray-600 mb-1.5 tracking-wide">
          Email address
        </label>
        <div className="relative">
          <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="you@company.com"
            value={fields.email}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading || isLocked}
            className={fieldErrors.email ? inputError : inputNormal}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            aria-invalid={!!fieldErrors.email}
          />
        </div>
        {fieldErrors.email && (
          <p id="email-error" className="mt-1.5 text-xs text-red-600 flex items-center gap-1 animate-fade-in">
            <AlertIcon className="w-3 h-3" />
            {fieldErrors.email}
          </p>
        )}
      </div>

      {/* ── Password ── */}
      <div className="mb-6 animate-slide-up animate-slide-up-delay-4">
        <label htmlFor="password" className="block text-xs font-500 text-gray-600 mb-1.5 tracking-wide">
          Password
        </label>
        <div className="relative">
          <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={fields.password}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading || isLocked}
            className={`${fieldErrors.password ? inputError : inputNormal} pr-10`}
            aria-describedby={fieldErrors.password ? 'password-error' : undefined}
            aria-invalid={!!fieldErrors.password}
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword
              ? <EyeOffIcon className="w-4 h-4" />
              : <EyeIcon    className="w-4 h-4" />
            }
          </button>
        </div>
        {fieldErrors.password && (
          <p id="password-error" className="mt-1.5 text-xs text-red-600 flex items-center gap-1 animate-fade-in">
            <AlertIcon className="w-3 h-3" />
            {fieldErrors.password}
          </p>
        )}
      </div>

      {/* ── Submit ── */}
      <div className="animate-slide-up animate-slide-up-delay-5">
        <button
          type="submit"
          disabled={isLoading || isLocked || hasFieldError}
          className={
            'w-full flex items-center justify-center gap-2.5 py-3 px-6 rounded-xl ' +
            'text-sm font-medium text-white transition-all duration-200 ' +
            'focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ' +
            (isLoading || isLocked
              ? 'bg-indigo-400 cursor-not-allowed opacity-70'
              : 'bg-indigo-700 hover:bg-indigo-800 active:scale-[0.98] shadow-pratiti-md hover:shadow-pratiti-lg')
          }
        >
          {isLoading ? (
            <>
              <PetalSpinner size={20} />
              <span>Signing in…</span>
            </>
          ) : isLocked ? (
            <span>Account Locked</span>
          ) : (
            <span>Sign in</span>
          )}
        </button>
      </div>

      {/* ── Support link ── */}
      <p className="mt-5 text-center text-xs text-gray-400 animate-slide-up animate-slide-up-delay-5">
        Having trouble?{' '}
        <a
          href="mailto:support@pratiti.com"
          className="text-cyan-600 hover:text-cyan-700 hover:underline transition-colors"
        >
          Contact IT Support
        </a>
      </p>
    </form>
  );
};

export default LoginForm;
