import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'react-toastify'
import api, { dataOf } from '../services/api'
import { NearbyHospitalMap, currentLocation } from '../components/OpenStreetMap'

function ClinicsPage() {
    const [origin, setOrigin] = useState(null)
    const [clinics, setClinics] = useState([])
    const [radius, setRadius] = useState(10)
    const [loading, setLoading] = useState(false)
    const [selected, setSelected] = useState(null)
    const navigate = useNavigate()

    useEffect(() => {
        api.get('/users/profile').then(response => {
            const profile = dataOf(response)
            if (profile.latitude && profile.longitude)
                setOrigin({ latitude: profile.latitude, longitude: profile.longitude })
        })
    }, [])

    const findClinics = async (nextOrigin = origin) => {
        if (!nextOrigin?.latitude || !nextOrigin?.longitude) {
            toast.error('Please provide your location')
            return
        }

        setLoading(true)
        setSelected(null)
        try {
            const response = await api.get('/clinics/nearby', {
                params: { ...nextOrigin, radiusKm: radius }
            })
            const result = dataOf(response)
            setClinics(result)
            if (!result.length)
                toast.info('No added clinics found within this radius')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to find nearby clinics')
        } finally {
            setLoading(false)
        }
    }

    const handleCurrentLocationClick = async () => {
        try {
            const location = await currentLocation()
            setOrigin(location)
            await findClinics(location)
        } catch (error) {
            toast.error(error.message)
        }
    }

    const getDirectionsUrl = clinic =>
        `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${origin.latitude}%2C${origin.longitude}%3B${clinic.latitude}%2C${clinic.longitude}`

    const handleBookAppointmentClick = clinic => {
        window.sessionStorage.setItem('selectedClinicId', String(clinic.clinicId))
        navigate('/appointments')
    }

    return (
        <div>
            <div className='flex flex-wrap items-end justify-between gap-4'>
                <div>
                    <h2 className='page-title'>Nearby Clinics</h2>
                    <p className='page-subtitle'>View verified clinics added to this application.</p>
                </div>
                <div className='flex flex-wrap gap-2'>
                    <select
                        className='input w-auto'
                        value={radius}
                        onChange={event => setRadius(Number(event.target.value))}
                    >
                        <option value='5'>Within 5 km</option>
                        <option value='10'>Within 10 km</option>
                        <option value='20'>Within 20 km</option>
                        <option value='30'>Within 30 km</option>
                    </select>
                    <button className='btn-secondary' onClick={handleCurrentLocationClick}>◎ Use current location</button>
                    <button className='btn-primary' onClick={() => findClinics()} disabled={loading}>
                        {loading ? 'Searching...' : '⌖ Find clinics'}
                    </button>
                </div>
            </div>

            {!origin && (
                <div className='card mt-6 border-amber-200 bg-amber-50'>
                    <p className='font-bold text-amber-900'>Location not available.</p>
                    <p className='mt-1 text-sm text-amber-700'>Add your location in Profile or use your current device location.</p>
                </div>
            )}

            <div className='mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]'>
                <div className='map-shell'>
                    <NearbyHospitalMap
                        origin={origin}
                        hospitals={clinics}
                        onSelect={setSelected}
                        selected={selected}
                        radiusKm={radius}
                    />
                </div>

                <div className='scrollbar-thin max-h-[650px] space-y-3 overflow-y-auto pr-1'>
                    {clinics.map((clinic, index) => (
                        <article
                            key={clinic.clinicId || index}
                            className={`card card-hover cursor-pointer ${selected === clinic ? 'ring-2 ring-teal-500' : ''}`}
                            onClick={() => setSelected(clinic)}
                        >
                            <div className='flex gap-4'>
                                <div className='grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 font-black text-white'>
                                    {index + 1}
                                </div>
                                <div className='min-w-0 flex-1'>
                                    <div className='flex flex-wrap items-center gap-2'>
                                        <h3 className='font-extrabold text-slate-900'>{clinic.name}</h3>
                                        <span className='badge bg-teal-50 text-teal-700'>Verified clinic</span>
                                    </div>
                                    <p className='mt-1 text-sm leading-6 text-slate-500'>{clinic.address}</p>
                                    {clinic.phone && <p className='mt-1 text-sm font-semibold text-slate-600'>☎ {clinic.phone}</p>}
                                    <div className='mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-600'>
                                        <span className='rounded-full bg-slate-100 px-3 py-1'>{clinic.distanceKm} km away</span>
                                        <span className='rounded-full bg-indigo-50 px-3 py-1 text-indigo-700'>Select to preview route</span>
                                    </div>
                                    <div className='mt-4 flex flex-wrap gap-2'>
                                        <a
                                            className='btn-secondary py-2'
                                            href={getDirectionsUrl(clinic)}
                                            target='_blank'
                                            rel='noreferrer'
                                            onClick={event => event.stopPropagation()}
                                        >
                                            Get directions
                                        </a>
                                        <button
                                            className='btn-primary py-2'
                                            onClick={event => {
                                                event.stopPropagation()
                                                handleBookAppointmentClick(clinic)
                                            }}
                                        >
                                            Book appointment
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}

                    {!clinics.length && (
                        <div className='card text-center text-slate-500'>
                            <p className='text-4xl'>⌖</p>
                            <p className='mt-3 font-bold text-slate-700'>Find nearby clinics</p>
                            <p className='mt-1 text-sm'>Clinics added and verified in this application will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ClinicsPage
