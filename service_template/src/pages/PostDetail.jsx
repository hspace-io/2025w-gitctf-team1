import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './PostDetail.css';
import api from '../services/api';

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  // 일시에서 시간 정보 제거하고 날짜만 반환
  const formatScheduleDate = (schedule) => {
    if (!schedule) return '';
    
    const scheduleStr = String(schedule);
    
    if (scheduleStr.includes('~')) {
      const [start, end] = scheduleStr.split('~');
      const startDate = start.trim().split('T')[0];
      const endDate = end.trim().split('T')[0];
      return `${startDate} ~ ${endDate}`;
    } else {
      return scheduleStr.split('T')[0];
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    loadPost();
    loadComments();
  }, [id]);

  const loadPost = async () => {
    try {
      setLoading(true);
      // API 명세서: GET /events/:id - 모집글 상세 조회
      const data = await api.get(`/events/${id}`);
      if (!data) {
        alert('게시글을 찾을 수 없습니다.');
        navigate('/recruiting');
        return;
      }
      
      // 백엔드 데이터 형식을 프론트엔드 형식으로 변환
      // 작성자 정보: authorName이 있으면 사용, 없으면 authorUsername 사용, 둘 다 없으면 '익명' 표시
      let authorDisplay = '익명';
      if (data.authorName) {
        authorDisplay = data.authorName;
      } else if (data.authorUsername) {
        authorDisplay = data.authorUsername;
      }
      
      const formattedPost = {
        ...data,
        type: data.category,  // category -> type
        schedule: data.eventDate,  // eventDate -> schedule
        recruitCount: data.recruitmentCount,  // recruitmentCount -> recruitCount
        author: authorDisplay,
        authorId: data.authorId,  // 작성자 ID 저장
        status: data.status || 'RECRUITING',  // 모집 상태 (기본값: RECRUITING)
        content: data.description,  // description -> content
        date: data.CreatedAt ? new Date(data.CreatedAt).toLocaleDateString('ko-KR') : '',
        views: 0,  // 조회수는 아직 구현되지 않음
        // difficulty는 그대로 유지 (LOW, MID, HIGH)
        difficulty: data.difficulty
      };
      
      setPost(formattedPost);
    } catch (error) {
      console.error('게시글 불러오기 실패:', error);
      alert('게시글을 불러올 수 없습니다.');
      navigate('/recruiting');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const data = await api.get(`/comments?postId=${id}`);
      // API가 {success: true, data: [...]} 형식으로 반환하면 data만 추출
      setComments(Array.isArray(data) ? data : (data.data || []));
    } catch (error) {
      console.error('댓글 불러오기 실패:', error);
      setComments([]);
    }
  };

  const handleEdit = () => {
    navigate(`/recruiting/edit/${id}`);
    window.scrollTo(0, 0);
  };

  const handleDelete = async () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    if (!user || !user.id) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      // API 명세서: DELETE /events/:id - 모집글 삭제
      await api.delete(`/events/${id}`, { authorId: user.id });
      alert('게시글이 삭제되었습니다.');
      navigate('/recruiting');
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
      alert(error.message || '게시글 삭제에 실패했습니다.');
    }
  };

  const handleToggleStatus = async () => {
    if (!user || !user.id) {
      alert('로그인이 필요합니다.');
      return;
    }

    const newStatus = post.status === 'COMPLETED' ? 'RECRUITING' : 'COMPLETED';
    const statusText = newStatus === 'COMPLETED' ? '모집 완료' : '모집 중';

    if (!window.confirm(`모집 상태를 "${statusText}"로 변경하시겠습니까?`)) {
      return;
    }

    try {
      // API 명세서: PATCH /events/:id/status - 모집 상태 변경
      const result = await api.patch(`/events/${id}/status`, {
        status: newStatus,
        authorId: user.id
      });
      
      // 게시글 다시 로드하여 최신 상태 반영
      await loadPost();
      alert(`모집 상태가 "${statusText}"로 변경되었습니다.`);
    } catch (error) {
      console.error('모집 상태 변경 실패:', error);
      alert(error.message || '모집 상태 변경에 실패했습니다.');
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    if (!user || !user.id) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    try {
      const result = await api.post(`/comments/${id}`, {
        content: commentText,
        authorId: user.id
      });
      // API가 {success: true, data: {...}} 형식으로 반환하면 data만 추출
      const newComment = result.data || result;
      setComments([...comments, newComment]);
      setCommentText('');
      alert('댓글이 등록되었습니다.');
    } catch (error) {
      console.error('댓글 등록 실패:', error);
      alert('댓글 등록에 실패했습니다.');
    }
  };

  const handleCommentEdit = (comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content);
  };

  const handleCommentEditCancel = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleCommentUpdate = async (commentId) => {
    if (!editingCommentText.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    if (!user || !user.id) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const result = await api.put(`/comments/${commentId}`, {
        content: editingCommentText,
        authorId: user.id
      });
      // API가 {success: true, data: {...}} 형식으로 반환하면 data만 추출
      const updatedComment = result.data || result;
      setComments(comments.map(c => 
        c.id === commentId ? updatedComment : c
      ));
      setEditingCommentId(null);
      setEditingCommentText('');
      alert('댓글이 수정되었습니다.');
    } catch (error) {
      console.error('댓글 수정 실패:', error);
      alert(error.message || '댓글 수정에 실패했습니다.');
    }
  };

  const handleCommentDelete = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) {
      return;
    }

    if (!user || !user.id) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      // DELETE 요청에 authorId를 포함시키기 위해 body에 포함
      // 하지만 DELETE 요청은 body를 지원하지 않을 수 있으므로, 쿼리 파라미터나 헤더 사용 고려
      // 일단 body로 시도하고, 안되면 다른 방법 사용
      await api.delete(`/comments/${commentId}`, { authorId: user.id });
      setComments(comments.filter(c => c.id !== commentId));
      alert('댓글이 삭제되었습니다.');
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      alert(error.message || '댓글 삭제에 실패했습니다.');
    }
  };

  return (
    <div className="post-detail">
      <div className="post-detail-container">
        <button className="back-btn" onClick={() => {
          navigate('/recruiting');
          window.scrollTo(0, 0);
        }}>
          <span className="back-arrow">←</span>
          <span>목록으로</span>
        </button>

        {loading ? (
          <div className="loading-message">로딩 중...</div>
        ) : !post ? (
          <div className="empty-message">게시글을 찾을 수 없습니다.</div>
        ) : (
          <>

        <article className="post-content">
          <div className="post-header-section">
            <div className="post-meta-top">
              <div className="post-badges">
                <span className="badge-type">
                  {(post.type === 'STUDY' || post.category === 'STUDY') ? '스터디' : 
                   (post.type === 'CTF' || post.category === 'CTF') ? 'CTF' : '프로젝트'}
                </span>
                <span className="badge-field">
                  {post.field === 'WEB' ? '웹' :
                   post.field === 'APP' ? '앱' :
                   post.field === 'AI' ? 'AI' :
                   post.field === 'SECURITY' ? '보안' :
                   post.field === 'ALGORITHM' ? '알고리즘' :
                   post.field === 'BLOCKCHAIN' ? '블록체인' :
                   post.field === 'GAME' ? '게임' : '기타'}
                </span>
              </div>
              <div className="post-info">
                <span className="post-author-name">{post.author}</span>
                {post.clubName && (
                  <>
                    <span className="post-divider">|</span>
                    <span className="post-club-name">{post.clubName}</span>
                  </>
                )}
                <span className="post-divider">|</span>
                <span className="post-date-text">{post.date}</span>
                <span className="post-divider">|</span>
                <span className="post-views-text">조회 {post.views}</span>
              </div>
            </div>

            <h1 className="post-detail-title">{post.title}</h1>

            <div className="post-detail-info">
              <div className="detail-info-item">
                <span className="info-icon">📅</span>
                <div>
                  <span className="info-label">일시</span>
                  <span className="info-value">{formatScheduleDate(post.schedule)}</span>
                </div>
              </div>
              <div className="detail-info-item">
                <span className="info-icon">👥</span>
                <div>
                  <span className="info-label">모집 인원</span>
                  <span className="info-value">{post.recruitCount}명</span>
                </div>
              </div>
              <div className="detail-info-item">
                <span className="info-icon">⭐</span>
                <div>
                  <span className="info-label">난이도</span>
                  <span className="info-value">
                    {post.difficulty === 'LOW' || post.difficulty === 'BEGINNER' ? '초급' :
                     post.difficulty === 'MID' || post.difficulty === 'INTERMEDIATE' ? '중급' : '고급'}
                  </span>
                </div>
              </div>
              <div className="detail-info-item">
                <span className="info-icon">📌</span>
                <div>
                  <span className="info-label">모집 상태</span>
                  <span className="info-value">
                    {post.status === 'COMPLETED' ? '모집 완료' : '모집 중'}
                  </span>
                </div>
              </div>
            </div>

          </div>

          <div className="post-body">
            <pre className="post-text">{post.content}</pre>
          </div>

          {/* 작성자만 수정/삭제/모집 상태 변경 가능 */}
          {user && user.id && post.authorId === user.id && (
            <div className="post-actions">
              <button 
                className="action-btn" 
                onClick={handleEdit}
              >
                수정
              </button>
              <button 
                className="action-btn delete" 
                onClick={handleDelete}
              >
                삭제
              </button>
              <button 
                className={`action-btn ${post.status === 'COMPLETED' ? 'completed' : 'recruiting'}`}
                onClick={handleToggleStatus}
              >
                {post.status === 'COMPLETED' ? '모집 중으로 변경' : '모집 완료'}
              </button>
            </div>
          )}
        </article>

        <section className="comments-section">
          <h2 className="comments-title">
            COMMENTS <span className="comments-count">{comments.length}</span>
          </h2>

          <div className="comment-input-area">
            <textarea
              className="comment-input"
              placeholder="댓글을 입력하세요..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button className="comment-submit-btn" onClick={handleCommentSubmit}>등록</button>
          </div>

          <div className="comments-list">
            {comments.map(comment => (
              <div key={comment.id} className="comment-item">
                <div className="comment-header">
                  <span className="comment-author">{comment.authorName || comment.author || '익명'}</span>
                  <span className="comment-date">{comment.date}</span>
                </div>
                {editingCommentId === comment.id ? (
                  <div className="comment-edit-area">
                    <textarea
                      className="comment-edit-input"
                      value={editingCommentText}
                      onChange={(e) => setEditingCommentText(e.target.value)}
                      rows={3}
                    />
                    <div className="comment-edit-actions">
                      <button 
                        className="comment-action-btn" 
                        onClick={() => handleCommentUpdate(comment.id)}
                      >
                        저장
                      </button>
                      <button 
                        className="comment-action-btn cancel" 
                        onClick={handleCommentEditCancel}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="comment-content">{comment.content}</p>
                    {/* 본인 댓글만 수정/삭제 가능 */}
                    {user && user.id && comment.authorId === user.id && (
                      <div className="comment-actions">
                        <button 
                          className="comment-action-btn" 
                          onClick={() => handleCommentEdit(comment)}
                        >
                          수정
                        </button>
                        <button 
                          className="comment-action-btn delete" 
                          onClick={() => handleCommentDelete(comment.id)}
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </section>
          </>
        )}
      </div>
    </div>
  );
}

export default PostDetail;
