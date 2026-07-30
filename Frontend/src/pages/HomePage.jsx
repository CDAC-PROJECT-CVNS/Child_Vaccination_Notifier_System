import {useEffect,useState} from 'react';
import {Link} from 'react-router';
import {useAuth} from '../hooks/AuthProvider';
import api,{dataOf} from '../services/api';
import AdminDashboard from './admin/AdminDashboard';
import ClinicDashboard from './clinic/ClinicDashboard';

export default function HomePage(){
 const{user}=useAuth();const[dashboard,setDashboard]=useState(null);
 useEffect(()=>{if(user?.role==='ROLE_PARENT')api.get('/dashboard').then(r=>setDashboard(dataOf(r)))},[user]);
 if(user?.role==='ROLE_ADMIN')return <AdminDashboard/>;
 if(user?.role==='ROLE_CLINIC')return <ClinicDashboard/>;
 const stats=[['Children',dashboard?.children||0,'♙','from-teal-500 to-cyan-500'],['Upcoming vaccines',dashboard?.upcomingVaccinations||0,'✓','from-blue-500 to-indigo-500'],['Missed vaccines',dashboard?.missedVaccinations||0,'!','from-amber-500 to-orange-500'],['Completed',dashboard?.completedVaccinations||0,'★','from-emerald-500 to-green-500'],['Unread notifications',dashboard?.unreadNotifications||0,'◉','from-violet-500 to-purple-500'],['Appointments',dashboard?.upcomingAppointments||0,'◷','from-rose-500 to-pink-500']];
 return <div>
  <section className="relative overflow-hidden rounded-[34px] bg-gradient-to-r from-slate-950 via-teal-950 to-blue-950 p-7 text-white shadow-2xl sm:p-10"><div className="relative z-10 max-w-3xl"><p className="text-sm font-bold uppercase tracking-[.24em] text-teal-300">Parent Dashboard</p><h2 className="mt-3 text-4xl font-black sm:text-5xl">Welcome, {user?.name?.split(' ')[0]}.</h2><p className="mt-4 max-w-2xl text-slate-300">Manage vaccination schedules, appointments, notifications, and child health records.</p><div className="mt-7 flex flex-wrap gap-3"><Link className="btn-primary" to="/children">Add child</Link><Link className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 font-bold hover:bg-white/20" to="/clinics">Find nearby hospitals</Link></div></div><div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-teal-400/20 blur-2xl"/></section>
  <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{stats.map(([name,value,icon,gradient])=><div className="stat-card card-hover" key={name}><div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${gradient} text-xl font-black text-white shadow-lg`}>{icon}</div><p className="mt-5 text-sm font-bold text-slate-500">{name}</p><p className="mt-1 text-4xl font-black text-slate-950">{value}</p></div>)}</div>
  <div className="mt-6 grid gap-5 lg:grid-cols-3"><Link to="/schedule" className="card card-hover"><p className="text-3xl">✓</p><h3 className="mt-4 section-title">Vaccination schedule</h3><p className="mt-2 text-sm leading-6 text-slate-500">Track upcoming, completed, and missed vaccinations.</p></Link><Link to="/appointments" className="card card-hover"><p className="text-3xl">◷</p><h3 className="mt-4 section-title">Appointments</h3><p className="mt-2 text-sm leading-6 text-slate-500">Select a clinic and an available time.</p></Link><Link to="/chatbot" className="card card-hover"><p className="text-3xl">✦</p><h3 className="mt-4 section-title">Vaccination assistant</h3><p className="mt-2 text-sm leading-6 text-slate-500">Get vaccination information and after-care guidance.</p></Link></div>
 </div>;
}
