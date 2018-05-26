const puppeteer = require("puppeteer");
const sessionFactory = require("../factories/sessionFactory");
const userFactory = require("../factories/userFactory");

class CustomPage {
  static async build() {
    // create an instance of Puppeteer Page
    // create an instance of CustomPage
    // combine the two and return a Proxy
    const browser = await puppeteer.launch({
      headless: true, // don't show the browser window in Travis CI server VM
      args: ["--no-sandbox"] // to decrease the amount of time to run tests on Travis CI server VM
    });

    const page = await browser.newPage();

    const customPage = new CustomPage(page);

    return new Proxy(customPage, {
      get: function(target, property) {
        return customPage[property] || browser[property] || page[property];
        // order matters here...browser comes before page, as we want to call browser.close and not page.close
      }
    });
  }

  constructor(page) {
    this.page = page;
  }

  async login() {
    const user = await userFactory();
    const { session, sig } = sessionFactory(user);

    await this.page.setCookie({ name: "session", value: session });
    await this.page.setCookie({ name: "session.sig", value: sig });
    // await this.page.goto("localhost:3000"); // this is needed to refresh the page and see the cookie in effect
    await this.page.goto("http://localhost:3000/blogs");
    await this.page.waitFor('a[href="/auth/logout"]');
  }

  async getContentsOf(selector) {
    return this.page.$eval(selector, el => el.innerHTML);
  }

  // request handler to automate a GET request in our tests
  get(path) {
    return this.page.evaluate(_path => {
      // _path is the path argument passed to evaluate function
      return fetch(_path, {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        }
      }).then(res => res.json());
    }, path);
  }

  // request handler to automate a POST request in our tests
  post(path, data) {
    // _path & _data are the path & data argument passed to evaluate function
    return this.page.evaluate(
      (_path, _data) => {
        return fetch(_path, {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(_data)
        }).then(res => res.json());
      },
      path,
      data
    );
  }

  execRequests(actions) {
    // actions map here is going to return array of Promises
    return Promise.all(
      actions.map(({ method, path, data }) => {
        // method can be 'get', 'post'
        return this[method](path, data);
      })
    );
  }
}

module.exports = CustomPage;

// usage:
// CustomPage.build();
