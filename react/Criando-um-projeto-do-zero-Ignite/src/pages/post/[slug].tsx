import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';

import { FiClock, FiCalendar, FiUser } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';

interface Post {
  first_publication_date: string | null;
  uid: string;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const [postFormatted, setPostFormatted] = useState(post);
  const [estimatedTime, setEstimatedTime] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (router.isFallback) {
      return;
    }

    const body = postFormatted.data.content.map(content => ({
      text: RichText.asHtml(content.body),
    }));

    const formatPost = {
      ...postFormatted,
      first_publication_date: format(
        new Date(postFormatted.first_publication_date),
        'dd MMM yyyy',
        { locale: ptBR }
      ),
      data: {
        ...postFormatted.data,
        content: postFormatted.data.content.map(content => ({
          heading: content.heading,
          body,
        })),
      },
    };

    setPostFormatted(formatPost);
  }, []);

  useEffect(() => {
    if (router.isFallback) {
      return;
    }

    const textLetters: string[] = post.data.content.map(content =>
      RichText.asText(content.body)
    );

    const letters = textLetters.map(letter => letter.split(' '));

    const numberOfLetters = letters.reduce((acc, letter) => {
      // eslint-disable-next-line no-param-reassign
      acc += letter.length;
      return acc;
    }, 0);

    const estimatedReadTime = Math.ceil(numberOfLetters / 200);

    setEstimatedTime(`${String(estimatedReadTime)} min`);
  }, []);

  return (
    <>
      {router.isFallback ? (
        <h1>Carregando...</h1>
      ) : (
        <>
          <Header />
          <main className={styles.container}>
            <img src={postFormatted.data.banner.url} alt="banner" />
            <article className={styles.post}>
              <h1>{postFormatted.data.title}</h1>
              <div className={styles.date_and_author}>
                <span>
                  <FiCalendar />
                  <time>{postFormatted.first_publication_date}</time>
                </span>
                <span>
                  <FiUser />
                  <p>{postFormatted.data.author}</p>
                </span>
                <span>
                  <FiClock />
                  <p>{estimatedTime}</p>
                </span>
              </div>
              {postFormatted.data.content.map((content, index) => (
                <div key={Math.random() * (1 - 0) + 0}>
                  <h2>{content.heading}</h2>
                  <div
                    key={Math.random() * (1 - 0) + 0}
                    className={styles.postContent}
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{
                      __html: content.body[index].text,
                    }}
                  />
                </div>
              ))}
            </article>
          </main>
        </>
      )}
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title'],
      pageSize: 1,
    }
  );

  const paths = posts.results.map(post => ({ params: { slug: post.uid } }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const { params } = context;
  const { slug } = params;

  const response = await prismic.getByUID('posts', String(slug), {});

  if (response) {
    const post = {
      first_publication_date: response.first_publication_date,
      uid: response.uid,
      data: {
        title: response.data.title,
        banner: {
          url: response.data.banner.url,
        },
        subtitle: response.data.subtitle,
        author: response.data.author,
        content: response.data.content,
      },
    };

    return {
      props: {
        post,
      },
    };
  }

  return {
    redirect: {
      destination: '/slug',
      permanent: false,
    },
  };
};
