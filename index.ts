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
      Authorization: `Bearer ${process.env.TOKEN}`,
      accept: 'application/json',
    },
    data,
  });
}

async function createUser(
  user: User,
  teamKeys: [string],
  locationKeys: [string]
): Promise<any> {
  const data = await postReq('/user-management/users', {
    fullName: user.name,
    email: user.email,
    teamKeys,
    locationKeys,
  });

  console.log('USER CREATED : ', JSON.parse(data.config?.data).fullName);

  return data;
}

async function assignUserToLocation(user: User) {
  try {
    if (locations.hasOwnProperty(user.officeName)) {
      return await postReq('/location-management/user/assign', {
        assigning: [
          {
            locationKey: locations['Crimelock Location Kansas'],
            userKey: user.key,
          },
        ],
      });
    } else {
      console.log(`NO Valid Location for ${user}`);
    }
  } catch (e: any) {
    console.log(e.response, e.config.data);
  }
}

async function assignUserToTeam(user: User) {
  try {
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
  } catch (e: any) {
    console.log(e.response, e.config.data);
  }
}

const seed = async () => {
  users.forEach(async (user: User) => {
    const teamKey = user.primaryGroup.includes('User')
      ? teams.brokers
      : teams.admins;

    const locationKey = locations[user.officeName];

    try {
      await createUser(user, [teamKey], [locationKey]);
    } catch (e: any) {
      if (e.data?.error == 'User already exists!')
        console.log('User Already Exists');
      else
        console.log(
          'UNCAUGHT',
          e.request?.res?.statusCode,
          e.response?.data,
          e.config?.data
        );
    }
  });
};

seed();
