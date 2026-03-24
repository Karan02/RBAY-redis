import type { CreateUserAttrs } from '$services/types';
import { genId } from '$services/utils';
import { client } from '$services/redis';
import { usersKey,usernamesUniqueKey, usernamesKey } from '$services/keys';


export const getUserByUsername = async (username: string) => {
  //Use the username argument to look persons userID with username sorted sets
  const decimalId = await client.zScore(usernamesKey(), username)
  //make sure we actually got an id and lookup
  if(!decimalId){
    throw new Error('User does not exist')
  }
  //take id and convert to hex
  const id = decimalId.toString(16)
  //use id to look up user's hash
  const user = await client.hGetAll(usersKey(id))
  //deserialize and return the hash
  return deserialize(id,user)
};

export const getUserById = async (id: string) => {
  const user = await client.hGetAll(usersKey(id))
  return deserialize(id,user)
};

export const createUser = async (attrs: CreateUserAttrs) => {
  const id = genId()

  //see username already in set 
  const exists = await client.sIsMember(usernamesUniqueKey(), attrs.username)
  if(exists){
    throw new Error('Username is taken')
  }

  await client.hSet(usersKey(id), serialize(attrs))
  await client.sAdd(usernamesUniqueKey(), attrs.username)
  await client.zAdd(usernamesKey(),{
    value: attrs.username,
    score: parseInt(id,16)
  })

  return id
};

const serialize = (user: CreateUserAttrs) => {
  return {
    username: user.username,
    password: user.password
  }
}

const deserialize = (id: string, user:{ [key:string]:string }) => {
  return {
    id,
    username:user.username,
    password: user.password
  }
}