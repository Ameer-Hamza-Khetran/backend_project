import dotenv from 'dotenv'
import connectDB from './db/index.js';

dotenv.config({ path: './env' })

connectDB()








/** Second Approach - Not a good approach. Index file is overloaded. Everything is in index. START*/

/** DB function and call */
// function connectDB() {}
// connectDB()

/** Better approach to use IFFE */

// const app = express();

// ( async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

//         app.on('error', (error) => {
//             console.log("ERR: ", error)
//         })

//         app.listen(process.env.PORT, () => {
//             console.log(`App is listening on ${process.env.PORT}`)
//         })

//     } catch (error) {
//         console.error("ERROR: ", error)
//     }
// })()

/** Second Approach - Not a good approach. Index file is overloaded. Everything is in index. END*/
