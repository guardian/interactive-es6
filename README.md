Guardian interactive ES6 template
=================================

An interactive template & test harness, set up with commonly used components and example code

Usage
=====

Setup
-----
`npm install`

Development
-----------
`grunt`

Production / deployment
-----------------------
`TODO`

Using third party js
--------------------
1. Install package using JSPM e.g.

	`jspm install reqwest` or

	`jspm install github:guardian/iframe-messenger`

2. Import package. e.g.

	`import reqwest from 'reqwest'` or

	`import reqwest from 'guardian/iframe-messenger'`

Text/JSON in javascript
-----------------------
```
import someHTML from './text/template.html!text'
import someJSON from './data/data.json!json'
```

Test Harness
============

`index.html` - Stripped down test harness. Includes frontend fonts and curl for loading boot.js.
`immersive.html` - Immersive-style interactive page pulled from theguardian.com
