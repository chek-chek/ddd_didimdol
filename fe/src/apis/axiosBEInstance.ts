import axios from 'axios'
const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
const axiosBEInstance = axios.create({
  baseURL: `${baseUrl}`,
  withCredentials: true,
})
export default axiosBEInstance
