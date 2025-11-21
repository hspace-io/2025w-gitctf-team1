// API 설정 파일
// 백엔드 연동 시 이 파일만 수정하면 됩니다!

const API_CONFIG = {
  // 개발 환경: localStorage 사용
  USE_LOCAL_STORAGE: true,

  // 백엔드 연동 시 아래 주석을 해제하고 USE_LOCAL_STORAGE를 false로 변경하세요
  // USE_LOCAL_STORAGE: false,
  // BASE_URL: 'http://localhost:5000/api',  // 또는 실제 백엔드 URL
};

// 로컬스토리지 키
const STORAGE_KEYS = {
  EVENTS: 'teammate_events',  // /events - 모집글
  COMMENTS: 'teammate_comments',
  NEXT_EVENT_ID: 'next_event_id',
  NEXT_COMMENT_ID: 'next_comment_id',
};

// 초기 샘플 데이터
const INITIAL_EVENTS = [];

const INITIAL_COMMENTS = [];

// 로컬스토리지 초기화
function initializeLocalStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS));
    localStorage.setItem(STORAGE_KEYS.NEXT_EVENT_ID, '1');
  }
  if (!localStorage.getItem(STORAGE_KEYS.COMMENTS)) {
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(INITIAL_COMMENTS));
    localStorage.setItem(STORAGE_KEYS.NEXT_COMMENT_ID, '1');
  }
}

// API 클래스
class API {
  constructor() {
    if (API_CONFIG.USE_LOCAL_STORAGE) {
      initializeLocalStorage();
    }
  }

  // GET 요청
  async get(endpoint) {
    if (API_CONFIG.USE_LOCAL_STORAGE) {
      return this._getFromLocalStorage(endpoint);
    } else {
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    }
  }

  // POST 요청
  async post(endpoint, data) {
    if (API_CONFIG.USE_LOCAL_STORAGE) {
      return this._postToLocalStorage(endpoint, data);
    } else {
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    }
  }

  // PUT 요청
  async put(endpoint, data) {
    if (API_CONFIG.USE_LOCAL_STORAGE) {
      return this._putToLocalStorage(endpoint, data);
    } else {
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    }
  }

  // DELETE 요청
  async delete(endpoint) {
    if (API_CONFIG.USE_LOCAL_STORAGE) {
      return this._deleteFromLocalStorage(endpoint);
    } else {
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    }
  }

  // 로컬스토리지 GET
  _getFromLocalStorage(endpoint) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // /events 엔드포인트 (모집글 목록 조회, 상세 조회)
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
        // 댓글 관련 (다른 팀원 담당)
        else if (endpoint.startsWith('/comments')) {
          const comments = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMENTS) || '[]');
          const postId = parseInt(endpoint.split('=')[1]);
          resolve(comments.filter(c => c.postId === postId));
        }
      }, 100); // API 호출 시뮬레이션
    });
  }

  // 로컬스토리지 POST
  _postToLocalStorage(endpoint, data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // /events POST (모집글 작성)
        if (endpoint === '/events') {
          const events = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]');
          const nextId = parseInt(localStorage.getItem(STORAGE_KEYS.NEXT_EVENT_ID) || '1');

          const newEvent = {
            ...data,
            id: nextId,
            date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
            views: 0,
          };

          events.unshift(newEvent); // 최신 글을 맨 앞에
          localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
          localStorage.setItem(STORAGE_KEYS.NEXT_EVENT_ID, String(nextId + 1));

          resolve(newEvent);
        } 
        // 댓글 작성 (다른 팀원 담당)
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

  // 로컬스토리지 PUT
  _putToLocalStorage(endpoint, data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // /events/:id PUT (모집글 수정)
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

  // 로컬스토리지 DELETE
  _deleteFromLocalStorage(endpoint) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // /events/:id DELETE (모집글 삭제)
        if (endpoint.startsWith('/events/')) {
          const events = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]');
          const id = parseInt(endpoint.split('/')[2]);
          const filtered = events.filter(e => e.id !== id);

          localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(filtered));
          resolve({ success: true });
        } 
        // 댓글 삭제 (다른 팀원 담당)
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
}

export default new API();
