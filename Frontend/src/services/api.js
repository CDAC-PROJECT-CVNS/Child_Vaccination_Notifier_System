import axios from 'axios'
import config from './config'

const api = axios.create({
    baseURL: config.BASE_URL
})

api.interceptors.request.use(request => {
    const token = window.sessionStorage.getItem('token')
    if (token)
        request.headers.Authorization = `Bearer ${token}`
    return request
})

api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            window.sessionStorage.clear()
            window.location.href = '/'
        }
        return Promise.reject(error)
    }
)

export function dataOf(response) {
    return response.data.data
}

export default api
