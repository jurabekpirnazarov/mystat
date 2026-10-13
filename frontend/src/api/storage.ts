export const getStorage = () => {
  return localStorage.getItem("access_token");
};

export const setStorage = (token: string) => {
  if (token && token !== "undefined") {
    localStorage.setItem("access_token", token);
  } else {
    console.error("Attempted to save invalid access token");
  }
};

export const getStorageR = () => {
  return localStorage.getItem("refresh_token");
};

export const setStorageR = (token: string) => {
  if (token && token !== "undefined") {
    localStorage.setItem("refresh_token", token);
  } else {
    console.error("Attempted to save invalid refresh token");
  }
};

export const clearStorage = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
};
