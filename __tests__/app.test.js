const connection = require("../db/connection.js");
const seed = require("../db/seeds/seed");
const testData = require("../db/data/test-data");
const request = require("supertest");
const app = require("../app");
const endpoints = require("../endpoints.json");
require("jest-sorted");

beforeEach(() => seed(testData));

afterAll(() => connection.end());

// alternatively, the above might need a return if its not one line.

describe("2. GET /api/topics", () => {
  test("Responds with a status 200 and an array of topic objects, each with slug and description properties", () => {
    return request(app)
      .get("/api/topics")
      .expect(200)
      .then(({ body }) => {
        const { topics } = body;
        expect(topics).toHaveLength(3);
        topics.forEach((topic) => {
          expect(topic).toHaveProperty("slug");
          expect(topic).toHaveProperty("description");
        });
      });
  });
});

describe("Error handling", () => {
  test("Responds with a 404 error if incorrect path is requested", () => {
    return request(app)
      .get("/api/banana")
      .expect(404)
      .then(({ body }) => {
        expect(body.message).toEqual("404 - Path not found");
      });
  });
});

describe("3. GET /api", () => {
  test("returns details of all endpoints", () => {
    return request(app)
      .get("/api")
      .expect(200)
      .then(({ body }) => {
        expect(body).toEqual(endpoints);
      });
  });
});

describe("4. GET /api/articles/:article_id", () => {
  test("responds with an artcle object with the correct properties", () => {
    return request(app)
      .get("/api/articles/1")
      .expect(200)
      .then(({ body }) => {
        const { article } = body;
        expect(article).toMatchObject({
          article_id: 1,
          title: expect.any(String),
          author: expect.any(String),
          body: expect.any(String),
          created_at: expect.any(String),
          votes: expect.any(Number),
          article_img_url: expect.any(String),
        });
      });
  });

  test("responds with a 404 error when a valid but non-existent ID is requested", () => {
    return request(app)
      .get("/api/articles/999")
      .expect(404)
      .then(({ body }) => {
        expect(body.message).toEqual("Page not found");
      });
  });
  test("responds with a 400 error when an invalid ID is requested", () => {
    return request(app)
      .get("/api/articles/banana")
      .expect(400)
      .then(({ body }) => {
        expect(body.message).toEqual("400 - Bad request");
      });
  });
});

describe("5. GET /api/articles", () => {
  test("responds with an articles array of article objects, with the correct properties", () => {
    return request(app)
      .get("/api/articles")
      .expect(200)
      .then(({ body }) => {
        const { articles } = body;
        expect(articles);
        articles.forEach((article) => {
          expect(article).toHaveProperty("title");
          expect(article).toHaveProperty("topic");
          expect(article).toHaveProperty("author");
          expect(article).toHaveProperty("created_at");
          expect(article).toHaveProperty("votes");
          expect(article).toHaveProperty("article_img_url");
          expect(article).toHaveProperty("comment_count");
          expect(article).toHaveProperty("votes");
        });
      });
  });
  test("response does not include the body property", () => {
    return request(app)
      .get("/api/articles")
      .expect(200)
      .then(({ body }) => {
        const { articles } = body;
        expect(articles);
        articles.forEach((article) => {
          expect(article).not.toHaveProperty("body");
        });
      });
  });
  test("response is sorted by date in descending order", () => {
    return request(app)
      .get("/api/articles")
      .expect(200)
      .then(({ body }) => {
        const { articles } = body;
        expect(articles).toBeSortedBy("created_at", {
          descending: true,
        });
      });
  });
});

