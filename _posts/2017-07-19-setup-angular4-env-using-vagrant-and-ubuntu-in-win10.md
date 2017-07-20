---
layout: post
title: "Setup angular4 environment using vagrant and ubuntu in Win10"
description: ""
category: dev
tags: [angular]
---

# install nodejs

The nodejs provided by Ubuntu 16.04 is 4.x which is obsolete. If you searched ubuntu + nodejs, a lot of guys tell you to download the tar and compile the source. Then you have to edit the profile to add node to the path. It turns out having nodejs only, no npm. 

Finally I got [this](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions), the offical guide line from nodejs github.

```bash
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash - 
 sudo apt-get install -y nodejs
```

# setup git

I copied my private/public keys to vagrant ~/.ssh directly. When I pull the code from github, it says `Bad owner or permissions on ~/.ssh/config`. Obviously the rw permissions are incorrect. Below command fixes the problem.

```bash
chmod 600 ~/.ssh/config
 chmod 400 ~/.ssh/private_key
 chmod 400 ~/.ssh/public_key
```

Don't forget to set `core.autocrlf` to `input`. It makes sure the line endings are converted to `lf` when you commit. On the other hand, you should set it to `true` in Windows when doing collabrative work. [here](https://help.github.com/articles/dealing-with-line-endings/) for further reference.

```bash
git config --global core.autocrlf input
```

# vagrant specific issue

When running `npm start` for angular-quickstart, I always get below error

```sh: 1: tsc: not found```

This is because there's no `tsc` command in `node_modules/.bin`. When you run `npm install`, it adds symlink to that folder so that it can use `tsc` directly in `package.json` instead of using the full path `./node_modules/typescript/bin/tsc`. However, the project folder is shared between my Win10 and vagrant Ubuntu. It's impossible to place a symlink in a shared folder. I use `--no-bin-links` when running `npm install`. 

2 solutions, either moving the project to unshared folder inside vagrant OR using full path in package.json. 3rd option is to install those package gloablly which is too much. 