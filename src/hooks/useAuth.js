import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { useAuthContext } from '../context/AuthContext';

const MAX_ATTEMPTS    = 5;
const LOCKOUT_MINUTES = 15;
const LOCKOUT_MS      = LOCKOUT_MINUTES * 60 * 1000;

export const useAuth = () => {
  const navigate          = useNavigate();
  const { handleLoginSuccess } = useAuthContext();

  const [isLoading,      setIsLoading]      = useState(false);
  const [error,          setError]          = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil,    setLockedUntil]    = useState(null);
  const [shakeForm,      setShakeForm]      = useState(false);

  /* Keep latest lockout in a ref for the countdown timer */
  const lockoutRef = useRef(null);

  const isLocked = lockedUntil && Date.now() < lockedUntil;

  const getRemainingLockoutMinutes = () => {
    if (!lockedUntil) return 0;
    const ms = lockedUntil - Date.now();
    return ms > 0 ? Math.ceil(ms / 60000) : 0;
  };

  const triggerShake = () => {
    setShakeForm(true);
    setTimeout(() => setShakeForm(false), 500);
  };

  const handleSubmit = useCallback(async ({ email, password }) => {
    /* ── Lockout guard ── */
    if (isLocked) {
      setError(`Account locked. Try again in ${getRemainingLockoutMinutes()} minute(s).`);
      triggerShake();
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response  = await login(email, password);
      const dashRoute = handleLoginSuccess(response);

      /* Reset failure count on success */
      setFailedAttempts(0);
      setLockedUntil(null);

      /* Redirect to role-specific dashboard */
      navigate(dashRoute, { replace: true });

    } catch (err) {
      const status = err?.status;
      let   msg    = '';

      if (status === 401) {
        const next = failedAttempts + 1;
        setFailedAttempts(next);

        if (next >= MAX_ATTEMPTS) {
          const until = Date.now() + LOCKOUT_MS;
          setLockedUntil(until);
          lockoutRef.current = until;
          msg = `Account locked after ${MAX_ATTEMPTS} failed attempts. Try again in ${LOCKOUT_MINUTES} minutes.`;
        } else {
          const remaining = MAX_ATTEMPTS - next;
          msg = `Invalid email or password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`;
        }
      } else if (status === 403) {
        msg = 'Your account is inactive. Please contact the Admin.';
      } else if (status === 423) {
        msg = `Account locked. Try again in ${LOCKOUT_MINUTES} minutes.`;
      } else if (!navigator.onLine) {
        msg = 'No internet connection. Please check your network.';
      } else {
        msg = err?.message || 'Something went wrong. Please try again.';
      }

      setError(msg);
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  }, [isLocked, failedAttempts, handleLoginSuccess, navigate]);

  return {
    handleSubmit,
    isLoading,
    error,
    shakeForm,
    isLocked,
    getRemainingLockoutMinutes,
  };
};