describe("6. GET /api/articles/:article_id/comments", () => {
  test("responds with an array of comments for a specific article", () => {
    return request(app)
      .get("/api/articles/1/comments")
      .expect(200)
      .then(({ body }) => {
        const { comments } = body;
        comments.forEach((comment) => {
          expect(comment).toHaveProperty("body");
          expect(comment).toHaveProperty("article_id");
          expect(comment).toHaveProperty("author");
          expect(comment).toHaveProperty("votes");
          expect(comment).toHaveProperty("created_at");
          expect(comment).toHaveProperty("comment_id");
        });
      });
  });
  test("comments are sorted by date in descending order", () => {
    return request(app)
      .get("/api/articles/1/comments")
      .expect(200)
      .then(({ body }) => {
        const { comments } = body;
        expect(comments).toBeSortedBy("created_at", {
          descending: true,
        });
      });
  });
  test("responds with a 404 when non-existent ID is requested", () => {
    return request(app)
      .get("/api/articles/2986/comments")
      .expect(404)
      .then(({ body }) => {
        expect(body.message).toEqual("Page not found");
      });
  });
  test("responds with a 400 when an invalid ID is requested", () => {
    return request(app)
      .get("/api/articles/banana/comments")
      .expect(400)
      .then(({ body }) => {
        expect(body.message).toEqual("400 - Bad request");
      });
  });
  test("responds with a 200 and an empty array when a valid ID with no comments is requested", () => {
    return request(app)
      .get("/api/articles/2/comments")
      .expect(200)
      .then(({ body }) => {
        expect(body.comments).toEqual([]);
      });
  });
});

describe("7. POST /api/articles/:article_id/comments", () => {
  test("responds with a status 201 and created comment", () => {
    const commentToPost = { username: "butter_bridge", body: "hello world" };
    return request(app)
      .post("/api/articles/4/comments")
      .expect(201)
      .send(commentToPost)
      .then(({ body }) => {
        expect(body.postedComment).toMatchObject({
          author: "butter_bridge",
          body: "hello world",
        });
      });
  });

  test("responds with a 201, ignoring unnecessary properties", () => {
    const commentToPost = {
      username: "butter_bridge",
      body: "hello world",
      banana: "ignore this",
    };
    return request(app)
      .post("/api/articles/4/comments")
      .send(commentToPost)
      .expect(201)
      .then(({ body }) => {
        expect(body.postedComment).not.toHaveProperty("banana");
      });
  });

  test("responds with a 400 if invalid ID is sent in request", () => {
    const commentToPost = {
      username: "butter_bridge",
      body: "hello world",
    };
    return request(app)
      .post("/api/articles/banana/comments")
      .send(commentToPost)
      .expect(400)
      .then(({ body }) => {
        expect(body.message).toEqual("400 - Bad request");
      });
  });

  test("responds with a 404 if valid but non-existent ID", () => {
    const commentToPost = {
      username: "butter_bridge",
      body: "hello world",
    };
    return request(app)
      .post("/api/articles/999/comments")
      .send(commentToPost)
      .expect(404)
      .then(({ body }) => {
        expect(body.message).toEqual("404 - Not Found");
      });
  });

  test("responds with a 400 if missing fields (no username or body)", () => {
    const commentToPost = {
      username: "butter_bridge",
    };
    return request(app)
      .post("/api/articles/5/comments")
      .send(commentToPost)
      .expect(400)
      .then(({ body }) => {
        expect(body.message).toEqual("400 - Bad request");
      });
  });

  test("responds with a 404 if username does not exist", () => {
    const commentToPost = {
      username: "john",
      body: "oi oi",
    };
    return request(app)
      .post("/api/articles/5/comments")
      .send(commentToPost)
      .expect(404)
      .then(({ body }) => {
        expect(body.message).toEqual("404 - Not Found");
      });
  });
});

