const axios = require("axios");
const fs = require("fs");

fs.readFile("./data.json", "utf8", (err, data) => {
  if (err) {
    console.error("Error reading data.json:", err);
    return;
  }

  const invoices = JSON.parse(data);
  const keys = Object.keys(invoices[0]);

  const textJsContent = `
  "headers": {
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9",
    "content-type": "application/json;charset=UTF-8",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-requested-with": "XMLHttpRequest",
    "x-xsrf-token": "cc485375-e8e0-4d2c-9b8c-9dcda5865c23",
    "cookie": "XSRF-TOKEN=cc485375-e8e0-4d2c-9b8c-9dcda5865c23; OWPJSESSIONID=NGMwNzQ2NWYtZWIyYS00NTNhLTg5NDItMmViY2I4NTU4NTY2; TS01214ff7=01bf609f080193a2900130eb1f803704e0fe1f890ccb6195a0536b55c8e8c2d5e30230cf31f3c37aa44a617947ee1c79432109eadb; BIGipServerPRO_OWP_WEB_SVR_POOL=372315308.47873.0000; TS01551615=01bf609f080193a2900130eb1f803704e0fe1f890ccb6195a0536b55c8e8c2d5e30230cf31f3c37aa44a617947ee1c79432109eadb; __zlcmid=1PlnKInlXbMW2v8; TS39867566027=080cb2d710ab200017a48bbea7c2fd7b30b1a32dfdd966047a8479c37a75f10edb22a7e1322e9e2608fbcffdeb1130000dddc8763a0464a6f7c9477d78a99dee44a23a9622843ea5569cfeb7e6431e3d820956a1175841818aa18d88ac75dd55"
  },
  "referrer": "https://efiling.tax.gov.kh/gdtefilingweb/entry/purchase-sale/vYVNJj0jlNBq",
  "referrerPolicy": "strict-origin-when-cross-origin",
  "body": "{\"COM_ID\":\"vYVNJj0jlNBq\",\"TAX_BRANCH\":2014018,\"IS_BRANCH\":false,\"COMPANY_BRANCH\":0,\"EXCHANGE_RATE\":11,\"MONTH\":\"12\",\"YEAR\":\"2024\",\"TAXPAYER_TYPE\":2,\"ITEM_ID\":\"xz4Ev2LgdEOZ\",\"INV_DATE\":\"2024-12-01\",\"INV_NO\":\"NA29\",\"TOTAL_AMT\":8050000,\"TRANSACTION\":1,\"VAT_TYPE\":3,\"CATEGORY\":1,\"NONE_VAT_AMT\":0,\"PLT_AMT\":0,\"SPEC_AMT\":0,\"ACCOM_AMT\":0,\"COM_TYPE\":2,\"PPT_RATE\":1,\"SECTOR_TYPE\":0,\"TREASURY_INV_NO\":\"\",\"INV_REMARK\":\"\\\"ចំណាយជួលទីតាំងប្រចាំខែ ធ្នូ    ២០២៤  \\\"\",\"STCS_AMT\":0}",
  "method": "POST",
  "mode": "cors"
});
`;

  const extractInvoiceData = (invoice) => {
    const urlPattern = /https?:\/\/[^\s",]+/;
    const xsrfTokenPattern = /"x-xsrf-token":\s*"([^"]+)"/;
    const cookiePattern = /"cookie":\s*"([^"]+)"/;
    const bodyPattern = /"body":\s*"({.*?})"/s;

    const firstUrl = invoice.match(urlPattern)[0];
    const xsrfToken = invoice.match(xsrfTokenPattern)?.[1] || "Not found";
    const cookie = invoice.match(cookiePattern)?.[1] || "Not found";
    const body = invoice.match(bodyPattern)?.[1] || "Not found";

    let bodyObject = {};
    try {
      bodyObject = JSON.parse(body);
    } catch (error) {
      console.error("Failed to parse body JSON:", error);
    }

    keys.forEach(key => delete bodyObject[key]);

    return { firstUrl, xsrfToken, cookie, body: bodyObject };
  };

  const savePurchaseSaleTax = async (invoice) => {
    const result = extractInvoiceData(textJsContent);
    const { firstUrl, xsrfToken, cookie, body } = result;

    const headers = {
      accept: "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/json;charset=UTF-8",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-requested-with": "XMLHttpRequest",
      "x-xsrf-token": xsrfToken,
      cookie,
      referrer: "https://efiling.tax.gov.kh/gdtefilingweb/entry/purchase-sale/PZXAr702MNle",
      referrerPolicy: "strict-origin-when-cross-origin"
    };

    const requestBody = { ...body };
    keys.forEach(key => {
      if (key === "TOTAL_AMT" || key === "ACCOM_AMT") {
        requestBody[key] = parseFloat(invoice[key].replace(/,/g, "").trim());
      } else {
        requestBody[key] = invoice[key].trim();
      }
    });

    try {
      // const response = await axios.post(firstUrl, requestBody, { headers });
      console.log(`Response for INV_NO ${invoice.INV_NO}:`, response.data);
    } catch (error) {
      console.error(`Error for INV_NO ${invoice.INV_NO}:`, error.message);
    }
  };

  const processInvoicesSequentially = async () => {
    for (const invoice of invoices) {
      await savePurchaseSaleTax(invoice);
    }
  };

  processInvoicesSequentially();
});
