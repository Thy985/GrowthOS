import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashboard';
import GrowthTree from './components/GrowthTree';
import Analytics from './components/Analytics';
import Auth from './components/Auth';

function App() {
  // 模拟登录状态
  const isAuthenticated = true;

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/auth" />} />
          <Route path="/growth-tree" element={isAuthenticated ? <GrowthTree /> : <Navigate to="/auth" />} />
          <Route path="/analytics" element={isAuthenticated ? <Analytics /> : <Navigate to="/auth" />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;