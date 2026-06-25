***

# ICICI Payment Gateway API - Agent-First Documentation

## 1. Agent Directives
*   **Primary Objective:** Facilitate integration with the ICICI Payment Gateway for initiating sales, verifying status, processing refunds, and handling settlements.
*   **Execution Rule:** Always calculate and append the `secureHash` parameter to requests. Authentication will fail otherwise.
*   **Data Types:** 
    *   `Numeric (M,N)`: A number with M significant digits and N decimal places.
    *   `Alphanumeric`: Letters and numbers. Avoid special characters unless specified.
    *   `JSON`: Minified JSON string format.

## 2. Environments & Base URLs
Map these to your environment variables dynamically based on the target deployment.

| Environment | Base URL |
| :--- | :--- |
| **TEST (UAT)** | `https://pgpayuat.icicibank.com` |
| **PRODUCTION** | `https://pgpay.icicibank.com` |

---

## 3. Authentication: Secure Hash Calculation
All POST/JSON requests require a cryptographic signature sent as the `secureHash` parameter.

### 3.1 Hash Logic v2 (For JSON Payloads)
1.  **Format:** Convert the JSON request/response object to a **minified JSON string** (no spaces, no newlines).
2.  **Algorithm:** `HMAC-SHA256`
3.  **Key:** Use the Secret Key provided by ICICI Bank.
4.  **Encoding:** Convert the HMAC output to HEX format.
5.  **Casing:** Convert the HEX string to **lowercase**.
6.  **Injection:** Append the resulting string to the payload as the `secureHash` field, or inject it into the HTTP header `securehash`.

### 3.2 Hash Logic v1 (For URL-Encoded Form Data)
1.  **Format:** Extract all POST parameters (ignore query parameters and empty/null values).
2.  **Sort:** Concatenate the parameter values in **ascending order** of their parameter names.
    *   *Example:* `param1="abc"`, `param2="xyz"`, `name="aa"`. String = `aaabcxyz`.
3.  **Calculate:** Generate `HMAC-SHA256` using the Secret Key.
4.  **Format:** Convert to HEX, lowercase it, and append as the `secureHash` parameter.

---

## 4. Integration Workflows (State Machines)

### Flow A: Standard Checkout (Redirect Mode)
Use this when the user should be redirected to the ICICI hosted page.
1. `POST /pg/api/v2/initiateSale` with `payType: "0"` -> Returns `redirectURI`.
2. Redirect user to `redirectURI`.
3. Await POST callback on `returnURL`.
4. Validate `secureHash` on incoming callback -> Update local DB.

### Flow B: Seamless Checkout (Direct Mode)
Use this when collecting card details natively.
1. `POST /pg/api/v2/initiateSale` with `payType: "1"` -> Returns `showOTPCapturePage: "Y"` and URLs.
2. `GET <generateOTPURI>` to trigger OTP.
3. Collect OTP from user -> `POST <verifyOTPURI>`.
4. On success, `POST <authorizeURI>`.

---

## 5. API Reference Definitions

### 5.1 Initiate Sale
*   **Endpoint:** `POST {BASE_URL}/pg/api/v2/initiateSale`
*   **Content-Type:** `application/json`
*   **Severity:** HIGH

#### Request Schema (JSON)
| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `merchantId` | Numeric(20) | Yes | Merchant account ID |
| `merchantTxnNo`| Alphanumeric(20)| Yes | Unique order reference. Must be alphanumeric. |
| `amount` | Numeric(9,2) | No | Transaction amount (e.g., `100.00`) |
| `currencyCode` | Numeric(3) | Yes | Currency code (e.g., `356` for INR) |
| `payType` | Numeric | Yes | `0` = Standard (Redirect), `1` = Direct (Seamless) |
| `transactionType`| String | Yes | Must be `SALE` |
| `returnURL` | String(128) | Cond | Callback URL for transaction result |
| `paymentMode` | String | Cond | If `payType=1`. Allowed: `CARD`, `NB`, `WALLET`, `UPI`, `AADHAAR` |
| `txnDate` | String(14) | Yes | Format: `YYYYMMDDHHMISS` |
| `cardNo` | Numeric(19) | Cond | Required if `payType=1` & `paymentMode=CARD` |
| `cardExpiry` | Numeric(6) | Cond | Required if `payType=1`. Format: `YYYYMM` |
| `cvv` | Numeric(4) | Cond | Required if `payType=1` |
| `secureHash` | String(64) | Yes | Hash calculated per Section 3.1 |

