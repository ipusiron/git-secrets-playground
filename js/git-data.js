'use strict';

const GIT_STRUCTURE = {
  "name": ".git",
  "type": "folder",
  "children": [
    { "name": "HEAD", "type": "file", "risk": "high" },
    { "name": "config", "type": "file", "risk": "medium" },
    { "name": "description", "type": "file", "risk": "low" },
    { "name": "index", "type": "file", "risk": "high" },
    { "name": "packed-refs", "type": "file", "risk": "medium" },
    {
      "name": "objects",
      "type": "folder",
      "risk": "high",
      "children": [
        { "name": "info", "type": "folder" },
        { "name": "pack", "type": "folder" },
        { 
          "name": "e6", 
          "type": "folder",
          "children": [
            { "name": "9de29bb2d1d6434b8b29ae775ad8c2e48c5391", "type": "file", "risk": "high" }
          ]
        },
        { 
          "name": "55", 
          "type": "folder",
          "children": [
            { "name": "7db03de997c86a4a028e1ebd3a1ceb225be238", "type": "file", "risk": "high" }
          ]
        },
        { 
          "name": "3b",
          "type": "folder",
          "children": [
            { "name": "b8dc0bbcd57a209018a4aa1c6d07db2edc75dd", "type": "file", "risk": "high" }
          ]
        },
        { 
          "name": "df",
          "type": "folder",
          "children": [
            { "name": "799688ee42b4d33e495ffa1a78469753c7dde9", "type": "file", "risk": "high" }
          ]
        }
      ]
    },
    {
      "name": "refs",
      "type": "folder",
      "risk": "high",
      "children": [
        {
          "name": "heads",
          "type": "folder",
          "children": [
            { "name": "main", "type": "file", "risk": "high" },
            { "name": "develop", "type": "file", "risk": "high" }
          ]
        },
        {
          "name": "remotes",
          "type": "folder",
          "children": [
            {
              "name": "origin",
              "type": "folder",
              "children": [
                { "name": "main", "type": "file", "risk": "medium" },
                { "name": "develop", "type": "file", "risk": "medium" }
              ]
            }
          ]
        },
        {
          "name": "tags",
          "type": "folder",
          "children": [
            { "name": "v1.0.0", "type": "file", "risk": "low" }
          ]
        }
      ]
    },
    {
      "name": "logs",
      "type": "folder",
      "risk": "medium",
      "children": [
        { "name": "HEAD", "type": "file", "risk": "medium" },
        {
          "name": "refs",
          "type": "folder",
          "children": [
            {
              "name": "heads",
              "type": "folder",
              "children": [
                { "name": "main", "type": "file", "risk": "medium" }
              ]
            }
          ]
        }
      ]
    },
    {
      "name": "hooks",
      "type": "folder",
      "children": [
        { "name": "pre-commit.sample", "type": "file" },
        { "name": "pre-push.sample", "type": "file" }
      ]
    },
    {
      "name": "info",
      "type": "folder",
      "children": [
        { "name": "exclude", "type": "file", "risk": "low" }
      ]
    }
  ]
};

const SAMPLE_OBJECTS = [
  {
    hash: 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391',
    type: 'blob',
    size: 0,
    content: '',
    descriptionKey: 'sample.empty'
  },
  {
    hash: '557db03de997c86a4a028e1ebd3a1ceb225be238',
    type: 'blob',
    size: 12,
    content: 'Hello World\n',
    descriptionKey: 'sample.hello'
  },
  {
    hash: '3bb8dc0bbcd57a209018a4aa1c6d07db2edc75dd',
    type: 'blob',
    size: 169,
    content: `# Project Configuration
version: 1.0.0
database:
  host: localhost
  username: admin
  password: secret123
api_keys:
  stripe: sk_test_abc123def456
  sendgrid: SG.xyz789`,
    descriptionKey: 'sample.config'
  },
  {
    hash: 'df799688ee42b4d33e495ffa1a78469753c7dde9',
    type: 'blob',
    size: 263,
    content: `FROM ubuntu:20.04
RUN apt-get update && apt-get install -y \\
    python3 \\
    python3-pip \\
    nginx
COPY requirements.txt /app/
WORKDIR /app
RUN pip3 install -r requirements.txt
COPY . /app/
EXPOSE 8000
CMD ["python3", "manage.py", "runserver", "0.0.0.0:8000"]`,
    descriptionKey: 'sample.docker'
  }
];

if (typeof module !== 'undefined' && module.exports) module.exports = { GIT_STRUCTURE, SAMPLE_OBJECTS };
