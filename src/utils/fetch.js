import fetch from 'isomorphic-fetch';
import HttpsProxyAgent from 'https-proxy-agent';
import pRetry from 'p-retry'

// currently we accept only retry count but other p-retry options
// could also be accepted.
const {
  DATOCMS_CLIENT_RETRIES = null
} = process.env

const retry = DATOCMS_CLIENT_RETRIES ? Number(DATOCMS_CLIENT_RETRIES) : false


export default function fetchWithProxy(url, options) {
  const instanceOptions = { ...options };

  if (!instanceOptions.agent && process.env.HTTPS_PROXY) {
    instanceOptions.agent = new HttpsProxyAgent(process.env.HTTPS_PROXY);
  }

  if (retry) {
    return pRetry(() => fetch(url, instanceOptions), {
      retries: retry,
    })
  }

  // do not retry
  return fetch(url, instanceOptions);
}
