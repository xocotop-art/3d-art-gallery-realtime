import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as THREE from 'three'
import App from './App'
import './index.css'

THREE.ImageLoader.prototype.crossOrigin = 'anonymous';

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
