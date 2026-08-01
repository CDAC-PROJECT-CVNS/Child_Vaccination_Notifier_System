import { NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from '../hooks/AuthProvider'

const links = {
    ROLE_PARENT: [
        ['/home', '⌂', 'Dashboard'],
        ['/children', '♙', 'Children'],
        ['/schedule', '✓', 'Schedule'],
        ['/appointments', '◷', 'Appointments'],
        ['/clinics', '⌖', 'Nearby Clinics'],
        ['/notifications', '◉', 'Notifications'],
        ['/chatbot', '✦', 'Vaccination Assistant'],
        ['/profile', '⚙', 'Profile']
    ],
    ROLE_ADMIN: [
        ['/home', '⌂', 'Dashboard'],
        ['/profile', '⚙', 'Profile']
    ],
    ROLE_CLINIC: [
        ['/home', '⌂', 'Dashboard'],
        ['/notifications', '◉', 'Notifications'],
        ['/profile', '⚙', 'Profile']
    ]
}

function Layout() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogoutClick = () => {
        logout()
        navigate('/')
    }

    const userLinks = links[user?.role] || []

    return (
        <div className='min-h-screen lg:grid lg:grid-cols-[270px_1fr]'>
            <aside className='hidden min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-teal-950 p-5 text-white lg:flex lg:flex-col'>
                <div className='flex items-center gap-3 px-2 py-3'>
                    <div className='grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-teal-400 to-blue-500 text-2xl shadow-lg'>✚</div>
                    <div>
                        <h1 className='text-xl font-black'>VaccineCare</h1>
                        <p className='text-xs text-slate-400'>Vaccination Management</p>
                    </div>
                </div>

                <nav className='mt-8 space-y-1'>
                    {userLinks.map(([to, icon, label]) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                                    isActive
                                        ? 'bg-white text-slate-950 shadow-xl'
                                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                }`
                            }
                        >
                            <span className='grid h-7 w-7 place-items-center rounded-lg bg-white/10 text-base'>{icon}</span>
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <div className='mt-auto rounded-3xl border border-white/10 bg-white/5 p-4'>
                    <p className='text-xs uppercase tracking-widest text-teal-300'>Account</p>
                    <p className='mt-2 font-bold'>{user?.name}</p>
                    <p className='text-xs text-slate-400'>{user?.role?.replace('ROLE_', '')}</p>
                    <button
                        className='mt-4 w-full rounded-2xl border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/10'
                        onClick={handleLogoutClick}
                    >
                        Sign out
                    </button>
                </div>
            </aside>

            <div className='min-w-0'>
                <header className='sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl lg:hidden'>
                    <div className='flex items-center justify-between px-4 py-3'>
                        <div>
                            <p className='font-black text-slate-900'>VaccineCare</p>
                            <p className='text-xs text-slate-500'>{user?.name}</p>
                        </div>
                        <button className='btn-secondary py-2' onClick={handleLogoutClick}>Sign out</button>
                    </div>
                    <nav className='scrollbar-thin flex gap-2 overflow-x-auto px-3 pb-3'>
                        {userLinks.map(([to, icon, label]) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) =>
                                    `whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold ${
                                        isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                                    }`
                                }
                            >
                                {icon} {label}
                            </NavLink>
                        ))}
                    </nav>
                </header>

                <main className='mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8'>
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default Layout
