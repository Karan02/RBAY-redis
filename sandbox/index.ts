import 'dotenv/config'
import { client } from '../src/services/redis'

const run = async () => {
  await client.del('car')
  await client.hSet('car',{
    color:'red',
    name:'karan',
    year: 1950,
    engine: JSON.stringify({ cylinders: 8}),
    owner:null || '',
    service:undefined || ''
  }) 

  const car = await client.hGetAll('car')

  console.log(car)
 {
  const carUnknown = await client.hGetAll('car#2342342')
  if(Object.keys(carUnknown).length === 0){ // check in this way
    console.log("key not exists")
  }
 }

//  const results = await Promise.all([
//   client.get('color'),
//   client.get('name')
// ]) // pipelining in node-redis world

}
run()