describe("8. PATCH /api/articles/:article_id", () => {
  test("responds with 200 and updates selected article with amount of votes passed", () => {
    const votesObject = { inc_votes: 1 };
    return request(app)
      .patch("/api/articles/2")
      .send(votesObject)
      .expect(200)
      .then(({ body }) => {
        expect(body.article.votes).toBe(1);
      });
  });
  test("responds with a 400 if invalid ID is requested", () => {
    const votesObject = { inc_votes: 1 };
    return request(app)
      .patch("/api/articles/banana")
      .send(votesObject)
      .expect(400)
      .then(({ body }) => {
        expect(body.message).toEqual("400 - Bad request");
      });
  });
  test("responds with a 404 if valid but non-existent ID is requested", () => {
    const votesObject = { inc_votes: 1 };
    return request(app)
      .patch("/api/articles/999")
      .send(votesObject)
      .expect(404)
      .then(({ body }) => {
        expect(body.message).toEqual("Page not found");
      });
  });
  test("responds with a 400 if an incorrect body is sent", () => {
    const votesObject = { inc_votes: "banana" };
    return request(app)
      .patch("/api/articles/2")
      .send(votesObject)
      .expect(400)
      .then(({ body }) => {
        expect(body.message).toEqual("400 - Bad request");
      });
  });
});

describe("9. DELETE /api/comments/:comment_id", () => {
  test("deletes the comment of the requested comment ID", () => {
    return request(app).delete("/api/comments/3").expect(204);
  });
  test("responds with a 404 if valid but non-existent ID requested", () => {
    return request(app)
      .delete("/api/comments/999")
      .expect(404)
      .then(({ body }) => {
        expect(body.message).toEqual("Page not found");
      });
  });
  test("responds with a 400 if invalid ID requested", () => {
    return request(app)
      .delete("/api/comments/banana")
      .expect(400)
      .then(({ body }) => {
        expect(body.message).toEqual("400 - Bad request");
      });
  });
});

describe("10. GET /api/users", () => {
  test("responds with a 200 when users request sent", () => {
    return request(app)
      .get("/api/users")
      .expect(200)
      .then(({ body }) => {
        expect(body.users).toHaveLength(4);
        body.users.forEach((user) => {
          expect(user).toHaveProperty("username");
          expect(user).toHaveProperty("name");
          expect(user).toHaveProperty("avatar_url");
        });
      });
  });
});

describe("11. GET /api/articles (queries)", () => {
  test("accepts a topic which filters the articles by the value specified in the query", () => {
    return request(app)
      .get("/api/articles?topic=mitch")
      .expect(200)
      .then(({ body }) => {
        body.articles.forEach((article) => {
          expect(article.topic).toEqual("mitch");
        });
      });
  });
  test("accepts an order query which which can be set to asc or desc for ascending or descending", () => {
    return request(app)
      .get("/api/articles?order=asc")
      .expect(200)
      .then(({ body }) => {
        const { articles } = body;
        expect(articles).toBeSortedBy("created_at", {
          ascending: true,
        });
      });
  });
  test("accepts a sort_by query which sorts the articles by any valid column", () => {
    return request(app)
      .get("/api/articles?sort_by=title")
      .expect(200)
      .then(({ body }) => {
        const { articles } = body;
        expect(articles).toBeSortedBy("title", {
          descending: true,
        });
      });
  });
  test("returns a 400 status and error message if invalid order query", () => {
    return request(app)
      .get("/api/articles?order=bananas")
      .expect(400)
      .then(({ body }) => {
        expect(body.message).toEqual("Invalid Query");
      });
  });
  test("returns a 400 status and an eror message if invalid sort_by query", () => {
    return request(app)
      .get("/api/articles?sort_by=bananas")
      .expect(400)
      .then(({ body }) => {
        expect(body.message).toEqual("Invalid Query");
      });
  });
  test("returns a 404 status and an eror message if valid but non-existent topic query", () => {
    return request(app)
      .get("/api/articles?topic=bananas")
      .expect(404)
      .then(({ body }) => {
        expect(body.message).toEqual("404- Topic Not Found");
      });
  });
  test("returns a 200 status with an empty array if valid topic with no articles", () => {
    return request(app)
      .get("/api/articles?topic=paper")
      .expect(200)
      .then(({ body }) => {
        expect(body.articles).toEqual([]);
      });
  });
});

