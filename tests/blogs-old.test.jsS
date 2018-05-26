// before adding page helper functions
const Page = require("./helpers/page");

let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto("localhost:3000");
});

afterEach(async () => {
  await page.close();
});

describe("When logged in", async () => {
  beforeEach(async () => {
    await page.login();
    await page.click("a.btn-floating");
  });

  // test("When logged in, can see blog create form", async () => {
  test("can see blog create form", async () => {
    // await page.login();
    // page.login redirects to localhost:3000, as thats how we setup our fake Google login OAuth flow
    // but in the real app login flow, we get redirected to localhost:3000/blogs
    // await page.goto("localhost:3000/blogs");
    // so we can either goto /blogs after we login OR modify the page.login function in page.js
    // so lets just modify the page.login to redirect to /blogs after successful login

    // await page.click("a.btn-floating");

    const label = await page.getContentsOf("form label");

    expect(label).toEqual("Blog Title");
  });

  describe("And using valid inputs", async () => {
    // we already logged in from top level describe beforeEach
    beforeEach(async () => {
      // enter some text in the form input fields
      await page.type(".title input", "My Title");
      await page.type(".content input", "My Content");
      // submit the form, i.e, click on Next button
      await page.click("form button");
    });

    test("Submitting takes user to review screen", async () => {
      // check to see if we are navigated to a page that shows 'Please confirm your entries' text
      const text = await page.getContentsOf("h5");

      expect(text).toEqual("Please confirm your entries");
    });

    test("Submitting then saving adds blog to index page", async () => {
      await page.click("button.green");
      // click on Save Blog button and this should navigate to /blogs
      // on /blogs page we should see the only single blog post of My Title : My Content
      // using waitFor as saving blog makes a ajax request and takes time
      // waitFor for a div with class 'card' appear, as the card is present on this screen and not on the previous screen
      await page.waitFor(".card");

      const title = await page.getContentsOf(".card-title");
      const content = await page.getContentsOf("p");

      expect(title).toEqual("My Title");
      expect(content).toEqual("My Content");
    });
  });

  // nested describe
  describe("And using invalid inputs", async () => {
    // we already logged in from top level describe beforeEach
    // one way to test invalid inputs is by not inputting any text in the form input fields
    // and then on clicking 'Next' on /blogs/new page, we should see error message for the form input fields
    beforeEach(async () => {
      await page.click("form button");
    });

    // so test reads as ... When logged in and usng invalid inputs, the form shows an error message
    test("the form shows an error message", async () => {
      const titleError = await page.getContentsOf(".title .red-text");
      const contentError = await page.getContentsOf(".content .red-text");

      expect(titleError).toEqual("You must provide a value");
      expect(contentError).toEqual("You must provide a value");
    });
  });
});

describe("User is not logged in", async () => {
  test("User cannot create blog posts", async () => {
    const result = await page.evaluate(() => {
      return fetch("/api/blogs", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ title: "My Title", content: "My Content" })
      }).then(res => res.json());
    });

    // console.log(result);
    expect(result).toEqual({ error: "You must log in!" });
  });

  test("User cannot get a list of posts", async () => {
    const result = await page.evaluate(() => {
      return fetch("/api/blogs", {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        }
      }).then(res => res.json());
    });

    expect(result).toEqual({ error: "You must log in!" });
  });
});
