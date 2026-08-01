import api,{dataOf} from '../services/api';
import {useEffect,useMemo,useState} from 'react';
import {Circle,MapContainer,Marker,Popup,Polyline,TileLayer,useMap,useMapEvents} from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({iconRetinaUrl:markerIcon2x,iconUrl:markerIcon,shadowUrl:markerShadow});

const DEFAULT_CENTER=[18.5204,73.8567];
const tileUrl=import.meta.env.VITE_OSM_TILE_URL||'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const osrmUrl=import.meta.env.VITE_OSRM_URL||'https://router.project-osrm.org';
const tileAttribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export function currentLocation(){
  return new Promise((resolve,reject)=>{
    if(!navigator.geolocation)return reject(new Error('Location is not supported by this browser'));
    navigator.geolocation.getCurrentPosition(
      p=>resolve({latitude:Number(p.coords.latitude.toFixed(7)),longitude:Number(p.coords.longitude.toFixed(7))}),
      ()=>reject(new Error('Location permission was denied or unavailable')),
      {enableHighAccuracy:true,timeout:12000,maximumAge:60000}
    );
  });
}

function Recenter({position,zoom=15}){
  const map=useMap();
  useEffect(()=>{if(position)map.setView(position,zoom)},[map,position?.[0],position?.[1],zoom]);
  return null;
}

function FitHospitals({origin,hospitals}){
  const map=useMap();
  useEffect(()=>{
    if(!origin)return;
    const points=[origin,...hospitals.filter(h=>Number.isFinite(Number(h.latitude))&&Number.isFinite(Number(h.longitude))).map(h=>[Number(h.latitude),Number(h.longitude)])];
    if(points.length===1)map.setView(origin,13);
    else map.fitBounds(L.latLngBounds(points),{padding:[45,45],maxZoom:15});
  },[map,origin?.[0],origin?.[1],hospitals]);
  return null;
}

function PickerMarker({position,onChange}){
  useMapEvents({click:e=>onChange({latitude:Number(e.latlng.lat.toFixed(7)),longitude:Number(e.latlng.lng.toFixed(7))})});
  if(!position)return null;
  return <Marker position={position} draggable eventHandlers={{dragend:e=>{
    const point=e.target.getLatLng();
    onChange({latitude:Number(point.lat.toFixed(7)),longitude:Number(point.lng.toFixed(7))});
  }}}><Popup>Selected location</Popup></Marker>;
}

function numberedIcon(index,registered){
  return L.divIcon({
    className:'cvns-number-marker',
    html:`<span class="${registered?'registered':''}">${index}</span>`,
    iconSize:[38,38],iconAnchor:[19,34],popupAnchor:[0,-31]
  });
}

function originIcon(){
  return L.divIcon({className:'cvns-origin-marker',html:'<span>⌾</span>',iconSize:[42,42],iconAnchor:[21,21],popupAnchor:[0,-20]});
}

function RouteLayer({origin,destination,onRoute}){
  const map=useMap();
  const[points,setPoints]=useState([]);
  useEffect(()=>{
    setPoints([]);onRoute?.(null);
    if(!origin||!destination)return;
    const controller=new AbortController();
    const url=`${osrmUrl}/route/v1/driving/${origin[1]},${origin[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson&steps=false`;
    fetch(url,{signal:controller.signal})
      .then(r=>{if(!r.ok)throw new Error('Route service unavailable');return r.json()})
      .then(data=>{
        const route=data.routes?.[0];
        if(!route)return;
        const line=route.geometry.coordinates.map(([lng,lat])=>[lat,lng]);
        setPoints(line);
        onRoute?.({distanceKm:Number((route.distance/1000).toFixed(1)),durationMinutes:Math.round(route.duration/60)});
        if(line.length)map.fitBounds(L.latLngBounds(line),{padding:[45,45],maxZoom:15});
      })
      .catch(e=>{if(e.name!=='AbortError')onRoute?.({error:'Route preview is temporarily unavailable.'})});
    return()=>controller.abort();
  },[map,origin?.[0],origin?.[1],destination?.[0],destination?.[1]]);
  return points.length?<Polyline positions={points}/>:null;
}

async function searchAddress(query){
  const response=await api.get('/locations/search',{params:{query}});
  return dataOf(response);
}

