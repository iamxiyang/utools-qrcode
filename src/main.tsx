import { createRoot } from 'react-dom/client'
import './index.scss'
import 'virtual:uno.css'
import { HomePage } from './App'
import { App } from 'antd'

const container = document.getElementById('root')
const root = createRoot(container!)

const MyApp: React.FC = () => (
  <App>
    <HomePage />
  </App>
)

root.render(<MyApp />)
