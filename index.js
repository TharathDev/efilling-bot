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
      "x-xsrf-token": "89670471-91bf-42d6-a12a-47d6a8dd1ec4",
      "cookie": "XSRF-TOKEN=89670471-91bf-42d6-a12a-47d6a8dd1ec4; OWPJSESSIONID=MzUxMjg0NTgtZWUwMy00NTk0LWI5MGMtMTM3MTBkZWUxOTYz; TS01214ff7=01bf609f08c346d93d100363a271328023b1d5e087532635a7aa95571fa86be9d906b772eb7939b57dcdd439dc509896cd5227570c; BIGipServerPRO_OWP_WEB_SVR_POOL=372315308.47873.0000; TS01551615=01bf609f08c346d93d100363a271328023b1d5e087532635a7aa95571fa86be9d906b772eb7939b57dcdd439dc509896cd5227570c; __zlcmid=1OinAPE2ZGRgSex; TS39867566027=080cb2d710ab2000faca5690b84ad0e8d545846ee6fad7e6a21f92d00610e445d95eef2bb6790e1b08a8c7b24b113000afbbd19fb2b91f7ca577ec50135905756f4942a97ad15842e7fef0e79e73ea5e3904246f7aa6a45f03728df09f57a27b",
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

    // try {
    //   const response = await axios.post(url, body, { headers });
    //   console.log(`Response for INV_NO ${invoice.INV_NO}:`, response.data);
    // } catch (error) {
    //   console.error(`Error for INV_NO ${invoice.INV_NO}:`, error.message);
    // }
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