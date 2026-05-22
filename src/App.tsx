import { DeltaGridEMDashboard } from './components/deltagrid'
import { ThemeProvider } from './theme/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <DeltaGridEMDashboard />
    </ThemeProvider>
  )
}

export default App
