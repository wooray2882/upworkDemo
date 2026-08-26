const COGNITO_CLIENT_ID = "7epldntfsb4h4k3k8fjv5ii1pd";
const COGNITO_REGION = "us-east-1";
const COGNITO_ENDPOINT = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`;

export interface AuthUser {
  email: string;
  companyId: string;
  role: string;
  token: string;
}

export const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const signIn = async (email: string, password: string): Promise<AuthUser> => {
  const response = await fetch(COGNITO_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth'
    },
    body: JSON.stringify({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.__type || 'Authentication failed');
  }

  const result = data.AuthenticationResult;
  if (!result || !result.IdToken) {
    throw new Error('Invalid auth response from Cognito');
  }

  const idToken = result.IdToken;
  const payload = parseJwt(idToken);

  const user: AuthUser = {
    email: payload?.email || email,
    companyId: payload?.['custom:companyId'] || 'comp-01',
    role: payload?.['custom:role'] || 'CLIENT',
    token: idToken
  };

  localStorage.setItem('indycomply_id_token', idToken);
  localStorage.setItem('indycomply_access_token', result.AccessToken);
  localStorage.setItem('indycomply_refresh_token', result.RefreshToken);
  localStorage.setItem('indycomply_user', JSON.stringify(user));

  return user;
};

export const signOut = () => {
  localStorage.removeItem('indycomply_id_token');
  localStorage.removeItem('indycomply_access_token');
  localStorage.removeItem('indycomply_refresh_token');
  localStorage.removeItem('indycomply_user');
};

export const getAuthToken = (): string | null => {
  const token = localStorage.getItem('indycomply_id_token');
  if (!token) return null;
  const payload = parseJwt(token);
  if (payload && payload.exp && payload.exp * 1000 < Date.now()) {
    console.warn('Cognito JWT token expired. Signing out...');
    signOut();
    return null;
  }
  return token;
};

export const autoLoginDevUser = async (): Promise<AuthUser | null> => {
  try {
    const user = await signIn('client1@indycomply.com', 'Password123!');
    return user;
  } catch (err) {
    console.error('Auto login failed:', err);
    return null;
  }
};

export const getCurrentUser = (): AuthUser | null => {
  const token = getAuthToken();
  if (!token) return null;
  const userStr = localStorage.getItem('indycomply_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
};
