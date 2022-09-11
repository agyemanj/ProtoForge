/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-shadow */
/* eslint-disable brace-style */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
// eslint-disable-next-line @typescript-eslint/no-var-requires

import * as fs from 'fs'
// import 'source-map-support/register'
import { config as configureEnvironment } from "dotenv"
configureEnvironment()

import { keys, hasValue, objectFromTuples, camelize, Tuple, KeysToCamelCase } from "@agyemanjp/standard"
import { defaultEnv } from '@danfortsystems/protoforge/library'

import { PostgresRepository, startExpressServer } from './library'
import { Route, ServerEnv } from "./types"
import { routesFactory } from './routes'
import { app } from '../common'

const serverEnvKeys = keys(defaultEnv)
serverEnvKeys.forEach(key => { if (!hasValue(process.env[key])) throw `${key} env variable not found` })
const serverEnv: KeysToCamelCase<ServerEnv> = camelize(objectFromTuples(serverEnvKeys.map(key => new Tuple(key, process.env[key]!))))

const db = new PostgresRepository({ dbUrl: process.env.DATABASE_URL! })
const rootHTML = fs.readFileSync(`${__dirname}/public/root.html`).toString()

// const routes = routesFactory(db, rootHTML)
const {
	home,
	requestLogger,
	urlEncodedBodyParser,
	jsonBodyParser,
	sessionManager,
	sslRedirect,
	staticServe,
	authInit,
	authSession,
	loginAction,
	registerAction,
	logoutAction,
	pages,
	api,
	defaultAPI,
	defaultAll
} = routesFactory(db, rootHTML, __dirname, serverEnv)

// console.log(`Starting server; app name: ${appName}`)
startExpressServer({
	name: app.name,
	routes: [
		requestLogger,
		urlEncodedBodyParser,
		jsonBodyParser,
		sessionManager,
		sslRedirect,
		staticServe,
		authInit,
		authSession,

		home,
		loginAction,
		registerAction,
		logoutAction,

		...pages as Route[],
		...api as Route[],

		defaultAPI,
		defaultAll
	],
	port: serverEnv.port
})



/* app.use(helmet())
	// app.use(helmet.noCache())
	app.use(cookieParser())
	app.use(bodyParser.urlencoded({ extended: true }))
*/
