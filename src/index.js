import dotenv from 'dotenv'
import connectDB from './db/index.js';
import { app } from './app.js'

dotenv.config({ path: './env' })

connectDB()
.then(() => {

    app.on('error', (error) => {
        console.log('ERROR: ', error)
    })

    app.listen(process.env.PORT || 3000, () => {
        console.log(`Server is running at port: ${process.env.PORT}`);
    })

})
.catch((error)=>{
    console.log('mongo db connection failed error: ', error)
})








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
