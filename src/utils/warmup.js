export const warmupServer = async () => {
  try {
    await fetch("https://YOUR_RENDER_URL/api/expenses/1");
  } catch {}
};