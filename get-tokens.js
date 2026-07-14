const http = require("http");
const EMAIL = "alice@test.com";
const PASSWORD = "Password@123";

function post(path, data) {
  return new Promise((res, rej) => {
    const b = JSON.stringify(data);
    const r = http.request({ host:"localhost", port:5000, path, method:"POST",
      headers:{ "Content-Type":"application/json", "Content-Length":Buffer.byteLength(b) }},
      s => { let d=""; s.on("data",c=>d+=c); s.on("end",()=>res({body:JSON.parse(d)})); });
    r.on("error",rej); r.write(b); r.end();
  });
}

(async () => {
  const login = await post("/api/auth/login", { email: EMAIL, password: PASSWORD });
  console.log("ACCESS TOKEN:\n" + login.body.accessToken + "\n");
  console.log("REFRESH TOKEN:\n" + login.body.refreshToken + "\n");
})();
