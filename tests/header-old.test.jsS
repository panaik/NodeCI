// before adding Proxy

const puppeteer = require("puppeteer");
const sessionFactory = require("./factories/sessionFactory");
const userFactory = require("./factories/userFactory");

let browser, page;

beforeEach(async () => {
  // opens a new browser
  // headless: false, shows graphical mode
  browser = await puppeteer.launch({
    headless: false
  });
  // creates a new page/tab inside the newly created browser
  page = await browser.newPage();
  await page.goto("localhost:3000");
});

afterEach(async () => {
  // await browser.close(); // browser.close, closes the chromium instance and returns control to cmd line
  await browser.close();
});

test("the header has the correct text", async () => {
  const text = await page.$eval("a.brand-logo", el => el.innerHTML);

  expect(text).toEqual("Blogster");
});

test("clicking login starts oauth flow", async () => {
  await page.click(".right a");

  const url = await page.url();

  expect(url).toMatch(/accounts\.google\.com/);
});

// test.only("When signed in, shows logout button", async () => {
test("When signed in, shows logout button", async () => {
  // '5adfa1236700fc39c0a33468' is coming from blog_dev_1 DB from mLab
  // '5adfa1236700fc39c0a33468' is the Mongo DB ID for the user who can sign into using Google OAuth flow
  // const id = "5adfa1236700fc39c0a33468";

  const user = await userFactory();
  const { session, sig } = sessionFactory(user);

  await page.setCookie({ name: "session", value: session });
  await page.setCookie({ name: "session.sig", value: sig });
  await page.goto("localhost:3000"); // this is needed to refresh the page and see the cookie in effect
  await page.waitFor('a[href="/auth/logout"]');

  const text = await page.$eval('a[href="/auth/logout"]', el => el.innerHTML);

  expect(text).toEqual("Logout");
});

// test("Adds two numbers", () => {
//   const sum = 1 + 2;

//   expect(sum).toEqual(3);
// });
