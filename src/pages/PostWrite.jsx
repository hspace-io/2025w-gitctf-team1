import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './PostWrite.css';
import api from '../services/api';

function PostWrite() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    type: 'STUDY',
    field: 'WEB',
    title: '',
    description: '',
    schedule: '',
    recruitCount: '',
    difficulty: 'BEGINNER',
    author: '',
    clubName: '',
    content: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (isEditMode) {
      loadPost();
    }
  }, [id]);

  const loadPost = async () => {
    try {
      // API 명세서: GET /events/:id - 모집글 상세 조회 (수정용)
      const post = await api.get(`/events/${id}`);
      if (post) {
        setFormData({
          type: post.type,
          field: post.field,
          title: post.title,
          description: post.description,
          schedule: post.schedule,
          recruitCount: post.recruitCount,
          difficulty: post.difficulty,
          author: post.author,
          clubName: post.clubName || '',
          content: post.content
        });
      }
    } catch (error) {
      console.error('게시글 불러오기 실패:', error);
      alert('게시글을 불러올 수 없습니다.');
      navigate('/');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    if (!formData.description.trim()) {
      alert('간단한 설명을 입력해주세요.');
      return;
    }
    if (!formData.author.trim()) {
      alert('작성자를 입력해주세요.');
      return;
    }
    if (!formData.schedule) {
      alert('일시를 입력해주세요.');
      return;
    }
    if (!formData.recruitCount || formData.recruitCount <= 0) {
      alert('모집 인원을 입력해주세요.');
      return;
    }
    if (!formData.content.trim()) {
      alert('상세 내용을 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      const postData = {
        type: formData.type,
        field: formData.field,
        title: formData.title,
        description: formData.description,
        schedule: formData.schedule,
        recruitCount: parseInt(formData.recruitCount),
        difficulty: formData.difficulty,
        author: formData.author,
        clubName: formData.clubName,
        content: formData.content
      };

      if (isEditMode) {
        // API 명세서: PUT /events/:id - 모집글 수정
        await api.put(`/events/${id}`, postData);
        alert('게시글이 수정되었습니다.');
        navigate(`/recruiting/post/${id}`);
        window.scrollTo(0, 0);
      } else {
        // API 명세서: POST /events - 모집글 작성
        const newPost = await api.post('/events', postData);
        alert('게시글이 작성되었습니다.');
        navigate(`/recruiting/post/${newPost.id}`);
        window.scrollTo(0, 0);
      }
    } catch (error) {
      console.error('게시글 저장 실패:', error);
      alert('게시글 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-write">
      <div className="post-write-container">
        <div className="write-header">
          <h1 className="write-title">{isEditMode ? '게시글 수정' : '새 글 작성'}</h1>
        </div>

        <form onSubmit={handleSubmit} className="write-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type">구분 *</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="form-select"
              >
                <option value="STUDY">스터디</option>
                <option value="CTF">CTF</option>
                <option value="PROJECT">프로젝트 홍보</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="field">분야 *</label>
              <select
                id="field"
                name="field"
                value={formData.field}
                onChange={handleChange}
                className="form-select"
              >
                <option value="WEB">웹</option>
                <option value="APP">앱</option>
                <option value="AI">인공지능</option>
                <option value="SECURITY">보안</option>
                <option value="ALGORITHM">알고리즘</option>
                <option value="BLOCKCHAIN">블록체인</option>
                <option value="GAME">게임</option>
                <option value="ETC">기타</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="title">제목 *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="제목을 입력하세요"
              className="form-input"
              maxLength="100"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">간단한 설명 *</label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="한 줄로 간단하게 설명해주세요"
              className="form-input"
              maxLength="100"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="schedule">일시 *</label>
              <input
                type="date"
                id="schedule"
                name="schedule"
                value={formData.schedule}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="recruitCount">모집 인원 *</label>
              <input
                type="number"
                id="recruitCount"
                name="recruitCount"
                value={formData.recruitCount}
                onChange={handleChange}
                placeholder="인원"
                className="form-input"
                min="1"
                max="99"
              />
            </div>

            <div className="form-group">
              <label htmlFor="difficulty">예상 난이도 *</label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="form-select"
              >
                <option value="BEGINNER">초급</option>
                <option value="INTERMEDIATE">중급</option>
                <option value="ADVANCED">고급</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="author">작성자 *</label>
              <input
                type="text"
                id="author"
                name="author"
                value={formData.author}
                onChange={handleChange}
                placeholder="이름을 입력하세요"
                className="form-input"
                maxLength="50"
                disabled={isEditMode}
              />
            </div>

            <div className="form-group">
              <label htmlFor="clubName">동아리명</label>
              <input
                type="text"
                id="clubName"
                name="clubName"
                value={formData.clubName}
                onChange={handleChange}
                placeholder="동아리명을 입력하세요"
                className="form-input"
                maxLength="50"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="content">상세 내용 *</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="상세 내용을 입력하세요"
              className="form-textarea"
              rows="15"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => {
                navigate(-1);
                window.scrollTo(0, 0);
              }}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? '저장 중...' : (isEditMode ? '수정하기' : '작성하기')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PostWrite;
