import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FavouritesStore {
  favourites: string[]   // block definition IDs
  toggle: (id: string) => void
  isFavourite: (id: string) => boolean
}

export const useFavouritesStore = create<FavouritesStore>()(
  persist(
    (set, get) => ({
      favourites: [],
      toggle: (id) => set(s => ({
        favourites: s.favourites.includes(id)
          ? s.favourites.filter(f => f !== id)
          : [...s.favourites, id],
      })),
      isFavourite: (id) => get().favourites.includes(id),
    }),
    { name: 'bb-favourites' }
  )
)
