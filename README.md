# gatsby-source-blogger

Source plugin for pulling blog posts and pages into [Gatsby](https://www.gatsbyjs.org/) from [Blogger](https://www.blogger.com/).

## Install

`npm install --save gatsby-source-blogger`

## Usage

```JavaScript
module.exports = {
  plugins: [
    {
      resolve: 'gatsby-source-blogger',
      options: {
        apiKey: 'your-api-key',
        blogId: 'your-blog-id'
        }
      }
    }
  ]
}
```

### Query Blog Posts

The plugin maps all JSON fields documented in the [Blogger API Reference](https://developers.google.com/blogger/docs/3.0/using#WorkingWithPosts) to GraphQL fields.

```GraphQL
{
  allBloggerPost {
    edges {
      node {
        slug
        kind
        id
        blog{
          id
        }
        published
        updated
        url
        selfLink
        title
        content
        author{
          id
          displayName
          url
          image{
            url
          }
        }
        replies{
          totalItems
          selfLink
        }
      }
    }
  }
}
```

### Query Pages

```GraphQL
{
  allBloggerPage {
    edges {
      node {
        slug
        kind
        id
        blog{
          id
        }
        published
        updated
        url
        selfLink
        title
        content
        author{
          id
          displayName
          url
          image{
            url
          }
        }
      }
    }
  }
}
```

### Slug

The plugin adds additional slug field to both the GraphQL type from the current Blogger url taking the last segment without the .html extension:

```
https://my-domain.com/2019/02/this-is-my-post-slug.html
```

```
https://my-domain.com/p/this-is-my-page-slug.html
```

### Markdown

Your Blogger posts and pages are available in Markdown format too; thanks to [Gatsby Transformer Remark](https://www.gatsbyjs.org/packages/gatsby-transformer-remark/) you can query `MarkdownRemark` child type and benefit to its additional fields like excerpt, time to read, etc.

```GraphQL
{
  allBloggerPost {
    edges {
      node {
        slug
        ...
        childMarkdownRemark{
          frontmatter{
            title
            date
            slug
          }
          html
          excerpt
          timeToRead
        }
      }
    }
  }
}
```
