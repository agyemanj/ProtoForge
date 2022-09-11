/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable brace-style */
/* eslint-disable no-unused-expressions */
/* eslint-disable camelcase */
import { inspect } from 'util'
import * as Net from 'net'
import { Stream } from 'stream'
// import * as fs from 'fs'
import { default as cuid } from 'cuid'
import { default as express } from 'express'
import { Transporter, createTransport } from "nodemailer"
import { S3, PutObjectCommand, GetObjectCommand, PutObjectCommandInput, GetObjectCommandInput, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { Json, Method, Proxy, ProxyFactoryAugmented, statusCodes } from '@agyemanjp/http'
import {
	Tuple, Obj, Filter, FilterSimple, FilterGroupSimple,
	toSnakeCase, plural, stringify,
	keys, objectFromTuples, entries, toCamelCase,
} from "@agyemanjp/standard"
import pgPromise from "pg-promise"

import { app, EntityModel } from "../common"
import { MailMessage, ServerArgs } from './types'

export type DbInstance = InstanceType<typeof PostgresRepository>
export class PostgresRepository {
	private _cache: {
		[e in keyof EntityModel]: {
			objects: Obj<[entity: EntityModel[e], timeStamp: number], string /* object id */>,
			vectors: Obj<[vector: Promise<EntityModel[e][]>, timeStamp: number], string /* filter key */>
		}
	}
	// private _io: IOProvider<Schema> | undefined
	readonly CACHE_EXPIRATION_MILLISECONDS = 10 * 60 * 1000 // 10 minutes
	private db: pgPromise.IDatabase<unknown>
	private maxRows?: number

	protected readonly pgErrorsCode = {
		UNIQUE_VIOLATION: "23505",
		NOT_NULL_VIOLATION: "23502"
	}
	protected readonly prErrorClasses = {
		"23": "Integrity Constraint Violation",
		"XX": "Internal Error",
		"58": "System Error",
		"54": "Program Limit Exceeded",
		"53": "Insufficient Resources",
	}

	constructor(config: { dbUrl: string, maxRows?: number }) {
		this._cache = objectFromTuples(keys(app.entities).map(e => new Tuple(e, ({ objects: {}, vectors: {} }))))
		this.db = pgPromise({})({
			ssl: { rejectUnauthorized: false },
			query_timeout: 10000, connectionString: config.dbUrl,
			connectionTimeoutMillis: 10000
		})
		this.db.$config.pgp.pg.types.setTypeParser(20, parseInt)
		this.maxRows = config.maxRows
	}

	invalidOrStale<T>(entry?: [T, number]) {
		return (entry === undefined) || (new Date().getTime() - entry[1] > this.CACHE_EXPIRATION_MILLISECONDS)
	}

	async findAsync<E extends keyof EntityModel>(entity: E, id: any, refreshCache?: boolean) {
		const objects = this._cache[entity].objects
		if (this.invalidOrStale(objects[id]) || refreshCache) {
			const rowsetName = this.interpolatableRowsetName(entity)
			const whereClause = this.getWhereClause({ fieldName: "id", operator: "equals", value: id })

			const found = await this.db
				.one({ text: `SELECT * FROM ${toSnakeCase(plural(entity))} WHERE ${whereClause}`, })
				.then(record => this.appObject(entity, record))
				.catch(err => { throw (`Postgres repository findAsync of ${entity}\n${err.message}`) })

			objects[id] = new Tuple(found, new Date().getTime())
		}
		return objects[id][0]
	}

	async getAsync<E extends keyof EntityModel>(entityName: E, filter: FilterSimple | FilterGroupSimple, refreshCache?: boolean) {
		try {
			console.log(`Db getAsync starting for ${entityName} with filter ${stringify(filter)}`)
			const filtersKey = filter ? JSON.stringify(filter) : "N/A"
			const vectors = this._cache[entityName].vectors
			if (this.invalidOrStale(vectors[filtersKey]) || refreshCache) {
				// const rowSetFn = this.interpolatableRowsetName(entity)
				const whereClause = filter ? this.getWhereClause(filter) : `1=1`
				const sql = `SELECT * FROM ${toSnakeCase(plural(entityName))} WHERE ${whereClause} LIMIT ${this.maxRows ?? 1000}`
				// console.log(`Postgres running sql "${sql}"`)
				const gotPromise = this.db
					.any({ text: sql })
					.then(rows => {
						const data = rows.map(obj => ({ ...this.appObject(entityName, obj) }))
						return data
					})
					.catch(err => {
						throw err.message
					})

				vectors[filtersKey] = [gotPromise, new Date().getTime()]
			}

			const ret = await vectors[filtersKey][0]
			console.log(`Db getAsync returning ${stringify(ret)}`)
			return ret
		}
		catch (e) {
			console.error(`Db getAsync: ${e}`)
			throw e
		}
	}

	async insertAsync<E extends keyof EntityModel>(entity: E, obj: EntityModel[E]) {
		await this.db
			.query({
				text: `SELECT * from ${this.interpolatableRowsetName(entity, "insert")}($1) as result`,
				values: [JSON.stringify([obj])]
			})
			.then(x => { console.log(`Response from pG insert of ${stringify(obj)}: ${stringify(x)}`) })
			.catch(err => {
				if (err.code == this.pgErrorsCode.UNIQUE_VIOLATION)
					throw `Data duplication`
				else
					throw `Could not insert ${entity}: ${err.message}`
			})


		// Append new objects to base vector cache, and remove all other vectors cache entries
		const baseVector = this._cache[entity].vectors["N/A"] || [Promise.resolve([]), new Date().getTime()]
		this._cache[entity].vectors = {
			"N/A": [
				baseVector[0].then(vector => [...vector, obj]),
				baseVector[1]
			]
		}

		this._cache[entity].objects[String(obj["id"])] = new Tuple(obj, new Date().getTime())
	}

	async updateAsync<E extends keyof EntityModel>(entity: E, obj: EntityModel[E]) {
		const rowsetName = this.interpolatableRowsetName(entity, "update")
		await this.db
			.query({
				text: `SELECT * from ${rowsetName}($1) as result`,
				values: [JSON.stringify([obj])]
			})
			.catch(err => {
				if (err.code == this.pgErrorsCode.UNIQUE_VIOLATION)
					throw new Error(`Data duplication`, {})
				else
					throw new Error(`Could not insert ${entity}: ${err.message}`)
			})


		// Remove all vectors cache entries
		this._cache[entity].vectors = {}

		// forEach(objects, (datum) => {
		// 	const idFieldname = schema[e].idField!
		// 	_cache[e].objects[String(datum[idFieldname])] = new Tuple(datum, new Date().getTime())
		// })
		// const idFieldname = schema[entity].idField!
		this._cache[entity].objects[String(obj["id"])] = new Tuple(obj, new Date().getTime())

	}

	async deleteAsync<E extends keyof EntityModel>(entity: E, id: any) {
		const stmt = `delete from ${entity} where id=$1`
		// console.log(`pg repository: delete sql to be executed: "${stmt}"`)
		await this.db.none(stmt, [id])

		this._cache[entity].vectors = {}
		delete this._cache[entity].objects[String(id)]
	}

	/** Turn the input value into a string that can be directly interpolated into an sql string */
	protected interpolatableValue(value: string | number | boolean): string {
		return typeof value === "number" ? `${value}` : `'${String(value)}'`
	}
	/** Turn the input column name into a string that can be directly interpolated into an sql string */
	protected interpolatableColumnName(columnName: string): string {
		return toSnakeCase(columnName).toLowerCase()
	}
	/** Turn the input rowset (table, view, tablevalued UDF, etc) name into a string that can be directly interpolated into an sql string */
	protected interpolatableRowsetName(rowsetName: string, operation: "select" | "insert" | "update" | "delete" = "select"): string {
		return `${operation}_${toSnakeCase(rowsetName).toLowerCase()}`
	}

	protected predicateTemplates(): Obj<undefined | ((column: string, value?: any) => string), Required<Filter>["operator"]> {
		return {
			equals: (col, val) => val !== undefined && val !== null
				? `${col} = ${this.interpolatableValue(val)}`
				: `${col} is NULL`,
			not_equal_to: (col, val) => val !== undefined && val !== null
				? `${col} <> ${this.interpolatableValue(val)}`
				: `${col} IS NOT NULL`,
			greater_than: (col, val) => val !== undefined && val !== null
				? `${col} > ${this.interpolatableValue(val)}`
				: `(false)`,
			less_than: (col, val) => val !== undefined && val !== null
				? `${col} < ${this.interpolatableValue(val)}`
				: `(false)`,
			greater_than_or_equals: (col, val) => val !== undefined && val !== null
				? `${col} >= ${this.interpolatableValue(val)}`
				: `(false)`,
			less_than_or_equals: (col, val) => val !== undefined && val !== null
				? `${col} <= ${this.interpolatableValue(val)}`
				: `(false)`,
			contains: (col, val) => val !== undefined && val !== null
				? `POSITION(${val} in ${col}) > 0`
				: `(false)`,
			ends_with: (col, val) => val !== undefined && val !== null
				? `${col} like ${this.interpolatableValue('%' + String(val))}`
				: `${col} like ${this.interpolatableValue('')}`,
			starts_with: (col, val) => val !== undefined && val !== null
				? `${col} like ${this.interpolatableValue(String(val))}`
				: `${col} like ${this.interpolatableValue('')}`,
			is_outlier_by: undefined,
			is_blank: (col) => `${col} IS NULL`,
			// is_contained_in: `POSITION(${} in ${x}) `,
			is_contained_in: (col, val) => val !== undefined && val !== null
				? `POSITION(${col} in ${val}) > 0`
				: `(false)`,
			in: (col, val) => Array.isArray(val) && val.length > 0
				? `${col} IN (${val.join(", ")})`
				: `(false)`
		}
	}
	protected getWhereClause(filter?: FilterSimple | FilterGroupSimple): string {
		const filterGroup = filter
			? "fieldName" in filter
				? { filters: [filter] }
				: filter
			: undefined


		return !filterGroup || filterGroup.filters.length == 0
			? `1=1` // placeholder tautology
			: filterGroup.filters
				.map(f => {
					if ('fieldName' in f) { // this is a Filter object, not a FilterGroup
						const exprTemplate = this.predicateTemplates()[f.operator]
						if (exprTemplate === undefined)
							throw (`SQL Filtering operator "${f.operator}"`)
						const effColumnName = this.interpolatableColumnName(f.fieldName)
						const predicate = exprTemplate(effColumnName, f.value)
						return `${f.negated ? "NOT " : ""}${predicate}`
					}
					else {
						// console.log(`Recursive call to getWhereClause on ${JSON.stringify(f)}`)
						return `(${this.getWhereClause(f)})`
					}
				})
				.join(` ${(filterGroup.combinator as string ?? "and")} `)
	}
	protected appObject<O extends Obj>(entity: string, dbObject: O) {
		const newObj = objectFromTuples(entries(dbObject)
			// exclude keys that begin with underscore, 
			// since their conversion to camel case is not reversible
			// such keys represent db-internal-only properties anyway 
			.filter(keyVal => !keyVal[0].startsWith("_"))
			.map(keyVal => {
				const key = keyVal[0]
				const val = keyVal[1]

				const newVal = val === null
					// Postgres always stores undefined values as 'null'; convert to undefined
					? undefined
					: Array.isArray(val)
						// NULL in postgres arrays should not appear in app
						// And arrays should be converted into CSV
						? val.filter((el) => el !== "NULL").join(",")
						: val
				return new Tuple(toCamelCase(key), newVal)
			})) as O

		return { ...newObj/*, objectType: entity */ }
	}
}

export class RawObjectStorage {
	protected client: S3
	protected bucket: string
	constructor(config: { region: string, bucket: string, secretAccessKey: string, accessKeyId: string, endpoint?: string }) {
		const { region, bucket, secretAccessKey, accessKeyId, endpoint } = config
		this.client = new S3({
			endpoint,
			credentials: { secretAccessKey, accessKeyId },
			region
		})
		this.bucket = bucket
	}

	/** Store an object in a bucket
	 * @param objName Name of object, e.g., 'index.html'. To put in a folder, use '/'. e.g., 'myApp/package.json'.
	 */
	async storeObject(id: string, content: PutObjectCommandInput["Body"]) {
		try {
			const data = await this.client.send(new PutObjectCommand({
				Bucket: this.bucket,
				Key: id,
				Body: content
			}))
			console.log(`Successfully uploaded object: ${this.bucket}/${id}`)
			return data // For unit tests.
		}
		catch (err) {
			console.log("Error", err)
		}
	}

	async getObject(id: string) {
		const data = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: id }))

		if (data.Body == undefined)
			return ""
		else if (data.Body instanceof Blob)
			return await data.Body.text()
		else if (data.Body instanceof ReadableStream)
			return await this.streamToString(data.Body as any as Stream)
		// return String(await (await data.Body.getReader().read()).value)
		else
			return await this.streamToString(data.Body)
	}

	async removeObject(id: string) {
		try {
			await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: id, }))
			console.log("\nDeleted " + id + " from" + this.bucket)
		}
		catch (err) {
			console.log("Error", err)
		}
	}

	// Create a helper function to convert a Stream into a string.
	protected streamToString(stream: Stream) {
		return new Promise<string>((resolve, reject) => {
			const chunks: Uint8Array[] = []
			stream.on("data", (chunk) => chunks.push(chunk))
			stream.on("error", reject)
			stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
		})
	}
}

