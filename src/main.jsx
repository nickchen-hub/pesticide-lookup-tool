import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Google 翻譯會把文字節點包進 <font>，React 之後移除/插入節點時會找不到原節點而崩潰
// 參考 https://github.com/facebook/react/issues/11538
if (typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild
  Node.prototype.removeChild = function (child) {
    if (child.parentNode !== this) return child
    return originalRemoveChild.apply(this, arguments)
  }
  const originalInsertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) return newNode
    return originalInsertBefore.apply(this, arguments)
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
