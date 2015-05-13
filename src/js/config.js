System.config({
  "baseURL": "/",
  "paths": {
    "*": "*.js",
    "github:*": "src/js/jspm_packages/github/*.js",
    "npm:*": "src/js/jspm_packages/npm/*.js"
  },
  "bundles": {
    "build/main": [
      "src/js/main"
    ]
  }
});

System.config({
  "map": {
    "guardian/iframe-messenger": "github:guardian/iframe-messenger@master",
    "json": "github:systemjs/plugin-json@0.1.0",
    "reqwest": "github:ded/reqwest@1.1.5",
    "text": "github:systemjs/plugin-text@0.0.2",
    "traceur": "github:jmcriffey/bower-traceur@0.0.87",
    "traceur-runtime": "github:jmcriffey/bower-traceur-runtime@0.0.87"
  }
});

