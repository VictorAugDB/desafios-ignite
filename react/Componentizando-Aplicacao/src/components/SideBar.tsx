import { useContext, useEffect, useState } from 'react';
import { Button } from '../components/Button'
import { SidebarContext } from '../hooks/SidebarContext';
import { api } from '../services/api';

import '../styles/sidebar.scss'

interface GenreResponseProps {
  id: number;
  name: 'action' | 'comedy' | 'documentary' | 'drama' | 'horror' | 'family';
  title: string;
}

export function SideBar() {
  const [genres, setGenres] = useState<GenreResponseProps[]>([]);
  const { handleClickButton, selectedGenreId } = useContext(SidebarContext)

  useEffect(() => {
    api.get<GenreResponseProps[]>('genres').then(response => {
      setGenres(response.data);
    });
  }, []);

  return (
      <nav className="sidebar">
        <span>Watch<p>Me</p></span>

        <div className="buttons-container">
          {genres.map(genre => (
            <Button
              id={String(genre.id)}
              title={genre.title}
              iconName={genre.name}
              onClick={() => handleClickButton(genre.id)}
              selected={selectedGenreId === genre.id}
            />
          ))}
        </div>

      </nav>
  )
}