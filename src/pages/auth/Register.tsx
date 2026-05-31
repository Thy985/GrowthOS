import React, { useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, Loader, Check, X } from 'lucide-react';
import authServiceV2 from '../../common/services/authServiceV2';
import { useToast } from '../../components/common/Toast';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

interface FormErrors {
  name?: string,
  email?: string,
  password?: string,
  confirmPassword?: string,
}

interface PasswordRequirement {
  label: string,
  met: boolean,
}

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);
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
    if (value.length < 8) return '密码至少需要 8 个字符';
    if (!/[A-Z]/.test(value)) return '密码需要包含至少一个大写字母';
    if (!/[a-z]/.test(value)) return '密码需要包含至少一个小写字母';
    if (!/[0-9]/.test(value)) return '密码需要包含至少一个数字';
    return '';
  }, []);

  const passwordRequirements = useMemo((): PasswordRequirement[] => {
    return [
      { label: '至少 8 个字符', met: password.length >= 8 },
      { label: '包含大写字母', met: /[A-Z]/.test(password) },
      { label: '包含小写字母', met: /[a-z]/.test(password) },
      { label: '包含数字', met: /[0-9]/.test(password) },
    ];
  }, [password]);

  const passwordStrength = useMemo(() => {
    const metCount = passwordRequirements.filter(r => r.met).length;
    if (metCount === 0) return { level: 0, label: '', color: '' };
    if (metCount <= 2) return { level: 1, label: '弱', color: 'bg-red-500' };
    if (metCount <= 3) return { level: 2, label: '中等', color: 'bg-amber-500' };
    return { level: 3, label: '强', color: 'bg-emerald-500' };
  }, [passwordRequirements]);

  const handleBlur = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    switch (field) {
      case 'name':
        setErrors(prev => ({ ...prev, name: !name.trim() ? '请输入用户名' : '' }));
        break;
      case 'email':
        setErrors(prev => ({ ...prev, email: validateEmail(email) }));
        break;
      case 'password':
        setErrors(prev => ({ ...prev, password: validatePassword(password) }));
        break;
      case 'confirmPassword':
        setErrors(prev => ({ 
          ...prev, 
          confirmPassword: confirmPassword !== password ? '两次输入的密码不一致' : '' 
        }));
        break;
    }
  }, [name, email, password, confirmPassword, validateEmail, validatePassword]);

  const handleChange = useCallback((field: string, value: string) => {
    switch (field) {
      case 'name':
        setName(value);
        if (touched.name) setErrors(prev => ({ ...prev, name: !value.trim() ? '请输入用户名' : '' }));
        break;
      case 'email':
        setEmail(value);
        if (touched.email) setErrors(prev => ({ ...prev, email: validateEmail(value) }));
        break;
      case 'password':
        setPassword(value);
        if (touched.password) {
          setErrors(prev => ({ ...prev, password: validatePassword(value) }));
        }
        if (touched.confirmPassword) {
          setErrors(prev => ({ ...prev, confirmPassword: confirmPassword !== value ? '两次输入的密码不一致' : '' }));
        }
        break;
      case 'confirmPassword':
        setConfirmPassword(value);
        if (touched.confirmPassword) {
          setErrors(prev => ({ ...prev, confirmPassword: value !== password ? '两次输入的密码不一致' : '' }));
        }
        break;
    }
  }, [touched, validateEmail, validatePassword, confirmPassword, password]);

  const isFormValid = useMemo(() => {
    return (
      name.trim() &&
      email.trim() &&
      !validateEmail(email) &&
      password &&
      !validatePassword(password) &&
      confirmPassword === password &&
      agreedToTerms
    );
  }, [name, email, password, confirmPassword, validateEmail, validatePassword, agreedToTerms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    
    const nameError = !name.trim() ? '请输入用户名' : '';
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmPasswordError = confirmPassword !== password ? '两次输入的密码不一致' : '';
    
    if (nameError || emailError || passwordError || confirmPasswordError) {
      setErrors({ name: nameError, email: emailError, password: passwordError, confirmPassword: confirmPasswordError });
      return;
    }

    if (!agreedToTerms) {
      showToast('请阅读并同意服务条款和隐私政策', 'warning');
      return;
    }

    setLoading(true);

    try {
      await authServiceV2.register(email, password, name);
      showToast('注册成功！正在跳转...', 'success');
      setTimeout(() => navigate('/'), 1000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '注册失败，请稍后重试';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-violet-200/30 to-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full blur-3xl" />
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
            创建账户
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-2">
            开始您的成长之旅
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="用户名"
              type="text"
              placeholder="您的显示名称"
              value={name}
              onChange={(e) => handleChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              error={touched.name ? errors.name : undefined}
              leftIcon={<User size={18} />}
              autoComplete="name"
              required
            />

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
                placeholder="创建密码"
                value={password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                error={touched.password ? errors.password : undefined}
                leftIcon={<Lock size={18} />}
                autoComplete="new-password"
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

            {password.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--color-text-secondary)]">密码强度</span>
                  {passwordStrength.label && (
                    <span className={`font-medium ${
                      passwordStrength.level === 1 ? 'text-red-500' :
                      passwordStrength.level === 2 ? 'text-amber-500' : 'text-emerald-500'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        level <= passwordStrength.level ? passwordStrength.color : 'bg-[var(--color-gray-200)]'
                      }`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1 mt-2">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-1.5 text-xs">
                      {req.met ? (
                        <Check size={12} className="text-emerald-500" />
                      ) : (
                        <X size={12} className="text-[var(--color-gray-400)]" />
                      )}
                      <span className={req.met ? 'text-emerald-600' : 'text-[var(--color-text-muted)]'}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="relative">
              <Input
                label="确认密码"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="再次输入密码"
                value={confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                onBlur={() => handleBlur('confirmPassword')}
                error={touched.confirmPassword ? errors.confirmPassword : undefined}
                leftIcon={<Lock size={18} />}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-[38px] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-[var(--color-border)] text-emerald-500 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="text-sm text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors leading-relaxed">
                我已阅读并同意{' '}
                <a href="#" className="text-emerald-600 hover:underline">服务条款</a>
                {' '}和{' '}
                <a href="#" className="text-emerald-600 hover:underline">隐私政策</a>
              </span>
            </label>

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
                  注册中...
                </span>
              ) : (
                '创建账户'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--color-text-secondary)]">
              已有账户？{' '}
              <Link
                to="/login"
                className="font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                立即登录
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Register;
