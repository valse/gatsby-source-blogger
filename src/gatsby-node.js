import crypto from "crypto";
import { google } from "googleapis";
import parse from "rehype-parse";
import rehype2remark from "rehype-remark";
import stringify from "remark-stringify";
import unified from "unified";
const { createRemoteFileNode } = require(`gatsby-source-filesystem`);

const typePrefix = "blogger__";

const refactoredEntityTypes = {
  post: `${typePrefix}POST`,
  page: `${typePrefix}PAGE`,
};

exports.sourceNodes = async (
  { cache, store, actions, createNodeId },
  { apiKey, blogId }
) => {
  const { createNode, setPluginStatus } = actions;

  const blogger = google.blogger({
    version: "v3",
    auth: apiKey,
  });

  let postResult;
  let posts = [];

  try {
    let params = {
      blogId: blogId,
      maxResults: 500,
      fetchImages: true,
    };

    do {
      postResult = await blogger.posts.list(params);
      if (postResult.data.nextPageToken) {
        params = { ...params, pageToken: postResult.data.nextPageToken };
      }
      if (postResult.data.items) {
        posts.push(...postResult.data.items);
      }
    } while (postResult.data.nextPageToken);
  } catch (err) {
    console.error("Error fetching posts", err);
  }

  const rePost = /^https?:\/\/(?:[^/]+)\/\d{4}\/\d{2}\/([^/][^.]+)\.html$/;

  if (posts) {
    for (const post of posts) {
      let featuredImageNode = null;

      if (post.images) {
        try {
          featuredImageNode = await createRemoteFileNode({
            url: post.images[0].url,
            store,
            cache,
            createNode,
            createNodeId,
          });
        } catch (err) {
          console.error("Error downloading post image", err);
        }
      }

      if (featuredImageNode && featuredImageNode.ext !== ".gif") {
        post.featuredImage___NODE = featuredImageNode.id;
      }

      return unified()
        .use(parse)
        .use(rehype2remark)
        .use(stringify)
        .process(post.content, function (err, md) {
          if (err) console.log(err);
          const segments = rePost.exec(post.url);
          const gatsbyPost = Object.assign({ slug: segments[1] }, post, {
            id: createNodeId(post.id),
            parent: null,
            children: [],
            internal: {
              type: refactoredEntityTypes.post,
              mediaType: `text/markdown`,
              content: `---
title: >-
  ${post.title}
date: ${post.published}
slug: ${segments[1]}
featuredImageUrl: ${post.images ? post.images[0].url : null}
---

${md}`,
              contentDigest: crypto
                .createHash(`md5`)
                .update(JSON.stringify(post))
                .digest(`hex`),
            },
          });

          createNode(gatsbyPost);
        });
    }
  }

  let pageResult;
  let pages = [];

  try {
    let params = {
      blogId: blogId,
      maxResults: 500,
    };

    do {
      pageResult = await blogger.pages.list(params);
      if (pageResult.data.nextPageToken) {
        params = { ...params, pageToken: pageResult.data.nextPageToken };
      }
      if (pageResult.data.items) {
        pages.push(...pageResult.data.items);
      }
    } while (pageResult.data.nextPageToken);
  } catch (err) {
    console.error("Error fetching pages", err);
  }

  const rePage = /^https?:\/\/(?:[^/]+)\/p\/([^/][^.]+)\.html$/;

  if (pages) {
    for (page of pages) {
      unified()
        .use(parse)
        .use(rehype2remark)
        .use(stringify)
        .process(page.content, function (err, md) {
          if (err) console.log(err);
          const segments = rePage.exec(page.url);
          const gatsbyPage = Object.assign({ slug: segments[1] }, page, {
            id: createNodeId(page.id),
            parent: null,
            children: [],
            internal: {
              type: refactoredEntityTypes.page,
              mediaType: `text/markdown`,
              content: `---
  title: >-
    ${page.title}
  date: ${page.published}
  slug: ${segments[1]}
  ---

  ${md}`,
              contentDigest: crypto
                .createHash(`md5`)
                .update(JSON.stringify(page))
                .digest(`hex`),
            },
          });

          createNode(gatsbyPage);
        });

      setPluginStatus({
        status: {
          lastFetched: Date.now(),
        },
      });
    }
  }
};
