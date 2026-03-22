import axiosClient from "./axiosClient";

export async function getGuideHome() {
  const res = await axiosClient.get("/guide/home");
  return res.data;
}
