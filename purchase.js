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
      "x-xsrf-token": "b6311c30-b602-41ca-8578-57cd66abb4da",
      "cookie": "XSRF-TOKEN=b6311c30-b602-41ca-8578-57cd66abb4da; OWPJSESSIONID=YzE5OTRkNWYtOTBkYy00NGM1LTgxYWMtZDM4Y2ZjNTM5ZTg1; TS01214ff7=01bf609f08ea2bd41271178e898e538d59753bc5fa9779ddd850b36c31f9c30b5ec4320e333eaccd385dd02b418a3960a2b760bd27; __zlcmid=1Ofn9wlDH47eDJw; BIGipServerPRO_OWP_WEB_SVR_POOL=372315308.47873.0000; TS01551615=01bf609f08a3f36f04811a78c86f982936797190bf1a7f048d2d24b7aa174eeda4c5f58e940f89d30f61bedfd6b3ad1aa92a870a32; TS39867566027=080cb2d710ab20000871c5dc7abc82e1502a72e5bd4b7e407df04fbd258f430c193ac88aa2ba6c1108a166848c113000ed3f697c7432bb06d3c427eec45234c3ecd4c481aed3b746781d316edc1249d28e85d06328b44411794cedb3744e9150",
      "Referer": "https://efiling.tax.gov.kh/gdtefilingweb/entry/purchase-sale/Qqap9d85dNOM",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": "{\"COM_ID\":\"Qqap9d85dNOM\",\"TAX_BRANCH\":2014018,\"IS_BRANCH\":false,\"COMPANY_BRANCH\":0,\"EXCHANGE_RATE\":11,\"MONTH\":\"10\",\"YEAR\":\"2024\",\"TAXPAYER_TYPE\":1,\"ITEM_ID\":\"YD1pO1o8AZ2k\",\"INV_DATE\":\"2024-10-01\",\"INV_NO\":\"1739998\",\"TOTAL_AMT\":178684,\"TRANSACTION\":1,\"VAT_TYPE\":1,\"CATEGORY\":1,\"NONE_VAT_AMT\":0,\"PLT_AMT\":0,\"SPEC_AMT\":0,\"ACCOM_AMT\":0,\"COM_TYPE\":2,\"PPT_RATE\":1,\"SECTOR_TYPE\":0,\"TREASURY_INV_NO\":\"\",\"INV_REMARK\":\"សេវាអ៊ីនធីណេត\",\"STCS_AMT\":0}",
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
    const url = "https://efiling.tax.gov.kh/gdtefilingweb/company/info";

    const type = tin.includes("-") ? 1 : 2;

    const body = JSON.stringify({
      TIN: tin,
      TYPE: type
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: body
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      console.log(`Response for fetchCompanyInfo for ${tin}:`);

      const data = await response.json();
      const id = data.data.id;
      return { id, type };
    } catch (error) {
      console.error("Fetch error:", error);
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
      console.log("HHH");
      const newItemId = await fetchCompanyInfo(invoice.ITEM_ID, headers);
      console.log("newItemId", newItemId);
      if (newItemId) {
        invoice.ITEM_ID = newItemId.id; // Replace ITEM_ID with the fetched id
        result.body.TAXPAYER_TYPE = newItemId.type;
      } else {
        console.log("No id returned from fetchCompanyInfo.");
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
