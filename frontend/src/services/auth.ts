import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
};

const userPool = new CognitoUserPool(poolData);

export interface SignUpInput {
  email: string;
  password: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface AuthResult {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

/**
 * Sign up a new user
 */
export const signUp = async ({ email, password }: SignUpInput): Promise<CognitoUser> => {
  return new Promise((resolve, reject) => {
    const attributeList = [
      new CognitoUserAttribute({
        Name: 'email',
        Value: email,
      }),
    ];

    userPool.signUp(email, password, attributeList, [], (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      if (!result) {
        reject(new Error('Sign up failed'));
        return;
      }
      resolve(result.user);
    });
  });
};

/**
 * Confirm sign up with verification code
 */
export const confirmSignUp = async (email: string, code: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.confirmRegistration(code, true, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
};

/**
 * Resend confirmation code
 */
export const resendConfirmationCode = async (email: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.resendConfirmationCode((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
};

/**
 * Sign in a user
 */
export const signIn = async ({ email, password }: SignInInput): Promise<AuthResult> => {
  return new Promise((resolve, reject) => {
    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (session) => {
        resolve({
          accessToken: session.getAccessToken().getJwtToken(),
          idToken: session.getIdToken().getJwtToken(),
          refreshToken: session.getRefreshToken().getToken(),
        });
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  const cognitoUser = userPool.getCurrentUser();
  if (cognitoUser) {
    cognitoUser.signOut();
  }
  localStorage.removeItem('accessToken');
  localStorage.removeItem('idToken');
  localStorage.removeItem('refreshToken');
};

/**
 * Get current user
 */
export const getCurrentUser = async (): Promise<CognitoUser | null> => {
  return new Promise((resolve) => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      resolve(null);
      return;
    }

    cognitoUser.getSession((err: Error | null) => {
      if (err) {
        resolve(null);
        return;
      }
      resolve(cognitoUser);
    });
  });
};

/**
 * Forgot password
 */
export const forgotPassword = async (email: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.forgotPassword({
      onSuccess: () => {
        resolve();
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
};

/**
 * Confirm password reset
 */
export const confirmPassword = async (
  email: string,
  code: string,
  newPassword: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.confirmPassword(code, newPassword, {
      onSuccess: () => {
        resolve();
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
};

/**
 * Refresh session
 */
export const refreshSession = async (): Promise<AuthResult> => {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      reject(new Error('No current user'));
      return;
    }

    cognitoUser.getSession((err: Error | null, session: any) => {
      if (err) {
        reject(err);
        return;
      }

      if (!session.isValid()) {
        reject(new Error('Session is invalid'));
        return;
      }

      resolve({
        accessToken: session.getAccessToken().getJwtToken(),
        idToken: session.getIdToken().getJwtToken(),
        refreshToken: session.getRefreshToken().getToken(),
      });
    });
  });
};
