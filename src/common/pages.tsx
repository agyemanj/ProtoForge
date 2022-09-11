/* eslint-disable @typescript-eslint/no-explicit-any */
import { Obj, map, hasValue, objectFromTuples, entries, Tuple, ArgsType } from "@agyemanjp/standard"
import { Component } from "@agyemanjp/somatic"

import { EntityDetailsPageOptions, EntityListPageOptions, AppSpec, factory as appgenLibFactory } from "@danfortsystems/protoforge"
import { default as app } from './spec'
import { proxies, dataProxiesConst } from "./api"
import { UserReadonly } from "./types"
// import { ClientEnv, UserReadonly } from "./types"

const pageComponents = {
	splash: (args: typeof app) =>
		() => import("@danfortsystems/protoforge/components/splash-page")
			.then(_ => _.factory(app as AppSpec)?.SplashPage),
	login: () => import("@danfortsystems/protoforge/components/login-page").then(_ => _.LoginPage),
	signup: () => import("@danfortsystems/protoforge/components/signup-page").then(_ => _.SignupPage),
	account: () => import("@danfortsystems/protoforge/components/user-mgt-page").then(_ => _.UserMgtPage),
	accountVerify: () => import("@danfortsystems/protoforge/components/verification-page").then(_ => _.VerificationPage),
	entityList: (args: EntityListPageOptions<AppSpec>) =>
		() =>
			import("@danfortsystems/protoforge/components/entity-list-page").then(_ =>
				_.factory(app as AppSpec, args)?.EntityListPage
			),
	entityDetails: (args: EntityDetailsPageOptions<AppSpec>) =>
		() =>
			import("@danfortsystems/protoforge/components/entity-details-page").then(_ =>
				_.factory(app as AppSpec, args).EntityDetailsPage
			),

	notFound: () => import("@danfortsystems/protoforge/components/unknown-page").then(_ => _.UnknownPage)
}

/** For generic type inference of page args */
const makePage = <P extends Obj>(p: Page<P>): Page<P> => p

export const customPages = {
	splash: makePage({
		urls: ["/splash"],
		minAuthorizedUserLevel: "none",
		getProps: () => ({}),
		component: pageComponents.splash(app)
	}),
	login: makePage({
		urls: ["/login"],
		minAuthorizedUserLevel: "none",
		getProps: (args) => ({
			returnUrl: args.query.return_url ?? ""
		}),
		component: pageComponents.login
	}),
	signup: makePage({
		urls: ["/signup"],
		minAuthorizedUserLevel: "none",
		getProps: () => ({}),
		component: pageComponents.signup
	}),
	accountVerification: makePage({
		urls: ["/verify"],
		minAuthorizedUserLevel: "none",
		getProps: (args) => ({
			emailAddress: args.query.email,
			verificationCode: args.query.code,
			accessLevel: (args.env.devEmailAddresses ?? "").split(";").includes(args.query.email)
				? "dev" as const
				: "none" as const,
			api: proxies
		}),
		component: pageComponents.accountVerify
	}),
	userAccount: makePage({
		urls: ["/users"],
		minAuthorizedUserLevel: "dev",
		getProps: async () => ({}),
		component: pageComponents.account
	}),
	notFound: makePage({
		urls: ["/unknown"],
		minAuthorizedUserLevel: "none",
		getProps: (args) => {
			console.log("Generating props for unknown page...")
			return { url: args.query?.url }
		},
		component: pageComponents.notFound
	})
}


const { Entity } = appgenLibFactory(app as AppSpec)

export const listPages = suffixKeys(map(app.entities, (entity, entityName) => makePage({
	urls: getRouteUrls(new Entity(entityName), false),
	minAuthorizedUserLevel: "none",
	getProps: (args) => ({
		user: args.user as UserReadonly,
		api: args.api,
		// searchKeywords: args.query.search ?? ""
	}),
	component: pageComponents.entityList({ entityName })
})), "s")

export const detailsPages = suffixKeys(map(app.entities, (entity, entityName) => makePage({
	urls: getRouteUrls(new Entity(entityName)),
	// url: `/${toSnakeCase(entityName)}_details`,
	minAuthorizedUserLevel: "none",
	getProps: (args) => {
		const { user, api } = args
		return {
			mode: (args.query.mode ?? "edit") as "view" | "edit",
			user,
			api,
			entityObjectId: args.query[new Entity(entityName).nameSnaked + "_id"] ?? "",
			parentObjectId: args.query["parent_id"],
		}
	},
	component: pageComponents.entityDetails({
		entityName: entityName,
		restriction: {
			fields: [],
			condition: async (api, user) => hasValue(user) &&
				(user?.accessLevel >= "dev" || (await api.getResAccessCounts(user))[0].count < 12)
			// or user is paid up with a subscription
		}
	})
})), "Details")

export const pagesConst = {
	...customPages,
	...detailsPages,
	...listPages
} as const

export const pages: Obj<Page<any>> = pagesConst

function getRouteUrls(entity: InstanceType<typeof Entity>, forDetails = true): string[] {
	const basicUrl = `/${entity.pluralNameSnaked}${forDetails ? `/:${entity.nameSnaked}_id` : ""}`
	return entity.parents.length > 0
		? entity.parents.map(parent => `/${parent.pluralNameSnaked}/:${parent.nameSnaked}_id` + basicUrl)
		: [basicUrl]
}

function suffixKeys<O extends Obj, S extends string>(obj: O, suffix: S) {
	return objectFromTuples(entries(obj).map(kv =>
		new Tuple(`${kv[0]}${suffix}`, kv[1])
	)) as any as { [key in `${keyof O}${S}`]: O[keyof O] }
}

export type Page<P extends Obj = Obj> = {
	/** Page route relative urls, possibly incuding params 
	 * If several, multiple routes based on each url will be created for the page
	 */
	urls: string[],

	/** Minimum user level authorized to view page */
	minAuthorizedUserLevel: UserReadonly["accessLevel"],

	/** Get specific page args from general args. 
	 * Throws if general args is missing props needed in specific args 
	 */
	// eslint-disable-next-line no-unused-vars
	getProps: (args: {
		user?: UserReadonly,
		params: Record<string, string>
		query: Record<string, string>
		baseUrl: string,
		env: {
			devEmailAddresses: string,
			objectStorageCdnUrl: string
		},
		api: typeof proxies
	}) => P

	/** Page component; if undefined is returned from the promise, then page is invalid and cannot be used */
	component: () => Promise<Component<P> | undefined>
}

