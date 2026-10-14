import axiosT from "./baseUrl";

export const fetchBookFavorites = async () => (await axiosT.get<number[]>("/books/favorites/")).data;
export const addBookFavorite = async (book: number) => (await axiosT.post("/books/favorites/", { book })).data;
export const removeBookFavorite = async (book: number) => axiosT.delete("/books/favorites/", { params: { book } });
export const fetchNearestPostal = async (lat: number, lng: number, limit = 5) =>
  (await axiosT.get<{ id: number; name: string; index: string; lat: number; lng: number; distance_km: number }[]>(
    "/books/postal-location/nearest/", { params: { lat, lng, limit } })).data;
