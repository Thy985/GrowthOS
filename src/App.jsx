import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default Appimport { BrowserRouter as Router, Routes,import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import GrowthTree from './components/GrowthTree'
import Analytics from './components/Analytics'
import Auth from './components/Auth'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import GrowthTree from './components/GrowthTree'
import Analytics from './components/Analytics'
import Auth from './components/Auth'

function App() {
  return (
    <Router>
      <div className="import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import GrowthTree from './components/GrowthTree'
import Analytics from './components/Analytics'
import Auth from './components/Auth'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-9