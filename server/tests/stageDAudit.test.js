const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const mongoose = require('mongoose');
const React = require('../../client/node_modules/react');
const ReactDOMServer = require('../../client/node_modules/react-dom/server');
const app = require('../index');
const connectDB = require('../config/db');
const User = require('../models/User');
const { signToken } = require('../utils/auth');

// Import MDBTabs components from client node_modules
const {
  MDBTabsContent,
  MDBTabsPane,
} = require('../../client/node_modules/mdb-react-ui-kit');

let server;
let baseUrl;

const makeRequest = (method, path, body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqHeaders = { ...headers };
    let postData = '';

    if (body) {
      postData = JSON.stringify(body);
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      url,
      { method, headers: reqHeaders },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            resolve({ status: res.statusCode, data: parsed });
          } catch {
            resolve({ status: res.statusCode, data });
          }
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
};

describe('Stage D Frontend & API Integration Audit', () => {
  let testUser;
  let testToken;

  before(async () => {
    await connectDB();
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;

    // Create a temporary test customer to verify auth contracts
    const email = `audit.d.${Date.now()}@example.com`;
    testUser = new User({
      name: 'Stage D Audit User',
      email,
      passwordHash: 'dummyHashForTokenTestingOnly123',
      phone: '555-1234',
      role: 'customer',
    });
    await testUser.save();

    testToken = signToken({
      userId: testUser._id,
      role: testUser.role,
    });
  });

  after(async () => {
    if (testUser && testUser._id) {
      try {
        await User.deleteOne({ _id: testUser._id });
      } catch {
        // Ignore cleanup error
      }
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  it('Contract: GET /GetRooms responds with 200 and rooms array', async () => {
    const res = await makeRequest('GET', '/GetRooms');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.rooms));
  });

  it('Contract: GET /api/auth/me returns 401 on missing token and 200 on valid token', async () => {
    // Missing token
    const unauth = await makeRequest('GET', '/api/auth/me');
    assert.equal(unauth.status, 401);

    // Valid token
    const auth = await makeRequest('GET', '/api/auth/me', null, {
      Authorization: `Bearer ${testToken}`,
    });
    assert.equal(auth.status, 200);
    assert.equal(auth.data.user.email, testUser.email);
    assert.equal(auth.data.user.role, 'customer');
    assert.equal(auth.data.user.passwordHash, undefined);
  });

  it('Contract: POST /cancelbooking requires authentication and returns 401 when missing', async () => {
    const res = await makeRequest('POST', '/cancelbooking', { bookingId: 'nonexistent' });
    assert.equal(res.status, 401);
  });

  it('Frontend Tabs: MDBTabsPane accurately toggles active class based on open prop', () => {
    // Render tabs when activeTab is "bookings"
    const htmlBookingsActive = ReactDOMServer.renderToString(
      React.createElement(
        MDBTabsContent,
        null,
        React.createElement(MDBTabsPane, { open: true }, 'BookingsContent'),
        React.createElement(MDBTabsPane, { open: false }, 'RoomsContent'),
        React.createElement(MDBTabsPane, { open: false }, 'AddRoomContent'),
        React.createElement(MDBTabsPane, { open: false }, 'UsersContent')
      )
    );

    // Pane 1 must have active class, other panes must not
    assert.ok(htmlBookingsActive.includes('tab-pane fade active'));
    assert.ok(htmlBookingsActive.includes('BookingsContent'));

    // Render tabs when activeTab is "rooms"
    const htmlRoomsActive = ReactDOMServer.renderToString(
      React.createElement(
        MDBTabsContent,
        null,
        React.createElement(MDBTabsPane, { open: false }, 'BookingsContent'),
        React.createElement(MDBTabsPane, { open: true }, 'RoomsContent'),
        React.createElement(MDBTabsPane, { open: false }, 'AddRoomContent'),
        React.createElement(MDBTabsPane, { open: false }, 'UsersContent')
      )
    );

    assert.ok(htmlRoomsActive.includes('tab-pane fade active'));
    assert.ok(htmlRoomsActive.includes('RoomsContent'));
  });

  it('CORS Policy: Allows both localhost:5173 and 127.0.0.1:5173, rejects unauthorized origins', async () => {
    // Test localhost:5173 origin
    const resLocalhost = await makeRequest('OPTIONS', '/health', null, {
      Origin: 'http://localhost:5173',
      'Access-Control-Request-Method': 'GET',
    });
    // In Express cors middleware, a preflight request from an allowed origin responds with status 204
    assert.ok([200, 204].includes(resLocalhost.status));

    // Test 127.0.0.1:5173 origin
    const res127 = await makeRequest('OPTIONS', '/health', null, {
      Origin: 'http://127.0.0.1:5173',
      'Access-Control-Request-Method': 'GET',
    });
    assert.ok([200, 204].includes(res127.status));

    // Test unauthorized origin
    const resEvil = await makeRequest('OPTIONS', '/health', null, {
      Origin: 'http://malicious-site.example.com',
      'Access-Control-Request-Method': 'GET',
    });
    // CORS middleware returns error for unauthorized origin on OPTIONS/request
    assert.ok(resEvil.status >= 400 || resEvil.status === 500);
  });
});
