# Simple scraper used to get hold of Flatpeak api keys

- entrypoint: src/index.ts
- most of logic: src/infiltrator.ts

** For a demo have a look at the video.mov in the root dir  

## The flow:
Base url: https://dashboard.flatpeak.com
1. hit POST /api/trpc/auth.loginEmail?batch=1 to submit email && request otp
=> retrieve methodId from response
2. intercept otp email and extract the opt
3. hit POST /api/trpc/auth.authenticateOtp?batch=1 to submit the otp 
=> retrieve the jwt from resp headers
(NOW LOGGED IN)
4. hit /api/trpc/keys.list'
=> retrieve the keys


## to run:
- git pull 
- npm i

- add email creds as env vars (see example.env)

- npm run dev || npm build, npm start


## to test: 
- npm test

