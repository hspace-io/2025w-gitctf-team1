import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Intro from './component/intro.jsx';
import Club from './component/Club.jsx';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Intro />} />
          <Route path="/club" element={<Club />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
