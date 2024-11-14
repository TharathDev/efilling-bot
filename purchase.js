const axios = require("axios");
const fs = require("fs"); // To read the JSON file

// Read data.json file
fs.readFile("./data.json", "utf8", (err, data) => {
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
      "x-xsrf-token": "208a2b37-e4c6-418c-8ee9-013c04cbab60",
      "cookie": "XSRF-TOKEN=208a2b37-e4c6-418c-8ee9-013c04cbab60; OWPJSESSIONID=MDg2MzFmZGUtZTI2My00Y2M2LWEyNDAtYTAxZTQwZTY1ZmMw; TS01214ff7=01bf609f08a183090d7de476e769756cd41f9d489fd32174ac4f5a1b6eef4dd35b65e345041d8ee176aad1ba7fba9abb8ca9e4e533; __zlcmid=1Ofn9wlDH47eDJw; BIGipServerPRO_OWP_WEB_SVR_POOL=372315308.47873.0000; TS01551615=01bf609f08a183090d7de476e769756cd41f9d489fd32174ac4f5a1b6eef4dd35b65e345041d8ee176aad1ba7fba9abb8ca9e4e533; TS39867566027=080cb2d710ab2000c4556113e7187e5673cd822ac90b07bf9ebe9770dd54eaab7fed49d875eb4cb108b7a2c0ff11300060a2bea716138cac9e4830d0ffecf9f5f3659d079234688c44d4189e966eeeea775bf23f458654c64046b51cd5561ce0",
      "Referer": "https://efiling.tax.gov.kh/gdtefilingweb/entry/purchase-sale/z7gEjX1D1NMY",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": "{\"COM_ID\":\"z7gEjX1D1NMY\",\"TAX_BRANCH\":2014018,\"IS_BRANCH\":false,\"COMPANY_BRANCH\":0,\"EXCHANGE_RATE\":11,\"MONTH\":\"10\",\"YEAR\":\"2024\",\"TAXPAYER_TYPE\":1,\"ITEM_ID\":\"YlDAngBGNRW3\",\"INV_DATE\":\"2024-10-10\",\"INV_NO\":\"HQTI-0000014625\",\"TOTAL_AMT\":223304720,\"TRANSACTION\":1,\"VAT_TYPE\":1,\"CATEGORY\":1,\"NONE_VAT_AMT\":0,\"PLT_AMT\":0,\"SPEC_AMT\":0,\"ACCOM_AMT\":0,\"COM_TYPE\":2,\"PPT_RATE\":1,\"SECTOR_TYPE\":0,\"TREASURY_INV_NO\":\"\",\"INV_REMARK\":\"CLICK 125 YM23: WHITE  CLICK 160 YM24: WHITE  SCOOPY CLUB 12 YM24:BLACK  SCOOPY PRESTIGE YM24: WHITE  SCOOPY CLUB 12 YM24: WHITE  BeAT YM25: BLUE  DREAM YM24:BLACK  DREAM YM25:BLACK  PCX YM24: WHITE+F\",\"STCS_AMT\":0}",
    "method": "POST"
  });
    `;

  const extractInvoiceData = invoice => {
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
      body: bodyObject
    };
  };

  // 2. REQUEST API FUNCTION

  // get company info id if ITEM_ID does existed

  const fetchCompanyInfo = async (tin, headers) => {
    const type = tin.includes("-") ? 1 : 2;
    const url =
      type === 1
        ? "https://efiling.tax.gov.kh/gdtefilingweb/company/info"
        : "https://efiling.tax.gov.kh/gdtefilingweb/api/nontaxpayer";

    const body = JSON.stringify(
      type === 1 ? { TIN: tin, TYPE: type } : { TIN: tin }
    );

    // console.log("url:", url, "body:",body);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body
      });

      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      const id = data.DATA.ID;

      console.log(`Response for ${tin}: ${response.data}  ${id}`);
      return { id, type };
    } catch (error) {
      console.error("Fetch error:", error.message);
    }
  };

  // Define the function to send POST request
  const savePurchaseSaleTax = async invoice => {
    const result = extractInvoiceData(textJsContent);

    const url = result.firstUrl;

    const headers = {
      accept: "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/json;charset=UTF-8",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-requested-with": "XMLHttpRequest",
      "x-xsrf-token": result.xsrfToken,
      cookie: result.cookie,
      referrer:
        "https://efiling.tax.gov.kh/gdtefilingweb/entry/purchase-sale/PZXAr702MNle",
      referrerPolicy: "strict-origin-when-cross-origin"
    };

    if (invoice.ITEM_ID) {
      const newItemId = await fetchCompanyInfo(invoice.ITEM_ID, headers);
      if (newItemId) {
        invoice.ITEM_ID = newItemId.id; // Replace ITEM_ID with the fetched id
        result.body.TAXPAYER_TYPE = newItemId.type;
      }
    }

    const body = {
      ...result.body // Spread extracted body properties here
    };

    keys.forEach(key => {
      // Add each key back dynamically based on its corresponding value from the invoice object
      if (key === "TOTAL_AMT") {
        body[key] = parseFloat(invoice[key].replace(/,/g, "").trim()); // For TOTAL_AMT, we clean and parse
      } else if (key === "ACCOM_AMT") {
        body[key] = parseFloat(invoice[key].replace(/,/g, "").trim()); // For TOTAL_AMT, we clean and parse
      } else {
        body[key] = invoice[key].trim(); // For other keys, just trim
      }
    });

    // console.log("last body", body);

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
