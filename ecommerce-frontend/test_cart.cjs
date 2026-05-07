const axios = require('axios');
async function test() {
  const loginRes = await axios.post('http://localhost:8080/api/auth/login', { username: 'testuser', password: 'password' }).catch(e => e.response);
  if (!loginRes || !loginRes.data.result || !loginRes.data.result.token) {
    console.log("LOGIN FAILED", loginRes ? loginRes.data : "No response");
    return;
  }
  const token = loginRes.data.result.token;
  console.log("Token:", token.substring(0, 20) + "...");
  const cartRes = await axios.get('http://localhost:8080/api/carts/items', { headers: { Authorization: "Bearer " + token } }).catch(e => e.response);
  console.log("CART STATUS:", cartRes.status);
  console.log("CART DATA:", cartRes.data);
}
test();
