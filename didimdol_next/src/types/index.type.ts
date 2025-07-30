export interface User {
  id: string
  name: string
  email: string
  created_at: string
}

export interface Prompt {
  id: string
  title: string
  content: string
  version: number
  created_at: string
}
