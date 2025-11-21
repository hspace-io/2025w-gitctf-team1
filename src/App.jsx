import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import BoardList from './pages/BoardList'
import PostDetail from './pages/PostDetail'
import PostWrite from './pages/PostWrite'

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          {/* 모집글 라우트 - /recruiting 하위로 */}
          <Route path="/recruiting" element={<BoardList />} />
          <Route path="/recruiting/post/:id" element={<PostDetail />} />
          <Route path="/recruiting/write" element={<PostWrite />} />
          <Route path="/recruiting/edit/:id" element={<PostWrite />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
