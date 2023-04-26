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
    fullName: user.Name,
    email: user.Email,
    teamKeys,
    locationKeys,
  });

  console.log('USER CREATED : ', JSON.parse(data.config?.data).fullName);

  return data;
}

async function searchUserKey(email: string) {
  const response = await postReq('/user-management/user/search', {
    filter: {
      email: email,
    },
    select: ['key'],
  });

  if (response.data.length <= 0) {
    console.log(`User With Email ${email} Key Not Found`);
    throw new Error('Userkey Not Found');
  }

  return response.data.data[0].key;
}

async function assignUserToLocation(locationKey: string, userKey: string) {
  try {
    return await postReq('/location-management/user/assign', {
      assigning: [
        {
          locationKey: locationKey,
          userKey: userKey,
        },
      ],
    });
  } catch (e: any) {
    console.log(`Error Assigning user ${userKey} to location ${locationKey}`);
    console.log(e.request?.res?.statusCode, e.response?.data, e.config?.data);
  }
}

async function assignUserToTeam(teamKey: string, userKey: string) {
  try {
    await postReq('/team-management/user/assign', {
      assigning: [
        {
          teamKey: teamKey,
          userKey: userKey,
        },
      ],
    });
  } catch (e: any) {
    console.log(
      'Error',
      e.request?.res?.statusCode,
      e.response?.data,
      e.config?.data
    );
  }
}

const seed = async () => {
  users.forEach(async (user: User) => {
    const teamKey = user.PrimaryGroup.includes('User')
      ? teams.brokers
      : teams.admins;

    const locationKey = locations[user.OfficeName];

    try {
      await createUser(user, [teamKey], [locationKey]);
    } catch (e: any) {
      if (e.response?.data.error == 'User already exists!') {
        const userKey = await searchUserKey(user.Email);
        await assignUserToTeam(teamKey, userKey);
        await assignUserToLocation(locationKey, userKey);

      } else
        console.log(
          'Error',
          e.request?.res?.statusCode,
          e.response?.data,
          e.config?.data
        );
    }
  });
};

seed();
