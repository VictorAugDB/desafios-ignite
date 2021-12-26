import { GetStaticProps } from 'next';
import Link from 'next/link';
import { useState, useCallback, useEffect } from 'react';

import Prismic from '@prismicio/client';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState(postsPagination);

  useEffect(() => {
    const postsWithFormattedDate = posts.results.map(post => ({
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        { locale: ptBR }
      ),
    }));

    setPosts({
      next_page: posts.next_page,
      results: [...postsWithFormattedDate],
    });
  }, []);

  const handleFetchData = useCallback(async (): Promise<void> => {
    const postsResponse: PostPagination = await fetch(`${posts.next_page}`)
      .then(response => response.json())
      .then(data => data);

    const formattedPosts = {
      next_page: postsResponse.next_page,
      results: postsResponse.results.map(post => {
        return {
          uid: post.uid,
          first_publication_date: format(
            new Date(post.first_publication_date),
            'dd MMM yyyy',
            { locale: ptBR }
          ),
          data: {
            title: post.data.title,
            subtitle: post.data.subtitle,
            author: post.data.author,
          },
        };
      }),
    };

    setPosts({
      next_page: formattedPosts.next_page,
      results: [...posts.results, ...formattedPosts.results],
    });
  }, [posts]);

  return (
    <div className={styles.container}>
      <img src="spacetraveling.svg" alt="logo" />
      {posts.results.map(post => (
        <Link key={post.uid} href={`/post/${post.uid}`}>
          <a className={styles.post}>
            <h1>{post.data.title}</h1>
            <p>{post.data.subtitle}</p>
            <div>
              <span>
                <FiCalendar />
                <time>{post.first_publication_date}</time>
              </span>
              <span>
                <FiUser />
                <p>{post.data.author}</p>
              </span>
            </div>
          </a>
        </Link>
      ))}
      {posts.next_page && (
        <button type="button" onClick={handleFetchData}>
          <p>Carregar mais posts</p>
        </button>
      )}
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: [
        'posts.title',
        'posts.subtitle',
        'posts.author',
        'posts.banner',
        'posts.content',
      ],
      pageSize: 1,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
    revalidate: 60,
  };
};
