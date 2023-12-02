// Shout outs to the following repositories:

// https://github.com/vercel/og-image
// https://github.com/ireade/netlify-puppeteer-screenshot-demo

// The maximum execution timeout is 10
// seconds when deployed on a Personal Account (Hobby plan).
// For Teams, the execution timeout is 60 seconds (Pro plan)
// or 900 seconds (Enterprise plan).

const puppeteer = require("puppeteer-core");
const chrome = require('@sparticuz/chromium-min');

/** The code below determines the executable location for Chrome to
 * start up and take the screenshot when running a local development environment.
 *
 * If the code is running on Windows, find chrome.exe in the default location.
 * If the code is running on Linux, find the Chrome installation in the default location.
 * If the code is running on MacOS, find the Chrome installation in the default location.
 * You may need to update this code when running it locally depending on the location of
 * your Chrome installation on your operating system.
 */

const exePath =
  process.platform === "win32"
    ? "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
    : process.platform === "linux"
    ? "/usr/bin/google-chrome"
    : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function getOptions(isDev) {
  let options;
  if (isDev) {
    options = {
      args: [],
      executablePath: exePath,
      headless: true,
    };
  } else {
    options = {
      args: [...chrome.args, '--hide-scrollbars', '--disable-web-security'],
      defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath(
      `https://github.com/Sparticuz/chromium/releases/download/v116.0.0/chromium-v116.0.0-pack.tar`
    ),
      headless: chrome.headless,
      ignoreHTTPSErrors: true,
    };
  }
  return options;
}

async function logError(err) {
    console.log('❌ Ocorreu algum erro >', `[${err}]`);
}

async function openSite(parameters, page) {

    console.log('👉🏻 Abrindo site');

    const userLoginField = '#user_login';
    const userPassField = '#user_pass';
    const submitButton = '#wp-submit';

  try {

    try {
      await page.goto(parameters.url);
      await page.waitForSelector(userLoginField, { visible: true });
      await page.waitForSelector(userPassField, { visible: true });

    } catch (error) {
      await logError(`❌ Não conseguiu acessar a URL: ${error}`);

      try {
        console.log('👉🏻Tentando url com WP-ADMIN');
    
        if (!parameters.url.includes('wp-admin')) {
          if (parameters.url.slice(-1) === '/') {
            parameters.url = parameters.url + 'wp-admin';
          } else {
            parameters.url = parameters.url + '/wp-admin';
          }
        }
                    
        await page.goto(parameters.url);
        await page.waitForSelector(userLoginField, { visible: true });
        await page.waitForSelector(userPassField, { visible: true });
    
      } catch (error) {
        await logError(`❌ Não conseguiu acessar a URL com WP-Admin`);
                
    
        console.log('👉🏻 Ativação não realizada');
                
        await browser.close();
        throw new Error('❌ Não conseguiu acessar a URL com WP-Admin');

      }
            
    }

        
    try {
      await page.type(userLoginField, parameters.user);
      await page.type(userPassField, parameters.password);
      await page.click(submitButton);

      let loginError = await page.$('#login_error');

      if (loginError) {
                
        console.log('👉🏻 Ativação não realizada');
                
        await browser.close();

      } else {
        console.log('👉🏻 Fez login');
      }

    } catch (e) {
      console.log('error', e);
    }

        
  } catch (e) {
    console.log('error', e);
  }
    
}

module.exports = async (req, res) => {
  const pageToScreenshot = req.query.page;

  // pass in this parameter if you are developing locally
  // to ensure puppeteer picks up your machine installation of
  // Chrome via the configurable options
  const isDev = req.query.isDev === "true";

  try {
    // check for https for safety!
    if (!pageToScreenshot.includes("https://")) {
      res.statusCode = 404;
      res.json({
        body: "Sorry, we couldn't screenshot that page. Did you include https://?",
      });
    }

    // get options for browser
    const options = await getOptions(isDev);

    // launch a new headless browser with dev / prod options
    const browser = await puppeteer.launch(options);
    const page = await browser.newPage();

    // set the viewport size
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    // tell the page to visit the url
    await page.goto(pageToScreenshot);

    const parameters = {
      url: pageToScreenshot,
      user: 'voltsstudio',
      password: 'vs321#@!'
    }
    // testing
    // const result = await openSite(parameters, page);
    
    
    //take a screenshot
    const file = await page.screenshot({
      type: "png",
    });
    
    res.statusCode = 200;
    res.end(file);
    // close the browser
    await browser.close();

    // res.setHeader("Content-Type", `image/png`);

    // return the file!
  } catch (e) {
    res.statusCode = 500;
    res.json({
      body: "Sorry, Something went wrong!",
    });
  }
};
