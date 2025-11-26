const API_CONFIG = {
  USE_LOCAL_STORAGE: false,
  BASE_URL: 'http://localhost:5000',
};

const STORAGE_KEYS = {
  EVENTS: 'teammate_events',
  COMMENTS: 'teammate_comments',
  NEXT_EVENT_ID: 'next_event_id',
  NEXT_COMMENT_ID: 'next_comment_id',
  USERS: 'teammate_users',
  NEXT_USER_ID: 'next_user_id',
  CURRENT_USER: 'current_user',
  CLUBS: 'teammate_clubs',
  NEXT_CLUB_ID: 'next_club_id',
};

const INITIAL_EVENTS = [];

const INITIAL_COMMENTS = [];

const INITIAL_CLUBS = [
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

function initializeLocalStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS));
    localStorage.setItem(STORAGE_KEYS.NEXT_EVENT_ID, '1');
  }
  if (!localStorage.getItem(STORAGE_KEYS.COMMENTS)) {
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(INITIAL_COMMENTS));
    localStorage.setItem(STORAGE_KEYS.NEXT_COMMENT_ID, '1');
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.NEXT_USER_ID, '1');
  }
  if (!localStorage.getItem(STORAGE_KEYS.CLUBS)) {
    localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(INITIAL_CLUBS));
    localStorage.setItem(STORAGE_KEYS.NEXT_CLUB_ID, '4');
  }
}

class API {
  constructor() {
    if (API_CONFIG.USE_LOCAL_STORAGE) {
      initializeLocalStorage();
    }
  }

  _getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async get(endpoint) {
    if (API_CONFIG.USE_LOCAL_STORAGE) {
      return this._getFromLocalStorage(endpoint);
    } else {
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        headers: this._getAuthHeaders()
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const result = await response.json();
      return result.data !== undefined ? result.data : result;
    }
  }

