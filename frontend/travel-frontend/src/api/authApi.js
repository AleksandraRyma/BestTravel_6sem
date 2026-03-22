import axiosClient from "./axiosClient";

export const loginUser = async (email, password) => {

  const res = await axiosClient.post("/auth/login", {
    email,
    password
  });

  return res.data;
};

export const registerUser = async (data) => {

  const res = await axiosClient.post("/auth/register", data);

  return res.data;
};