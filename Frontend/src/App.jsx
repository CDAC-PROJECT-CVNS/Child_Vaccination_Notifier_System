import { Navigate, Route, Routes } from 'react-router'
import AuthPage from './pages/AuthPage'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import ChildrenPage from './pages/ChildrenPage'
import SchedulePage from './pages/SchedulePage'
import AppointmentsPage from './pages/AppointmentsPage'
import ClinicsPage from './pages/ClinicsPage'
import NotificationsPage from './pages/NotificationsPage'
import ChatbotPage from './pages/ChatbotPage'
import ProfilePage from './pages/ProfilePage'

function Guard({ roles, children }) {
    return <ProtectedRoute roles={roles}>{children}</ProtectedRoute>
}

function App() {
    return (
        <Routes>
            <Route path='/' element={<AuthPage />} />
            <Route element={<Guard><Layout /></Guard>}>
                <Route path='/home' element={<HomePage />} />
                <Route path='/profile' element={<ProfilePage />} />
                <Route path='/children' element={<Guard roles={['ROLE_PARENT']}><ChildrenPage /></Guard>} />
                <Route path='/schedule' element={<Guard roles={['ROLE_PARENT']}><SchedulePage /></Guard>} />
                <Route path='/appointments' element={<Guard roles={['ROLE_PARENT']}><AppointmentsPage /></Guard>} />
                <Route path='/clinics' element={<Guard roles={['ROLE_PARENT']}><ClinicsPage /></Guard>} />
                <Route path='/notifications' element={<NotificationsPage />} />
                <Route path='/chatbot' element={<ChatbotPage />} />
            </Route>
            <Route path='*' element={<Navigate to='/home' />} />
        </Routes>
    )
}

export default App
