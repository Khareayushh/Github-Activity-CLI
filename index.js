#!/usr/bin/env node

import { Command } from "commander";
import { timeStamp } from "console";
import { channel } from "diagnostics_channel";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const program = new Command();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE = path.resolve(__dirname, "cache.json");
const GITHUB_API_URL = "https://api.github.com/users";
const CACHE_EXPIRATION_MS = 30 * 1000;

function loadCache() {
  if (fs.existsSync(CACHE_FILE)) {
    const cacheData = fs.readFileSync(CACHE_FILE);
    
    return JSON.parse(cacheData);
  }
  return {};
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

async function fetchUserActivity(username) {
  const cache = loadCache();
  const currentTime = Date.now();
  if (
    cache[username] &&
    currentTime - cache[username].timeStamp < CACHE_EXPIRATION_MS
  ) {
    console.log("Inside");
    return cache[username].data;
  }

  try {
    const userData = await fetch(`${GITHUB_API_URL}/${username}/events`);
    if (!userData.ok) {
      throw new Error(`User not found or API error: ${userData.statusText}`);
    }

    const events = await userData.json();

    cache[username] = {
      timeStamp: currentTime,
      data: events,
    };
    saveCache(cache);
    if (events.length === 0) {
      console.log(`No recent activity found for user ${username}.`);
      return;
    }
    return events;
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

async function fetchingUserActivity(username) {
    const activity = await fetchUserActivity(username);

    if (activity && activity.length > 0) {
        console.log(`Recent activity for ${username}:`);
        activity.forEach(event => {
            switch (event.type) {
                case 'PushEvent':
                    console.log(`- Pushed ${event.payload.commits.length} commits to ${event.repo.name}`);
                    break;
                case 'IssuesEvent':
                    console.log(`- Opened an issue in ${event.repo.name}: "${event.payload.issue.title}"`);
                    break;
                case 'WatchEvent':
                    console.log(`- Starred the repository ${event.repo.name}`);
                    break;
                case 'ForkEvent':
                    console.log(`- Forked the repository ${event.repo.name} to ${event.repo.name}`);
                    break;
                default:
                    console.log(`- ${event.type} in ${event.repo.name}`);
            }
        });
    } else {
        console.log(`No recent activity found for user ${username}.`);
    }
}

// command to get analytics of github user
program
  .argument("<username>")
  .description("Fetches user activity and shows recent activity.")
  .action((username) => {
    fetchingUserActivity(username);
    console.log(`Hello ${username}!`);
  });

program.parse(process.argv);
