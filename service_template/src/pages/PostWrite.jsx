import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './PostWrite.css';
import api from '../services/api';

function PostWrite() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    type: 'STUDY',
    field: 'WEB',
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    schedule: '',
    recruitCount: '',
    difficulty: 'BEGINNER',
    author: '',
    clubName: '',
    content: ''
  });

  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (isEditMode) {
      loadPost();
    } else {
      // 새 글 작성 시 로그인한 사용자 정보로 자동 설정
      if (user) {
        setFormData(prev => ({
          ...prev,
          author: user.name || '',
          clubName: user.clubName || ''
        }));
      }
    }
  }, [id, user]);

  const loadPost = async () => {
    try {
      // API 명세서: GET /events/:id - 모집글 상세 조회 (수정용)
      const post = await api.get(`/events/${id}`);
      if (post) {
        // 권한 확인: 작성자만 수정 가능
        if (!user || !user.id || post.authorId !== user.id) {
          alert('본인이 작성한 게시글만 수정할 수 있습니다.');
          navigate('/recruiting');
          return;
        }

        let startDate = '';
        let endDate = '';
        
        // 백엔드 데이터 형식 변환
        const schedule = post.eventDate || post.schedule;
        
        if (schedule) {
          if (schedule.includes('~')) {
            const [start, end] = schedule.split('~');
            startDate = start.trim().split('T')[0];
            endDate = end.trim().split('T')[0];
          } else {
            startDate = schedule.split('T')[0];
            endDate = schedule.split('T')[0];
          }
        }
        
        // difficulty 변환 (LOW -> BEGINNER, MID -> INTERMEDIATE, HIGH -> ADVANCED)
        const difficultyMap = {
          'LOW': 'BEGINNER',
          'MID': 'INTERMEDIATE',
          'HIGH': 'ADVANCED'
        };
        
        setFormData({
          type: post.category || post.type,  // category -> type
          field: post.field,
          title: post.title,
          description: post.description || '',
          startDate: startDate,
          endDate: endDate,
          schedule: schedule,
          recruitCount: post.recruitmentCount || post.recruitCount,  // recruitmentCount -> recruitCount
          difficulty: difficultyMap[post.difficulty] || post.difficulty,  // difficulty 변환
          author: post.authorName || post.author || '',
          clubName: post.clubName || '',
          content: post.description || ''  // description -> content
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

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];

    const validFiles = selectedFiles.filter(file => {
      if (file.size > maxSize) {
        alert(`${file.name}은(는) 5MB를 초과합니다.`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        alert(`${file.name}은(는) 허용되지 않는 파일 형식입니다.`);
        return false;
      }
      return true;
    });

    // 파일을 Base64로 변환
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFiles(prev => [...prev, {
          name: file.name,
          type: file.type,
          size: file.size,
          data: event.target.result
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileRemove = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleExistingFileRemove = (index) => {
    setExistingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
    if (!formData.startDate) {
      alert('시작 일시를 입력해주세요.');
      return;
    }
    if (!formData.endDate) {
      alert('종료 일시를 입력해주세요.');
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
      // 시작 일시와 종료 일시를 합쳐서 schedule 생성 (날짜만)
      const schedule = formData.startDate === formData.endDate
        ? formData.startDate
        : `${formData.startDate}~${formData.endDate}`;

      // difficulty 변환 (BEGINNER -> LOW, INTERMEDIATE -> MID, ADVANCED -> HIGH)
      const difficultyMap = {
        'BEGINNER': 'LOW',
        'INTERMEDIATE': 'MID',
        'ADVANCED': 'HIGH'
      };
      
      // 백엔드 API 형식에 맞게 데이터 변환
      const postData = {
        category: formData.type,  // type -> category
        field: formData.field,
        title: formData.title,
        description: formData.content || formData.description,  // content를 description으로
        eventDate: schedule,  // schedule -> eventDate
        recruitmentCount: parseInt(formData.recruitCount),  // recruitCount -> recruitmentCount
        difficulty: difficultyMap[formData.difficulty] || formData.difficulty,  // difficulty 변환
        clubName: user?.clubName || formData.clubName || null,  // 로그인한 사용자의 동아리명 자동 사용
        authorId: user?.id || null  // 로그인한 사용자의 ID
      };

      if (isEditMode) {
        if (!user || !user.id) {
          alert('로그인이 필요합니다.');
          return;
        }
        // API 명세서: PUT /events/:id - 모집글 수정
        await api.put(`/events/${id}`, {
          ...postData,
          authorId: user.id  // 수정 시에도 authorId 전송
        });
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
              <div className="schedule-input-wrapper">
                <div className="schedule-input-item">
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <span className="schedule-separator">~</span>
                <div className="schedule-input-item">
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
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
