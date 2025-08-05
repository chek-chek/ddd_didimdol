import axios from 'axios'
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
const axiosInstance = axios.create({
  baseURL: `${baseUrl}`,
  withCredentials: true,
})
export default axiosInstance
