import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import FormInput from '../components/FormInput';
import './SignUp.css';

function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    schoolName: '',
    clubName: '',
    name: '',
    nickname: '',
    username: '',
    password: '',
    passwordConfirm: ''
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
    
    // 유효성 검사
    if (!formData.schoolName.trim()) {
      setError('학교명을 입력해주세요.');
      return;
    }
    if (!formData.clubName.trim()) {
      setError('동아리명을 입력해주세요.');
      return;
    }
    if (!formData.name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }
    if (!formData.nickname.trim()) {
      setError('닉네임을 입력해주세요.');
      return;
    }
    if (!formData.username.trim()) {
      setError('아이디를 입력해주세요.');
      return;
    }
    if (!formData.password.trim()) {
      setError('비밀번호를 입력해주세요.');
      return;
    }
    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (formData.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await api.signUp({
        schoolName: formData.schoolName,
        clubName: formData.clubName,
        name: formData.name,
        nickname: formData.nickname,
        username: formData.username,
        password: formData.password
      });
      
      console.log('회원가입 성공:', data);
      alert('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
      navigate('/login');
      window.scrollTo(0, 0);
    } catch (err) {
      console.error('회원가입 실패:', err);
      setError(err.message || '회원가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-card">
          <h1 className="signup-title">회원가입</h1>

          {error && <div className="signup-error">{error}</div>}

          <form onSubmit={handleSubmit} className="signup-form">
            <FormInput
              label="학교명"
              id="schoolName"
              name="schoolName"
              value={formData.schoolName}
              onChange={handleChange}
              placeholder="학교명을 입력하세요"
              disabled={loading}
            />

            <FormInput
              label="동아리명"
              id="clubName"
              name="clubName"
              value={formData.clubName}
              onChange={handleChange}
              placeholder="동아리명을 입력하세요"
              disabled={loading}
            />

            <FormInput
              label="이름"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="이름을 입력하세요"
              disabled={loading}
            />

            <FormInput
              label="닉네임"
              id="nickname"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              placeholder="닉네임을 입력하세요"
              disabled={loading}
            />

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

            <FormInput
              label="비밀번호 확인"
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              value={formData.passwordConfirm}
              onChange={handleChange}
              placeholder="비밀번호를 다시 입력하세요"
              disabled={loading}
            />

            <button 
              type="submit" 
              className="signup-button"
              disabled={loading}
            >
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </form>

          <div className="signup-footer">
            <span>이미 계정이 있으신가요? </span>
            <Link to="/login" className="login-link">로그인</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;