export function OpenStreetMapPicker({latitude,longitude,onChange,height='330px'}){
  const[error,setError]=useState('');
  const[query,setQuery]=useState('');
  const[results,setResults]=useState([]);
  const[searching,setSearching]=useState(false);
  const lat=Number(latitude),lng=Number(longitude);
  const valid=Number.isFinite(lat)&&Number.isFinite(lng);
  const position=valid?[lat,lng]:null;
  const center=position||DEFAULT_CENTER;

  const useCurrent=async()=>{
    try{setError('');onChange(await currentLocation())}catch(e){setError(e.message)}
  };
  const submitSearch=async e=>{
    e.preventDefault();
    if(query.trim().length<3)return setError('Enter at least three characters');
    setSearching(true);setError('');setResults([]);
    try{
      const list=await searchAddress(query.trim());
      setResults(list);
      if(!list.length)setError('No matching location found');
    }catch(e){setError(e.response?.data?.message||e.message||'Address search is unavailable')}finally{setSearching(false)}
  };
  const chooseResult=item=>{
    onChange({latitude:Number(Number(item.latitude).toFixed(7)),longitude:Number(Number(item.longitude).toFixed(7))});
    setQuery(item.displayName);setResults([]);setError('');
  };

  return <div className="map-shell">
    <div className="border-b border-slate-200 bg-white/95 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="font-semibold text-slate-800">Select location</p><p className="text-xs text-slate-500">Search an address or choose a point on the map.</p></div>
        <button type="button" className="btn-secondary" onClick={useCurrent}>◎ Use current location</button>
      </div>
      <form className="mt-3 flex gap-2" onSubmit={submitSearch}>
        <input className="input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search address, area, or hospital"/>
        <button type="submit" className="btn-primary shrink-0" disabled={searching}>{searching?'Searching...':'Search'}</button>
      </form>
      {results.length>0&&<div className="mt-2 max-h-48 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">{results.map(item=><button type="button" key={`${item.osmType}-${item.osmId}`} className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-cyan-50" onClick={()=>chooseResult(item)}>{item.displayName}</button>)}</div>}
      {error&&<p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">{error}</p>}
    </div>
    <MapContainer center={center} zoom={valid?15:11} scrollWheelZoom style={{height,width:'100%'}}>
      <TileLayer url={tileUrl} attribution={tileAttribution}/>
      <Recenter position={position}/>
      <PickerMarker position={position} onChange={onChange}/>
    </MapContainer>
    <div className="grid gap-3 border-t border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
      <label className="text-xs font-semibold text-slate-500">Latitude<input className="input mt-1" type="number" step="any" value={latitude??''} onChange={e=>onChange({latitude:e.target.value===''?null:Number(e.target.value),longitude})}/></label>
      <label className="text-xs font-semibold text-slate-500">Longitude<input className="input mt-1" type="number" step="any" value={longitude??''} onChange={e=>onChange({latitude,longitude:e.target.value===''?null:Number(e.target.value)})}/></label>
    </div>
  </div>;
}

export function NearbyHospitalMap({origin,hospitals,onSelect,selected,radiusKm=10}){
  const[route,setRoute]=useState(null);
  const originPosition=origin&&Number.isFinite(Number(origin.latitude))&&Number.isFinite(Number(origin.longitude))?[Number(origin.latitude),Number(origin.longitude)]:null;
  const destination=selected&&Number.isFinite(Number(selected.latitude))&&Number.isFinite(Number(selected.longitude))?[Number(selected.latitude),Number(selected.longitude)]:null;
  const selectedKey=selected?`${selected.source}-${selected.placeId||selected.clinicId}`:null;

  const routeText=useMemo(()=>{
    if(!selected)return 'Select a hospital to preview the route.';
    if(route?.error)return route.error;
    if(route)return `${route.distanceKm} km by road · approximately ${route.durationMinutes} minutes`;
    return 'Calculating route...';
  },[route,selected]);

  if(!originPosition)return <div className="map-empty">Set your location to view nearby hospitals.</div>;
  return <div>
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3 text-sm">
      <span className="font-semibold text-slate-700">{routeText}</span>
      
    </div>
    <MapContainer center={originPosition} zoom={13} scrollWheelZoom className="h-[560px] w-full">
      <TileLayer url={tileUrl} attribution={tileAttribution}/>
      <FitHospitals origin={originPosition} hospitals={hospitals}/>
      <Circle center={originPosition} radius={Number(radiusKm)*1000}/>
      <Marker position={originPosition} icon={originIcon()}><Popup>Your location</Popup></Marker>
      {hospitals.filter(h=>Number.isFinite(Number(h.latitude))&&Number.isFinite(Number(h.longitude))).map((h,index)=>{
        const key=`${h.source}-${h.placeId||h.clinicId||index}`;
        return <Marker key={key} position={[Number(h.latitude),Number(h.longitude)]} icon={numberedIcon(index+1,h.source==='REGISTERED')} eventHandlers={{click:()=>onSelect?.(h)}} opacity={selectedKey&&selectedKey!==key?0.55:1}>
          <Popup><div className="min-w-48"><strong>{h.name}</strong><br/><span>{h.address}</span><br/><span>{h.distanceKm} km away</span>{h.phone&&<><br/><span>{h.phone}</span></>}</div></Popup>
        </Marker>;
      })}
      <RouteLayer origin={originPosition} destination={destination} onRoute={setRoute}/>
    </MapContainer>
  </div>;
}
