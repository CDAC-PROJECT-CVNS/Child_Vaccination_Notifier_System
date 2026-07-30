import {useEffect,useState} from 'react';
import {toast} from 'react-toastify';
import api,{dataOf} from '../services/api';
import {useAuth} from '../hooks/AuthProvider';
import {OpenStreetMapPicker} from '../components/OpenStreetMap';

export default function ProfilePage(){
 const{user}=useAuth();const[form,setForm]=useState(null),[passwordForm,setPasswordForm]=useState({oldPassword:'',newPassword:''});
 useEffect(()=>{api.get('/users/profile').then(r=>setForm(dataOf(r)))},[]);
 if(!form)return <div className="card">Loading profile...</div>;
 const save=async e=>{e.preventDefault();try{setForm(dataOf(await api.put('/users/profile',form)));toast.success('Profile updated')}catch(x){toast.error(x.response?.data?.message||'Unable to update profile')}};
 const changePassword=async e=>{e.preventDefault();try{await api.patch('/auth/change-password',passwordForm);toast.success('Password changed');setPasswordForm({oldPassword:'',newPassword:''})}catch(x){toast.error(x.response?.data?.message||'Unable to change password')}};
 return <div>
  <div><h2 className="page-title">Profile settings</h2><p className="page-subtitle">Manage your personal information and account security.</p></div>
  <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
   <form className="card" onSubmit={save}><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold text-slate-600">First name<input className="input mt-2" value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})}/></label><label className="text-sm font-bold text-slate-600">Last name<input className="input mt-2" value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})}/></label><label className="text-sm font-bold text-slate-600">Email<input className="input mt-2" value={form.email} disabled/></label><label className="text-sm font-bold text-slate-600">Phone<input className="input mt-2" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label><label className="text-sm font-bold text-slate-600">City<input className="input mt-2" value={form.city||''} onChange={e=>setForm({...form,city:e.target.value})}/></label><label className="text-sm font-bold text-slate-600">Date of birth<input className="input mt-2" type="date" value={form.dob||''} onChange={e=>setForm({...form,dob:e.target.value||null})}/></label><label className="text-sm font-bold text-slate-600 sm:col-span-2">Address<textarea className="input mt-2 min-h-24" value={form.address||''} onChange={e=>setForm({...form,address:e.target.value})}/></label>{user?.role==='ROLE_PARENT'&&<div className="sm:col-span-2"><OpenStreetMapPicker latitude={form.latitude} longitude={form.longitude} onChange={location=>setForm({...form,...location})}/></div>}<button className="btn-primary sm:col-span-2">Save profile</button></div></form>
   <div className="space-y-6"><div className="card bg-gradient-to-br from-slate-950 to-teal-950 text-white"><div className="grid h-16 w-16 place-items-center rounded-3xl bg-white/10 text-3xl">{form.firstName?.[0]}{form.lastName?.[0]}</div><h3 className="mt-5 text-2xl font-black">{form.firstName} {form.lastName}</h3><p className="mt-1 text-sm text-slate-300">{form.role?.replace('ROLE_','')}</p><p className="mt-5 text-sm text-slate-300">{form.city||'Location not provided'}</p></div><form className="card" onSubmit={changePassword}><h3 className="section-title">Change password</h3><div className="mt-4 space-y-3"><input className="input" type="password" placeholder="Current password" value={passwordForm.oldPassword} onChange={e=>setPasswordForm({...passwordForm,oldPassword:e.target.value})}/><input className="input" type="password" placeholder="New password" value={passwordForm.newPassword} onChange={e=>setPasswordForm({...passwordForm,newPassword:e.target.value})}/><button className="btn-secondary w-full">Update password</button></div></form></div>
  </div>
 </div>;
}
