import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './BoardList.css';
import api from '../services/api';

function BoardList() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: 'ALL',
    field: 'ALL',
    difficulty: 'ALL',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      // API 명세서: GET /events - 모집글 목록 조회
      const data = await api.get('/events');
      setPosts(data);
    } catch (error) {
      console.error('게시글 불러오기 실패:', error);
      alert('게시글을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const getFilteredPosts = () => {
    let filtered = posts;

    if (filters.type !== 'ALL') {
      filtered = filtered.filter(post => post.type === filters.type);
    }

    if (filters.field !== 'ALL') {
      filtered = filtered.filter(post => post.field === filters.field);
    }

    if (filters.difficulty !== 'ALL') {
      filtered = filtered.filter(post => post.difficulty === filters.difficulty);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(post => post.schedule >= filters.dateFrom);
    }

    if (filters.dateTo) {
      filtered = filtered.filter(post => post.schedule <= filters.dateTo);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post =>
        (post.title && post.title.toLowerCase().includes(query)) ||
        (post.description && post.description.toLowerCase().includes(query)) ||
        (post.author && post.author.toLowerCase().includes(query)) ||
        (post.clubName && post.clubName.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  const filteredPosts = getFilteredPosts();

  const difficultyLabels = {
    BEGINNER: '초급',
    INTERMEDIATE: '중급',
    ADVANCED: '고급'
  };

  const typeLabels = {
    STUDY: '스터디',
    CTF: 'CTF',
    PROJECT: '프로젝트'
  };

  const fieldLabels = {
    WEB: '웹',
    APP: '앱',
    AI: 'AI',
    SECURITY: '보안',
    ALGORITHM: '알고리즘',
    BLOCKCHAIN: '블록체인',
    GAME: '게임',
    ETC: '기타'
  };

  return (
    <div className="board-list">
      <div className="board-container">
        <div className="board-header">
          <h1 className="board-title">TEAMMATE RECRUIT</h1>
          <p className="board-subtitle">스터디, CTF, 프로젝트 팀원을 모집하세요.</p>
        </div>

        <div className="search-section">
          <input
            type="text"
            className="search-input"
            placeholder="제목, 설명, 작성자로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-toggle-section">
          <button
            className="filter-toggle-btn"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <span>필터 {isFilterOpen ? '숨기기' : '보기'}</span>
            <span className={`toggle-icon ${isFilterOpen ? 'open' : ''}`}>▼</span>
          </button>
        </div>

        <div className={`filters-section ${isFilterOpen ? 'open' : 'closed'}`}>
          <div className="filter-group">
            <label className="filter-label">구분</label>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${filters.type === 'ALL' ? 'active' : ''}`}
                onClick={() => handleFilterChange('type', 'ALL')}
              >
                전체
              </button>
              <button
                className={`filter-btn ${filters.type === 'STUDY' ? 'active' : ''}`}
                onClick={() => handleFilterChange('type', 'STUDY')}
              >
                스터디
              </button>
              <button
                className={`filter-btn ${filters.type === 'CTF' ? 'active' : ''}`}
                onClick={() => handleFilterChange('type', 'CTF')}
              >
                CTF
              </button>
              <button
                className={`filter-btn ${filters.type === 'PROJECT' ? 'active' : ''}`}
                onClick={() => handleFilterChange('type', 'PROJECT')}
              >
                프로젝트
              </button>
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">분야</label>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${filters.field === 'ALL' ? 'active' : ''}`}
                onClick={() => handleFilterChange('field', 'ALL')}
              >
                전체
              </button>
              {Object.entries(fieldLabels).map(([value, label]) => (
                <button
                  key={value}
                  className={`filter-btn ${filters.field === value ? 'active' : ''}`}
                  onClick={() => handleFilterChange('field', value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">난이도</label>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${filters.difficulty === 'ALL' ? 'active' : ''}`}
                onClick={() => handleFilterChange('difficulty', 'ALL')}
              >
                전체
              </button>
              <button
                className={`filter-btn ${filters.difficulty === 'BEGINNER' ? 'active' : ''}`}
                onClick={() => handleFilterChange('difficulty', 'BEGINNER')}
              >
                초급
              </button>
              <button
                className={`filter-btn ${filters.difficulty === 'INTERMEDIATE' ? 'active' : ''}`}
                onClick={() => handleFilterChange('difficulty', 'INTERMEDIATE')}
              >
                중급
              </button>
              <button
                className={`filter-btn ${filters.difficulty === 'ADVANCED' ? 'active' : ''}`}
                onClick={() => handleFilterChange('difficulty', 'ADVANCED')}
              >
                고급
              </button>
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">일시 기간</label>
            <div className="date-filter-inputs">
              <input
                type="date"
                className="date-input"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                placeholder="시작일"
              />
              <span className="date-separator">~</span>
              <input
                type="date"
                className="date-input"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                placeholder="종료일"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-message">로딩 중...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="empty-message">
            {searchQuery || filters.type !== 'ALL' || filters.field !== 'ALL' || filters.difficulty !== 'ALL' || filters.dateFrom || filters.dateTo
              ? '검색 결과가 없습니다.'
              : '게시글이 없습니다.'}
          </div>
        ) : (
          <div className="post-list">
            {filteredPosts.map(post => (
              <Link to={`/recruiting/post/${post.id}`} key={post.id} className="post-card">
                <div className="post-card-header">
                  <div className="post-badges">
                    <span className="post-type">{typeLabels[post.type]}</span>
                    <span className="post-field">{fieldLabels[post.field]}</span>
                  </div>
                  <span className="post-views">👁 {post.views}</span>
                </div>

                <h2 className="post-title">{post.title}</h2>
                <p className="post-description">{post.description}</p>

                <div className="post-info-grid">
                  <div className="info-item">
                    <span className="info-label">일시</span>
                    <span className="info-value">{post.schedule}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">모집</span>
                    <span className="info-value">{post.recruitCount}명</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">난이도</span>
                    <span className="info-value">{difficultyLabels[post.difficulty]}</span>
                  </div>
                </div>

                <div className="post-meta">
                  <div className="post-author-info">
                    <span className="post-author">{post.author}</span>
                    {post.clubName && <span className="post-club">{post.clubName}</span>}
                  </div>
                  <span className="post-date">{post.date}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <button className="write-btn" onClick={() => {
          navigate('/recruiting/write');
          window.scrollTo(0, 0);
        }}>
          <span>글쓰기</span>
          <span className="plus-icon">+</span>
        </button>
      </div>
    </div>
  );
}

export default BoardList;
