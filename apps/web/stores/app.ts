import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', () => {
  const isLoaded = ref(true)
  return { isLoaded }
})