/** Send a mail message using SMTP */
export function sendMail(msg: MailMessage) {
	const transporter = createTransport({
		host: process.env.SMTP_HOST,
		port: Number.parseInt(process.env.SMTP_PORT!),
		auth: {
			user: process.env.SMTP_USERNAME,
			pass: process.env.SMTP_PASSWORD
		}
	})

	/*const message = {
		from: "from-example@email.com",
		to: "to-example@email.com",
		subject: "Subject",
		text: "Hello SMTP Email"
	}
	const messageHTML = {
		from: "from@email.com",
		to: "to@email.com",
		subject: "Subject",
		html: "<h1>Hello SMTP Email</h1>"
	}*/

	transporter.sendMail(msg, (err, info) => {
		if (err) {
			console.error(err.message)
		}
		else {
			console.log(info.response)
		}
	})
}

/** Starts an express server based on input confuguration */
export function startExpressServer(args: ServerArgs) {
	const expressApp = express()

	// Set up routes
	args.routes.forEach(route => {
		if (typeof route === "function") {
			expressApp.use(route)
			console.log(`Set up "${route.name}" middleware`)
		}
		else {
			if (Array.isArray(route)) {
				route[1].forEach(url => expressApp[route[0]](url, route[2]))
				console.log(`Set up route "${route[0]}" for urls "${route[1]}"`)
			}
			else {
				route.urls.forEach(url => expressApp[route.method](url, route.handler))
				console.log(`Set up route "${route.method}" for urls "${route.urls}"`)
			}
		}
	})

	// error handling route comes last
	expressApp.use(((err, req, res) => {
		// console.log(`Error route starting with errInfo= ${stringify(errInfo)}`)
		console.warn(`Starting express handler for error:\n${inspect(err)} `)
		// ToDo: log the error internally

		if ("statusCode" in err)
			return res
				.status("statusCode" in err ? err.statusCode : 500)
				.send(stringify("err" in err ? err.err : err))
	}) as express.ErrorRequestHandler)


	const sockets: Obj<Net.Socket> = {}

	// Start server
	console.log(`\n${args.name} server starting...`)
	const server = (expressApp
		.listen(args.port, () => {
			console.log(`${args.name} server started on port ${args.port} at ${new Date().toLocaleString()} \n`)
		})
		.on('connection', socket => {
			const socketId = cuid()
			socket.on('close', () => delete sockets[socketId])
			sockets[socketId] = socket
		})
	)

	// Setup process error handlers
	process.on('unhandledRejection', (reason: unknown) => cleanShutdown(`Unhandled rejection`, reason))
	process.on('uncaughtException', (err: Error) => cleanShutdown(`Uncaught exception`, err))
	process.on('SIGTERM', (signal) => cleanShutdown(signal))
	process.on('SIGINT', (signal) => cleanShutdown(signal))

	function cleanShutdown(reason: unknown, error?: unknown) {
		if (error)
			console.error(`\n${args.name} server shutting down due to: ${reason}\n${error instanceof Error ? error.stack : error}`)
		else
			console.warn(`\n${args.name} server shutting down due to: ${reason}`)

		server.close(() => {
			console.log(`${args.name} server closed\n`)
			process.exit(error === undefined ? 0 : 1)
		})

		Object.keys(sockets).forEach(socketId => {
			sockets[socketId].destroy()
			//console.log('socket', socketId, 'destroyed')
		})
	}
}

/** Attaches a route creation function to input augmented proxy factory */
export function augmentedProxy<Args extends Json, Ret extends Json | null>(prx: ProxyFactoryAugmented<Args, Ret, Method>) {
	return {
		route: (handlerFn: Proxy<Args, Ret>) => ({
			method: prx.method,
			urls: [prx.url],
			handler: jsonHandler(handlerFn, true)
		})
	}

	/** Create handler accepting typed JSON data (in query, params, header, and/or body) and returning JSON data */
	function jsonHandler<QryHdrsBdy, Ret>(fn: (req: QryHdrsBdy & { url: string, baseUrl: string, originalUrl: string }) => Promise<Ret>, wrap = false): express.Handler {
		return async (req, res) => {
			try {
				const r = await fn({
					...req.body,
					...req.query,
					...req.headers,
					...req.params,
					url: req.url,
					baseUrl: req.baseUrl,
					originalUrl: req.originalUrl
				})
				res.status(statusCodes.OK).json(wrap ? { data: r } : r)
			}
			catch (err) {
				res.status(statusCodes.INTERNAL_SERVER_ERROR).send(wrap ? { error: err } : err)
			}
		}
	}
}

