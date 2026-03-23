import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api/expenses';

export const addExpense = (expense) =>
  axios.post(BASE_URL, expense);

export const getAllExpenses = (userId) =>
  axios.get(`${BASE_URL}/${userId}`);

export const deleteExpense = (id) =>
  axios.delete(`${BASE_URL}/${id}`);

export const getMonthlySummary = (
  userId, month, year, budget) =>
  axios.get(`${BASE_URL}/${userId}/summary`, {
    params: { month, year, budget }
  });

  export const getUserSettings = (userId) =>
  axios.get(`http://localhost:8080/api/settings/${userId}`);

export const saveUserSettings = (userId, settings) =>
  axios.post(
    `http://localhost:8080/api/settings/${userId}`, settings);

