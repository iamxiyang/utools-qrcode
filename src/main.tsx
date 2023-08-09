import { createRoot } from 'react-dom/client'
import './index.scss'
import 'virtual:uno.css'
import MyApp from './App'

const container = document.getElementById('root')
const root = createRoot(container!)
root.render(<MyApp />)