describe("12. GET /api/articles/:article_id (comment count)", () => {
  test("responds with a status 200 and returns correct properties with comment count now added", () => {
    return request(app)
      .get("/api/articles/4")
      .expect(200)
      .then(({ body }) => {
        expect(body.article).toMatchObject({
          article_id: 4,
          title: expect.any(String),
          author: expect.any(String),
          body: expect.any(String),
          created_at: expect.any(String),
          votes: expect.any(Number),
          article_img_url: expect.any(String),
          comment_count: expect.any(String),
        });
      });
  });
});

describe("17. GET /api/users/:username", () => {
  test("responds with a 200 and returns the correct properties for a specific username", () => {
    return request(app)
      .get("/api/users/butter_bridge")
      .expect(200)
      .then(({ body }) => {
        expect(body.user[0]).toMatchObject({
          username: "butter_bridge",
          name: "jonny",
          avatar_url:
            "https://www.healthytherapies.com/wp-content/uploads/2016/06/Lime3.jpg",
        });
      });
  });
  test("responds with a 404 if username does not exist", () => {
    return request(app)
      .get("/api/users/bananaman")
      .expect(404)
      .then(({ body }) => {
        expect(body.message).toEqual("User not found.");
      });
  });
});

describe("18. PATCH /api/comments/:comment_id", () => {
  test("responds with 200 and updates selected comment with amount of votes passed", () => {
    const votesObject = { inc_votes: 1 };
    return request(app)
      .patch("/api/comments/3")
      .send(votesObject)
      .expect(200)
      .then(({ body }) => {
        expect(body.votes).toEqual(101);
      });
  });
  test("responds with a 404 if valid but non-existent comment ID is requested", () => {
    const votesObject = { inc_votes: 1 };
    return request(app)
      .patch("/api/comments/999")
      .send(votesObject)
      .expect(404)
      .then(({ body }) => {
        expect(body.message).toEqual("Comment ID not found");
      });
  });
});

describe("19. POST /api/articles", () => {
  test("responds with a 201 and created article", () => {
    const articleObj = {
      author: "butter_bridge",
      title: "Hiya",
      body: "this is my body",
      topic: "cats",
      article_img_url:
        "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fbucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com%2Fpublic%2Fimages%2F82346fd4-4737-4551-95f8-1295bd6fc743_1200x824.jpeg",
    };
    return request(app)
      .post("/api/articles")
      .send(articleObj)
      .expect(201)
      .then(({ body }) => {
        expect(body.postedArticle).toEqual(
          expect.objectContaining({
            author: "butter_bridge",
            title: "Hiya",
            body: "this is my body",
            topic: "cats",
            article_img_url:
              "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fbucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com%2Fpublic%2Fimages%2F82346fd4-4737-4551-95f8-1295bd6fc743_1200x824.jpeg",
          })
        );
      });
  });
  test("if article_img_url is not defined, it responds with default value", () => {
    const articleObj = {
      author: "butter_bridge",
      title: "Hiya",
      body: "this is my body",
      topic: "cats",
    };
    return request(app)
      .post("/api/articles")
      .send(articleObj)
      .expect(201)
      .then(({ body }) => {
        expect(body.postedArticle.article_img_url).toEqual(
          "https://www.pulsecarshalton.co.uk/wp-content/uploads/2016/08/jk-placeholder-image.jpg"
        );
      });
  });

  test("responds with a 201, ignoring unnecessary properties", () => {
    const articleObj = {
      author: "butter_bridge",
      title: "Hiya",
      body: "this is my body",
      topic: "cats",
      banana: "ignore this",
    };
    return request(app)
      .post("/api/articles")
      .send(articleObj)
      .expect(201)
      .then(({ body }) => {
        expect(body.postedArticle).not.toHaveProperty("banana");
      });
  });

  test("responds with a 400 if missing fields", () => {
    const articleObj = {
      author: "butter_bridge",
      title: "Hiya",
      body: "this is my body",
    };
    return request(app)
      .post("/api/articles")
      .send(articleObj)
      .expect(400)
      .then(({ body }) => {
        expect(body.message).toEqual("400 - Bad request");
      });
  });

  test("responds with a 404 if author does not exist", () => {
    const articleObj = {
      author: "john",
      title: "Hiya",
      body: "this is my body",
      topic: "cats",
    };
    return request(app)
      .post("/api/articles")
      .send(articleObj)
      .expect(404)
      .then(({ body }) => {
        expect(body.message).toEqual("404 - Not Found");
      });
  });
});

