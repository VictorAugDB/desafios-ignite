import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/api";

interface GenreResponseProps {
  id: number;
  name: 'action' | 'comedy' | 'documentary' | 'drama' | 'horror' | 'family';
  title: string;
}

interface SiderbarContextData {
  selectedGenreId: number;
  selectedGenre: GenreResponseProps
  handleClickButton: (id: number) => void
}

interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarContext = createContext({} as SiderbarContextData)

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [selectedGenre, setSelectedGenre] = useState<GenreResponseProps>({} as GenreResponseProps);
  const [selectedGenreId, setSelectedGenreId] = useState(1);

  useEffect(() => {  
    api.get<GenreResponseProps>(`genres/${selectedGenreId}`).then(response => {
      setSelectedGenre(response.data);
    })
  }, [selectedGenreId])

  function handleClickButton(id: number) {
    setSelectedGenreId(id);
  }

  return (
    <SidebarContext.Provider value={{
      selectedGenreId,
      selectedGenre,
      handleClickButton
    }}>
      {children}
    </SidebarContext.Provider>
  )
}

