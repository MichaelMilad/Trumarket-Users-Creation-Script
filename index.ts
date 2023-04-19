import dotenv from 'dotenv';
import axios from 'axios';

import { User } from './interfaces';
import users from './users';
import * as constants from './constants';

const { teams, locations } = constants;

dotenv.config();

async function postReq(url: string, data: object) {
  return await axios({
    method: 'post',
    url: process.env.URL + url,
    headers: {
      api_key: `Bearer ${process.env.TOKEN}`,
      accept: 'application/json',
    },
    data,
  });
}

async function createUser(user: User) {
  return await postReq('/user-management/users', {
    fullName: user.name,
    email: user.email,
  });
}

async function assignUserToLocation(user: User) {
  return Object.keys(locations).forEach(async (k, v) => {
    if (user.officeName.includes(k)) {
      return await postReq('/location-management/user/assign', {
        assigning: [
          {
            locationKey: v,
            userKey: user.key,
          },
        ],
      });
    }
  });
}

async function assignUserToTeam(user: User) {
  if (user.primaryGroup.includes('User')) {
    await postReq('/team-management/user/assign', {
      assigning: [
        {
          teamKey: teams.brokers,
          userKey: user.key,
        },
      ],
    });

    return console.log(`User ${user.name} Added to brokers team`);
  } else if (user.primaryGroup.includes('Admin')) {
    await postReq('/team-management/user/assign', {
      assigning: [
        {
          teamKey: teams.admins,
          userKey: user.key,
        },
      ],
    });

    return console.log(`User ${user.name} Added to admin team`);
  } else {
    console.log("User didn't belong to any Group");
  }
}

const seed = async () => {
  users.forEach(async (user:User) => {
    await createUser(user)
      .then(async (data) => {
        console.log(data);
        await assignUserToTeam(user);
      })
      .then(async (data) => {
        console.log(data);
        await assignUserToLocation(user);
      })
      .catch((e) => console.log(e));
  });
};

seed();
