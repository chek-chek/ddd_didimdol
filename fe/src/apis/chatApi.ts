import axiosInstance from './axiosInstance'

export const getChatHistory = async (chatId: string) => {
  const { data } = await axiosInstance.get('/api/chat/chatHistory/' + chatId)
  return data
}

export const postChat = async (message: string, chatId: string) => {
  const { data } = await axiosInstance.post('/api/chat', {
    message,
    chatId,
  })
  return data
}
