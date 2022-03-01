import { getGlobalNotionData } from '@/lib/notion/getNotionData'
import { LayoutSearch } from '@/themes'
import BLOG from '@/blog.config'
import { useGlobal } from '@/lib/global'
import { getDataFromCache } from '@/lib/cache/cache_manager'

export async function getStaticPaths () {
  return {
    paths: [],
    fallback: true
  }
}

/**
 * 将对象的指定字段拼接到字符串
 * @param sourceTextArray
 * @param targetObj
 * @param key
 * @returns {*}
 */
function appendText (sourceTextArray, targetObj, key) {
  if (!targetObj) {
    return sourceTextArray
  }
  const textArray = targetObj[key]
  const text = textArray ? textArray[0][0] : ''
  if (text && text !== 'Untitled') {
    sourceTextArray.concat(text)
  }
}

export async function getStaticProps ({ params: { keyword } }) {
  const {
    allPosts,
    categories,
    tags,
    postCount,
    latestPosts,
    customNav
  } = await getGlobalNotionData({ from: 'search-props', pageType: ['Post'] })

  const filterPosts = []
  for (const post of allPosts) {
    const cacheKey = 'page_block_' + post.id
    const page = await getDataFromCache(cacheKey)
    console.log('读取缓存结果:', cacheKey, page)
    const tagContent = post.tags ? post.tags.join(' ') : ''
    const categoryContent = post.category ? post.category.join(' ') : ''
    const indexContent = [post.title, post.summary, tagContent, categoryContent]
    if (page != null) {
      const contentIds = Object.keys(page.block)
      contentIds.forEach(id => {
        const properties = page?.block[id]?.value?.properties
        appendText(indexContent, properties, 'title')
        appendText(indexContent, properties, 'caption')
      })
    }
    post.results = []
    indexContent.forEach(c => {
      const index = c.toLowerCase().indexOf(keyword.toLowerCase())
      if (index > -1) {
        const referText = c?.replaceAll(keyword, `<span class='text-red-500'>${keyword}</span>`)
        post.results.push(`<span>${referText}</span>`)
      }
    })

    if (post.results.length > 0) {
      filterPosts.push(post)
    }
  }

  return {
    props: {
      posts: filterPosts,
      tags,
      categories,
      postCount,
      latestPosts,
      customNav,
      keyword
    },
    revalidate: 1
  }
}

const Index = (props) => {
  const { keyword } = props
  const { locale } = useGlobal()
  const meta = {
    title: `${keyword || ''} | ${locale.NAV.SEARCH} | ${BLOG.TITLE}  `,
    description: BLOG.DESCRIPTION,
    type: 'website'
  }
  return <LayoutSearch {...props} meta={meta} currentSearch={keyword} />
}

export default Index
