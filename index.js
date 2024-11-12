const axios = require('axios');
const fs = require('fs');  // To read the JSON file

// Read data.json file
fs.readFile('./data.json', 'utf8', (err, data) => {
  if (err) {
    console.error("Error reading data.json:", err);
    return;
  }

  // 1. DATA PREPARATION

  // Parse the JSON data
  const invoices = JSON.parse(data);

  const keys = Object.keys(invoices[0]);

  const textJsContent = `
  fetch("https://efiling.tax.gov.kh/gdtefilingweb/purchase-sale/savepurchase-saletax-api", {
    "headers": {
      "accept": "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/json;charset=UTF-8",
      "sec-ch-ua": "\"Chromium\";v=\"130\", \"Google Chrome\";v=\"130\", \"Not?A_Brand\";v=\"99\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-kl-ajax-request": "Ajax_Request",
      "x-requested-with": "XMLHttpRequest",
      "x-xsrf-token": "b6311c30-b602-41ca-8578-57cd66abb4da",
      "cookie": "XSRF-TOKEN=b6311c30-b602-41ca-8578-57cd66abb4da; OWPJSESSIONID=YzE5OTRkNWYtOTBkYy00NGM1LTgxYWMtZDM4Y2ZjNTM5ZTg1; TS01214ff7=01bf609f08ea2bd41271178e898e538d59753bc5fa9779ddd850b36c31f9c30b5ec4320e333eaccd385dd02b418a3960a2b760bd27; __zlcmid=1Ofn9wlDH47eDJw; BIGipServerPRO_OWP_WEB_SVR_POOL=372315308.47873.0000; TS01551615=01bf609f08ea2bd41271178e898e538d59753bc5fa9779ddd850b36c31f9c30b5ec4320e333eaccd385dd02b418a3960a2b760bd27; TS39867566027=080cb2d710ab2000babf48449908d66fa1b5ca654f256d20649d296b422a9f69db92f50c31fa2d2c08c68b892c113000394367bd76134048a1f62c7587c7687381579d168a0dc0acc749f395ba5c3da29642497ae877a4c5921139115d755506",
      "Referer": "https://efiling.tax.gov.kh/gdtefilingweb/entry/purchase-sale/Qqap9d85dNOM",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": "{\"COM_ID\":\"Qqap9d85dNOM\",\"TAX_BRANCH\":2014018,\"IS_BRANCH\":false,\"COMPANY_BRANCH\":0,\"EXCHANGE_RATE\":11,\"MONTH\":\"10\",\"YEAR\":\"2024\",\"TAXPAYER_TYPE\":2,\"ITEM_ID\":\"JknEV505OpZQ\",\"INV_DATE\":\"2024-10-01\",\"INV_NO\":\"INV24-0275\",\"TOTAL_AMT\":58282519,\"TRANSACTION\":2,\"VAT_TYPE\":1,\"CATEGORY\":1,\"NONE_VAT_AMT\":0,\"PLT_AMT\":0,\"SPEC_AMT\":0,\"ACCOM_AMT\":0,\"COM_TYPE\":2,\"PPT_RATE\":1,\"SECTOR_TYPE\":0,\"TREASURY_INV_NO\":\"\",\"INV_REMARK\":\"សាំងស៊ុបពែ(ULG)  សាំងធម្មតា(ULR)  ប្រេងម៉ាស៊ូត(HSD)\",\"STCS_AMT\":0}",
    "method": "POST"
  });
    `;

  const extractInvoiceData = (invoice) => {
    // Define regex patterns for x-xsrf-token, cookie, and body
    const urlPattern = /https?:\/\/[^\s",]+/;
    const xsrfTokenPattern = /"x-xsrf-token":\s*"([^"]+)"/;
    const cookiePattern = /"cookie":\s*"([^"]+)"/;
    const bodyPattern = /"body":\s*"({.*?})"/s; // 's' flag allows matching multi-line body content

    const firstUrl = invoice.match(urlPattern)[0];

    // Extract x-xsrf-token
    const xsrfTokenMatch = invoice.match(xsrfTokenPattern);
    const xsrfToken = xsrfTokenMatch ? xsrfTokenMatch[1] : "Not found";

    // Extract cookie
    const cookieMatch = invoice.match(cookiePattern);
    const cookie = cookieMatch ? cookieMatch[1] : "Not found";

    // Extract body
    const bodyMatch = invoice.match(bodyPattern);
    const body = bodyMatch ? bodyMatch[1] : "Not found";

    // Parse the body JSON to an object for manipulation
    let bodyObject;
    try {
      bodyObject = JSON.parse(body);
    } catch (error) {
      console.error("Failed to parse body JSON:", error);
      bodyObject = {}; // Set to an empty object if parsing fails
    }

    // Remove Keys which contain in json from bodyObject

    keys.forEach(key => {
      delete bodyObject[key];
    });

    // console.log(bodyObject);

    // Return the extracted values in an object, along with remaining body
    return {
      firstUrl,
      xsrfToken,
      cookie,
      body: bodyObject,
    };
  };


  // 2. REQUEST API FUNCTION

  // Define the function to send POST request
  const savePurchaseSaleTax = async (invoice) => {

    const result = extractInvoiceData(textJsContent);

    const url = result.firstUrl;

    const headers = {
      "accept": "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/json;charset=UTF-8",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-requested-with": "XMLHttpRequest",
      "x-xsrf-token": result.xsrfToken,
      "cookie": result.cookie,
      "referrer": "https://efiling.tax.gov.kh/gdtefilingweb/entry/purchase-sale/PZXAr702MNle",
      "referrerPolicy": "strict-origin-when-cross-origin"
    }

    const body = {
      ...result.body // Spread extracted body properties here
    };

    keys.forEach(key => {
      // Add each key back dynamically based on its corresponding value from the invoice object
      if (key === 'TOTAL_AMT') {
        body[key] = parseFloat(invoice[key].replace(/,/g, '').trim()); // For TOTAL_AMT, we clean and parse
      } else if (key === 'ACCOM_AMT') {
        body[key] = parseFloat(invoice[key].replace(/,/g, '').trim()); // For TOTAL_AMT, we clean and parse
      }else {
        body[key] = invoice[key].trim(); // For other keys, just trim
      }
    });

    // console.log(body);

    try {
      const response = await axios.post(url, body, { headers });
      console.log(`Response for INV_NO ${invoice.INV_NO}:`, response.data);
    } catch (error) {
      console.error(`Error for INV_NO ${invoice.INV_NO}:`, error.message);
    }
  };

  // 3. Sequentially send the request

  // Loop through each invoice in the JSON file and send the request
  const processInvoicesSequentially = async () => {
    for (const invoice of invoices) {
      await savePurchaseSaleTax(invoice); // Wait for each request to finish
      // console.log(invoice);
    }
  };

  processInvoicesSequentially();
});