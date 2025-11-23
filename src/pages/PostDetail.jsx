import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PostDetail.css';
import api from '../services/api';

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');

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
      setPost(data);
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
      setComments(data);
    } catch (error) {
      console.error('댓글 불러오기 실패:', error);
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

    try {
      // API 명세서: DELETE /events/:id - 모집글 삭제
      await api.delete(`/events/${id}`);
      alert('게시글이 삭제되었습니다.');
      navigate('/recruiting');
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
      alert('게시글 삭제에 실패했습니다.');
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentAuthor.trim()) {
      alert('작성자를 입력해주세요.');
      return;
    }
    if (!commentText.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    try {
      const newComment = await api.post(`/comments/${id}`, {
        postId: parseInt(id),
        author: commentAuthor,
        content: commentText
      });
      setComments([...comments, newComment]);
      setCommentText('');
      setCommentAuthor('');
      alert('댓글이 등록되었습니다.');
    } catch (error) {
      console.error('댓글 등록 실패:', error);
      alert('댓글 등록에 실패했습니다.');
    }
  };

  const handleCommentDelete = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await api.delete(`/comments/${commentId}`);
      setComments(comments.filter(c => c.id !== commentId));
      alert('댓글이 삭제되었습니다.');
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      alert('댓글 삭제에 실패했습니다.');
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
                  {post.type === 'STUDY' ? '스터디' : post.type === 'CTF' ? 'CTF' : '프로젝트'}
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
                    {post.difficulty === 'BEGINNER' ? '초급' :
                     post.difficulty === 'INTERMEDIATE' ? '중급' : '고급'}
                  </span>
                </div>
              </div>
            </div>

            {post.files && post.files.length > 0 && (
              <div className="attachments-list">
                {post.files.map((file, index) => (
                  <a
                    key={index}
                    href={file.data}
                    download={file.name}
                    className="attachment-item"
                  >
                    <span className="attachment-icon">
                      {file.type.startsWith('image/') ? '🖼️' :
                       file.type === 'application/pdf' ? '📄' :
                       file.type.includes('word') ? '📝' : '📎'}
                    </span>
                    <span className="attachment-name">{file.name}</span>
                    <span className="attachment-size">
                      {file.size < 1024 ? file.size + ' B' :
                       file.size < 1024 * 1024 ? (file.size / 1024).toFixed(1) + ' KB' :
                       (file.size / (1024 * 1024)).toFixed(1) + ' MB'}
                    </span>
                    <span className="attachment-download">다운로드</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="post-body">
            <pre className="post-text">{post.content}</pre>
          </div>

          <div className="post-actions">
            <button className="action-btn" onClick={handleEdit}>수정</button>
            <button className="action-btn delete" onClick={handleDelete}>삭제</button>
          </div>
        </article>

        <section className="comments-section">
          <h2 className="comments-title">
            COMMENTS <span className="comments-count">{comments.length}</span>
          </h2>

          <div className="comment-input-area">
            <input
              type="text"
              className="comment-author-input"
              placeholder="작성자"
              value={commentAuthor}
              onChange={(e) => setCommentAuthor(e.target.value)}
            />
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
                  <span className="comment-author">{comment.author}</span>
                  <span className="comment-date">{comment.date}</span>
                </div>
                <p className="comment-content">{comment.content}</p>
                <div className="comment-actions">
                  <button className="comment-action-btn" onClick={() => handleCommentDelete(comment.id)}>삭제</button>
                </div>
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
