const db = require("../db/connection");
const { checkTopicExists } = require("../db/seeds/utils");

exports.selectTopics = () => {
  return db.query(`SELECT * FROM topics`).then((result) => {
    return result.rows;
  });
};

exports.fetchSingleArticle = (article_id) => {
  return db
    .query(
      `SELECT articles.*, COUNT(comments.comment_id) AS comment_count FROM articles LEFT JOIN comments ON comments.article_id = articles.article_id WHERE articles.article_id = $1 GROUP BY articles.article_id`,
      [article_id]
    )
    .then((result) => {
      if (result.rows.length === 0) {
        return Promise.reject({ status: 404, msg: "Page not found" });
      }
      return result.rows[0];
    });
};

exports.fetchArticles = (
  topic,
  order = "DESC",
  sort_by = "created_at",
  limit = "10"
) => {
  const validOrder = ["asc", "ASC", "desc", "DESC"];
  const validSortBy = ["title", "topic", "author", "created_at", "votes"];

  if (
    !validOrder.includes(order) ||
    !validSortBy.includes(sort_by) ||
    isNaN(parseInt(limit))
  ) {
    return Promise.reject({ status: 400, message: "Invalid Query" });
  }

  let queryStr = `SELECT articles.article_id, articles.title, articles.topic, articles.author, articles.created_at, articles.votes, articles.article_img_url, COUNT(comments.comment_id) AS comment_count
FROM articles
LEFT JOIN comments ON comments.article_id = articles.article_id`;

  const queryValues = [];

  if (topic) {
    return checkTopicExists(topic).then(() => {
      queryStr += " WHERE topic = $1";
      queryValues.push(topic);
      queryStr += ` GROUP BY articles.article_id ORDER BY articles.${sort_by} ${order} LIMIT ${limit}`;
      return db.query(queryStr, queryValues).then((result) => {
        return result.rows;
      });
    });
  } else {
    queryStr += ` GROUP BY articles.article_id ORDER BY articles.${sort_by} ${order} LIMIT ${limit}`;

    return db.query(queryStr, queryValues).then((result) => {
      return result.rows;
    });
  }
};

exports.fetchComments = (article_id, limit = "10") => {
  if (isNaN(parseInt(limit))) {
    return Promise.reject({ status: 400, message: "Invalid Query" });
  }

  return db
    .query(
      `SELECT * FROM comments WHERE article_id = $1 ORDER BY created_at DESC LIMIT ${limit}`,
      [article_id]
    )
    .then(({ rows }) => {
      return rows;
    });
};

exports.addComment = (article_id, newComment) => {
  const { body, username } = newComment;
  return db
    .query(
      "INSERT INTO comments(body, author, article_id) VALUES($1, $2, $3) RETURNING *",
      [body, username, article_id]
    )
    .then((result) => {
      return result.rows[0];
    });
};

exports.patchArticleVotes = (votes, article_id) => {
  return db
    .query(
      "UPDATE articles SET votes = votes + $1 WHERE article_id =$2 RETURNING *",
      [votes, article_id]
    )
    .then((result) => {
      if (result.rows.length === 0) {
        return Promise.reject({ status: 404, msg: "Page not found" });
      }
      return result.rows[0];
    });
};

exports.removeComment = (comment_id) => {
  return db
    .query("DELETE FROM comments WHERE comment_id = $1 RETURNING *", [
      comment_id,
    ])
    .then((result) => {
      if (result.rows.length === 0) {
        return Promise.reject({ status: 404, msg: "Page not found" });
      }
    });
};

exports.fetchUsers = () => {
  return db.query("SELECT * FROM users").then((result) => {
    return result.rows;
  });
};

exports.fetchUsername = (username) => {
  return db
    .query("SELECT * FROM users WHERE username = $1", [username])
    .then((result) => {
      if (result.rows.length === 0) {
        return Promise.reject({ status: 404, message: "User not found." });
      }
      return result.rows;
    });
};

exports.patchCommentVotes = (votes, comment_id) => {
  return db
    .query(
      "UPDATE comments SET votes = votes + $1 WHERE comment_id =$2 RETURNING *",
      [votes, comment_id]
    )
    .then((result) => {
      if (result.rows.length === 0) {
        return Promise.reject({ status: 404, message: "Comment ID not found" });
      }
      return result.rows[0];
    });
};

exports.addArticle = (newArticle) => {
  const {
    author,
    title,
    body,
    topic,
    article_img_url = "https://www.pulsecarshalton.co.uk/wp-content/uploads/2016/08/jk-placeholder-image.jpg",
  } = newArticle;

  return db
    .query(
      "INSERT INTO articles (author, title, body, topic, article_img_url) VALUES($1, $2, $3, $4, $5) RETURNING *;",
      [author, title, body, topic, article_img_url]
    )
    .then((result) => {
      const newArticle = result.rows[0];

      return db
        .query(
          "SELECT COUNT(comment_id) AS comment_count FROM comments WHERE article_id = $1",
          [newArticle.article_id]
        )
        .then((newArticleCommentCount) => {
          const commentCount = newArticleCommentCount.rows[0].comment_count;
          newArticle.comment_count = commentCount;
          return newArticle;
        });
    });
};

exports.addTopic = (newTopic) => {
  const { slug, description } = newTopic;

  if (!description) {
    return Promise.reject({
      status: 400,
      message: "Please add a description!",
    });
  }

  return db
    .query(
      "INSERT INTO topics (slug, description) VALUES ($1, $2) RETURNING *;",
      [slug, description]
    )
    .then((result) => {
      return result.rows[0];
    });
};