describe("20. GET /api/articles (pagination)", () => {
  test("responds with a default limit of 10 when there are 13 articles", () => {
    return request(app)
      .get("/api/articles")
      .expect(200)
      .then(({ body }) => {
        expect(body.articles.length).toBe(10);
      });
  });
  test("responds with specified limit when one is provided", () => {
    return request(app)
      .get("/api/articles?limit=7")
      .expect(200)
      .then(({ body }) => {
        expect(body.articles.length).toBe(7);
      });
  });
  test("responds with a 400 if the limit is not valid", () => {
    return request(app)
      .get("/api/articles?limit=bananas")
      .expect(400)
      .then(({ body }) => {
        expect(body.message).toEqual("Invalid Query");
      });
  });
});

describe("21. GET /api/articles/:article_id/comments (pagination)", () => {
  test("responds with a default limit of 10 for article with 11 comments", () => {
    return request(app)
      .get("/api/articles/1/comments")
      .expect(200)
      .then(({ body }) => {
        expect(body.comments.length).toBe(10);
      });
  });
  test("responds with specified limit when one is provided", () => {
    return request(app)
      .get("/api/articles/1/comments?limit=4")
      .expect(200)
      .then(({ body }) => {
        expect(body.comments.length).toBe(4);
      });
  });
  test("responds with a 400 if the limit is not valid", () => {
    return request(app)
      .get("/api/articles/1/comments?limit=bananas")
      .expect(400)
      .then(({ body }) => {
        expect(body.message).toEqual("Invalid Query");
      });
  });
});

describe("22. POST /api/topics", () => {
  test("responds with a 201 and the posted topic", () => {
    const topicToPost = {
      slug: "northcoders",
      description: "a lovely place to work",
    };
    return request(app)
      .post("/api/topics")
      .send(topicToPost)
      .expect(201)
      .then(({ body }) => {
        expect(body.postedTopic).toEqual(
          expect.objectContaining({
            slug: "northcoders",
            description: "a lovely place to work",
          })
        );
      });
  });
  test("responds with a 201 and the posted topic if extra properties are passed", () => {
    const topicToPost = {
      slug: "northcoders",
      description: "a lovely place to work",
      bananas: "a lovely bunch",
    };
    return request(app)
      .post("/api/topics")
      .send(topicToPost)
      .expect(201)
      .then(({ body }) => {
        expect(body.postedTopic).not.toHaveProperty("bananas");
      });
  });
  test("responds with a 400 if missing required slug field in the post object", () => {
    const topicToPost = {
      description: "northcoders",
    };
    return request(app)
      .post("/api/topics")
      .send(topicToPost)
      .expect(400)
      .then(({ body }) => {
        expect(body.message).toEqual("400 - Bad request");
      });
  });
  test("responds with a 400 and message advising user to add a description if it's missing", () => {
    const topicToPost = {
      slug: "northcoders",
    };
    return request(app)
      .post("/api/topics")
      .send(topicToPost)
      .expect(400)
      .then(({ body }) => {
        console.log(body);
        expect(body.message).toEqual("Please add a description!");
      });
  });
});
