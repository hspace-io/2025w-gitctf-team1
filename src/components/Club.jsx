import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './club.css';

function Club() {
  const navigate = useNavigate();
  const { isLoggedIn, login, logout } = useAuth();
  const [selectedClub, setSelectedClub] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', username: '', tags: [] });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // API 교체: 현재 로그인한 사용자 정보
  // GET /auth/me (또는 로그인 응답에서 사용자 정보 저장)
  const currentUser = {
    username: '@security_kim',
    name: '김보안',
    isAdmin: false,
  };

  const isAuthorized = (club) => {
    if (!isLoggedIn) return false;
    const member = club.members.find(m => m.username === currentUser.username);
    if (!member) return false;
    return member.tags.includes('회장') || member.tags.includes('운영진') || currentUser.isAdmin;
  };

  // API 교체: 동아리 목록 조회
  // GET /clubs?schoolName=
  const clubs = [
    {
      id: 1,
      name: 'Pay1oad',
      schoolName: '가천대학교',
      description: '보안 및 해킹 기술을 연구하는 동아리입니다.',
      president: '김보안',
      members: [
        { name: '김보안', username: '@security_kim', tags: ["회장", "운영진"]},
        { name: '이해킹', username: '@hacker_lee', tags: ['운영진']},
        { name: '박디버깅', username: '@debug_park', tags: ['부원']},
        { name: '최게임', username: '@gamer_choi', tags: ['부원']},
        { name: '정리버스', username: '@reverse_jung', tags: ['부원']},
      ],
    },
    {
      id: 2,
      name: 'I want to sleep',
      schoolName: '잠 부족',
      description: '잠 자고 싶어요',
      president: '홍웹',
      members: [
        { name: '홍웹', username: '@web_hong', tags: ['회장'] },
        { name: '강프론트', username: '@frontend_kang', tags: ['운영진'] },
        { name: '윤백엔드', username: '@backend_yoon', tags: ['부원'] },
        { name: '임풀스택', username: '@fullstack_lim', tags: ['부원'] },
        { name: '한디자인', username: '@design_han', tags: ['부원'] },
      ],
    },
    {
      id: 3,
      name: 'I want to go home',
      schoolName: '퇴근 요정',
      description: '집에 가고 싶어요',
      president: '송AI',
      members: [
        { name: '송AI', username: '@ai_song', tags: ['회장'] },
        { name: '조머신러닝', username: '@ml_cho', tags: ['부원'] },
      ],
    },
  ];

  const handleClubClick = (club) => {
    // API 교체: 동아리 상세 조회
    // GET /clubs/:id
    setSelectedClub(club);
  };

  const handleCloseDetail = () => {
    setSelectedClub(null);
    setEditingMember(null);
    setDeleteConfirm(null);
  };

  const handleEditMember = (member, index) => {
    setEditingMember(index);
    setEditForm({
      name: member.name,
      username: member.username,
      tags: [...member.tags],
    });
  };

  const handleSaveEdit = async (clubId, memberIndex) => {
    try {
      // API 교체: 사용자 정보 수정
      // PUT /users/:id (User 정보 수정 API 필요)
      // 또는 PUT /clubs/:id/members/:memberId (멤버 정보 수정 API 필요)


      const updatedClub = { ...selectedClub };
      updatedClub.members[memberIndex] = {
        ...updatedClub.members[memberIndex],
        ...editForm,
      };
      setSelectedClub(updatedClub);
      setEditingMember(null);
    } catch (error) {
      console.error('멤버 수정 실패:', error);
      alert('멤버 정보 수정에 실패했습니다.');
    }
  };

  const handleCancelEdit = () => {
    setEditingMember(null);
    setEditForm({ name: '', username: '', tags: [] });
  };

  const handleDeleteMember = async (clubId, memberIndex) => {
    try {
      // API 교체: 동아리에서 멤버 제거
      // DELETE /clubs/:id/members/:memberId (멤버 제거 API 필요)
      // 또는 PUT /users/:id (clubName 필드 수정)
      const updatedClub = { ...selectedClub };
      updatedClub.members = updatedClub.members.filter((_, index) => index !== memberIndex);
      setSelectedClub(updatedClub);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('멤버 삭제 실패:', error);
      alert('멤버 삭제에 실패했습니다.');
    }
  };

  const handleTagToggle = (tag) => {
    if (editForm.tags.includes(tag)) {
      const newTags = editForm.tags.filter(t => t !== tag);
      setEditForm({ ...editForm, tags: newTags });
    } else {
      let newTags = [...editForm.tags];
      
      if (tag === '부원') {
        newTags = ['부원'];
      } else if (tag === '회장' || tag === '운영진') {
        newTags = newTags.filter(t => t !== '부원');
        newTags.push(tag);
      } else {
        newTags = newTags.filter(t => t !== '부원');
        newTags.push(tag);
      }
      
      setEditForm({ ...editForm, tags: newTags });
    }
  };

  return (
    <div className="club-container">
      <main className="club-main">
        <div className="club-header">
          <h2 className="club-title">Club</h2>
          <p className="club-subtitle">HSPACE 소속 동아리입니다.</p>
        </div>

        <div className="club-search-container">
          {/* API 교체: 검색어를 쿼리 파라미터로 전달 */}
          {/* GET /clubs?schoolName=&search= (검색어 파라미터) */}
          <input
            type="text"
            className="club-search-input"
            placeholder="동아리 이름으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="club-list">
          {(() => {
            // API 교체: 검색은 백엔드에서 처리하므로 클라이언트 필터링 제거
            // 검색어가 있을 때는 API 호출: GET /clubs?search={searchQuery}
            const filteredClubs = clubs.filter((club) => {
              if (!searchQuery.trim()) return true;
              const query = searchQuery.toLowerCase();
              return (
                club.name.toLowerCase().includes(query) ||
                club.description.toLowerCase().includes(query)
              );
            });

            if (filteredClubs.length === 0) {
              return (
                <div className="club-empty-message">
                  검색 결과가 없습니다.
                </div>
              );
            }

            return filteredClubs.map((club) => (
              <div
                key={club.id}
                className="club-card"
                onClick={() => handleClubClick(club)}
              >
                <div className="club-card-header">
                  <h3 className="club-card-title">{club.name}</h3>
                </div>
                <p className="club-card-description">{club.description}</p>
                <div className="club-card-footer">
                  <span className="club-member-count">부원 {club.members.length}명</span>
                </div>
              </div>
            ));
          })()}
        </div>
      </main>

      {selectedClub && (
        <div className="club-modal-overlay" onClick={handleCloseDetail}>
          <div className="club-modal" onClick={(e) => e.stopPropagation()}>
            <button className="club-modal-close" onClick={handleCloseDetail}>
              ×
            </button>
            <div className="club-modal-content">
              <h2 className="club-modal-title">{selectedClub.name}</h2>
              {selectedClub.schoolName && (
                <div className="club-modal-school">{selectedClub.schoolName}</div>
              )}
              <p className="club-modal-description">{selectedClub.description}</p>
              
              <div className="club-members-list-container">
                {selectedClub.members.map((member, index) => (
                  <div key={index} className="club-member-item">
                    {editingMember === index ? (
                      <div className="member-edit-form">
                        <div className="edit-form-row">
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="edit-input"
                            placeholder="이름"
                          />
                          <input
                            type="text"
                            value={editForm.username}
                            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                            className="edit-input"
                            placeholder="사용자명"
                          />
                        </div>
                        <div className="edit-form-tags">
                          {['회장', '운영진', '부원'].map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleTagToggle(tag)}
                              className={`edit-tag-button ${editForm.tags.includes(tag) ? 'active' : ''}`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                        <div className="edit-form-actions">
                          <button
                            onClick={() => handleSaveEdit(selectedClub.id, index)}
                            className="save-button"
                          >
                            저장
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="cancel-button"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="member-profile">
                          <div className="member-avatar">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="member-info">
                            <div className="member-name">{member.name}</div>
                            <div className="member-username">{member.username}</div>
                          </div>
                        </div>
                        <div className="member-tags">
                          {member.tags.map((tag, tagIndex) => {
                            const getTagClass = (tagName) => {
                              if (tagName === '회장') return 'tag-president';
                              if (tagName === '운영진') return 'tag-executive';
                              if (tagName === '부원') return 'tag-member';
                              return `tag-${tagName.toLowerCase()}`;
                            };
                            return (
                              <span key={tagIndex} className={`member-tag ${getTagClass(tag)}`}>
                                {tag}
                              </span>
                            );
                          })}
                        </div>
                        {isAuthorized(selectedClub) && (
                          <div className="member-actions">
                            <button
                              onClick={() => handleEditMember(member, index)}
                              className="edit-button"
                              title="편집"
                            >
                              <span className="edit-icon"></span>
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(index)}
                              className="delete-button"
                              title="삭제"
                            >
                              <span className="delete-icon"></span>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
              {deleteConfirm !== null && (
                <div className="delete-confirm-overlay">
                  <div className="delete-confirm-modal">
                    <p>정말 이 멤버를 삭제하시겠습니까?</p>
                    <div className="delete-confirm-actions">
                      <button
                        onClick={() => handleDeleteMember(selectedClub.id, deleteConfirm)}
                        className="confirm-delete-button"
                      >
                        삭제
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="cancel-delete-button"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Club;

