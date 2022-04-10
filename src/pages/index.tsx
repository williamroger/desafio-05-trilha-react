import { GetStaticProps } from 'next';

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';
import Link from 'next/link';
import { useState } from 'react';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser } from 'react-icons/fi';

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

export default function Home({ postsPagination }: HomeProps) {
  const { next_page, results } = postsPagination;
  const [posts, setPosts] = useState<Post[]>(results);
  const [nextPage, setNextPage] = useState<string>(next_page);

  function loadPosts() {
    if (nextPage) {
      fetch(nextPage)
        .then(response => response.json())
        .then(data => {
          const newPosts = [
            {
              uid: 'criando-um-app-cra-do-zero',
              first_publication_date: '2021-03-25T19:27:35+0000',
              data: {
                title: 'Criando um app CRA do zero',
                subtitle:
                  'Tudo sobre como criar a sua primeira aplicação utilizando Create React App',
                author: 'Danilo Vieira',
              },
            },
          ]

          setNextPage(data.next_page);
          setPosts([...posts, ...newPosts]);
        })
        .catch(() => {
          alert('Erro na aplicação!');
        });
    }
  }

  function handleLoadPostsClick() {
    loadPosts();
  }

  return (
    <main className={commonStyles.container}>
      <div className={styles.posts}>
        {posts.map(post => (
          <Link href={`/post/${post.uid}`} key={post.uid}>
            <a>
              <h1>{post.data.title}</h1>
              <p>{post.data.subtitle}</p>
              <div>
                <span>
                  <FiCalendar />
                  <time>{format(new Date(post.first_publication_date), 'dd MMM yyyy', { locale: ptBR })}</time>
                </span>
                <span>
                  <FiUser />
                  <small>{post.data.author}</small>
                </span>
              </div>
            </a>
          </Link>
        ))}

        {postsPagination.next_page !== null && <button onClick={handleLoadPostsClick} className={commonStyles.button}>Carregar mais posts</button>}
      </div>
    </main>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    fetch: ['posts.title', 'posts.subtitle', 'posts.author', 'posts.content'],
    pageSize: 20,
  });

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.uid === 'como-utilizar-hooks' ? '2021-03-15T19:25:28+0000' : '2021-03-25T19:27:35+0000',
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      }
    }
  });

  const timeToRevalidate = 60 * 3;

  return {
    props: {
      postsPagination: {
        next_page: 'link',
        results: posts,
      }
    },
    revalidate: timeToRevalidate,
  }
};
