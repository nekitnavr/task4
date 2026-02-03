if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const app = express()
const port = 3000
const {Client} = require('pg')
const {sha3_256} = require('js-sha3')
const sendVerificationEmail = require('./mail')
const cors = require('cors')

// const con = new Client({
//     host: 'localhost',
//     user: 'postgres',
//     port: 5432,
//     password: 'ttgames222',
//     database: 'task4'
// })
const con = new Client({
    host: process.env.DB_HOST,
    user: 'task4db',
    port: 5432,
    password: process.env.DB_PASSWORD,
    database: 'task4db_i34u',
    ssl: true
})
con.connect().then(()=>console.log('database connected'))

app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:4173/',
        'https://task4-front-kqif.onrender.com'
    ]
}))

app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.use(express.static('dist'))

app.get('/api/users', async (req, res) => {
    const query = `SELECT id, name, email, status, last_active FROM users ORDER BY last_active DESC`
    const result = (await con.query(query)).rows
    res.send(result)
})

async function userExists(email){
    const query = `SELECT EXISTS(SELECT email, name, status FROM users WHERE email = '${email}')`
    const response = await con.query(query)
    return response.rows[0].exists 
}
async function getUserStatus(email){
    const query = `SELECT status FROM users WHERE email = '${email}'`
    const response = await con.query(query)
    return response.rows[0] ? response.rows[0].status : '' 
}
async function updateLastActive(email) {
    const query = `UPDATE users SET last_active=NOW() WHERE email = '${email}'`
    const response = await con.query(query)
    return response
}

app.delete('/api/deleteUnverifiedUsers', (req,res)=>{
    const query = `DELETE FROM users WHERE status = 'unverified'`
    con.query(query, (error, response)=>{
        if (error) {
            return res.status(400).send('Something went wrong')
        }else{
            return res.send('Users deleted successfully')
        }
    })
})
app.delete('/api/deleteUsers', (req,res)=>{
    const userIds = JSON.parse(req.query.users);
    const query = `DELETE FROM users WHERE id in (${userIds.join(',')});`
    con.query(query, (error, response)=>{
        if (error) {
            return res.status(400).send('Something went wrong')
        }else{
            return res.send('Users deleted successfully')
        }
    })
})
app.patch('/api/blockUsers', (req,res)=>{
    const {users:userIds} = req.body;
    const query = `UPDATE users SET status='blocked' WHERE id in (${userIds.join(',')});`
    con.query(query, (error, response)=>{
        if (error) {
            return res.status(400).send('Something went wrong')
        }else{
            return res.send('Users blocked successfully')
        }
    })
})
app.patch('/api/unblockUsers', (req,res)=>{
    const {users:userIds} = req.body;
    const query = `UPDATE users SET status=status_const WHERE id in (${userIds.join(',')});`
    con.query(query, (error, response)=>{
        if (error) {
            return res.status(400).send('Something went wrong')
        }else{
            return res.send('Users unblocked successfully')
        }
    })
})

app.get('/api/userIsAuthorized', async (req,res)=>{
    const email = req.query.email
    if (await userExists(email)) {
        const userStatus = await getUserStatus(email)
        if (userStatus != 'blocked') {
            return res.send(true)
        }else{
            return res.status(403).send(false)
        }
    }else{
        return res.status(404).send(`User doesn't exist`)
    }
})

app.patch('/api/updateLastActive', async (req,res)=>{
    const {email} = req.body
    if (await userExists(email)) {
        await updateLastActive(email)
        return res.send('updated last active')
    }else{
        return res.status(404).send(`User doesn't exist`)
    }
})

app.post('/api/login', async (req, res)=>{
    const {email, password} = req.body;
    const query = `SELECT password_hash FROM users WHERE email = '${email}'`
    if (await userExists(email)) {
        const userStatus = await getUserStatus(email)
        if (userStatus != 'blocked') {
            const {password_hash} = (await con.query(query)).rows[0]
            const passwordCheckHash = sha3_256(password)
            if (password_hash == passwordCheckHash) {
                updateLastActive(email)
                return res.send({email: email, status:userStatus})
            }else{
                return res.status(401).send('Wrong password')
            }
        }else{
            return res.status(403).send('User not authorized to use this resource')
        }
    }else{
        return res.status(404).send(`User doesn't exist`)
    }
})

app.get('/api/verifyUser', async (req, res)=>{
    const email = req.query.email
    const query = `
    UPDATE users SET 
    status = CASE 
        WHEN status='blocked' then status
        ELSE 'verified'
    END,
    status_const='verified' WHERE email = '${email}'
    `
    if (await userExists(email)) {
        con.query(query).then(response=>{
            res.send('user verified!')
        }).catch(error=>{
            res.send('there was error when verifying user')
        })
    }else{
        return res.status(404).send(`User doesn't exist`)
    }
})

app.post('/api/createUser', (req, res) => {
    const {email, password, name} = req.body;
    const passwordHash = sha3_256(password)
    const query = `
        INSERT INTO public.users(email, password_hash, status, last_active, name, status_const)
	    VALUES ('${email}', '${passwordHash}', 'unverified', NOW(), '${name}', 'unverified');
    `
    con.query(query, (error, response)=>{
        if (error) {
            return res.status(500).send('User already exists')
        }else{
            try{
                if (process.env.NODE_ENV == 'production') {
                    sendVerificationEmail(email)
                }
            }catch (error){
                console.log(error);
            }
            return res.send('user created')
        }
    })
})

app.listen(port, () => {
    console.log(`http://localhost:3000`)
})
