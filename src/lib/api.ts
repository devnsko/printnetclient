import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // send cookies (including HttpOnly secure cookies)
});

// remove localStorage token logic; server will read the cookie and authenticate
export default api;
