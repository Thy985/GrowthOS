import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashboard';
import GrowthTree from './components/GrowthTree';
import Analytics from './components/Analytics';
import Auth from './components/Auth';

function Navbar() {
  const location = useLocation();
  
  return (
    <nav className="nav">
      <div className="nav-container">
        <Link to="/" className="nav-logo">GrowthOS</Link>
        <div className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            仪表盘
          </Link>
          <Link to="/growth-tree" className={`nav-link ${location.pathname === '/growth-tree' ? 'active' : ''}`}>
            成长树
          </Link>
          <Link to="/analytics" className={`nav-link ${location.pathname === '/analytics' ? 'active' : ''}`}>
            分析
          </Link>
        </div>
      </div>
    </nav>
  );
}

function App() {
  // 模拟登录状态
  const isAuthenticated = true;

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        {isAuthenticated && <Navbar />}
        <div className="main">
          <Routes>
            <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/auth" />} />
            <Route path="/growth-tree" element={isAuthenticated ? <GrowthTree /> : <Navigate to="/auth" />} />
            <Route path="/analytics" element={isAuthenticated ? <Analytics /> : <Navigate to="/auth" />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;