import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Intro from './component/intro.jsx';
import Club from './component/Club.jsx';
import Header from './components/Header';
import BoardList from './pages/BoardList';
import PostDetail from './pages/PostDetail';
import PostWrite from './pages/PostWrite';
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
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
