#!/usr/bin/env node

import { Command } from "commander";

const program = new Command();

const GITHUB_API_URL = 'https://api.github.com/users';

async function fetchUserActivity(username){
    try {
        const userData = await fetch(`${GITHUB_API_URL}/${username}/events`);
        if(!userData.ok){
            throw new Error(`User not found or API error: ${userData.statusText}`)
        }

        const events = await userData.json();

        if(events.length === 0){
            console.log(`No recent activity found for user ${username}.`);
            return;
        }

        console.log(`Recent activity for ${username}:`);
        events.forEach(event => {
            switch(event.type){
                case 'PushEvent':
                    console.log(`- Pushed ${event.payload.commits.length} commits to ${event.repo.name}`);
                    break;
                case 'IssuesEvent':
                    console.log(`- Opened a new issue in ${event.repo.name}`);
                    break;
                case 'WatchEvent':
                    console.log(`- Starred ${event.repo.name}`);
                    break;
                default:
                    console.log(`- ${event.type} in ${event.repo.name}`);
            }
        });
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

// command to get analytics of github user
program
    .argument('<username>')
    .description('Fetches user activity and shows recent activity.')
    .action((username)=>{

        fetchUserActivity(username);
        console.log(`Hello ${username}!`);
    })

program.parse(process.argv);