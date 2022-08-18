const puppeteer = require('puppeteer-extra');
const proxyChain = require('proxy-chain');
const { PROXY, PROXY_LOGIN, PROXY_LIST, CHROME_DEBUG, CHROME_EXECUTABLE, PROXY_PORT } = require('./constants.js');

module.exports = async function () {
  const browserOptions = [
    '--no-sandbox',
    '--no-zygote',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-web-security',
    '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36'
    // NOTE do NOT disable WebGL/GPU stuff. SW uses this to detect headless.
  ];

  // const browserOptions = [
    // '--no-sandbox',
    // '--disable-setuid-sandbox',
    // '--disable-infobars',
    // '--window-position=0,0',
    // '--ignore-certifcate-errors',
    // '--ignore-certifcate-errors-spki-list',
  //   '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"'
  // ]
  if (PROXY !== undefined) {
    const newProxy = await proxyChain.anonymizeProxy(PROXY);
    console.log(`Proxy specified: ${PROXY}; New proxy: ${newProxy}`);
    browserOptions.push(`--proxy-server=${newProxy}`);
  }
  // https://blog.apify.com/how-to-make-headless-chrome-and-puppeteer-use-a-proxy-server-with-authentication-249a21a79212
  else if (PROXY_LIST !== undefined && PROXY_LOGIN !== undefined && PROXY_PORT !== undefined) {
    let randomProxyIP = PROXY_LIST[Math.floor(Math.random() * PROXY_LIST.length)]
    let myProxy = PROXY_LOGIN+"@"+randomProxyIP+":"+PROXY_PORT
    const newProxy = await proxyChain.anonymizeProxy(myProxy);
    console.log(`Proxy specified: ${myProxy}; New proxy: ${newProxy}`);
    browserOptions.push(`--proxy-server=${newProxy}`);
  }

  const StealthPlugin = require('puppeteer-extra-plugin-stealth');
  puppeteer.use(StealthPlugin());

  let browser = await puppeteer.launch({
    args: browserOptions,

    executablePath: CHROME_EXECUTABLE,

    // not sure if this is absolutely needed: I added this while
    // trying to get some different proxies to work
    ignoreHTTPSErrors: true,

    headless: !CHROME_DEBUG,
    dumpio: CHROME_DEBUG,

    slowMo: CHROME_DEBUG ? 500 : 0
  });

  if (CHROME_DEBUG) {
    console.log("chrome debugging is enabled: use 'node inspect' to ");

    let version = await browser.version();
    console.log(`Chrome Version: ${version}`);
  }

  return browser;
};
