const { expressjwt : expressJwt } = require('express-jwt');

function authJwt() {
    const secret = process.env.JWT_SECRET;
    const api = process.env.API_URL;
    return expressJwt({
        secret,
        algorithms: ['HS256'],
        isRevoked: isRevoked
    }).unless({
        path: [
            { url: /\/api\/v1\/users\/.*$/, methods: ['POST','PUT', 'DELETE','GET', 'OPTIONS'] }, // Allow user update and delete
       { url: /\/public\/uploads(.*)/, methods: ['POST','GET','DELETE', 'OPTIONS'] },
        { url: /\/api\/v1\/products(.*)/, methods: ['POST','GET','PUT','DELETE', 'OPTIONS'] },
  { url: /\/api\/v1\/categories(.*)/, methods: ['POST','PUT','DELETE','GET' ,'OPTIONS'] },
          { url: /\/api\/v1\/orders(.*)/, methods: ['POST','GET','PUT','DELETE', 'OPTIONS'] },
          { url: /\/api\/v1\/ordercharge(.*)/, methods: ['POST','GET','PUT','DELETE', 'OPTIONS'] },
          { url: /\/api\/v1\/banners(.*)/, methods: ['POST','GET','PUT','DELETE', 'OPTIONS'] },
          
           `${api}/users/login`,
         `${api}/users`,
     
     
     //  `${api}/users/get/count`,
      //  `${api}/orders/get/totalsales`,
       //   {url:/(.*)/}

        ]
    });
}

async function isRevoked(req, payload, done) {
    console.log(req.url);
    console.log(req.method);
    if (payload.isAdmin) {
        done(); // Allow admin users to access any URL
    } else if (req.url.includes('orders')) {
        done(null, true); // Deny access to 'orders' URLs for non-admin users
    } else if (req.url.includes('users')) {
        done(null, true); // Deny access to 'users' URLs for non-admin users
    } else {
        done(); // Allow access to other URLs
    }
}

module.exports = authJwt;
