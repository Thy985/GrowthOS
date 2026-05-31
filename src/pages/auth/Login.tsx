import React, { useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader } from 'lucide-react';
import authServiceV2 from '../../common/services/authServiceV2';
import { useToast } from '../../components/common/Toast';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

interface FormErrors {
  email?: string,
  password?: string,
}

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const { showToast } = useToast();

  const validateEmail = useCallback((value: string): string => {
    if (!value.trim()) return '请输入邮箱地址';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return '请输入有效的邮箱格式';
    return '';
  }, []);

  const validatePassword = useCallback((value: string): string => {
    if (!value) return '请输入密码';
    return '';
  }, []);

  const handleBlur = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    if (field === 'email') {
      setErrors(prev => ({ ...prev, email: validateEmail(email) }));
    } else if (field === 'password') {
      setErrors(prev => ({ ...prev, password: validatePassword(password) }));
    }
  }, [email, password, validateEmail, validatePassword]);

  const handleChange = useCallback((field: string, value: string) => {
    if (field === 'email') {
      setEmail(value);
      if (touched.email) {
        setErrors(prev => ({ ...prev, email: validateEmail(value) }));
      }
    } else if (field === 'password') {
      setPassword(value);
      if (touched.password) {
        setErrors(prev => ({ ...prev, password: validatePassword(value) }));
      }
    }
  }, [touched, validateEmail, validatePassword]);

  const isFormValid = useMemo(() => {
    return email.trim() && password && !validateEmail(email) && !validatePassword(password);
  }, [email, password, validateEmail, validatePassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setTouched({ email: true, password: true });
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      return;
    }

    setLoading(true);

    try {
      await authServiceV2.login(email, password);
      showToast('登录成功！正在跳转...', 'success');
      setTimeout(() => navigate('/'), 1000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '登录失败，请检查邮箱和密码';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-violet-200/30 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] font-[var(--font-display)]">
            欢迎回来
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-2">
            登录到您的 GrowthOS 账户
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="邮箱地址"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              error={touched.email ? errors.email : undefined}
              leftIcon={<Mail size={18} />}
              autoComplete="email"
              required
            />

            <div className="relative">
              <Input
                label="密码"
                type={showPassword ? 'text' : 'password'}
                placeholder="输入您的密码"
                value={password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                error={touched.password ? errors.password : undefined}
                leftIcon={<Lock size={18} />}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-[var(--color-border)] text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-sm text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
                  记住我
                </span>
              </label>
              <span className="text-sm text-[var(--color-text-muted)]">
                忘记密码？
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="large"
              fullWidth
              disabled={loading || !isFormValid}
              className="mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader className="animate-spin" size={18} />
                  登录中...
                </span>
              ) : (
                '登录'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--color-text-secondary)]">
              还没有账户？{' '}
              <Link
                to="/register"
                className="font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                立即注册
              </Link>
            </p>
          </div>
        </Card>

        <p className="text-center text-xs text-[var(--color-text-muted)] mt-6">
          登录即表示您同意我们的{' '}
          <a href="#" className="text-emerald-600 hover:underline">服务条款</a>
          {' '}和{' '}
          <a href="#" className="text-emerald-600 hover:underline">隐私政策</a>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
