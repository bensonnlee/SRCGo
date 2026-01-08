import type { AuthResult } from '@apptypes/auth';
import type { BarcodeResult } from '@apptypes/barcode';
import { apiClient } from '@services/api/client';
import { API_ENDPOINTS } from '@utils/constants';

const CAS_SERVICE_URL =
  'https://innosoftfusiongo.com/sso/login/login-process-cas.php';

/**
 * Step 1: Initialize session with Innosoft Fusion
 * Sets up necessary cookies for the auth flow
 */
async function startLogin(): Promise<void> {
  await apiClient.get(API_ENDPOINTS.LOGIN_START, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });
}

/**
 * Step 2: Get execution token from UCR CAS login page
 * The execution token is required for form submission
 */
async function getExecution(): Promise<string> {
  const url = `${API_ENDPOINTS.CAS_LOGIN}?service=${encodeURIComponent(CAS_SERVICE_URL)}`;

  const response = await apiClient.get(url, {
    headers: {
      Referer: API_ENDPOINTS.LOGIN_START,
      Connection: 'keep-alive',
      'Accept-Encoding': 'gzip, deflate, br',
    },
  });

  const html = response.data as string;
  const match = html.match(/name="execution" value="([^"]+)"/);

  if (!match) {
    throw new Error('Could not extract execution token');
  }

  return match[1];
}

/**
 * Step 3: Submit credentials to UCR CAS
 * Returns the redirect URL containing the service ticket
 * Uses XMLHttpRequest for better redirect control on React Native
 */
