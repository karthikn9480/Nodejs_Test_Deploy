const express = require('express');
const app = express();
const fs = require('fs');
const child_process = require('child_process');
const port = 3000;

// ☠️ 1. XSS (Cross-Site Scripting)
// Example: visit http://localhost:3000/?name=<script>alert('Hacked!')</script>
app.get('/', (req, res) => {
  const name = req.query.name || 'Guest';
  res.send(`<h1>Welcome ${name}</h1>`); // unsanitized output ✅ vulnerable
});

// ☠️ 2. Command Injection
// Example: http://localhost:3000/ping?host=google.com && ls
app.get('/ping', (req, res) => {
  const host = req.query.host;
  child_process.exec(`ping -c 2 ${host}`, (err, stdout) => {
    if (err) return res.send('Something went wrong!');
    res.send(`<pre>${stdout}</pre>`);
  });
});

// ☠️ 3. Directory Traversal
// Example: http://localhost:3000/file?path=../../etc/passwd
app.get('/file', (req, res) => {
  const file = req.query.path; // user input, no validation
  fs.readFile(file, 'utf8', (err, data) => {
    if (err) res.send('Error reading file');
    else res.send(`<pre>${data}</pre>`);
  });
});

// ☠️ 4. NoSQL Injection (if MongoDB was present)
// Example: manipulate parameters in queries like {"$ne": null}
const mockUsers = [{ username: 'admin', password: 'secret' }];
app.get('/login', (req, res) => {
  const { username, password } = req.query;
  const user = mockUsers.find(
    (u) => u.username == username && u.password == password
  );
  if (user) res.send('Login successful!');
  else res.send('Invalid credentials');
});

// ☠️ 5. Missing Rate Limiting (DoS Flood Risk)
app.get('/heavy', (req, res) => {
  let output = '';
  for (let i = 0; i < 1e8; i++) output += '.';
  res.send(output); // can easily exhaust server CPU and RAM
});

app.listen(port, () => {
  console.log(`⚠️ Vulnerable app running at http://localhost:${port}`);
});
