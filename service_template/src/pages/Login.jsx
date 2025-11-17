import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import FormInput from '../components/FormInput';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username.trim()) {
      setError('아이디를 입력해주세요.');
      return;
    }
    if (!formData.password.trim()) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await api.login(formData.username, formData.password);
      
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      if (data.user) {
        localStorage.setItem('current_user', JSON.stringify(data.user));
      }
      

      login(data.user);
      
      alert('로그인되었습니다!');
      navigate('/');
      window.scrollTo(0, 0);
    } catch (err) {
      console.error('로그인 실패:', err);
      setError(err.message || '아이디 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <h1 className="login-title">로그인</h1>
          <p className="login-subtitle">Enter your ID and password below to sign in.</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <FormInput
              label="아이디"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="아이디를 입력하세요"
              disabled={loading}
            />

            <FormInput
              label="비밀번호"
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              disabled={loading}
            />

            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? '로그인 중...' : 'Sign in'}
            </button>
          </form>

          <div className="login-footer">
            <span>계정이 없으신가요? </span>
            <Link to="/signup" className="signup-link">회원가입</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