async function submitLogin(
  execution: string,
  username: string,
  password: string
): Promise<string> {
  const url = `${API_ENDPOINTS.CAS_LOGIN}?service=${encodeURIComponent(CAS_SERVICE_URL)}`;

  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', password);
  params.append('execution', execution);
  params.append('_eventId', 'submit');
  params.append('geolocation', '');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);

    // Enable native cookie handling so cookies are sent during redirects
    xhr.withCredentials = true;

    // Set headers
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Origin', 'https://auth.ucr.edu');
    xhr.setRequestHeader('Referer', url);
    xhr.setRequestHeader(
      'User-Agent',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
    );

    xhr.onreadystatechange = () => {
      // Check at HEADERS_RECEIVED (readyState 2) to catch redirects early
      if (xhr.readyState === 2) {
        if (xhr.responseURL && xhr.responseURL.includes('ticket=ST')) {
          resolve(xhr.responseURL);
          xhr.abort();
          return;
        }
      }

      if (xhr.readyState === 4) {
        // Check responseURL for ticket (redirect was followed)
        if (xhr.responseURL && xhr.responseURL.includes('ticket=ST')) {
          resolve(xhr.responseURL);
          return;
        }

        // Check response body for error messages
        const html = xhr.responseText;
        if (
          html?.includes('credentials you provided cannot be determined') ||
          html?.includes('Authentication failed') ||
          html?.includes('Incorrect username or password')
        ) {
          reject(new Error('Invalid credentials'));
          return;
        }

        // Check for ticket in body
        const ticketMatch = html?.match(/ticket=(ST[^"&\s]+)/);
        if (ticketMatch) {
          resolve(`${CAS_SERVICE_URL}?ticket=${ticketMatch[1]}`);
          return;
        }

        reject(new Error('Invalid credentials'));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error'));
    };

    xhr.send(params.toString());
  });
}

/**
 * Step 4: Complete login and get Fusion token
 * The Fusion token is returned in the response headers
 * Note: The ticket was already consumed during the redirect in Step 3,
 * so we just call login-finish.php with our session cookies
 */
async function loginFinish(ticketUrl: string): Promise<string> {
  const response = await apiClient.post(API_ENDPOINTS.LOGIN_FINISH, '', {
    headers: {
      'Content-Type': 'multipart/form-data; boundary=',
      Origin: 'https://innosoftfusiongo.com',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      'Accept-Language': 'en-us',
      Referer: ticketUrl,
      Connection: 'keep-alive',
      'Accept-Encoding': 'gzip, deflate, br',
    },
  });

  const fusionToken = response.headers['fusion-token'] as string | undefined;

  if (!fusionToken) {
    throw new Error('Could not retrieve fusion token');
  }

  return fusionToken;
}

/**
 * Step 5: Generate barcode using Fusion token
 * Returns the barcode ID number
 */
async function getBarcode(fusionToken: string): Promise<string> {
  const response = await apiClient.get(API_ENDPOINTS.BARCODE, {
    headers: {
      Accept: '*/*',
      'Content-Type': 'application/json;charset=utf-8;',
      Connection: 'keep-alive',
      Authorization: `Bearer ${fusionToken}`,
      'Accept-Encoding': 'gzip, deflate, br',
      'User-Agent': 'UCRSRC/268 CFNetwork/1240.0.4 Darwin/20.6.0',
    },
  });

  const data = response.data as { AppBarcodeIdNumber?: string }[];

  if (!data?.[0]?.AppBarcodeIdNumber) {
    throw new Error('Invalid barcode response');
  }

  return data[0].AppBarcodeIdNumber;
}

/**
 * Authenticate user with UCR CAS
 * Performs steps 1-4 to obtain a Fusion token
 */
export async function authenticateUser(
  username: string,
  password: string
): Promise<AuthResult> {
  // Trim whitespace from credentials - mobile users often accidentally add spaces
  const trimmedUsername = username.trim();
  const trimmedPassword = password.trim();

  if (!trimmedUsername || !trimmedPassword) {
    return {
      success: false,
      error: 'Username and password are required',
    };
  }

  try {
    // Step 1: Initialize session
    await startLogin();

    // Step 2: Get execution token
    const execution = await getExecution();

    // Step 3: Submit credentials and get ticket URL
    const ticketUrl = await submitLogin(execution, trimmedUsername, trimmedPassword);

    // Step 4: Complete login and get fusion token
    const fusionToken = await loginFinish(ticketUrl);

    return {
      success: true,
      fusionToken,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Authentication failed';

    // Provide user-friendly error messages
    if (message === 'Invalid credentials') {
      return {
        success: false,
        error: 'Invalid username or password',
      };
    }

    if (message === 'Could not extract execution token') {
      return {
        success: false,
        error: 'Authentication service unavailable',
      };
    }

    // Network or other errors
    if (
      message.includes('timeout') ||
      message.includes('Network') ||
      message.includes('ECONNREFUSED')
    ) {
      return {
        success: false,
        error: 'Network error. Please check your connection.',
      };
    }

    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Generate barcode ID using an existing Fusion token
 */
export async function generateBarcodeId(
  fusionToken: string
): Promise<BarcodeResult> {
  try {
    const barcodeId = await getBarcode(fusionToken);
    return {
      success: true,
      barcodeId,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to generate barcode';

    // Provide user-friendly error messages
    if (
      message.includes('status code 4') ||
      message.includes('status code 5')
    ) {
      return {
        success: false,
        error: 'Unable to load barcode. Tap refresh to try again.',
      };
    }

    if (
      message.includes('timeout') ||
      message.includes('Network') ||
      message.includes('ECONNREFUSED')
    ) {
      return {
        success: false,
        error: 'Network error. Please check your connection.',
      };
    }

    return {
      success: false,
      error: 'Unable to load barcode. Tap refresh to try again.',
    };
  }
}

/**
 * Full authentication flow with barcode generation
 * Tries cached token first, falls back to full auth if expired
 */
export async function fullAuthAndBarcode(
  username: string,
  password: string,
  cachedToken?: string | null
): Promise<{ fusionToken: string; barcodeId: string }> {
  // Try cached token first
  if (cachedToken) {
    try {
      const barcodeId = await getBarcode(cachedToken);
      return { fusionToken: cachedToken, barcodeId };
    } catch {
      // Token expired, continue with full auth
    }
  }

  // Full authentication flow
  const authResult = await authenticateUser(username, password);

  if (!authResult.success || !authResult.fusionToken) {
    throw new Error(authResult.error || 'Authentication failed');
  }

  const barcodeId = await getBarcode(authResult.fusionToken);
  return { fusionToken: authResult.fusionToken, barcodeId };
}

/**
 * Re-authenticate and get new Fusion token
 * Used when the cached token has expired
 */
export async function refreshAuthentication(
  username: string,
  password: string
): Promise<AuthResult> {
  return authenticateUser(username, password);
}
