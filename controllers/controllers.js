const {
  selectTopics,
  fetchSingleArticle,
  fetchArticles,
  fetchComments,
  addComment,
  patchArticleVotes,
  removeComment,
  fetchUsers,
  fetchUsername,
  patchCommentVotes,
} = require("../models/models");
const endpoints = require("../endpoints.json");

exports.getTopics = (req, res, err) => {
  selectTopics().then((topics) => {
    res.status(200).send({ topics });
  });
};

exports.getEndpoints = (req, res) => {
  console.log("hello");
  res.status(200).send(endpoints);
};

exports.getSingleArticle = (req, res, next) => {
  const { article_id } = req.params;
  fetchSingleArticle(article_id)
    .then((article) => {
      res.status(200).send({ article });
    })
    .catch(next);
};

// exports.getArticles = (req, res, next) => {
//   fetchArticles().then((articles) => {
//     res.status(200).send({ articles });
//   });
// };

exports.getArticles = (req, res, next) => {
  console.log("hello");
  const { topic, order, sort_by } = req.query;
  fetchArticles(topic, order, sort_by)
    .then((articles) => {
      res.status(200).send({ articles });
    })
    .catch(next);
};

exports.getComments = (req, res, next) => {
  const { article_id } = req.params;

  Promise.all([fetchSingleArticle(article_id), fetchComments(article_id)])
    .then(([promiseOne, comments]) => {
      res.status(200).send({ comments });
    })
    .catch(next);
};

exports.postComment = (req, res, next) => {
  const { article_id } = req.params;
  const newComment = req.body;

  addComment(article_id, newComment)
    .then((postedComment) => {
      res.status(201).send({ postedComment });
    })
    .catch(next);
};

exports.updateArticleVotes = (req, res, next) => {
  const { article_id } = req.params;
  const { inc_votes } = req.body; //req.body.inc_votes
  patchArticleVotes(inc_votes, article_id)
    .then((article) => {
      res.status(200).send({ article });
    })
    .catch(next);
};

exports.deleteComment = (req, res, next) => {
  const { comment_id } = req.params;
  removeComment(comment_id)
    .then(() => {
      res.status(204).send();
    })
    .catch(next);
};

exports.getUsers = (req, res, next) => {
  fetchUsers()
    .then((users) => {
      res.status(200).send({ users });
    })
    .catch(next);
};

exports.getUsername = (req, res, next) => {
  const { username } = req.params;
  fetchUsername(username)
    .then((user) => {
      res.status(200).send({ user });
    })
    .catch(next);
};

exports.updateCommentVotes = (req, res, next) => {
  const { comment_id } = req.params;
  const { inc_votes } = req.body;
  patchCommentVotes(inc_votes, comment_id)
    .then((updatedComment) => {
      res.status(200).send(updatedComment);
    })
    .catch(next);
};
