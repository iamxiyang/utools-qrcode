import { createRoot } from 'react-dom/client'
import './index.scss'
import 'virtual:uno.css'
import AppPage from './App'
import { App } from 'antd'

const container = document.getElementById('root')
const root = createRoot(container!)

const MyApp: React.FC = () => (
  <App>
    <AppPage />
  </App>
)

root.render(<MyApp />)