  async post(endpoint, data) {
    if (API_CONFIG.USE_LOCAL_STORAGE) {
      return this._postToLocalStorage(endpoint, data);
    } else {
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: this._getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Network response was not ok');
      }
      const result = await response.json();
      return result.data !== undefined ? result.data : result;
    }
  }

  async put(endpoint, data) {
    if (API_CONFIG.USE_LOCAL_STORAGE) {
      return this._putToLocalStorage(endpoint, data);
    } else {
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: this._getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Network response was not ok');
      }
      const result = await response.json();
      return result.data !== undefined ? result.data : result;
    }
  }

  async patch(endpoint, data) {
    if (API_CONFIG.USE_LOCAL_STORAGE) {
      return this._putToLocalStorage(endpoint, data);
    } else {
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        method: 'PATCH',
        headers: this._getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Network response was not ok');
      }
      const result = await response.json();
      return result.data !== undefined ? result.data : result;
    }
  }

  async delete(endpoint, data = null) {
    if (API_CONFIG.USE_LOCAL_STORAGE) {
      return this._deleteFromLocalStorage(endpoint);
    } else {
      let url = `${API_CONFIG.BASE_URL}${endpoint}`;
      if (data) {
        const params = new URLSearchParams();
        Object.keys(data).forEach(key => {
          params.append(key, data[key]);
        });
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Network response was not ok');
      }
      const result = await response.json();
      return result;
    }
  }

  async login(username, password) {
    if (API_CONFIG.USE_LOCAL_STORAGE) {
      return this._loginLocalStorage(username, password);
    } else {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login failed');
      }
      const result = await response.json();
      return result;
    }
  }

  async signUp(userData) {
    if (API_CONFIG.USE_LOCAL_STORAGE) {
      return this._signUpLocalStorage(userData);
    } else {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/signUp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Sign up failed');
      }
      const result = await response.json();
      return result;
    }
  }

  _getFromLocalStorage(endpoint) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (endpoint.startsWith('/events')) {
          const events = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]');

          if (endpoint === '/events') {
            resolve(events);
          } else {
            const id = parseInt(endpoint.split('/')[2]);
            const event = events.find(e => e.id === id);
            resolve(event || null);
          }
        }
        else if (endpoint.startsWith('/clubs')) {
          const clubs = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLUBS) || '[]');

          if (endpoint === '/clubs' || endpoint.startsWith('/clubs?')) {
            let filteredClubs = [...clubs];
            const urlParams = new URLSearchParams(endpoint.split('?')[1] || '');
            const schoolName = urlParams.get('schoolName');
            const search = urlParams.get('search');

            if (schoolName) {
              filteredClubs = filteredClubs.filter(c => c.schoolName === schoolName);
            }
            if (search) {
              const query = search.toLowerCase();
              filteredClubs = filteredClubs.filter(c =>
                c.name.toLowerCase().includes(query) ||
                c.description.toLowerCase().includes(query)
              );
            }
            resolve(filteredClubs);
          } else {
            const id = parseInt(endpoint.split('/')[2]);
            const club = clubs.find(c => c.id === id);
            resolve(club || null);
          }
        }
        else if (endpoint.startsWith('/comments')) {
          const comments = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMENTS) || '[]');
          const postId = parseInt(endpoint.split('=')[1]);
          resolve(comments.filter(c => c.postId === postId));
        }
      }, 100);
    });
  }

  _postToLocalStorage(endpoint, data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (endpoint === '/events') {
          const events = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]');
          const nextId = parseInt(localStorage.getItem(STORAGE_KEYS.NEXT_EVENT_ID) || '1');

          const newEvent = {
            ...data,
            id: nextId,
            date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
            views: 0,
          };

          events.unshift(newEvent);
          localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
          localStorage.setItem(STORAGE_KEYS.NEXT_EVENT_ID, String(nextId + 1));

          resolve(newEvent);
        } 
        else if (endpoint.startsWith('/comments')) {
          const comments = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMENTS) || '[]');
          const nextId = parseInt(localStorage.getItem(STORAGE_KEYS.NEXT_COMMENT_ID) || '1');

          const newComment = {
            ...data,
            id: nextId,
            date: new Date().toLocaleString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            }).replace(/\. /g, '.').replace('.', '. '),
          };

          comments.push(newComment);
          localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
          localStorage.setItem(STORAGE_KEYS.NEXT_COMMENT_ID, String(nextId + 1));

          resolve(newComment);
        }
      }, 100);
    });
  }

  _putToLocalStorage(endpoint, data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (endpoint.startsWith('/events/')) {
          const events = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]');
          const id = parseInt(endpoint.split('/')[2]);
          const index = events.findIndex(e => e.id === id);

          if (index !== -1) {
            events[index] = { ...events[index], ...data };
            localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
            resolve(events[index]);
          } else {
            resolve(null);
          }
        }
      }, 100);
    });
  }

  _deleteFromLocalStorage(endpoint) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (endpoint.startsWith('/events/')) {
          const events = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]');
          const id = parseInt(endpoint.split('/')[2]);
          const filtered = events.filter(e => e.id !== id);

          localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(filtered));
          resolve({ success: true });
        } 
        else if (endpoint.startsWith('/comments/')) {
          const comments = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMENTS) || '[]');
          const id = parseInt(endpoint.split('/')[2]);
          const filtered = comments.filter(c => c.id !== id);

          localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(filtered));
          resolve({ success: true });
        }
      }, 100);
    });
  }

  _loginLocalStorage(username, password) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
          const userInfo = {
            id: user.id,
            username: user.username,
            name: user.name,
            nickname: user.nickname,
            schoolName: user.schoolName,
            clubName: user.clubName,
          };
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userInfo));
          resolve({
            success: true,
            user: userInfo,
            token: `fake-jwt-token-${user.id}`,
          });
        } else {
          reject(new Error('아이디 또는 비밀번호가 올바르지 않습니다.'));
        }
      }, 300);
    });
  }

  _signUpLocalStorage(userData) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
          const nextId = parseInt(localStorage.getItem(STORAGE_KEYS.NEXT_USER_ID) || '1');

          const existingUser = users.find(u => u.username === userData.username);
          if (existingUser) {
            reject(new Error('이미 사용 중인 아이디입니다.'));
            return;
          }

          const newUser = {
            id: nextId,
            schoolName: userData.schoolName,
            clubName: userData.clubName,
            name: userData.name,
            nickname: userData.nickname,
            username: userData.username,
            password: userData.password,
            createdAt: new Date().toISOString(),
          };

          users.push(newUser);
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
          localStorage.setItem(STORAGE_KEYS.NEXT_USER_ID, String(nextId + 1));

          const clubs = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLUBS) || '[]');
          const club = clubs.find(c => c.name === userData.clubName && c.schoolName === userData.schoolName);
          
          if (club) {
            const usernameWithAt = userData.username.startsWith('@') ? userData.username : `@${userData.username}`;
            const existingMember = club.members.find(m => 
              m.username === userData.username || 
              m.username === usernameWithAt ||
              m.name === userData.name
            );
            
            if (!existingMember) {
              const isFirstMember = club.members.length === 0;
              const newMember = {
                name: userData.name,
                username: usernameWithAt,
                tags: isFirstMember ? ['회장'] : ['부원']
              };
              
              club.members.push(newMember);
              if (isFirstMember) {
                club.president = userData.name;
              }
              localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(clubs));
            }
          }

          resolve({
            success: true,
            user: {
              id: newUser.id,
              username: newUser.username,
              name: newUser.name,
              nickname: newUser.nickname,
              schoolName: newUser.schoolName,
              clubName: newUser.clubName,
            }
          });
        } catch (error) {
          reject(error);
        }
      }, 300);
    });
  }
}

export default new API();
