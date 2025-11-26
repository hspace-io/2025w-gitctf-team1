import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api';
import './club.css';

function Club() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const [selectedClub, setSelectedClub] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', username: '', tags: [] });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteClubConfirm, setDeleteClubConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [clubs, setClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentUser = user || {
    id: '',
    username: '',
    name: '',
    isAdmin: false,
  };

  const isAuthorized = (club) => {
    if (!isLoggedIn || !currentUser || !currentUser.id) return false;
    
    const member = club.members.find(m => m.id === currentUser.id);
    
    if (!member) return false;
    
    return member.tags.includes('회장') || member.tags.includes('운영진') || currentUser.isAdmin;
  };


  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setIsLoading(true);
        let endpoint = '/clubs';
        if (searchQuery.trim()) {
          endpoint = `/clubs?search=${encodeURIComponent(searchQuery.trim())}`;
        }
        const data = await api.get(endpoint);
        setClubs(data);
      } catch (error) {
        console.error('동아리 목록 조회 실패:', error);
        setClubs([]);
      } finally {
        setIsLoading(false);
      }
    };


    const timeoutId = setTimeout(() => {
      fetchClubs();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleClubClick = async (club) => {

    try {
      const clubDetail = await api.get(`/clubs/${club.id}`);
      setSelectedClub(clubDetail || club);
    } catch (error) {
      console.error('동아리 상세 조회 실패:', error);
      setSelectedClub(club);
    }
  };

  const handleCloseDetail = () => {
    setSelectedClub(null);
    setEditingMember(null);
    setDeleteConfirm(null);
    setDeleteClubConfirm(false);
  };

  const handleDeleteClub = async () => {
    if (!selectedClub) return;
    
    try {
      await api.delete(`/clubs/${selectedClub.id}`);
      alert('동아리가 삭제되었습니다.');
      setSelectedClub(null);
      setDeleteClubConfirm(false);
      // 동아리 목록 새로고침
      const data = await api.get(searchQuery.trim() ? `/clubs?search=${encodeURIComponent(searchQuery.trim())}` : '/clubs');
      setClubs(data);
    } catch (error) {
      console.error('동아리 삭제 실패:', error);
      alert('동아리 삭제에 실패했습니다.');
    }
  };

  const handleEditMember = (member, index) => {
    setEditingMember(index);
    setEditForm({
      name: member.name,
      username: member.username.replace('@', ''), 
      tags: [...member.tags],
    });
  };

  const handleSaveEdit = async (clubId, memberIndex) => {
    try {
      const member = selectedClub.members[memberIndex]; 

      const usernameToSend = editForm.username.replace('@', '');

      await api.put(`/clubs/${clubId}/members/${member.id}`, {
        name: editForm.name,
        username: usernameToSend,
        alias: usernameToSend,        
        tags: editForm.tags,
      });

      const updated = await api.get(`/clubs/${clubId}`);
      setSelectedClub(updated);

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
          <input
            type="text"
            className="club-search-input"
            placeholder="동아리 이름, 설명, 학교명으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="club-list">
          {isLoading ? (
            <div className="club-empty-message">로딩 중...</div>
          ) : clubs.length === 0 ? (
            <div className="club-empty-message">
              {searchQuery ? '검색 결과가 없습니다.' : '등록된 동아리가 없습니다.'}
            </div>
          ) : (
            clubs.map((club) => (
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
            ))
          )}
        </div>
      </main>

      {selectedClub && (
        <div className="club-modal-overlay" onClick={handleCloseDetail}>
          <div className="club-modal" onClick={(e) => e.stopPropagation()}>
            <button className="club-modal-close" onClick={handleCloseDetail}>
              ×
            </button>
            <div className="club-modal-content">
              <div className="club-modal-header">
                <div>
                  <h2 className="club-modal-title">{selectedClub.name}</h2>
                  {selectedClub.schoolName && (
                    <div className="club-modal-school">{selectedClub.schoolName}</div>
                  )}
                </div>
                {currentUser.isAdmin && (
                  <button
                    onClick={() => setDeleteClubConfirm(true)}
                    className="club-delete-button"
                    title="동아리 삭제"
                  >
                    삭제
                  </button>
                )}
              </div>
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
                            placeholder="해커닉네임"
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
                            {(member.alias || member.username) && (
                              <div className="member-alias">
                                ({member.alias || member.username?.replace('@', '')})
                              </div>
                            )}
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
              {deleteClubConfirm && (
                <div className="delete-confirm-overlay">
                  <div className="delete-confirm-modal">
                    <p>정말 이 동아리를 삭제하시겠습니까?</p>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                      동아리 삭제 시 모든 멤버의 동아리 정보가 제거됩니다.
                    </p>
                    <div className="delete-confirm-actions">
                      <button
                        onClick={handleDeleteClub}
                        className="confirm-delete-button"
                      >
                        삭제
                      </button>
                      <button
                        onClick={() => setDeleteClubConfirm(false)}
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

