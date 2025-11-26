import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Intro from './components/intro.jsx';
import Club from './components/Club.jsx';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
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
            <Route 
              path="/recruiting" 
              element={
                <ProtectedRoute>
                  <BoardList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/recruiting/post/:id" 
              element={
                <ProtectedRoute>
                  <PostDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/recruiting/write" 
              element={
                <ProtectedRoute>
                  <PostWrite />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/recruiting/edit/:id" 
              element={
                <ProtectedRoute>
                  <PostWrite />
                </ProtectedRoute>
              } 
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
