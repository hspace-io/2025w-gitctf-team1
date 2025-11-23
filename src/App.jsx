import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Intro from './components/intro.jsx';
import Club from './components/Club.jsx';
import Header from './components/Header';
import BoardList from './pages/BoardList';
import PostDetail from './pages/PostDetail';
import PostWrite from './pages/PostWrite';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          <Routes>
            <Route path="/" element={<Intro />} />
            <Route path="/club" element={<Club />} />
            {/* 모집글 라우트 - /recruiting 하위로 */}
            <Route path="/recruiting" element={<BoardList />} />
            <Route path="/recruiting/post/:id" element={<PostDetail />} />
            <Route path="/recruiting/write" element={<PostWrite />} />
            <Route path="/recruiting/edit/:id" element={<PostWrite />} />
            {/* 인증 라우트 */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