#### Response Schema (JSON)
*   **Success Check:** `responseCode == "R1000"`
*   **Key Fields Returned:** `merchantId`, `merchantTxnNo`, `redirectURI`, `generateOTPURI`, `verifyOTPURI`, `authorizeURI`, `showOTPCapturePage` (Y/N), `tranCtx`, `secureHash`.

### 5.2 Command API (Refund / Void / Transaction Status)
*   **Endpoint:** `POST {BASE_URL}/tsp/pg/api/command`
*   **Content-Type:** `application/x-www-form-urlencoded`
*   **Severity:** HIGH (Refund) / MEDIUM (Status)

#### Request Schema (URL-Encoded)
| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `merchantId` | Alphanumeric(20)| Yes | Merchant account ID |
| `merchantTxnNo`| Alphanumeric(20)| Yes | The new unique reference No. for *this* command |
| `originalTxnNo`| Alphanumeric(20)| Yes | The original transaction reference number |
| `transactionType`| String(6) | Yes | `REFUND`, `VOID`, or `STATUS` |
| `amount` | Numeric(9,2) | Yes | 0 for VOID. Amount for REFUND. N/A for STATUS. |
| `secureHash` | String(64) | Yes | Hash calculated per Section 3.2 |

#### Response Schema (JSON)
*   **Status API Success Check:** `responseCode == "000"`, check `txnStatus` (`SUC` = Success, `REJ` = Rejected, `REQ` = Pending).
*   **Refund API Success Check:** `responseCode == "000"`, maps to success.

### 5.3 Generate QR
*   **Endpoint:** `POST {BASE_URL}/tsp/pg/api/generateQR`
*   **Content-Type:** `application/x-www-form-urlencoded`

#### Request Schema (URL-Encoded)
| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `merchantId` | Numeric(12) | Yes | Merchant account ID |
| `merchantRefNo`| Alphanumeric(12)| Yes | Unique order reference |
| `amount` | Numeric(9,2) | Yes | Amount |
| `currency` | Numeric(3) | Yes | e.g., `356` |
| `requestType` | String(12) | Yes | Value: `UPIQR` |
| `secureHash` | String(64) | Yes | Hash calculated per Section 3.2 |

#### Response Schema (JSON)
*   **Success Check:** `returnCode == "200"`
*   **Key Field:** `upiQR` (String representing the UPI QR logic `upi://pay?...`)

### 5.4 Settlement Details
*   **Endpoint:** `POST {BASE_URL}/tsp/pg/api/settlementDetails`
*   **Content-Type:** `application/x-www-form-urlencoded`

Retrieves max 100 settled transactions per call. Use pagination via `lastTxnID`.
**Required Params:** `merchantId`, `settlementID`, `secureHash`, `lastTxnID` (optional for page 1).

---

## 6. Callback / Webhook Handling (Payment Advice)
Agents must expose a webhook to receive HTTP POST requests from ICICI servers.

*   **Content-Type:** `application/x-www-form-urlencoded` (default) or `application/json` (if configured during onboarding).
*   **Payload structure:** `responseCode`, `respDescription`, `merchantId`, `merchantTxnNo`, `txnID`, `paymentDateTime`, `paymentID`.
*   **Agent Logic requirement:** 
    1. Parse incoming parameters.
    2. Recalculate hash on incoming params (ignoring URL queries and the hash itself).
    3. Assert `calculated_hash == received_secureHash`.
    4. If matched and `responseCode == "0000"`, update local database state to "PAID".
    5. Return `HTTP 200 OK` to stop webhook retries.

---

## 7. Dictionary: Common Response & Status Codes

| Field | Code | Meaning | Agent Action |
| :--- | :--- | :--- | :--- |
| `responseCode` (Init) | `R1000` | Request Initiated Successfully | Proceed to Redirect/OTP |
| `responseCode` (Final) | `000`, `0000`| Transaction/Command Success | Mark task successful |
| `txnStatus` | `SUC` | Transaction Successful | Fulfill order |
| `txnStatus` | `REJ` | Transaction Rejected | Cancel order / Retry |
| `txnStatus` | `REQ` | Received & In Process | Poll `/command` endpoint later |
| `settlementStatus` | `STD` | Settled | Reconcile accounts |
| `settlementStatus` | `NSD` | Not yet settled | Wait for settlement cycle (12h) |