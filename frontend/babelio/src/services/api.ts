import axios, { type AxiosResponse } from 'axios'

const api = axios.create({
  baseURL: '/rest/s1/babelio',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加认证token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('jwt_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器 - 统一错误处理，返回 data
api.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// 类型定义
export interface ApiResponse<T = unknown> {
  [key: string]: T
}

export default api

// 书籍 API
export const bookApi = {
  list: (params?: { pageIndex?: number; pageSize?: number; searchTerm?: string }) =>
    api.get('/books', { params }),
  get: (bookId: string) => api.get(`/books/${bookId}`),
  create: (data: any) => api.post('/books', data),
  update: (bookId: string, data: any) => api.put(`/books/${bookId}`, data),
  search: (queryString: string) => api.get('/books/search', { params: { queryString } }),
  getByIsbn: (isbn: string) => api.get(`/books/isbn/${isbn}`)
}

// 书评 API
export const reviewApi = {
  list: (params?: { bookId?: string; pageIndex?: number; pageSize?: number }) =>
    api.get('/reviews', { params }),
  get: (reviewId: string) => api.get(`/reviews/${reviewId}`),
  create: (data: any) => api.post('/reviews', data),
  update: (reviewId: string, data: any) => api.put(`/reviews/${reviewId}`, data),
  getFeatured: () => api.get('/reviews/featured'),
  getComments: (reviewId: string) => api.get(`/reviews/${reviewId}/comments`),
  addComment: (reviewId: string, data: any) => api.post(`/reviews/${reviewId}/comments`, data)
}

// 草稿 API
export const draftApi = {
  list: () => api.get('/drafts'),
  get: (draftId: string) => api.get(`/drafts/${draftId}`),
  save: (data: any) => api.post('/drafts', data),
  update: (draftId: string, data: any) => api.put(`/drafts/${draftId}`, data),
  delete: (draftId: string) => api.delete(`/drafts/${draftId}`)
}

// 书架 API
export const bookshelfApi = {
  get: () => api.get('/bookshelf'),
  add: (data: { bookId: string; status: string; isPrivate?: boolean }) =>
    api.post('/bookshelf', data),
  updateStatus: (entryId: string, data: { status?: string; isPrivate?: boolean }) =>
    api.put(`/bookshelf/${entryId}`, data),
  remove: (entryId: string) => api.delete(`/bookshelf/${entryId}`)
}

// 搜索 API
export const searchApi = {
  unified: (queryString: string, searchType?: string) =>
    api.get('/search', { params: { queryString, searchType } })
}

// 用户 API
export const userApi = {
  getCurrentUser: () => api.get('/users/me'),
  getProfile: (userId: string) => api.get(`/users/${userId}/profile`),
  getContributions: (userId: string) => api.get(`/users/${userId}/contributions`)
}

// 首页 API
export const homeApi = {
  getFeaturedBooks: () => api.get('/home/featured-books'),
  getFeaturedReviews: () => api.get('/home/featured-reviews'),
  getDiscussing: () => api.get('/home/discussing')
}
