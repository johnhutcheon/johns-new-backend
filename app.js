const express = require("express");
const app = express();
const cors = require("cors");

const {
  getTopics,
  getEndpoints,
  getSingleArticle,
  getArticles,
  getComments,
  getUsers,
  postComment,
  updateArticleVotes,
  deleteComment,
  getUsername,
  updateCommentVotes,
} = require("./controllers/controllers");

const {
  handleInvalidPath,
  handlePsqlErrors,
  handleCustomErrors,
  handleServerErrors,
} = require("./controllers/errors.controllers");

app.use(express.json());

app.use(cors());

app.get("/api/topics", getTopics);
app.get("/api", getEndpoints);
app.get("/api/articles/:article_id", getSingleArticle);
app.get("/api/articles", getArticles);
app.get("/api/articles/:article_id/comments", getComments);
app.get("/api/users", getUsers);
app.get("/api/users/:username", getUsername);
app.post("/api/articles/:article_id/comments", postComment);
app.patch("/api/articles/:article_id", updateArticleVotes);
app.delete("/api/comments/:comment_id", deleteComment);
app.patch("/api/comments/:comment_id", updateCommentVotes);

app.all("*", handleInvalidPath);

app.use(handlePsqlErrors);

app.use(handleCustomErrors);

app.use(handleServerErrors);

module.exports = app;
