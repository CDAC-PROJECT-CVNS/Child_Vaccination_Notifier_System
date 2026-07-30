import {useEffect,useState} from 'react';
import {useNavigate} from 'react-router';
import {toast} from 'react-toastify';
import api,{dataOf} from '../services/api';
import {useAuth} from '../hooks/AuthProvider';
import {OpenStreetMapPicker} from '../components/OpenStreetMap';

const empty={firstName:'',lastName:'',email:'',phone:'',password:'',dob:'',address:'',city:'Pune',role:'ROLE_PARENT',clinicName:'',latitude:null,longitude:null};

export default function AuthPage(){
 const[register,setRegister]=useState(false),[show,setShow]=useState(false),[form,setForm]=useState(empty),[loading,setLoading]=useState(false);
 const[verifyEmail,setVerifyEmail]=useState(''),[otp,setOtp]=useState(''),[resendIn,setResendIn]=useState(0);
 const{login}=useAuth(),navigate=useNavigate();
 const change=e=>setForm({...form,[e.target.name]:e.target.value});
 useEffect(()=>{if(resendIn<=0)return;const id=setInterval(()=>setResendIn(x=>x>0?x-1:0),1000);return()=>clearInterval(id)},[resendIn]);
 const finishLogin=data=>{login(data);toast.success('Email verified');navigate('/home')};
 const submit=async e=>{
  e.preventDefault();setLoading(true);
  try{
   if(register){
    const body={...form,dob:form.dob||null};
    const result=dataOf(await api.post('/auth/register',body));
    setVerifyEmail(result.email);setOtp('');setResendIn(60);
    toast.success('Verification code sent');
   }else{
    const data=dataOf(await api.post('/auth/login',{email:form.email,password:form.password}));
    login(data);toast.success('Welcome back');navigate('/home');
   }
  }catch(error){
   const message=error.response?.data?.message||'Request failed';
   if(!register&&message.toLowerCase().includes('not verified')){setVerifyEmail(form.email);setResendIn(0)}
   toast.error(message);
  }finally{setLoading(false)}
 };
 const verify=async e=>{e.preventDefault();setLoading(true);try{finishLogin(dataOf(await api.post('/auth/verify-email-otp',{email:verifyEmail,otp}))) }catch(error){toast.error(error.response?.data?.message||'Verification failed')}finally{setLoading(false)}};
 const resend=async()=>{setLoading(true);try{await api.post('/auth/resend-email-otp',{email:verifyEmail});setResendIn(60);toast.success('New verification code sent')}catch(error){toast.error(error.response?.data?.message||'Unable to resend code')}finally{setLoading(false)}};
 const back=()=>{setVerifyEmail('');setOtp('');setRegister(false);setForm({...empty,email:form.email})};
 return <div className="relative min-h-screen overflow-hidden bg-slate-950 p-3 sm:p-6">
   <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-teal-500/25 blur-3xl"/><div className="absolute -right-32 bottom-10 h-[430px] w-[430px] rounded-full bg-blue-500/25 blur-3xl"/>
   <div className="relative mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-7xl overflow-hidden rounded-[34px] bg-white shadow-2xl sm:min-h-[calc(100vh-3rem)] lg:grid-cols-[.9fr_1.1fr]">
    <section className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-teal-950 to-blue-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div><div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm">Child vaccination management</div><h1 className="mt-10 max-w-xl text-6xl font-black leading-[1.02]">Timely care.<br/><span className="text-teal-300">Complete records.</span></h1><p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">Manage vaccination schedules, appointments, nearby clinics, reminders, and trusted vaccination information.</p></div>
      <div className="grid grid-cols-3 gap-3">{[['Verified','Email access'],['Nearby','Clinic locator'],['Secure','Role-based access']].map(([a,b])=><div key={b} className="rounded-3xl border border-white/10 bg-white/10 p-4"><p className="text-2xl font-black text-teal-300">{a}</p><p className="mt-1 text-xs text-slate-300">{b}</p></div>)}</div>
    </section>
    <section className="max-h-[calc(100vh-1.5rem)] overflow-y-auto p-6 sm:p-10 lg:p-12">
      <div className="mx-auto max-w-2xl">
      {verifyEmail?<>
       <div className="lg:hidden"><p className="text-2xl font-black gradient-text">VaccineCare</p></div><div className="mx-auto mt-10 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-500 to-blue-600 text-4xl text-white shadow-xl">✉</div>
       <p className="mt-7 text-center text-sm font-bold uppercase tracking-[.2em] text-teal-600">Verify your email</p><h2 className="mt-2 text-center text-4xl font-black text-slate-950">Enter verification code</h2><p className="mx-auto mt-3 max-w-lg text-center leading-7 text-slate-500">A verification code was sent to <b className="text-slate-800">{verifyEmail}</b>. The code expires in 10 minutes.</p>
       <form onSubmit={verify} className="mx-auto mt-8 max-w-md"><input className="input text-center text-3xl font-black tracking-[.45em]" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" required pattern="[0-9]{6}"/><button className="btn-primary mt-5 w-full" disabled={loading||otp.length!==6}>{loading?'Please wait...':'Verify and continue'}</button></form>
       <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm"><span className="text-slate-500">Didn’t receive the code?</span><button className="font-bold text-teal-700 disabled:text-slate-400" disabled={loading||resendIn>0} onClick={resend}>{resendIn>0?`Resend in ${resendIn}s`:'Resend code'}</button></div>
       <button className="mx-auto mt-5 block font-bold text-slate-500 hover:text-slate-800" onClick={back}>← Back to sign in</button>
      </>:<>
       <div className="lg:hidden"><p className="text-2xl font-black gradient-text">VaccineCare</p></div><p className="mt-3 text-sm font-bold uppercase tracking-[.2em] text-teal-600">{register?'Create account':'Sign in'}</p><h2 className="mt-2 text-4xl font-black text-slate-950">{register?'Create your account':'Welcome back'}</h2><p className="mt-2 text-slate-500">{register?'Complete the form and verify your email.':'Sign in to access your dashboard.'}</p>
      <form onSubmit={submit} className="mt-8 grid gap-4 sm:grid-cols-2">
       {register&&<>
        <label className="text-sm font-bold text-slate-600">First name<input className="input mt-2" name="firstName" value={form.firstName} required onChange={change}/></label>
        <label className="text-sm font-bold text-slate-600">Last name<input className="input mt-2" name="lastName" value={form.lastName} required onChange={change}/></label>
        <label className="text-sm font-bold text-slate-600">Phone<input className="input mt-2" name="phone" value={form.phone} placeholder="10-digit mobile number" required onChange={change}/></label>
        <label className="text-sm font-bold text-slate-600">Date of birth<input className="input mt-2" type="date" name="dob" value={form.dob} onChange={change}/></label>
        <label className="text-sm font-bold text-slate-600">Register as<select className="input mt-2" name="role" value={form.role} onChange={change}><option value="ROLE_PARENT">Parent / Guardian</option><option value="ROLE_CLINIC">Clinic / Hospital</option></select></label>
        <label className="text-sm font-bold text-slate-600">City<input className="input mt-2" name="city" value={form.city} required onChange={change}/></label>
        <label className="text-sm font-bold text-slate-600 sm:col-span-2">Address<textarea className="input mt-2 min-h-24" name="address" value={form.address} required onChange={change}/></label>
        {form.role==='ROLE_CLINIC'&&<label className="text-sm font-bold text-slate-600 sm:col-span-2">Clinic or hospital name<input className="input mt-2" name="clinicName" value={form.clinicName} required onChange={change}/></label>}
        <div className="sm:col-span-2"><OpenStreetMapPicker latitude={form.latitude} longitude={form.longitude} onChange={location=>setForm({...form,...location})}/></div>
       </>}
       <label className="text-sm font-bold text-slate-600 sm:col-span-2">Email address<input className="input mt-2" type="email" name="email" value={form.email} placeholder="name@example.com" required onChange={change}/></label>
       <label className="relative text-sm font-bold text-slate-600 sm:col-span-2">Password<input className="input mt-2 pr-14" type={show?'text':'password'} name="password" value={form.password} placeholder="Minimum 8 characters" required onChange={change}/><button type="button" className="absolute bottom-3 right-4 text-xl" onClick={()=>setShow(!show)}>{show?'◉':'◎'}</button></label>
       <button className="btn-primary mt-2 sm:col-span-2" disabled={loading}>{loading?'Please wait...':register?'Create account':'Sign in'}</button>
      </form>
      <button className="mt-6 font-bold text-teal-700 hover:text-teal-900" onClick={()=>{setRegister(!register);setForm(empty)}}>{register?'Already have an account? Sign in':'Create an account'}</button>
      </>}
      </div>
    </section>
   </div>
 </div>;
}
