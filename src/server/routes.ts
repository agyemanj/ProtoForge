/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable brace-style */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import path from 'path'
import * as express from 'express'
import { default as session } from "express-session"
import { default as createMemoryStore } from 'memorystore'
import { default as morgan } from "morgan"
import HerokuSslRedirect from "heroku-ssl-redirect"
import { Base64 } from 'js-base64'
import passport from 'passport'
import { default as passportLocal } from "passport-local"
import * as bcrypt from "bcryptjs"
import { default as cuid } from "cuid"

import { statusCodes } from '@agyemanjp/http'
import { AppSpec, layoutComponentFactory } from '@danfortsystems/protoforge'
import { stringifyAttributes, renderToStringAsync, createElement, Component } from '@agyemanjp/somatic'
import { hasValue, isObject, map, Obj, stringify, values, ArgsType } from '@agyemanjp/standard'

import { app, Page, pages, pagesConst, dataProxiesConst, proxies, EntityModel, EntityObject } from '../common'
import { DbInstance, augmentedProxy, sendMail } from './library'
import { Route } from "./types"

export const routesFactory = <E extends ArgsType<Page["getProps"]>[0]["env"]>(db: DbInstance, rootHTML: string, rootFolderPath: string, env: E) => {
	const pageRoutes = (() => {
		return {
			...map(pages, (page, pageName: keyof typeof pagesConst) => ({
				method: "get" as const,
				urls: page.urls,
				handler: createPageHandler({ ...page, name: pageName })
			}))
		}

		/** Create an express handler for the input page */
		function createPageHandler(namedPage: Page & { name: keyof typeof pagesConst }) {
			const Layout = layoutComponentFactory(app as AppSpec).Layout

			return (async (req, res) => { // page handler
				console.log(`Handler starting for "${req.url}", req.user = ${req.user}; page: ${namedPage.name}`)

				const baseUrl = '//' + req.get('host')
				const user = req.user as UserReadonly | undefined
				const query = isObject(req.query) ? req.query as Obj<string> : {}

				const injectedInfo/*: Omit<ArgsType<Page["getProps"]>[0], "api"> & { pageName: keyof typeof pagesConst }*/ = {
					user,
					pageName: namedPage.name,
					params: req.params,
					query,
					baseUrl,
					env
				}
				// console.warn(`\nServer injected info :\n${JSON.stringify(injectedInfo, undefined, 2)} `)

				if (injectedInfo.user?.accessLevel ?? "none" >= namedPage.minAuthorizedUserLevel) {
					const encodedInjectedInfo = Base64.encode(JSON.stringify(injectedInfo))
					const injectedAttribs = stringifyAttributes({ ["data-req-info"]: encodedInjectedInfo, id: "root" })

					// console.log(`baseUrl url for api repo = ${baseUrl}`)
					// const repository = new APIRepository({ baseUrl, customFetch: crossFetch })
					const props = namedPage.getProps({ ...injectedInfo, api: proxies })
					const Comp = await namedPage.component()
					if (!Comp) throw `Invalid page "${namedPage.name}"`
					const htmlCore = await renderToStringAsync(createElement<Component<any>>(
						Layout,
						{
							user: injectedInfo.user,
							showLogin: !["login", "signup"].includes(injectedInfo.pageName)
						},
						createElement(Comp, props)
					))
					// console.log(`\nCore html of ${namedPage.name} page:\n${htmlCore} `)

					const htmlFull = (rootHTML
						.replace("<div></div>", `<div ${injectedAttribs}>${htmlCore}</div>`)
						.replace("<script></script>", `<script type="module" src="/static/client.js"></script>`)
						.replace(`<title>${app.name}</title>`, `<title>${app.name}: ${namedPage.name}</title>`)
					)
					// log(`\nFull html of ${page.name} page being sent to browser:\n${htmlFull} `)

					return res.send(htmlFull)
				}
				else {
					return res.redirect(`/login?return_url=${encodeURIComponent(req.url)}`)
				}

			}) as express.Handler
		}

	})()

	const apiRoutes = {
		// entity data routes
		...map(app.entities, (entityObject, entityName) => {
			const entityPluralName = entityObject.namePlural as keyof typeof dataProxiesConst
			return {
				get: augmentedProxy(proxies[entityPluralName].get)
					.route((args) => db
						.getAsync(entityName, args.filter ? JSON.parse(args.filter) : undefined)
						// .catch(e => { console.error(e) })
					),

				find: augmentedProxy(proxies[entityPluralName].find)
					.route((args) => db.findAsync(entityName, args.id)),

				insert: augmentedProxy(proxies[entityPluralName].insert)
					.route((obj) => (db.insertAsync(entityName, obj as EntityObject).then(__ => null))),

				update: augmentedProxy(proxies[entityPluralName].update)
					.route((obj) => (db.updateAsync(entityName, obj as EntityObject).then(__ => null))),

				delete: augmentedProxy(proxies[entityPluralName].delete)
					.route((args) => (db.deleteAsync(entityName, args.id).then(__ => null)))
			}
		}),

		// any extra routes
		...{}
	}

	const authRoutes = (() => {
		configurePassport()
		return _({
			authInit: passport.initialize(),
			authSession: passport.session(),

			// auth 
			loginAction: ["post", ["/login"], ((req, res, next) => {
				// console.log(`Request body sent to login post: ${stringify(req.body)}`)
				passport.authenticate('local-login', (errAuth, user, info) => {
					if (errAuth || !user) {
						const msg = `Login failed for '${req.body.email_addr}'`
						console.error(errAuth ?? info.message)
						res.status(statusCodes.BAD_REQUEST).send(msg)
					}
					else {
						// eslint-disable-next-line no-shadow
						req.logIn(user, async (err) => {
							if (err) {
								res.status(400).send(`Login failed: ${err}`)
							}
							else {
								if (req.session) {
									req.session.cookie.maxAge = req.body.remember === "true"
										? 5184000000 /* 2 months */
										: 900000 /* 15 minutes */
								}
								res.redirect(req.query && hasValue(req.query.return_url)
									? String(req.query.return_url)
									: "/"
								)
							}
						})
					}
				})(req, res, next)
			})],
			registerAction: ["post", ["/register"], (async (req, res, next) => {
				passport.authenticate('local-signup', (errAuth, user, info) => {
					if (errAuth || !user) {
						const msg = `Signup failed for ${req.body.email_addr}`
						console.error(errAuth ?? info.message)
						res.status(statusCodes.BAD_REQUEST).send(msg)
					}
					else {
						// log(`About to req.logIn(user...`)
						req.logIn(user, async (errLogin) => {
							if (errLogin) {
								res.status(statusCodes.UNAUTHORIZED).send(`Login failed for user ${user}: ${errLogin}`)
							}
							else {
								// log(`User logged in after signup`)

								if (req.session) req.session.cookie.maxAge = 5184000000
								if (req.headers["accept"] === "application/json") {
									return (user)
								}
								else {
									res.redirect(String(req.query.return_url) ?? "/")
								}
							}
						})
					}
				})(req, res, next)
			})],
			verify: ["post", ["/verify"], (async (req, res, next) => {
				const { emailAddress, verificationCode, accessLevel } = req.body
				const users = await db.getAsync("userReadonly", {
					filters: [
						{ fieldName: "emailAdress", operator: "equals", value: emailAddress },
						{ fieldName: "verificationCode", operator: "equals", value: verificationCode }
					]
				})
				console.log(`Users matching verification found: ${stringify(users)}`)

				if (users.length > 0) {
					const updatedUser = {
						...users[0],
						whenVerified: Date.now(),
						...(accessLevel ? { accessLevel: accessLevel } : {}
						)
					} as UserReadonly
					await db.updateAsync("userReadonly", updatedUser)
					return sanitizeUser(updatedUser)
				}
				else {
					throw (statusCodes.NOT_FOUND.toString())
				}
			})],
			logoutAction: ["get", ["/logout"], (async (req, res, next) => {
				req.logout((err) => { })
				// res.redirect(pagesConst.splash.url)
			})]
		})

		function sanitizeUser<U extends EntityModel["userReadonly"]>(user: U) {
			return {
				...user,
				pwdHash: undefined,
				pwdSalt: undefined,
				verificationCode: undefined
			} as UserReadonly
		}
		async function authenticateAsync(credentials: { email: string, pwd: string }): Promise<EntityModel["userReadonly"] | undefined> {
			// log(`Authenticating user '${credentials.email}'`)
			const dbUser = (await db.getAsync("user", {
				filters: [
					{ fieldName: "emailAddress", operator: "equals", value: credentials.email },
					{ fieldName: "whenVerified", operator: "is_blank", value: undefined, negated: true }
				],
				combinator: "AND"
			}))[0]

			if (!dbUser)
				return undefined

			const { pwdHash, pwdSalt, ...readonlyUser } = dbUser
			return new Promise((resolve, reject) => {
				bcrypt.compare(credentials.pwd, pwdHash as any, (err: Error, result: boolean) => {
					if (result === true) {
						resolve(readonlyUser as UserReadonly)
					}
					else {
						// error(String(err))
						reject(err)
					}
				})
			})
		}
		async function registerAsync(args: EntityModel["userReadonly"] & { password?: string, verificationCode: string }): Promise<void> {
			try {
				const { password, ...user } = args
				if (!password)
					throw new Error(`Cannot register user without password`)
				const pwdSalt = bcrypt.genSaltSync()
				const pwdHash = bcrypt.hashSync(password, pwdSalt)
				const verificationCode = args.verificationCode
				const userToBeRegistered = {
					...user,
					pwdHash,
					pwdSalt,
					verificationCode,
					// whenVerified: null
				}
				await db.insertAsync("user", userToBeRegistered)
				console.log(`User registered`)
			}
			catch (err) {
				console.error(String(err))
				throw err
			}
		}
		async function verifyAsync(args: { emailAddress: string, verificationCode: string, accessLevel?: UserReadonly["accessLevel"] }): Promise<EntityModel["userReadonly"] | undefined> {
			const { emailAddress, verificationCode, accessLevel } = args
			const users = await db.getAsync("user", {
				filters: [
					{ fieldName: "emailAdress", operator: "equals", value: emailAddress },
					// { fieldName: "app", operator: "equals", value: appName },
					{ fieldName: "verificationCode", operator: "equals", value: verificationCode }
				]
			})

			console.log(`Users matching verification found: ${stringify(users)}`)

			if (users.length > 0) {
				await db.updateAsync("user", {
					...users[0],
					whenVerified: Date.now(),
					...(accessLevel
						? { accessLevel: accessLevel }
						: {}
					)
				})

				return users[0] as UserReadonly
			}
			else
				return undefined

		}
		async function updatePwdAsync(id: string, newPassword: string): Promise<void> {
			const pwdSalt = bcrypt.genSaltSync()
			const pwdHash = bcrypt.hashSync(newPassword, pwdSalt)

			// log(`Calling findAsync from extensions.updatePwdAsync...`)
			const user = await db.findAsync("user", id)
			return await db.updateAsync("user", { ...user, pwdHash, pwdSalt })
		}
		async function unregisterAsync(id: string) { db.deleteAsync("user", id) }

		/** Configure and return passport with db authentication middleware */
		function configurePassport() {
			// construct & configure passport instance
			passport.serializeUser<string>((user, done) => { done(null, (user as UserReadonly).id) })
			passport.deserializeUser<string>(async (id, done) => {
				try {
					const userPromise = db.findAsync("user", id)
					const userInfo = await userPromise
					return done(null, userInfo)
				}
				catch (err) {
					return done(`Error deserializing user ${id} from Db:\n${err}`, undefined)
					// return done(err, false)
				}
			})

			passport.use('local-login', new passportLocal.Strategy(
				{ usernameField: 'email_addr', passwordField: 'password', passReqToCallback: true },
				async (req, email, pwd, done) => {
					if (!email) throw ("email not supplied to local-login strategy")
					if (!pwd) throw ("password not supplied to local-login strategy")
					try {
						const userInfo = await authenticateAsync({ email, pwd })
						return done(null, userInfo)
					}
					catch (err) {
						// return done(err, false)
						return done(err, false, { message: 'Incorrect password or email' })
					}
				})
			)
			passport.use('local-signup', new passportLocal.Strategy(
				{ usernameField: 'email_addr', passwordField: 'password', passReqToCallback: true },
				async (req, email, pwd, done) => {
					try {
						const user = {
							id: cuid(),
							accessLevel: "regular" as UserReadonly["accessLevel"],
							emailAddress: email,
							displayName: req.body['display_name'],
							companyName: "", //req.body['company_name'],
							whenVerified: undefined,
							password: pwd
						}
						// log(`New user to be signed up: ${stringify(user)}`)
						const verificationCode = cuid()
						const verificationURL = `https://${req.get('host')}/verify?email=${email}&code=${verificationCode}`
						console.log(`New user verification url: ${verificationURL}`)

						await registerAsync({ ...user, verificationCode })
						console.log(`User registered`)
						sendMail({
							from: "noreply@nxthaus.com",
							to: user.emailAddress,
							subject: "Email Verification",
							text: `Hello ${user.displayName},`
								+ `\nPlease click this link (or copy and paste it in your browser address bar and enter) `
								+ `to verify your new account:\n/verify`
						})
						return done(null, sanitizeUser(user))
					}
					catch (err) {
						// return done(err, false)
						return done(err, false, { message: `Could not signup user "${email}"` })
					}
				})
			)

			return passport
		}
	})()

	return {
		..._({
			requestLogger: morgan('tiny', { skip: (req) => req.baseUrl === "/static" }),
			urlEncodedBodyParser: express.urlencoded({ extended: true }),
			jsonBodyParser: express.json({ limit: "20mb" }),
			sessionManager: session({
				resave: false,
				rolling: true,
				store: new (createMemoryStore(session))({
					checkPeriod: 86400000 // prune expired entries every 24h
				}),
				// store: new SessionFileStorage({ path: './sessions/', /* secret: "" */ }),
				secret: process.env.SESSION_SECRET || "nthsfweqweioyfqw",
				cookie: { secure: false/*, maxAge: 1000 , httpOnly: false*/ },
				saveUninitialized: false,
			}),
			sslRedirect: HerokuSslRedirect(),
			staticServe: ["use", ['/static'], express.static(path.join(rootFolderPath, 'public'))],
			home: ["get", ["/"], (req, res) => {
				const redirectUrl = req.user ? `/projects` : `/splash`
				// log(`Request for '/' received by server; redirecting to ${redirectUrl}`)
				return res.redirect(redirectUrl)
			}],
			defaultAll: ["get", ["*"], (req, res) => { return res.redirect(`/unknown`) }],
			defaultAPI: ["get", ["/api/*"], (req, res) => {
				console.warn(`Handling unknown API route ${req.url}`)
				res.status(statusCodes.NOT_FOUND).send()
			}],
			...authRoutes
		}),

		pages: values(pageRoutes /*as Obj<Route>*/),
		api: values(apiRoutes).map(r => values(r)).flat()
	}
}

function _<H extends Obj<Route>>(h: H) { return h }

type UserReadonly = EntityModel["userReadonly"]
